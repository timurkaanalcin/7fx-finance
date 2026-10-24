import { NextResponse } from "next/server";
import { cronAuthorization } from "@/lib/cron-auth";
import { runTradingEngineCron } from "@/lib/engine-cron";

export const dynamic = "force-dynamic";
// Headroom over the 20s account budget. Hobby and Pro both allow this.
export const maxDuration = 30;

/**
 * Vercel Cron entry for pending fills and SL/TP.
 * Schedule is every minute in vercel.json. Hobby rejects that expression
 * (once per day only). Pro and Enterprise run it once a minute, which is
 * the fastest interval those plans allow.
 * If CRON_SECRET is unset this fails closed. The owner must add it; Vercel
 * then sends Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: Request) {
  const decision = cronAuthorization(process.env.CRON_SECRET, req.headers.get("authorization"));
  if (decision === "unset") {
    console.error(
      "CRON_SECRET is unset; /api/cron/engine refused the run. Add CRON_SECRET to the project environment."
    );
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (decision !== "ok") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await runTradingEngineCron();
  return NextResponse.json({ ok: true, ...result });
}
