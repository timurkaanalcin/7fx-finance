import { NextResponse } from "next/server";
import { writeAudit, requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isSupportedAccountCurrency,
  normalizeAccountCurrency,
  parseMembershipUpdate,
  serializeUserMembership,
} from "@/lib/membership";
import { isAccountLoginId } from "@/lib/account-login-id";
import { recordLedger } from "@/lib/ledger";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = ctx.params.id;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      account: true,
      notes: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
  if (!user) return NextResponse.json({ error: "User yok" }, { status: 404 });

  const [
    positions,
    orders,
    deposits,
    balanceRequests,
    ledger,
    communications,
    documents,
    reminders,
    withdrawals,
    depositMethods,
  ] =
    await Promise.all([
      prisma.position.findMany({
        where: { userId: id },
        orderBy: { openedAt: "desc" },
        take: 100,
      }),
      prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.depositRequest.findMany({
        where: { userId: id },
        include: { method: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.balanceRequest.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.balanceLedger.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.communication.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.documentRecord.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.reminder.findMany({
        where: { userId: id },
        orderBy: { remindAt: "asc" },
        take: 100,
      }),
      prisma.withdrawalRequest.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.depositMethod.findMany({
        select: { id: true, label: true, type: true, active: true },
        orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
      }),
    ]);

  const membership = serializeUserMembership(user as unknown as Record<string, unknown>);

  return NextResponse.json({
    user: membership,
    tradingAccountId: membership.tradingAccountId,
    notes: user.notes,
    positions,
    orders,
    deposits,
    balanceRequests,
    ledger,
    communications,
    documents,
    reminders,
    withdrawals,
    depositMethods,
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = ctx.params.id;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User yok" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // Add note
  if (body.addNote) {
    const noteBody = String(body.addNote).trim().slice(0, 2000);
    if (!noteBody) {
      return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 });
    }
    const note = await prisma.userNote.create({
      data: {
        userId: id,
        authorId: admin.id,
        authorName: admin.name,
        body: noteBody,
      },
    });
    await writeAudit({
      adminId: admin.id,
      action: "ADD_NOTE",
      targetId: id,
      note: noteBody.slice(0, 200),
    });
    return NextResponse.json({ ok: true, note });
  }

  const data = parseMembershipUpdate(body);
  if (body.active !== undefined && typeof body.active === "boolean") {
    if (target.id === admin.id && !body.active) {
      return NextResponse.json({ error: "You cannot freeze yourself" }, { status: 400 });
    }
    const envAdmin = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!body.active && envAdmin && target.email === envAdmin) {
      return NextResponse.json(
        { error: "Production ADMIN_EMAIL account cannot be frozen" },
        { status: 400 }
      );
    }
    data.active = body.active;
  }
  if (body.role !== undefined) {
    const role = String(body.role).toUpperCase();
    if (role === "ADMIN" || role === "TRADER") {
      if (target.id === admin.id && role !== "ADMIN") {
        return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
      }
      data.role = role;
    }
  }

  // User.name is required — ignore an empty display name instead of failing.
  if (data.name === null) delete data.name;

  const envAdminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  // Email (login) — unique, lower-case. The production ADMIN_EMAIL account keeps its email
  // (the seed re-creates/repairs that admin by email).
  if (body.email !== undefined) {
    const email = String(body.email || "").trim().toLowerCase();
    if (email !== target.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
      if (envAdminEmail && target.email === envAdminEmail) {
        return NextResponse.json(
          { error: "Production ADMIN_EMAIL account email cannot be changed" },
          { status: 400 }
        );
      }
      const clash = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (clash && clash.id !== id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      data.email = email;
    }
  }

  // 16-digit Account ID (login) — digits only, unique
  if (body.accountLoginId !== undefined) {
    const loginId = String(body.accountLoginId || "").trim();
    if (loginId !== (target.accountLoginId || "")) {
      if (!isAccountLoginId(loginId)) {
        return NextResponse.json({ error: "Account ID must be exactly 16 digits" }, { status: 400 });
      }
      const clash = await prisma.user.findUnique({ where: { accountLoginId: loginId }, select: { id: true } });
      if (clash && clash.id !== id) {
        return NextResponse.json({ error: "Account ID already in use" }, { status: 409 });
      }
      data.accountLoginId = loginId;
    }
  }

  // Trading account fields shown on the profile (stored on Account)
  const accountData: Record<string, unknown> = {};
  const account = await prisma.account.findUnique({ where: { userId: id } });
  if (body.leverage !== undefined && body.leverage !== "") {
    const lev = Math.round(Number(body.leverage));
    if (!Number.isFinite(lev) || lev < 1 || lev > 5000) {
      return NextResponse.json({ error: "Leverage must be 1–5000" }, { status: 400 });
    }
    if (account && lev !== account.leverage) accountData.leverage = lev;
  }
  if (body.currency !== undefined && body.currency !== "") {
    if (!isSupportedAccountCurrency(body.currency)) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }
    const cur = normalizeAccountCurrency(body.currency);
    if (account && cur !== account.currency) accountData.currency = cur;
  }
  if (Object.keys(accountData).length && !(await requireAdminPerm("canAdjustBalance"))) {
    return NextResponse.json({ error: "No permission to change leverage/currency" }, { status: 403 });
  }

  if (!Object.keys(data).length && !Object.keys(accountData).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  if (account && Object.keys(accountData).length) {
    await prisma.account.update({ where: { userId: id }, data: accountData });
    if (accountData.currency) {
      await recordLedger({
        userId: id,
        type: "CURRENCY_CHANGE",
        amount: 0,
        balanceBefore: account.balance,
        balanceAfter: account.balance,
        currency: String(accountData.currency),
        comment: `Para birimi: ${account.currency} → ${accountData.currency}`,
        createdById: admin.id,
        createdByName: admin.name,
        refType: "AuditLog",
      });
    }
    await writeAudit({
      adminId: admin.id,
      action: "UPDATE_ACCOUNT_SETTINGS",
      targetId: id,
      meta: { ...accountData, previousLeverage: account.leverage, previousCurrency: account.currency },
    });
  }

  // Sync name from first/last if needed
  if ((data.firstName !== undefined || data.lastName !== undefined) && data.name === undefined) {
    const fn = data.firstName !== undefined ? data.firstName : target.firstName;
    const ln = data.lastName !== undefined ? data.lastName : target.lastName;
    const composed = [fn, ln].filter(Boolean).join(" ").trim();
    if (composed) data.name = composed;
  }

  const user = Object.keys(data).length
    ? await prisma.user.update({
        where: { id },
        data,
        include: { account: true },
      })
    : await prisma.user.findUniqueOrThrow({ where: { id }, include: { account: true } });

  if (Object.keys(data).length) {
    await writeAudit({
      adminId: admin.id,
      action: "UPDATE_MEMBERSHIP",
      targetId: id,
      meta: data,
    });
  }

  return NextResponse.json({
    ok: true,
    user: serializeUserMembership(user as unknown as Record<string, unknown>),
  });
}
