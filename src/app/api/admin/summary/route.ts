import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const accounts = await prisma.account.findMany({
    include: { user: { select: { id: true, email: true, name: true, role: true, active: true } } },
    orderBy: { balance: "desc" },
    take: 100,
  });

  const openByUser = await prisma.position.groupBy({
    by: ["userId"],
    where: { status: "OPEN" },
    _count: { _all: true },
    _sum: { profit: true, margin: true, volume: true },
  });
  const openMap = new Map(openByUser.map((r) => [r.userId, r]));

  const totals = {
    balance: accounts.reduce((s, a) => s + a.balance, 0),
    equity: accounts.reduce((s, a) => s + a.equity, 0),
    margin: accounts.reduce((s, a) => s + a.margin, 0),
  };

  return NextResponse.json({
    totals,
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
