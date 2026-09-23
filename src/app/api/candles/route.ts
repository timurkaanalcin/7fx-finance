import { NextResponse } from "next/server";
import { getCandles } from "@/lib/price-engine";
import { getSymbol } from "@/lib/symbols";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "AAPL";
  const timeframe = searchParams.get("timeframe") || "5m";

  if (!getSymbol(symbol)) {
    return NextResponse.json({ symbol, timeframe, candles: [], error: "Unknown symbol" }, { status: 400 });
  }

  const { candles, error, stale } = await getCandles(symbol, timeframe);
  const status = candles.length === 0 && error ? 502 : 200;
  return NextResponse.json(
    {
      symbol,
      timeframe,
      candles,
      source: "yahoo",
      error: error || null,
      stale: !!stale,
    },
    { status }
  );
}
