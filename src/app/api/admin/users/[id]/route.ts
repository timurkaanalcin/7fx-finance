import { canAccessUser, isScopedStaff } from "@/lib/crm-scope";
import { NextResponse } from "next/server";
import { writeAudit, requireAdmin, requireAdminPerm, isCrmReadOnlyAdmin } from "@/lib/auth";
import { maskTraderForRoViewer } from "@/lib/security/mask";
import { prisma } from "@/lib/prisma";
import {
  isSupportedAccountCurrency,
  normalizeAccountCurrency,
  parseMembershipUpdate,
  serializeUserMembership,
} from "@/lib/membership";
import { isAccountLoginId } from "@/lib/account-login-id";
import { recordLedger } from "@/lib/ledger";
import { jobTitleSchema } from "@/lib/job-titles";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { noteVisibilityWhere } from "@/lib/comment-teams";
import { crmPageWindow, pagedOrLegacy, traderDetailScope } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

function slicePage<T>(found: T[], take: number, skip: number) {
  const hasMore = found.length > take;
  const rows = hasMore ? found.slice(0, take) : found;
  return { rows, hasMore, nextSkip: skip + rows.length };
}

export async function GET(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = ctx.params.id;
  if (!(await canAccessUser(admin, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const search = new URL(req.url).searchParams;
  const scope = traderDetailScope(search.get("view"));
  const withNotes = scope === "full" || scope === "profile";
  const user = await prisma.user.findUnique({
    where: { id },
    include: { account: true },
  });
  if (!user) return NextResponse.json({ error: "User yok" }, { status: 404 });
  const notePage = crmPageWindow(search.get("take"), search.get("skip"));
  const noteFound = withNotes
    ? await prisma.userNote.findMany({
        where: { userId: id, ...(noteVisibilityWhere(admin) || {}) },
        orderBy: { createdAt: "desc" },
        skip: notePage.skip,
        take: notePage.take + 1,
      })
    : [];
  const noteSlice = slicePage(noteFound, notePage.take, notePage.skip);
  const notes = noteSlice.rows;
  const notesHasMore = noteSlice.hasMore;
  const notesNextSkip = noteSlice.nextSkip;

  const membership = serializeUserMembership(user as unknown as Record<string, unknown>);
  const roViewer = isCrmReadOnlyAdmin(admin);
  const userOut = roViewer
    ? maskTraderForRoViewer(membership as unknown as Record<string, unknown>)
    : membership;
  const pack = (extra: Record<string, unknown>) =>
    NextResponse.json({
      user: userOut,
      dataMasked: roViewer,
      tradingAccountId: membership.tradingAccountId,
      view: scope,
      ...extra,
    });

  if (scope === "finance") return pack({});

  if (scope === "profile") {
    if (search.get("part") === "notes") {
      return pack({ notes, notesHasMore, notesNextSkip });
    }
    const activityEvents = await prisma.clientActivityEvent.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return pack({ notes, notesHasMore, notesNextSkip, activityEvents: mapActivity(activityEvents) });
  }

  if (scope === "positions") {
    const part = search.get("part");
    const pos = crmPageWindow(search.get("take"), part === "orders" ? null : search.get("skip"));
    const ord = crmPageWindow(
      search.get("orderTake") ?? (part === "orders" ? search.get("take") : null),
      search.get("orderSkip") ?? (part === "orders" ? search.get("skip") : null)
    );
    const [positionsFound, ordersFound] = await Promise.all([
      part === "orders"
        ? Promise.resolve(null)
        : prisma.position.findMany({
            where: { userId: id },
            orderBy: { openedAt: "desc" },
            skip: pos.skip,
            take: pos.take + 1,
          }),
      part === "positions"
        ? Promise.resolve(null)
        : prisma.order.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
            skip: ord.skip,
            take: ord.take + 1,
          }),
    ]);
    const positionsPage = positionsFound ? slicePage(positionsFound, pos.take, pos.skip) : null;
    const ordersPage = ordersFound ? slicePage(ordersFound, ord.take, ord.skip) : null;
    return pack({
      ...(positionsPage
        ? {
            positions: positionsPage.rows,
            positionsHasMore: positionsPage.hasMore,
            positionsNextSkip: positionsPage.nextSkip,
          }
        : {}),
      ...(ordersPage
        ? { orders: ordersPage.rows, ordersHasMore: ordersPage.hasMore, ordersNextSkip: ordersPage.nextSkip }
        : {}),
    });
  }

  if (scope === "comms") {
    const page = crmPageWindow(search.get("take"), search.get("skip"));
    const found = await prisma.communication.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take + 1,
    });
    const communications = slicePage(found, page.take, page.skip);
    return pack({
      communications: communications.rows,
      communicationsHasMore: communications.hasMore,
      communicationsNextSkip: communications.nextSkip,
    });
  }

  if (scope === "tickets") {
    const part = search.get("part");
    const page = crmPageWindow(search.get("take"), search.get("skip"));
    const wantDeposits = part == null || part === "deposits";
    const wantWithdrawals = part == null || part === "withdrawals";
    const wantBalance = part == null || part === "balance";
    const [depositsFound, withdrawalsFound, balanceFound, depositMethods] = await Promise.all([
      wantDeposits
        ? prisma.depositRequest.findMany({
            where: { userId: id },
            include: { method: true },
            orderBy: { createdAt: "desc" },
            skip: page.skip,
            take: page.take + 1,
          })
        : Promise.resolve(null),
      wantWithdrawals
        ? prisma.withdrawalRequest.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
            skip: page.skip,
            take: page.take + 1,
          })
        : Promise.resolve(null),
      wantBalance
        ? prisma.balanceRequest.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
            skip: page.skip,
            take: page.take + 1,
          })
        : Promise.resolve(null),
      part == null
        ? prisma.depositMethod.findMany({
            select: { id: true, label: true, type: true, active: true },
            orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
          })
        : Promise.resolve(null),
    ]);
    const deposits = depositsFound ? slicePage(depositsFound, page.take, page.skip) : null;
    const withdrawals = withdrawalsFound ? slicePage(withdrawalsFound, page.take, page.skip) : null;
    const balanceRequests = balanceFound ? slicePage(balanceFound, page.take, page.skip) : null;
    return pack({
      ...(deposits
        ? { deposits: deposits.rows, depositsHasMore: deposits.hasMore, depositsNextSkip: deposits.nextSkip }
        : {}),
      ...(withdrawals
        ? {
            withdrawals: withdrawals.rows,
            withdrawalsHasMore: withdrawals.hasMore,
            withdrawalsNextSkip: withdrawals.nextSkip,
          }
        : {}),
      ...(balanceRequests
        ? {
            balanceRequests: balanceRequests.rows,
            balanceRequestsHasMore: balanceRequests.hasMore,
            balanceRequestsNextSkip: balanceRequests.nextSkip,
          }
        : {}),
      ...(depositMethods ? { depositMethods } : {}),
    });
  }

  if (scope === "ledger") {
    const params = new URL(req.url).searchParams;
    const paged = params.has("take") || params.has("skip");
    const page = pagedOrLegacy(params.get("take"), params.get("skip"), paged, 200);
    const found = await prisma.balanceLedger.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.paged ? page.take + 1 : page.take,
    });
    const hasMore = page.paged && found.length > page.take;
    const ledger = hasMore ? found.slice(0, page.take) : found;
    return pack({ ledger, hasMore, nextSkip: page.skip + ledger.length });
  }

  if (scope === "documents") {
    const page = crmPageWindow(search.get("take"), search.get("skip"));
    const found = await prisma.documentRecord.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take + 1,
    });
    const documents = slicePage(found, page.take, page.skip);
    return pack({
      documents: documents.rows,
      documentsHasMore: documents.hasMore,
      documentsNextSkip: documents.nextSkip,
    });
  }

  if (scope === "reminders") {
    const page = crmPageWindow(search.get("take"), search.get("skip"));
    const found = await prisma.reminder.findMany({
      where: { userId: id },
      orderBy: { remindAt: "asc" },
      skip: page.skip,
      take: page.take + 1,
    });
    const reminders = slicePage(found, page.take, page.skip);
    return pack({
      reminders: reminders.rows,
      remindersHasMore: reminders.hasMore,
      remindersNextSkip: reminders.nextSkip,
    });
  }

  const first = { take: 50, skip: 0 };
  const [
    positionsFound,
    ordersFound,
    depositsFound,
    balanceFound,
    ledgerPage,
    communicationsFound,
    documentsFound,
    remindersFound,
    withdrawalsFound,
    depositMethods,
    activityEvents,
  ] = await Promise.all([
    prisma.position.findMany({
      where: { userId: id },
      orderBy: { openedAt: "desc" },
      take: first.take + 1,
    }),
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: first.take + 1,
    }),
    prisma.depositRequest.findMany({
      where: { userId: id },
      include: { method: true },
      orderBy: { createdAt: "desc" },
      take: first.take + 1,
    }),
    prisma.balanceRequest.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: first.take + 1,
    }),
    (async () => {
      const page = pagedOrLegacy(search.get("take"), search.get("skip"), true, 50);
      const found = await prisma.balanceLedger.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        skip: page.skip,
        take: page.take + 1,
      });
      const ledgerHasMore = found.length > page.take;
      const ledger = ledgerHasMore ? found.slice(0, page.take) : found;
      return { ledger, ledgerHasMore, ledgerNextSkip: page.skip + ledger.length };
    })(),
    prisma.communication.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: first.take + 1,
    }),
    prisma.documentRecord.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: first.take + 1,
    }),
    prisma.reminder.findMany({
      where: { userId: id },
      orderBy: { remindAt: "asc" },
      take: first.take + 1,
    }),
    prisma.withdrawalRequest.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: first.take + 1,
    }),
    prisma.depositMethod.findMany({
      select: { id: true, label: true, type: true, active: true },
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
    }),
    prisma.clientActivityEvent.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  const positions = slicePage(positionsFound, first.take, first.skip);
  const orders = slicePage(ordersFound, first.take, first.skip);
  const deposits = slicePage(depositsFound, first.take, first.skip);
  const balanceRequests = slicePage(balanceFound, first.take, first.skip);
  const communications = slicePage(communicationsFound, first.take, first.skip);
  const documents = slicePage(documentsFound, first.take, first.skip);
  const reminders = slicePage(remindersFound, first.take, first.skip);
  const withdrawals = slicePage(withdrawalsFound, first.take, first.skip);

  return pack({
    notes,
    notesHasMore,
    notesNextSkip,
    positions: positions.rows,
    positionsHasMore: positions.hasMore,
    positionsNextSkip: positions.nextSkip,
    orders: orders.rows,
    ordersHasMore: orders.hasMore,
    ordersNextSkip: orders.nextSkip,
    deposits: deposits.rows,
    depositsHasMore: deposits.hasMore,
    depositsNextSkip: deposits.nextSkip,
    balanceRequests: balanceRequests.rows,
    balanceRequestsHasMore: balanceRequests.hasMore,
    balanceRequestsNextSkip: balanceRequests.nextSkip,
    ledger: ledgerPage.ledger,
    ledgerHasMore: ledgerPage.ledgerHasMore,
    ledgerNextSkip: ledgerPage.ledgerNextSkip,
    communications: communications.rows,
    communicationsHasMore: communications.hasMore,
    communicationsNextSkip: communications.nextSkip,
    documents: documents.rows,
    documentsHasMore: documents.hasMore,
    documentsNextSkip: documents.nextSkip,
    reminders: reminders.rows,
    remindersHasMore: reminders.hasMore,
    remindersNextSkip: reminders.nextSkip,
    withdrawals: withdrawals.rows,
    withdrawalsHasMore: withdrawals.hasMore,
    withdrawalsNextSkip: withdrawals.nextSkip,
    depositMethods,
    activityEvents: mapActivity(activityEvents),
  });
}

