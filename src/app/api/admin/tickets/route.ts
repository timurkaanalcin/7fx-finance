import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const kind = (searchParams.get("kind") || "all").toLowerCase();

  const depWhere = status ? { status: status.toUpperCase() } : {};
  const balWhere = status ? { status: status.toUpperCase() } : {};

  const [deposits, balanceReqs] = await Promise.all([
    kind === "margin"
      ? Promise.resolve([])
      : prisma.depositRequest.findMany({
          where: depWhere,
          include: {
            method: true,
            user: { select: { id: true, name: true, email: true, account: true, country: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
    kind === "deposit"
      ? Promise.resolve([])
      : prisma.balanceRequest.findMany({
          where: balWhere,
          include: {
            user: { select: { id: true, name: true, email: true, account: true, country: true } },
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
      customer: d.user.name,
      customerId: d.userId,
      customerEmail: d.user.email,
      tradingAccountId: d.user.account?.id ?? null,
      country: d.user.country,
      openedAt: d.createdAt,
      closedAt: d.reviewedAt,
    })),
    ...balanceReqs.map((b) => ({
      id: b.id,
      kind: "MARGIN" as const,
      amount: b.amount,
      currency: "USD",
      status: b.status,
      method: b.type,
      customer: b.user.name,
      customerId: b.userId,
      customerEmail: b.user.email,
      tradingAccountId: b.user.account?.id ?? null,
      country: b.user.country,
      openedAt: b.createdAt,
      closedAt: b.reviewedAt,
      reason: b.reason,
    })),
  ].sort((a, b) => +new Date(b.openedAt) - +new Date(a.openedAt));

  return NextResponse.json({ tickets });
}
