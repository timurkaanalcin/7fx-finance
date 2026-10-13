import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const t = (await req.text()).slice(0, 8000);
    console.error("[client-error]", t);
  } catch {}
  return NextResponse.json({ ok: true });
}