function mapActivity(
  events: {
    id: string;
    kind: string;
    path: string | null;
    userAgent: string | null;
    meta: string | null;
    createdAt: Date;
  }[]
) {
  return events.map((e) => ({
    id: e.id,
    kind: e.kind,
    path: e.path,
    userAgent: e.userAgent,
    meta: e.meta,
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  // Scoped staff (Sales/Retention Manager) never edit profiles or reassign; retention goes via /api/admin/retention/[id].
  if (isScopedStaff(admin)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  if (body.assigneeId !== undefined) {
    if (target.role !== "TRADER") return NextResponse.json({ error: "Only customers can be assigned" }, { status: 400 });
    const aid = String(body.assigneeId || "").trim();
    if (!aid) {
      (data as Record<string, unknown>).assigneeId = null;
    } else {
      const staff = await prisma.user.findFirst({ where: { id: aid, role: "ADMIN" }, select: { id: true, name: true } });
      if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 400 });
      (data as Record<string, unknown>).assigneeId = staff.id;
      (data as Record<string, unknown>).assigneeName = staff.name;
    }
  }

  if (body.retentionNote !== undefined) {
    (data as Record<string, unknown>).retentionNote = String(body.retentionNote || "").slice(0, 4000) || null;
  }
  if (body.retentionFollowUpAt !== undefined) {
    const raw = String(body.retentionFollowUpAt || "").trim();
    const d = raw ? new Date(raw) : null;
    if (d && Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    (data as Record<string, unknown>).retentionFollowUpAt = d;
  }

  if (body.jobTitle !== undefined) {
    const jt = jobTitleSchema.safeParse(body.jobTitle);
    if (!jt.success) return NextResponse.json({ error: "Invalid job title" }, { status: 400 });
    (data as Record<string, unknown>).jobTitle = jt.data ?? null;
  }

  // Invalid reason (explicit field or INV_* sale status) → leadInvalid sync (manual, never overwritten by auto)
  {
    const { isInvalidCode, manualReasonData } = await import("@/lib/lead-invalid");
    const d = data as Record<string, unknown>;
    if (body.leadInvalidReason !== undefined) {
      const r = String(body.leadInvalidReason || "").trim();
      if (r && !isInvalidCode(r)) return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
      Object.assign(d, manualReasonData(r || null));
      if (r) d.saleStatus = r;
      else if (String(target.saleStatus || "").startsWith("INV_") && d.saleStatus === undefined) d.saleStatus = "NEW";
    } else if (d.saleStatus !== undefined && d.saleStatus !== target.saleStatus) {
      const ss = String(d.saleStatus || "");
      if (isInvalidCode(ss)) Object.assign(d, manualReasonData(ss));
      else if (target.leadInvalidReason || String(target.saleStatus || "").startsWith("INV_")) Object.assign(d, manualReasonData(null));
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
