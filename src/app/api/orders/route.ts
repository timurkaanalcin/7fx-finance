import { ensureSymbolCatalog } from "@/lib/trading-settings";
import { NextResponse } from "next/server";
import { publicErrorText } from "@/lib/security/public-error";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tradingDisabledMessage, mustChangePasswordMessage } from "@/lib/account-perms";
import { placeOrder } from "@/lib/trading";
import { getMarketStatus } from "@/lib/market-hours";
import { stripStaff } from "@/lib/customer-sanitize";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const status = new URL(req.url).searchParams.get("status");
  const pendingOnly = status === "PENDING";
  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      ...(pendingOnly ? { status: "PENDING" } : {}),
    },
    orderBy: { createdAt: "desc" },
    // Pending-only is the working-order blotter. A mixed history of 200 would drop older working orders.
    take: pendingOnly ? 500 : 200,
  });
  return NextResponse.json(stripStaff(orders));
}

export async function POST(req: Request) {
  await ensureSymbolCatalog();
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  if ((user as { mustChangePassword?: boolean }).mustChangePassword === true) {
    return NextResponse.json(
      { error: mustChangePasswordMessage((user as { language?: string }).language) },
      { status: 403 }
    );
  }
  if ((user as { tradingEnabled?: boolean }).tradingEnabled === false) {
    return NextResponse.json(
      { error: tradingDisabledMessage((user as { language?: string }).language) },
      { status: 403 }
    );
  }
  try {
    const body = await req.json();
    const symbol = String(body.symbol || "");
    const mkt = getMarketStatus(symbol);
    if (mkt.blockOrdersWhenClosed && !mkt.open) {
      return NextResponse.json(
        {
          error: `Market closed (${mkt.label}). Stock orders only during session hours.`,
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
    return NextResponse.json({ error: publicErrorText(e, "Order error") }, { status: 400 });
  }
}
