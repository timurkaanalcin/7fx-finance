import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const [byType, depositsApproved, depositsPending, openPnL, creditBonus] = await Promise.all([
    prisma.balanceLedger.groupBy({
      by: ["type"],
      _sum: { amount: true },
      _count: true,
    }),
    prisma.depositRequest.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.depositRequest.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.position.aggregate({
      where: { status: "OPEN" },
      _sum: { profit: true, volume: true },
      _count: true,
    }),
    prisma.account.aggregate({
      _sum: { credit: true, bonus: true, balance: true, equity: true },
    }),
  ]);

  const incomeTypes = ["DEPOSIT", "MARGIN_ADD", "BONUS", "CREDIT"];
  const outcomeTypes = ["WITHDRAWAL", "RESET", "ADJUSTMENT"];
  let income = 0;
  let outcome = 0;
  for (const row of byType) {
    const amt = row._sum.amount || 0;
    if (incomeTypes.includes(row.type) || amt > 0) {
      if (outcomeTypes.includes(row.type) && amt < 0) outcome += Math.abs(amt);
      else if (incomeTypes.includes(row.type)) income += Math.abs(amt);
      else if (amt < 0) outcome += Math.abs(amt);
      else if (!outcomeTypes.includes(row.type)) income += amt;
    } else if (amt < 0) {
      outcome += Math.abs(amt);
    }
  }
  // Prefer explicit deposit aggregates when ledger sparse
  if (income === 0 && (depositsApproved._sum.amount || 0) > 0) {
    income = depositsApproved._sum.amount || 0;
  }

  return NextResponse.json({
    kpis: {
      income,
      outcome,
      net: income - outcome,
      depositsApproved: depositsApproved._sum.amount || 0,
      depositsApprovedCount: depositsApproved._count,
      depositsPending: depositsPending._sum.amount || 0,
      depositsPendingCount: depositsPending._count,
      openPositions: openPnL._count,
      openVolume: openPnL._sum.volume || 0,
      floatingPnL: openPnL._sum.profit || 0,
      totalBalance: creditBonus._sum.balance || 0,
      totalEquity: creditBonus._sum.equity || 0,
      totalCredit: creditBonus._sum.credit || 0,
      totalBonus: creditBonus._sum.bonus || 0,
    },
    byType: byType.map((t) => ({
      type: t.type,
      amount: t._sum.amount || 0,
      count: t._count,
    })),
  });
}
