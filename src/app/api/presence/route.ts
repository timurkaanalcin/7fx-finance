import { NextResponse } from "next/server";
import { getSession, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST — lightweight client heartbeat (sent every ~45s while the tab is visible).
 *  requireUser() records presence (throttled, skipped for admin impersonation). */
export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const session = await getSession();
  return NextResponse.json(
    { ok: true, tracked: !session?.impersonatedBy },
    { headers: { "Cache-Control": "no-store" } }
  );
}
