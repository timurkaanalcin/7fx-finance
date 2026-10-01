import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { placeOrder, processPendingOrders, checkSlTp } from "@/lib/trading";
import { getMarketStatus } from "@/lib/market-hours";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Oturum yok" }, { status: 401 });
  await processPendingOrders(user.id);
  await checkSlTp(user.id);
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Oturum yok" }, { status: 401 });
  try {
    const body = await req.json();
    const symbol = String(body.symbol || "");
    const mkt = getMarketStatus(symbol);
    if (mkt.blockOrdersWhenClosed && !mkt.open) {
      return NextResponse.json(
        {
          error: `Piyasa kapalı (${mkt.label}). Hisse emirleri yalnızca seans saatlerinde.`,
        },
        { status: 403 }
      );
    }
    const result = await placeOrder({
      userId: user.id,
      symbol,
      side: body.side === "SELL" ? "SELL" : "BUY",
      type: body.type === "LIMIT" ? "LIMIT" : body.type === "STOP" ? "STOP" : "MARKET",
      volume: Number(body.volume),
      price: body.price != null ? Number(body.price) : undefined,
      stopLoss: body.stopLoss != null && body.stopLoss !== "" ? Number(body.stopLoss) : undefined,
      takeProfit: body.takeProfit != null && body.takeProfit !== "" ? Number(body.takeProfit) : undefined,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Emir hatası";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
