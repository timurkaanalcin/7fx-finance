import { NextResponse } from "next/server";
import { cronAuthorization } from "@/lib/cron-auth";
import { runTradingEngineCron } from "@/lib/engine-cron";

export const dynamic = "force-dynamic";
// Headroom over the 20s account budget. Hobby and Pro both allow this.
export const maxDuration = 30;

/**
 * Vercel Cron entry for pending fills and SL/TP.
 * vercel.json schedules this once a day (Hobby allows only a daily cron).
 * GitHub Actions calls the same route every five minutes. If CRON_SECRET is
 * unset this fails closed. The owner must set it on Vercel and as a repo secret.
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
