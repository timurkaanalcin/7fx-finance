import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { headlineFromAggregate } from "@/lib/account-totals";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SUMMARY_ROWS = 100;

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const [found, headline] = await Promise.all([
    prisma.account.findMany({
      include: { user: { select: { id: true, email: true, name: true, role: true, active: true } } },
      orderBy: { balance: "desc" },
      take: SUMMARY_ROWS + 1,
    }),
    prisma.account.aggregate({
      _sum: { balance: true, equity: true, margin: true },
    }),
  ]);
  const accountsPartial = found.length > SUMMARY_ROWS;
  const accounts = accountsPartial ? found.slice(0, SUMMARY_ROWS) : found;

  const openByUser = await prisma.position.groupBy({
    by: ["userId"],
    where: { status: "OPEN" },
    _count: { _all: true },
    _sum: { profit: true, margin: true, volume: true },
  });
  const openMap = new Map(openByUser.map((r) => [r.userId, r]));

  const totals = headlineFromAggregate(headline._sum);

  return NextResponse.json({
    totals,
    accountsPartial,
    accounts: accounts.map((a) => {
      const o = openMap.get(a.userId);
      return {
        userId: a.userId,
        email: a.user.email,
        name: a.user.name,
        role: a.user.role,
        active: a.user.active,
        balance: a.balance,
        equity: a.equity,
        margin: a.margin,
        freeMargin: a.freeMargin,
        openPositions: o?._count._all ?? 0,
        floatingPnL: o?._sum.profit ?? 0,
        openVolume: o?._sum.volume ?? 0,
      };
    }),
  });
}
