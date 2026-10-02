import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const [
    users,
    openPositions,
    pendingDeposits,
    pendingBalance,
    volumeAgg,
    recentPositions,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.position.count({ where: { status: "OPEN" } }),
    prisma.depositRequest.count({ where: { status: "PENDING" } }),
    prisma.balanceRequest.count({ where: { status: "PENDING" } }),
    prisma.position.aggregate({
      _sum: { volume: true },
      where: { status: { in: ["OPEN", "CLOSED"] } },
    }),
    prisma.position.findMany({
      orderBy: { openedAt: "desc" },
      take: 8,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({
    kpis: {
      users,
      openPositions,
      pendingDeposits,
      pendingBalanceRequests: pendingBalance,
      totalVolume: volumeAgg._sum.volume ?? 0,
    },
    recentActivity: {
      positions: recentPositions.map((p) => ({
        id: p.id,
        symbol: p.symbol,
        side: p.side,
        volume: p.volume,
        status: p.status,
        profit: p.profit,
        openedAt: p.openedAt,
        closedAt: p.closedAt,
        traderId: p.user.id,
        traderName: p.user.name,
      })),
      orders: recentOrders.map((o) => ({
        id: o.id,
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        volume: o.volume,
        status: o.status,
        createdAt: o.createdAt,
        traderId: o.user.id,
        traderName: o.user.name,
      })),
    },
    generatedAt: new Date().toISOString(),
  });
}
