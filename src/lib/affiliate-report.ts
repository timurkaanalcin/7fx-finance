import { classifySaleStatus, type LeadStatusMapping } from "@/lib/lead-status";

/** Same windows as the Affiliates report. */
export const AFFILIATE_PERIODS: Record<string, number> = {
  day: 1,
  week: 7,
  month: 30,
  m3: 90,
  m6: 182,
  year: 365,
};

export function affiliateSourceName(x: {
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
  campaign?: string | null;
}): string {
  return (x.affiliateA || x.affiliateB || x.affiliateC || x.campaign || "").trim() || "—";
}

export type AffiliateLeadRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  createdAt: Date;
  affiliateA: string | null;
  affiliateB: string | null;
  affiliateC: string | null;
  campaign: string | null;
  saleStatus: string | null;
  leadInvalid: boolean;
  leadInvalidReason: string | null;
  ftd: boolean;
  deposits: number;
};

export type OriginSnap = {
  declaredSource: string | null;
  detectedSource: string | null;
  mismatch: boolean;
  fraudFlag?: boolean;
  referrer?: string | null;
  landingUrl?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
  msclkid?: string | null;
  inAppBrowser?: string | null;
  ip?: string | null;
  country?: string | null;
  city?: string | null;
  userAgent?: string | null;
};

export type AffiliateAgg = {
  name: string;
  leads: number;
  valid: number;
  invalid: number;
  reasons: Record<string, number>;
  deposits: number;
  ftd: number;
  day: number;
  week: number;
  month: number;
  m3: number;
  m6: number;
  year: number;
  mismatch: number;
  tracked: number;
};

export type CapturedAffiliateLead = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  declared: string | null;
  detected: string | null;
  mismatch: boolean;
  fraudFlag: boolean;
  referrer: string | null;
  landingUrl: string | null;
  fbclid: string | null;
  gclid: string | null;
  ttclid: string | null;
  msclkid: string | null;
  inApp: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  userAgent: string | null;
  invalid: boolean;
  reason: string;
  ftd: boolean;
  deposits: number;
};

function blank(name: string): AffiliateAgg {
  return {
    name,
    leads: 0,
    valid: 0,
    invalid: 0,
    reasons: {},
    deposits: 0,
    ftd: 0,
    day: 0,
    week: 0,
    month: 0,
    m3: 0,
    m6: 0,
    year: 0,
    mismatch: 0,
    tracked: 0,
  };
}

/**
 * Affiliates report aggregation. Invalid = leadInvalid or classifySaleStatus === "invalid"
 * (INV_* codes and the desk's invalid status list). Everything else counts as valid,
 * matching the existing report. Deposits = leads with at least one APPROVED deposit.
 */
export function buildAffiliateReport(opts: {
  users: AffiliateLeadRow[];
  origins?: Map<string, OriginSnap>;
  period: string;
  reasonFilter?: string;
  mapping: LeadStatusMapping;
  now?: number;
  capture?: string | null;
  captureLimit?: number;
}): {
  rows: AffiliateAgg[];
  captured: CapturedAffiliateLead[];
  capturedTruncated: boolean;
  unlinked: { detected: string; leads: number }[];
} {
  const now = opts.now ?? Date.now();
  const period = opts.period || "month";
  const sel = period === "all" ? Infinity : AFFILIATE_PERIODS[period] ?? 30;
  const reasonFilter = (opts.reasonFilter || "").trim();
  const origins = opts.origins || new Map<string, OriginSnap>();
  const map = new Map<string, AffiliateAgg>();
  const captured: CapturedAffiliateLead[] = [];
  const limit = opts.captureLimit ?? 300;
  let capturedTruncated = false;
  const unlinked = new Map<string, number>();

  for (const x of opts.users) {
    const rc = x.leadInvalidReason || (String(x.saleStatus || "").startsWith("INV_") ? String(x.saleStatus) : "");
    if (reasonFilter && (reasonFilter === "NONE" ? Boolean(rc) || x.leadInvalid : rc !== reasonFilter)) continue;
    const name = affiliateSourceName(x);
    let a = map.get(name);
    if (!a) map.set(name, (a = blank(name)));
    const age = (now - x.createdAt.getTime()) / 86400000;
    for (const [k, d] of Object.entries(AFFILIATE_PERIODS)) {
      if (age <= d) (a as unknown as Record<string, number>)[k] += 1;
    }
    if (age > sel) continue;
    a.leads++;
    const inv = x.leadInvalid || classifySaleStatus(x.saleStatus, opts.mapping) === "invalid";
    if (inv) {
      a.invalid++;
      const k = rc || "OTHER";
      a.reasons[k] = (a.reasons[k] || 0) + 1;
    } else a.valid++;
    if (x.deposits > 0) a.deposits++;
    if (x.ftd || x.deposits > 0) a.ftd++;
    const og = origins.get(x.id);
    if (og) {
      a.tracked++;
      if (og.mismatch) a.mismatch++;
    }
    if (name === "—" && og?.detectedSource) {
      const key = og.detectedSource || "unknown";
      unlinked.set(key, (unlinked.get(key) || 0) + 1);
    }
    if (opts.capture && name === opts.capture) {
      if (captured.length >= limit) capturedTruncated = true;
      else {
        captured.push({
          id: x.id,
          name: x.name || "",
          email: x.email || "",
          createdAt: x.createdAt.toISOString(),
          declared: og?.declaredSource || null,
          detected: og?.detectedSource || null,
          mismatch: Boolean(og?.mismatch),
          fraudFlag: Boolean(og?.fraudFlag),
          referrer: og?.referrer || null,
          landingUrl: og?.landingUrl || null,
          fbclid: og?.fbclid || null,
          gclid: og?.gclid || null,
          ttclid: og?.ttclid || null,
          msclkid: og?.msclkid || null,
          inApp: og?.inAppBrowser || null,
          ip: og?.ip || null,
          country: og?.country || null,
          city: og?.city || null,
          userAgent: og?.userAgent || null,
          invalid: inv,
          reason: rc,
          ftd: Boolean(x.ftd || x.deposits > 0),
          deposits: x.deposits,
        });
      }
    }
  }

  captured.sort((p, q) => (p.createdAt < q.createdAt ? 1 : -1));
  const unlinkedRows = Array.from(unlinked.entries())
    .map(([detected, leads]) => ({ detected, leads }))
    .sort((p, q) => q.leads - p.leads);

  return { rows: Array.from(map.values()), captured, capturedTruncated, unlinked: unlinkedRows };
}

export function breakdownOf(leads: CapturedAffiliateLead[]): { declared: string; detected: string; leads: number; mismatches: number }[] {
  const map = new Map<string, { declared: string; detected: string; leads: number; mismatches: number }>();
  for (const l of leads) {
    const declared = l.declared || "—";
    const detected = l.detected || "unknown";
    const key = `${declared}\u0000${detected}`;
    let row = map.get(key);
    if (!row) map.set(key, (row = { declared, detected, leads: 0, mismatches: 0 }));
    row.leads++;
    if (l.mismatch) row.mismatches++;
  }
  return Array.from(map.values()).sort((a, b) => b.leads - a.leads);
}
