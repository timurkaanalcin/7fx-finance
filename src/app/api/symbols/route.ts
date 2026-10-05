import { NextResponse } from "next/server";
import { SYMBOLS } from "@/lib/symbols";
import { ensureSymbolCatalog } from "@/lib/trading-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Live symbol catalog (built-ins + admin overrides / custom symbols). */
export async function GET() {
  await ensureSymbolCatalog();
  return NextResponse.json(SYMBOLS, { headers: { "Cache-Control": "no-store" } });
}
