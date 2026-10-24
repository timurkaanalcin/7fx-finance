import { ensureSymbolCatalog } from "@/lib/trading-settings";
import { maybeGzipJson } from "@/lib/json-gzip";
import { NextResponse } from "next/server";
import { getCandles } from "@/lib/price-engine";
import { getSymbol } from "@/lib/symbols";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  await ensureSymbolCatalog();
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "AAPL";
  const timeframe = searchParams.get("timeframe") || "5m";

  if (!getSymbol(symbol)) {
    return NextResponse.json({ symbol, timeframe, candles: [], error: "Unknown symbol" }, { status: 400 });
  }

  const { candles, error, stale } = await getCandles(symbol, timeframe);
  const status = candles.length === 0 && error ? 502 : 200;
  const payload = {
    symbol,
    timeframe,
    candles,
    source: "yahoo",
    error: error || null,
    stale: !!stale,
  };
  const packed = maybeGzipJson(req.headers.get("accept-encoding"), payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Accept-Encoding",
  };
  if (packed.encoding === "gzip") {
    headers["Content-Encoding"] = "gzip";
    const bytes = new Uint8Array(packed.body.byteLength);
    bytes.set(packed.body);
    return new NextResponse(bytes, { status, headers });
  }
  return new NextResponse(packed.body, { status, headers });
}
