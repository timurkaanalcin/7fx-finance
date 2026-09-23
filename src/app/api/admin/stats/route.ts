import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const [
    users,
    openPositions,
    pendingDeposits,
    pendingBalance,
    volumeAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.position.count({ where: { status: "OPEN" } }),
    prisma.depositRequest.count({ where: { status: "PENDING" } }),
    prisma.balanceRequest.count({ where: { status: "PENDING" } }),
    prisma.position.aggregate({
      _sum: { volume: true },
      where: { status: { in: ["OPEN", "CLOSED"] } },
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
  });
}
