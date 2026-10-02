import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { closePosition } from "@/lib/trading";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  try {
    const body = await req.json();
    const account = await closePosition(user.id, String(body.id));
    return NextResponse.json({ ok: true, account });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Close error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
