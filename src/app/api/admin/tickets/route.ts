import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canApproveDeposits");
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
  const userSelect = {
    select: { id: true, name: true, email: true, account: true, country: true, accountLoginId: true },
  } as const;

  const [deposits, balanceReqs, withdrawals] = await Promise.all([
    kind === "margin" || kind === "withdraw"
      ? Promise.resolve([])
      : prisma.depositRequest.findMany({
          where: depWhere,
          include: {
            method: true,
            user: userSelect,
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
    kind === "deposit" || kind === "withdraw"
      ? Promise.resolve([])
      : prisma.balanceRequest.findMany({
          where: balWhere,
          include: {
            user: userSelect,
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
    kind === "deposit" || kind === "margin"
      ? Promise.resolve([])
      : prisma.withdrawalRequest.findMany({
          where: wdWhere,
          include: {
            user: userSelect,
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
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
  ].sort((a, b) => +new Date(b.openedAt) - +new Date(a.openedAt));

  const methods = await prisma.depositMethod.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
    select: { id: true, label: true, type: true, active: true },
  });
  return NextResponse.json({ tickets, methods });
}
