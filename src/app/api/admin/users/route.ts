import { NextResponse } from "next/server";
import { writeAudit, ADMIN_PERMISSIONS, hashPassword, requireAdmin, requireAdminPerm } from "@/lib/auth";
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
import { ONLINE_MS, RECENT_MS, serializePresence } from "@/lib/presence-shared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const status = (searchParams.get("status") || "").trim(); // active | frozen | all
  const desk = (searchParams.get("desk") || "").trim();
  const country = (searchParams.get("country") || "").trim();
  const saleStatus = (searchParams.get("saleStatus") || "").trim();
  const retentionStatus = (searchParams.get("retentionStatus") || "").trim();
  const presence = (searchParams.get("presence") || "").trim(); // online | recent | offline

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
  if (status === "trade_off") and.push({ tradingEnabled: false });
  if (status === "withdraw_off") and.push({ withdrawalsEnabled: false });
  if (status === "login_off") and.push({ loginEnabled: false });
  if (desk) {
    const match = await prisma.desk.findFirst({
      where: { OR: [{ id: desk }, { code: desk }, { name: desk }] },
    });
    const ors: Record<string, string>[] = [{ desk }, { deskId: desk }];
    if (match) {
      ors.push({ desk: match.name }, { deskId: match.id });
      if (match.code) {
        ors.push({ deskId: match.code });
        ors.push({ desk: match.code });
      }
    }
    and.push({ OR: ors });
  }
  if (country) and.push({ country: { equals: country } });
  if (saleStatus) and.push({ saleStatus: { equals: saleStatus } });
  if (retentionStatus) and.push({ retentionStatus: { equals: retentionStatus } });
  if (presence) {
    const onlineSince = new Date(Date.now() - ONLINE_MS);
    const recentSince = new Date(Date.now() - RECENT_MS);
    if (presence === "online") and.push({ lastSeenAt: { gte: onlineSince } });
    else if (presence === "recent") and.push({ lastSeenAt: { gte: recentSince } });
    else if (presence === "offline")
      and.push({ OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: recentSince } }] });
  }
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
  const catalog = await prisma.desk.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
    take: 200,
  });
  const deskOptions = catalog.map((d) => ({ id: d.id, name: d.name, code: d.code }));
  const knownNames = new Set(catalog.map((d) => d.name));
  for (const row of desks) {
    const name = row.desk;
    if (name && !knownNames.has(name)) {
      deskOptions.push({ id: name, name, code: null });
      knownNames.add(name);
    }
  }

  return NextResponse.json({
    users: users.map((u) => ({
      ...serializeUserMembership(u as unknown as Record<string, unknown>),
      ...serializePresence(u as unknown as Record<string, unknown>),
    })),
    serverTime: new Date().toISOString(),
    desks: deskOptions.map((d) => d.name),
    deskOptions,
    permissionDefs: ADMIN_PERMISSIONS,
  });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  // Create new member
  if (action === "create") {
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
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
    // Real accounts start at 0 unless the admin explicitly enters a starting balance.
    const balance =
      body.balance !== undefined && body.balance !== null && body.balance !== "" && Number.isFinite(Number(body.balance))
        ? Number(body.balance)
        : 0;
    if (body.currency != null && body.currency !== "" && !isSupportedAccountCurrency(body.currency)) {
      return NextResponse.json(
        { error: "Invalid currency. Supported: USD, EUR, TRY, GBP, CHF, JPY, AUD, CAD" },
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
  if (!target) return NextResponse.json({ error: "User yok" }, { status: 404 });

  if (action === "setRolee") {
    const role = String(body.role || "").toUpperCase();
    if (role !== "ADMIN" && role !== "TRADER") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (target.id === admin.id && role !== "ADMIN") {
      return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
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
      return NextResponse.json({ error: "You cannot freeze yourself" }, { status: 400 });
    }
    const envAdmin = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!active && envAdmin && target.email === envAdmin) {
      return NextResponse.json(
        { error: "Production ADMIN_EMAIL account cannot be frozen" },
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
      return NextResponse.json({ error: "Permissions are for ADMIN only" }, { status: 400 });
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

  if (action === "adjustBalance" || action === "setBalance") {
    // Two explicit modes (CRM Finans tab):
    //   setBalance    → set main balance to an exact amount (ledger ADJUSTMENT with the delta)
    //   adjustBalance → add (+) / subtract (−) an amount on top of the current balance
    //                   (ledger type ADJUSTMENT | DEPOSIT | WITHDRAWAL as chosen)
    const balAdmin = await requireAdminPerm("canAdjustBalance");
    if (!balAdmin) return NextResponse.json({ error: "No permission to adjust balance" }, { status: 403 });
    if (!target.account) {
      return NextResponse.json({ error: "Account yok" }, { status: 404 });
    }
    const raw = typeof body.amount === "string" ? body.amount.replace(",", ".").trim() : body.amount;
    const value = raw === "" || raw == null ? NaN : Number(raw);
    if (!Number.isFinite(value)) {
      return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
    }
    const balanceBefore = target.account.balance;
    const balanceAfter = action === "setBalance" ? value : balanceBefore + value;
    const amount = balanceAfter - balanceBefore;
    if (action === "adjustBalance" && amount === 0) {
      return NextResponse.json({ error: "Amount cannot be 0" }, { status: 400 });
    }
    let ledgerType: "ADJUSTMENT" | "DEPOSIT" | "WITHDRAWAL" = "ADJUSTMENT";
    if (action === "adjustBalance") {
      const t = String(body.ledgerType || "ADJUSTMENT").toUpperCase();
      if (t === "DEPOSIT" || t === "WITHDRAWAL" || t === "ADJUSTMENT") ledgerType = t;
      else return NextResponse.json({ error: "Invalid ledgerType" }, { status: 400 });
      if (ledgerType === "DEPOSIT" && amount < 0) {
        return NextResponse.json({ error: "Deposit must be a positive amount" }, { status: 400 });
      }
      if (ledgerType === "WITHDRAWAL" && amount > 0) {
        return NextResponse.json({ error: "Withdrawal must be a negative amount" }, { status: 400 });
      }
    }
    const note =
      String(body.note || "").trim().slice(0, 500) ||
      (action === "setBalance"
        ? `CRM: main balance set ${balanceBefore} → ${balanceAfter}`
        : `CRM: manual ${ledgerType.toLowerCase()} ${amount >= 0 ? "+" : ""}${amount}`);
    if (amount !== 0) {
      await prisma.account.update({
        where: { userId },
        data: { balance: balanceAfter },
      });
      await recordLedger({
        userId,
        type: ledgerType,
        amount,
        balanceBefore,
        balanceAfter,
        currency: target.account.currency,
        comment: note,
        createdById: balAdmin.id,
        createdByName: balAdmin.name,
        refType: "AuditLog",
      });
    }
    const updated = await refreshAccountMetrics(userId);
    await writeAudit({
      adminId: balAdmin.id,
      action: action === "setBalance" ? "SET_BALANCE" : "ADJUST_BALANCE",
      targetId: userId,
      note,
      meta: { amount, ledgerType, previousBalance: balanceBefore, newBalance: balanceAfter },
    });
    return NextResponse.json({
      ok: true,
      account: updated
        ? {
            balance: updated.balance,
            equity: updated.equity,
            credit: updated.credit,
            bonus: updated.bonus,
            currency: updated.currency,
            margin: updated.margin,
            freeMargin: updated.freeMargin,
            leverage: updated.leverage,
          }
        : { balance: balanceAfter },
    });
  }

  if (action === "updateFinance") {
    const balAdmin = await requireAdminPerm("canAdjustBalance");
    if (!balAdmin) return NextResponse.json({ error: "No permission to adjust balance" }, { status: 403 });
    if (!target.account) {
      return NextResponse.json({ error: "Account yok" }, { status: 404 });
    }
    const data: Record<string, number | string> = {};
    if (body.balance !== undefined && body.balance !== null && body.balance !== "" && Number.isFinite(Number(body.balance))) {
      data.balance = Number(body.balance);
    }
    if (body.credit !== undefined && body.credit !== null && body.credit !== "" && Number.isFinite(Number(body.credit))) {
      data.credit = Number(body.credit);
    }
    if (body.bonus !== undefined && body.bonus !== null && body.bonus !== "" && Number.isFinite(Number(body.bonus))) {
      data.bonus = Number(body.bonus);
    }
    if (body.leverage !== undefined && body.leverage !== "") {
      const lev = Math.round(Number(body.leverage));
      if (!Number.isFinite(lev) || lev < 1 || lev > 5000) {
        return NextResponse.json({ error: "Leverage must be 1–5000" }, { status: 400 });
      }
      data.leverage = lev;
    }
    if (body.currency !== undefined) {
      if (!isSupportedAccountCurrency(body.currency)) {
        return NextResponse.json(
          { error: "Invalid currency. Supported: USD, EUR, TRY, GBP, CHF, JPY, AUD, CAD" },
          { status: 400 }
        );
      }
      data.currency = normalizeAccountCurrency(body.currency);
    }
    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
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
    // Admin sets a new password for a client. Never echoes/logs the password or hash.
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Password too long (max 128)" }, { status: 400 });
    }
    const envAdmin = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (envAdmin && target.email === envAdmin && admin.id !== target.id) {
      return NextResponse.json(
        { error: "Only the main ADMIN_EMAIL admin can change that account's password" },
        { status: 403 }
      );
    }
    const passwordHash = await hashPassword(password);
    const self = target.id === admin.id;
    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      // Revoke the target's existing sessions (JWT iat < passwordChangedAt). Skipped for
      // self-change so the acting admin is not logged out mid-session.
      data: self ? { passwordHash } : { passwordHash, passwordChangedAt: now },
    });
    // Expire any still-valid auto-login links for this user.
    const expiredLinks = await prisma.autoLoginLink
      .updateMany({ where: { userId, expiresAt: { gt: now } }, data: { expiresAt: now } })
      .then((r) => r.count)
      .catch(() => 0);
    await writeAudit({
      adminId: admin.id,
      action: "RESET_PASSWORD",
      targetId: userId,
      note: body.note ? String(body.note).slice(0, 500) : "Admin password reset",
      meta: { sessionsRevoked: !self, expiredLoginLinks: expiredLinks },
    });
    return NextResponse.json({ ok: true, sessionsRevoked: !self, expiredLoginLinks: expiredLinks });
  }

  return NextResponse.json({ error: "Bilinmeyen action" }, { status: 400 });
}
