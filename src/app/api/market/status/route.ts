import { NextResponse } from "next/server";
import { getMarketStatus } from "@/lib/market-hours";
import { SYMBOLS } from "@/lib/symbols";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (symbol) {
    return NextResponse.json({ symbol, ...getMarketStatus(symbol) });
  }
  const all = SYMBOLS.map((s) => ({ symbol: s.symbol, ...getMarketStatus(s.symbol) }));
  return NextResponse.json({ markets: all, ts: Date.now() });
}
