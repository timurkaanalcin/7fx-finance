import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "OPEN").toUpperCase();
  const tab = (searchParams.get("tab") || "positions").toLowerCase();

  if (tab === "orders") {
    const orderStatus = searchParams.get("orderStatus");
    const where = orderStatus ? { status: orderStatus.toUpperCase() } : {};
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, brokerName: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return NextResponse.json({ orders });
  }

  const where = status === "ALL" ? {} : { status };
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
  });
}
