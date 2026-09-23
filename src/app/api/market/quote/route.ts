import { NextResponse } from "next/server";
import { SYMBOLS, getSymbol } from "@/lib/symbols";
import { getPrice, tickAll } from "@/lib/price-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbolsParam = searchParams.get("symbols");

  if (symbolsParam) {
    const list = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const prices = [];
    const errors: string[] = [];
    for (const sym of list) {
      if (!getSymbol(sym)) {
        errors.push(`Unknown: ${sym}`);
        continue;
      }
      const tick = await getPrice(sym);
      if (tick) prices.push(tick);
      else errors.push(`No quote: ${sym}`);
    }
    return NextResponse.json({
      prices,
      source: "yahoo",
      errors: errors.length ? errors : undefined,
      ts: Date.now(),
    });
  }

  // All watchlist symbols
  const prices = await tickAll();
  return NextResponse.json({
    prices,
    source: "yahoo",
    count: prices.length,
    symbols: SYMBOLS.map((s) => ({ symbol: s.symbol, yahoo: s.yahoo, class: s.class })),
    ts: Date.now(),
  });
}
