import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scopeUserWhere } from "@/lib/crm-scope";
import { getSystemSettings } from "@/lib/system-settings";
import { classifySaleStatus } from "@/lib/lead-status";

export const dynamic = "force-dynamic";

const PERIODS: Record<string, number> = { day: 1, week: 7, month: 30, m3: 90, m6: 182, year: 365 };

/** Per-affiliate lead stats. Affiliate = affiliateA (set by bulk import "source") → B → C → campaign. */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const u = new URL(req.url);
  const period = u.searchParams.get("period") || "month";
  const now = Date.now();
  const where: Record<string, unknown> = { role: "TRADER" };
  const reasonFilter = (u.searchParams.get("reason") || "").trim();
  const sel = period === "all" ? Infinity : PERIODS[period] ?? 30;
  const settings = await getSystemSettings();
  const users = await prisma.user.findMany({
    where: scopeUserWhere(admin, where) as never,
    select: {
      createdAt: true,
      affiliateA: true,
      affiliateB: true,
      affiliateC: true,
      campaign: true,
      saleStatus: true,
      leadInvalid: true,
      leadInvalidReason: true,
      _count: { select: { deposits: { where: { status: "APPROVED" } } } },
    },
  });
  type Agg = { name: string; leads: number; valid: number; invalid: number; reasons: Record<string, number>; deposits: number; day: number; week: number; month: number; m3: number; m6: number; year: number };
  const map = new Map<string, Agg>();
  for (const x of users) {
    const rc = x.leadInvalidReason || (String(x.saleStatus || "").startsWith("INV_") ? String(x.saleStatus) : "");
    if (reasonFilter && (reasonFilter === "NONE" ? Boolean(rc) || x.leadInvalid : rc !== reasonFilter)) continue;
    const name = (x.affiliateA || x.affiliateB || x.affiliateC || x.campaign || "").trim() || "—";
    let a = map.get(name);
    if (!a) map.set(name, (a = { name, leads: 0, valid: 0, invalid: 0, reasons: {}, deposits: 0, day: 0, week: 0, month: 0, m3: 0, m6: 0, year: 0 }));
    const age = (now - x.createdAt.getTime()) / 86400000;
    for (const [k, d] of Object.entries(PERIODS)) if (age <= d) (a as unknown as Record<string, number>)[k] = (a[k as keyof Agg] as number) + 1;
    if (age > sel) continue;
    a.leads++;
    const inv = x.leadInvalid || classifySaleStatus(x.saleStatus, settings.leadStatusMapping) === "invalid";
    if (inv) {
      a.invalid++;
      const k = rc || "OTHER";
      a.reasons[k] = (a.reasons[k] || 0) + 1;
    }
    else a.valid++;
    if (x._count.deposits > 0) a.deposits++;
  }
  return NextResponse.json({ period, rows: Array.from(map.values()) });
}
