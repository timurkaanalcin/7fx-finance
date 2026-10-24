import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { mergeTicketWindow, type TicketKind } from "@/lib/ticket-page";
import { crmPageWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const kind = (searchParams.get("kind") || "all").toLowerCase();

  const q = (searchParams.get("q") || "").trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const base: Record<string, unknown> = {};
  if (status) base.status = status.toUpperCase();
  const createdAt: Record<string, Date> = {};
  if (from && !Number.isNaN(new Date(from).getTime())) createdAt.gte = new Date(from);
  if (to && !Number.isNaN(new Date(to).getTime())) createdAt.lte = new Date(to);
  if (Object.keys(createdAt).length) base.createdAt = createdAt;
  if (q) {
    base.user = {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { accountLoginId: { contains: q } },
        { phone: { contains: q } },
      ],
    };
  }
  const depWhere = base;
  const balWhere = base;
  const wdWhere = base;
  const paged =
    searchParams.has("take") ||
    searchParams.has("depSkip") ||
    searchParams.has("marginSkip") ||
    searchParams.has("wdSkip");
  const pageSize = paged ? crmPageWindow(searchParams.get("take"), null).take : 200;
  const cursors = {
    deposit: paged ? clipSkip(searchParams.get("depSkip")) : 0,
    margin: paged ? clipSkip(searchParams.get("marginSkip")) : 0,
    withdraw: paged ? clipSkip(searchParams.get("wdSkip")) : 0,
  };
  const queryTake = paged ? pageSize + 1 : pageSize;
  const countFirst = paged && cursors.deposit === 0 && cursors.margin === 0 && cursors.withdraw === 0;
  const userSelect = {
    select: {
      id: true,
      name: true,
      email: true,
      country: true,
      accountLoginId: true,
      account: { select: { id: true, currency: true } },
    },
  } as const;

  const wantDeposit = kind !== "margin" && kind !== "withdraw";
  const wantMargin = kind !== "deposit" && kind !== "withdraw";
  const wantWithdraw = kind !== "deposit" && kind !== "margin";
  const [deposits, balanceReqs, withdrawals, depCount, marginCount, wdCount] = await Promise.all([
    !wantDeposit
      ? Promise.resolve([])
      : prisma.depositRequest.findMany({
          where: depWhere,
          include: {
            method: { select: { label: true } },
            user: userSelect,
          },
          orderBy: { createdAt: "desc" },
          skip: cursors.deposit,
          take: queryTake,
        }),
    !wantMargin
      ? Promise.resolve([])
      : prisma.balanceRequest.findMany({
          where: balWhere,
          include: {
            user: userSelect,
          },
          orderBy: { createdAt: "desc" },
          skip: cursors.margin,
          take: queryTake,
        }),
    !wantWithdraw
      ? Promise.resolve([])
      : prisma.withdrawalRequest.findMany({
          where: wdWhere,
          include: {
            user: userSelect,
          },
          orderBy: { createdAt: "desc" },
          skip: cursors.withdraw,
          take: queryTake,
        }),
    countFirst ? prisma.depositRequest.count({ where: depWhere }) : Promise.resolve(0),
    countFirst ? prisma.balanceRequest.count({ where: balWhere }) : Promise.resolve(0),
    countFirst ? prisma.withdrawalRequest.count({ where: wdWhere }) : Promise.resolve(0),
  ]);

  const tickets = [
    ...deposits.map((d) => ({
      id: d.id,
      kind: "DEPOSIT" as const,
      amount: d.amount,
      currency: d.currency,
      status: d.status,
      method: d.method.label,
      methodId: d.methodId,
      note: d.note,
      adminNote: d.adminNote,
      customer: d.user.name,
      accountLoginId: d.user.accountLoginId,
      customerId: d.userId,
      customerEmail: d.user.email,
      tradingAccountId: d.user.account?.id ?? null,
      country: d.user.country,
      openedAt: d.createdAt,
      closedAt: d.reviewedAt,
      approvalReason: d.approvalReason,
      eventScenario: d.eventScenario,
    })),
    ...balanceReqs.map((b) => ({
      id: b.id,
      kind: "MARGIN" as const,
      amount: b.amount,
      currency: b.user.account?.currency ?? "USD",
      status: b.status,
      method: b.type,
      type: b.type,
      adminNote: b.adminNote,
      customer: b.user.name,
      accountLoginId: b.user.accountLoginId,
      customerId: b.userId,
      customerEmail: b.user.email,
      tradingAccountId: b.user.account?.id ?? null,
      country: b.user.country,
      openedAt: b.createdAt,
      closedAt: b.reviewedAt,
      reason: b.reason,
      riskAcknowledged: b.riskAcknowledged,
      riskAcknowledgedAt: b.riskAcknowledgedAt,
      approvalReason: b.approvalReason,
      eventScenario: b.eventScenario,
    })),
    ...withdrawals.map((w) => ({
      id: w.id,
      kind: "WITHDRAW" as const,
      amount: w.amount,
      currency: w.currency,
      status: w.status,
      method: w.method,
      note: w.note,
      adminNote: w.adminNote,
      customer: w.user.name,
      accountLoginId: w.user.accountLoginId,
      customerId: w.userId,
      customerEmail: w.user.email,
      tradingAccountId: w.user.account?.id ?? null,
      country: w.user.country,
      openedAt: w.createdAt,
      closedAt: w.reviewedAt,
      details: w.details,
      approvalReason: w.approvalReason,
      eventScenario: w.eventScenario,
    })),
  ];

  const methods = await prisma.depositMethod.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
    select: { id: true, label: true, type: true, active: true },
  });

  if (!paged) {
    tickets.sort((a, b) => +new Date(b.openedAt) - +new Date(a.openedAt));
    return NextResponse.json({ tickets, methods });
  }

  const merged = mergeTicketWindow(
    [
      clipKind(tickets, "DEPOSIT", pageSize),
      clipKind(tickets, "MARGIN", pageSize),
      clipKind(tickets, "WITHDRAW", pageSize),
    ],
    cursors,
    pageSize
  );
  return NextResponse.json({
    tickets: merged.tickets,
    methods,
    hasMore: merged.hasMore,
    cursors: merged.cursors,
    counts: countFirst
      ? { DEPOSIT: depCount, MARGIN: marginCount, WITHDRAW: wdCount }
      : undefined,
  });
}

function clipSkip(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100_000, Math.trunc(n));
}

function clipKind<T extends { kind: TicketKind }>(rows: T[], kind: TicketKind, take: number) {
  const matched = rows.filter((row) => row.kind === kind);
  const extra = matched.length > take;
  return { kind, rows: extra ? matched.slice(0, take) : matched, extra };
}
