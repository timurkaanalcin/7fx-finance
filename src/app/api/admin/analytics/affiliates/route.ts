import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { loadAffiliateReport } from "@/lib/affiliate-load";

export const dynamic = "force-dynamic";

/** Per-affiliate lead stats. Affiliate = affiliateA (set by bulk import "source") → B → C → campaign. */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const u = new URL(req.url);
  const period = u.searchParams.get("period") || "month";
  const reasonFilter = (u.searchParams.get("reason") || "").trim();
  const { rows } = await loadAffiliateReport(admin, { period, reasonFilter });
  return NextResponse.json({
    period,
    rows: rows.map((r) => ({
      name: r.name,
      leads: r.leads,
      valid: r.valid,
      invalid: r.invalid,
      reasons: r.reasons,
      deposits: r.deposits,
      ftd: r.ftd,
      day: r.day,
      week: r.week,
      month: r.month,
      m3: r.m3,
      m6: r.m6,
      year: r.year,
      mismatch: r.mismatch,
      tracked: r.tracked,
    })),
  });
}
