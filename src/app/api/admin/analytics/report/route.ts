import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const [
    depositsSum,
    withdrawalsSum,
    openPositions,
    closedPositions,
    pendingTickets,
    activeTraders,
    frozenTraders,
    activeDesks,
    pendingDocs,
    communications,
    ftdCount,
  ] = await Promise.all([
    prisma.depositRequest.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true }, _count: true }),
    prisma.balanceLedger.aggregate({ where: { type: "WITHDRAWAL" }, _sum: { amount: true }, _count: true }),
    prisma.position.count({ where: { status: "OPEN" } }),
    prisma.position.count({ where: { status: "CLOSED" } }),
    Promise.all([
      prisma.depositRequest.count({ where: { status: "PENDING" } }),
      prisma.balanceRequest.count({ where: { status: "PENDING" } }),
    ]).then(([a, b]) => a + b),
    prisma.user.count({ where: { role: "TRADER", active: true } }),
    prisma.user.count({ where: { role: "TRADER", active: false } }),
    prisma.desk.count({ where: { active: true } }),
    prisma.documentRecord.count({ where: { status: "PENDING" } }),
    prisma.communication.count(),
    prisma.user.count({ where: { role: "TRADER", ftd: true } }),
  ]);

  return NextResponse.json({
    report: {
      depositsAmount: depositsSum._sum.amount || 0,
      depositsCount: depositsSum._count,
      withdrawalsAmount: Math.abs(withdrawalsSum._sum.amount || 0),
      withdrawalsCount: withdrawalsSum._count,
      openPositions,
      closedPositions,
      pendingTickets,
      activeTraders,
      frozenTraders,
      activeDesks,
      pendingDocs,
      communications,
      ftdCount,
      generatedAt: new Date().toISOString(),
    },
  });
}
