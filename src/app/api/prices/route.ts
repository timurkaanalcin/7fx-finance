import { NextResponse } from "next/server";
import { tickAll } from "@/lib/price-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const prices = await tickAll();
    return NextResponse.json({ prices, source: "yahoo", ts: Date.now() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Quote fetch failed";
    return NextResponse.json(
      { prices: [], source: "yahoo", error: msg, ts: Date.now() },
      { status: 502 }
    );
  }
}
