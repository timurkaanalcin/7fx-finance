import { NextResponse } from "next/server";
import { getSymbol } from "@/lib/symbols";
import { getCandles } from "@/lib/price-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "AAPL";
  const timeframe = searchParams.get("timeframe") || "5m";

  if (!getSymbol(symbol)) {
    return NextResponse.json({ error: "Unknown symbol", symbol }, { status: 400 });
  }

  const { candles, error, stale } = await getCandles(symbol, timeframe);
  const status = candles.length === 0 && error ? 502 : 200;
  return NextResponse.json(
    {
      symbol,
      timeframe,
      source: "yahoo",
      yahoo: getSymbol(symbol)?.yahoo,
      candles,
      error: error || null,
      stale: !!stale,
      ts: Date.now(),
    },
    { status }
  );
}
