import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { refreshAccountMetrics } from "@/lib/trading";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "OPEN").toUpperCase();
  const tab = (searchParams.get("tab") || "positions").toLowerCase();
  const userId = searchParams.get("userId");

  if (tab === "orders") {
    const orderStatus = searchParams.get("orderStatus");
    const where: Record<string, unknown> = {};
    if (orderStatus) where.status = orderStatus.toUpperCase();
    if (userId) where.userId = userId;
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, brokerName: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return NextResponse.json({
      orders,
      generatedAt: new Date().toISOString(),
    });
  }

  // Live mark-to-market for open positions so CRM reflects terminal activity.
  if (status === "OPEN" || status === "ALL") {
    const openOwners = await prisma.position.findMany({
      where: {
        status: "OPEN",
        ...(userId ? { userId } : {}),
      },
      select: { userId: true },
      distinct: ["userId"],
      take: 100,
    });
    await Promise.all(
      openOwners.map((o) => refreshAccountMetrics(o.userId).catch(() => null))
    );
  }

  const where: Record<string, unknown> = status === "ALL" ? {} : { status };
  if (userId) where.userId = userId;
  const positions = await prisma.position.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, brokerName: true, desk: true, account: true },
      },
    },
    orderBy: { openedAt: "desc" },
    take: 300,
  });

  return NextResponse.json({
    positions: positions.map((p) => ({
      ...p,
      tradingAccountId: p.user.account?.id ?? null,
      traderName: p.user.name,
      traderEmail: p.user.email,
      broker: p.user.brokerName,
      desk: p.user.desk,
    })),
    generatedAt: new Date().toISOString(),
  });
}
