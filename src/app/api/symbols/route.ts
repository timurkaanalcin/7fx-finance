import { NextResponse } from "next/server";
import { SYMBOLS } from "@/lib/symbols";

export async function GET() {
  return NextResponse.json(SYMBOLS);
}
