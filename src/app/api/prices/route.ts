import { NextResponse } from "next/server";
import { tickAll } from "@/lib/price-engine";
import { publicErrorText } from "@/lib/security/public-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const prices = await tickAll();
    return NextResponse.json({ prices, source: "yahoo", ts: Date.now() });
  } catch (e) {
    return NextResponse.json(
      { prices: [], source: "yahoo", error: publicErrorText(e, "Quote fetch failed"), ts: Date.now() },
      { status: 502 }
    );
  }
}
