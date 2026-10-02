import { NextResponse } from "next/server";
import { requireAdminPerm, writeAudit, ADMIN_PERMISSIONS, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAccountMetrics } from "@/lib/trading";
import {
  isSupportedAccountCurrency,
  normalizeAccountCurrency,
  parseMembershipUpdate,
  serializeUserMembership,
} from "@/lib/membership";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { allocateUniqueAccountLoginId } from "@/lib/account-login-id";
import { recordLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const status = (searchParams.get("status") || "").trim(); // active | frozen | all
  const desk = (searchParams.get("desk") || "").trim();
  const country = (searchParams.get("country") || "").trim();
  const saleStatus = (searchParams.get("saleStatus") || "").trim();
  const retentionStatus = (searchParams.get("retentionStatus") || "").trim();

  const where: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];

  if (q) {
    and.push({
      OR: [
        { email: { contains: q } },
        { accountLoginId: { contains: q } },
        { name: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
        { brokerName: { contains: q } },
      ],
    });
  }
  if (status === "active") and.push({ active: true });
  if (status === "frozen") and.push({ active: false });
  if (desk) and.push({ desk: { equals: desk } });
  if (country) and.push({ country: { equals: country } });
  if (saleStatus) and.push({ saleStatus: { equals: saleStatus } });
  if (retentionStatus) and.push({ retentionStatus: { equals: retentionStatus } });
  if (and.length) where.AND = and;

  const users = await prisma.user.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: { account: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const desks = await prisma.user.findMany({
    where: { desk: { not: null } },
    select: { desk: true },
    distinct: ["desk"],
    take: 100,
  });

  return NextResponse.json({
    users: users.map((u) => serializeUserMembership(u as unknown as Record<string, unknown>)),
    desks: desks.map((d) => d.desk).filter(Boolean),
    permissionDefs: ADMIN_PERMISSIONS,
  });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  // Create new member
  if (action === "create") {
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Geçerli e-posta gerekli" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter" }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "E-posta zaten kayıtlı" }, { status: 409 });
    }

    const membership = parseMembershipUpdate(body);
    const firstName = (membership.firstName as string | null) || null;
    const lastName = (membership.lastName as string | null) || null;
    const name =
      (membership.name as string | null) ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      email.split("@")[0];

    const passwordHash = await hashPassword(password);
    const accountLoginId = await allocateUniqueAccountLoginId();
    const balance = Number.isFinite(Number(body.balance)) ? Number(body.balance) : 10000;
    if (body.currency != null && body.currency !== "" && !isSupportedAccountCurrency(body.currency)) {
      return NextResponse.json(
        { error: "Geçersiz para birimi. Desteklenen: USD, EUR, TRY, GBP, CHF, JPY, AUD, CAD" },
        { status: 400 }
      );
    }
    const currency = normalizeAccountCurrency(body.currency, "USD");
    const credit = Number.isFinite(Number(body.credit)) ? Number(body.credit) : 0;
    const bonus = Number.isFinite(Number(body.bonus)) ? Number(body.bonus) : 0;
    const role = String(body.role || "TRADER").toUpperCase() === "ADMIN" ? "ADMIN" : "TRADER";

    const user = await prisma.user.create({
      data: {
        email,
        accountLoginId,
        passwordHash,
        name,
        role,
        active: body.active === false ? false : true,
        registrationDate: new Date(),
        ...membership,
        firstName,
        lastName,
        account: {
          create: {
            balance,
            equity: balance,
            freeMargin: balance,
            currency,
            credit,
            bonus,
          },
        },
      },
      include: { account: true },
    });

    await writeAudit({
      adminId: admin.id,
      action: "CREATE_USER",
      targetId: user.id,
      note: body.note ? String(body.note).slice(0, 500) : null,
      meta: { email, role },
    });

    return NextResponse.json({
      ok: true,
      user: serializeUserMembership(user as unknown as Record<string, unknown>),
    });
  }

  // Bulk actions
  if (action === "bulk") {
    const userIds: string[] = Array.isArray(body.userIds)
      ? body.userIds.map((x: unknown) => String(x)).filter(Boolean)
      : [];
    const bulkAction = String(body.bulkAction || "");
    if (!userIds.length || !bulkAction) {
      return NextResponse.json({ error: "userIds ve bulkAction gerekli" }, { status: 400 });
    }

    if (bulkAction === "freeze" || bulkAction === "activate") {
      const active = bulkAction === "activate";
      const envAdmin = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
      let ids = userIds.filter((id) => !(id === admin.id && !active));
      if (!active && envAdmin) {
        const protectedRows = await prisma.user.findMany({
          where: { id: { in: ids }, email: envAdmin },
          select: { id: true },
        });
        const blocked = new Set(protectedRows.map((r) => r.id));
        ids = ids.filter((id) => !blocked.has(id));
      }
      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { active },
      });
      await writeAudit({
        adminId: admin.id,
        action: active ? "BULK_UNFREEZE" : "BULK_FREEZE",
        meta: { userIds: ids },
      });
      return NextResponse.json({ ok: true, count: ids.length });
    }

    if (bulkAction === "assignDesk" || bulkAction === "assignBroker") {
      const data: Record<string, unknown> = {};
      if (bulkAction === "assignDesk") {
        data.desk = body.desk != null ? String(body.desk).slice(0, 80) || null : null;
        if (body.deskId !== undefined) {
          data.deskId = body.deskId != null ? String(body.deskId).slice(0, 80) || null : null;
        }
      }
      if (bulkAction === "assignBroker") {
        data.brokerName =
          body.brokerName != null ? String(body.brokerName).slice(0, 120) || null : null;
        if (body.assigneeName !== undefined) {
          data.assigneeName =
            body.assigneeName != null ? String(body.assigneeName).slice(0, 120) || null : null;
        }
      }
      await prisma.user.updateMany({ where: { id: { in: userIds } }, data });
      await writeAudit({
        adminId: admin.id,
        action: bulkAction === "assignDesk" ? "BULK_ASSIGN_DESK" : "BULK_ASSIGN_BROKER",
        meta: { userIds, ...data },
      });
      return NextResponse.json({ ok: true, count: userIds.length });
    }

    return NextResponse.json({ error: "Bilinmeyen bulkAction" }, { status: 400 });
  }

  const userId = String(body.userId || "");
  if (!userId || !action) {
    return NextResponse.json({ error: "userId ve action gerekli" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, include: { account: true } });
  if (!target) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });

  if (action === "setRole") {
    const role = String(body.role || "").toUpperCase();
    if (role !== "ADMIN" && role !== "TRADER") {
      return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
    }
    if (target.id === admin.id && role !== "ADMIN") {
      return NextResponse.json({ error: "Kendi admin rolünüzü kaldıramazsınız" }, { status: 400 });
    }
    await prisma.user.update({ where: { id: userId }, data: { role } });
    await writeAudit({
      adminId: admin.id,
      action: role === "ADMIN" ? "PROMOTE" : "DEMOTE",
      targetId: userId,
      note: body.note ? String(body.note).slice(0, 500) : null,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "setActive") {
    const active = Boolean(body.active);
    if (target.id === admin.id && !active) {
      return NextResponse.json({ error: "Kendinizi donduramazsınız" }, { status: 400 });
    }
    const envAdmin = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!active && envAdmin && target.email === envAdmin) {
      return NextResponse.json(
        { error: "Prod ADMIN_EMAIL hesabı dondurulamaz" },
        { status: 400 }
      );
    }
    await prisma.user.update({ where: { id: userId }, data: { active } });
    await writeAudit({
      adminId: admin.id,
      action: active ? "UNFREEZE" : "FREEZE",
      targetId: userId,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "setPermissions") {
    if (target.role !== "ADMIN") {
      return NextResponse.json({ error: "İzinler yalnızca ADMIN için" }, { status: 400 });
    }
    const data: Record<string, boolean> = {};
    for (const key of [
      "canManageUsers",
      "canApproveDeposits",
      "canEditRates",
      "canManageMethods",
      "canAdjustBalance",
    ] as const) {
      if (typeof body[key] === "boolean") data[key] = body[key];
    }
    await prisma.user.update({ where: { id: userId }, data });
    await writeAudit({
      adminId: admin.id,
      action: "SET_PERMISSIONS",
      targetId: userId,
      meta: data,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "adjustBalance") {
    const balAdmin = await requireAdminPerm("canAdjustBalance");
    if (!balAdmin) return NextResponse.json({ error: "Bakiye düzeltme yetkisi yok" }, { status: 403 });
    const amount = Number(body.amount);
    const note = String(body.note || "").trim();
    if (!Number.isFinite(amount) || amount === 0) {
      return NextResponse.json({ error: "Geçerli tutar gerekli" }, { status: 400 });
    }
    if (!note) {
      return NextResponse.json({ error: "Denetim notu zorunlu" }, { status: 400 });
    }
    if (!target.account) {
      return NextResponse.json({ error: "Hesap yok" }, { status: 404 });
    }
    const balanceBefore = target.account.balance;
    const balanceAfter = balanceBefore + amount;
    await prisma.account.update({
      where: { userId },
      data: { balance: balanceAfter },
    });
    await recordLedger({
      userId,
      type: "ADJUSTMENT",
      amount,
      balanceBefore,
      balanceAfter,
      currency: target.account.currency,
      comment: note,
      createdById: balAdmin.id,
      createdByName: balAdmin.name,
      refType: "AuditLog",
    });
    await refreshAccountMetrics(userId);
    await writeAudit({
      adminId: balAdmin.id,
      action: "ADJUST_BALANCE",
      targetId: userId,
      note,
      meta: { amount, previousBalance: balanceBefore },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "updateFinance") {
    const balAdmin = await requireAdminPerm("canAdjustBalance");
    if (!balAdmin) return NextResponse.json({ error: "Bakiye düzeltme yetkisi yok" }, { status: 403 });
    if (!target.account) {
      return NextResponse.json({ error: "Hesap yok" }, { status: 404 });
    }
    const data: Record<string, number | string> = {};
    if (body.balance !== undefined && Number.isFinite(Number(body.balance))) {
      data.balance = Number(body.balance);
    }
    if (body.credit !== undefined && Number.isFinite(Number(body.credit))) {
      data.credit = Number(body.credit);
    }
    if (body.bonus !== undefined && Number.isFinite(Number(body.bonus))) {
      data.bonus = Number(body.bonus);
    }
    if (body.currency !== undefined) {
      if (!isSupportedAccountCurrency(body.currency)) {
        return NextResponse.json(
          { error: "Geçersiz para birimi. Desteklenen: USD, EUR, TRY, GBP, CHF, JPY, AUD, CAD" },
          { status: 400 }
        );
      }
      data.currency = normalizeAccountCurrency(body.currency);
    }
    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
    }
    const balanceBefore = target.account.balance;
    const currencyBefore = target.account.currency;
    const note = body.note != null && String(body.note).trim() ? String(body.note).trim().slice(0, 500) : null;
    await prisma.account.update({ where: { userId }, data });
    const currencyAfter =
      typeof data.currency === "string" ? data.currency : target.account.currency;
    if (typeof data.balance === "number" && data.balance !== balanceBefore) {
      await recordLedger({
        userId,
        type: "FINANCE_SET",
        amount: data.balance - balanceBefore,
        balanceBefore,
        balanceAfter: data.balance,
        currency: currencyAfter,
        comment: note || "Finance update",
        createdById: balAdmin.id,
        createdByName: balAdmin.name,
        refType: "AuditLog",
      });
    } else if (typeof data.currency === "string" && data.currency !== currencyBefore) {
      await recordLedger({
        userId,
        type: "CURRENCY_CHANGE",
        amount: 0,
        balanceBefore,
        balanceAfter: balanceBefore,
        currency: currencyAfter,
        comment: note || `Para birimi: ${currencyBefore} → ${currencyAfter}`,
        createdById: balAdmin.id,
        createdByName: balAdmin.name,
        refType: "AuditLog",
      });
    }
    const updated = await refreshAccountMetrics(userId);
    await writeAudit({
      adminId: balAdmin.id,
      action:
        typeof data.currency === "string" && data.currency !== currencyBefore
          ? "UPDATE_CURRENCY"
          : "UPDATE_FINANCE",
      targetId: userId,
      note,
      meta: {
        ...data,
        previousCurrency: currencyBefore,
        previousBalance: balanceBefore,
      },
    });
    return NextResponse.json({
      ok: true,
      currency: currencyAfter,
      account: updated
        ? {
            balance: updated.balance,
            equity: updated.equity,
            credit: updated.credit,
            bonus: updated.bonus,
            currency: updated.currency,
          }
        : { currency: currencyAfter },
    });
  }

  if (action === "resetPassword") {
    const password = String(body.password || "");
    if (password.length < 8) {
      return NextResponse.json({ error: "Şifre en az 8 karakter" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await writeAudit({
      adminId: admin.id,
      action: "RESET_PASSWORD",
      targetId: userId,
      note: body.note ? String(body.note).slice(0, 500) : "Admin password reset",
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bilinmeyen action" }, { status: 400 });
}
