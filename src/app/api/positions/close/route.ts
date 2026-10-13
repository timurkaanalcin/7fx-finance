import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { closePosition } from "@/lib/trading";
import { tradingDisabledMessage, mustChangePasswordMessage } from "@/lib/account-perms";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  if ((user as { mustChangePassword?: boolean }).mustChangePassword === true) {
    return NextResponse.json(
      { error: mustChangePasswordMessage((user as { language?: string }).language) },
      { status: 403 }
    );
  }
  if ((user as { tradingEnabled?: boolean }).tradingEnabled === false) {
    return NextResponse.json(
      { error: tradingDisabledMessage((user as { language?: string }).language) },
      { status: 403 }
    );
  }
  try {
    const body = await req.json();
    const rawVol = body.volume;
    let volume: number | undefined;
    if (rawVol != null && rawVol !== "") {
      const n = Number(rawVol);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: "Invalid volume" }, { status: 400 });
      }
      volume = n;
    }
    const account = await closePosition(user.id, String(body.id), volume);
    return NextResponse.json({ ok: true, account });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Close error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
