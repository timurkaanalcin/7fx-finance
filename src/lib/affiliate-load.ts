import { prisma } from "@/lib/prisma";
import { scopeUserWhere } from "@/lib/crm-scope";
import { getSystemSettings } from "@/lib/system-settings";
import {
  buildAffiliateReport,
  type AffiliateLeadRow,
  type OriginSnap,
} from "@/lib/affiliate-report";

type Staff = { id: string; name?: string | null; role?: string | null; jobTitle?: string | null };

export async function loadAffiliateReport(
  admin: Staff,
  opts: { period: string; reasonFilter?: string; capture?: string | null; captureLimit?: number }
) {
  const settings = await getSystemSettings();
  const users = await prisma.user.findMany({
    where: scopeUserWhere(admin, { role: "TRADER" }) as never,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      affiliateA: true,
      affiliateB: true,
      affiliateC: true,
      campaign: true,
      saleStatus: true,
      leadInvalid: true,
      leadInvalidReason: true,
      ftd: true,
      _count: { select: { deposits: { where: { status: "APPROVED" } } } },
    },
  });
  const origins = await prisma.leadOrigin.findMany({
    select: {
      userId: true,
      declaredSource: true,
      detectedSource: true,
      mismatch: true,
      fraudFlag: true,
      referrer: true,
      landingUrl: true,
      fbclid: true,
      gclid: true,
      ttclid: true,
      msclkid: true,
      inAppBrowser: true,
      ip: true,
      country: true,
      city: true,
      userAgent: true,
    },
  });
  const map = new Map<string, OriginSnap>();
  for (const o of origins) map.set(o.userId, o);
  const rows: AffiliateLeadRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    affiliateA: u.affiliateA,
    affiliateB: u.affiliateB,
    affiliateC: u.affiliateC,
    campaign: u.campaign,
    saleStatus: u.saleStatus,
    leadInvalid: u.leadInvalid,
    leadInvalidReason: u.leadInvalidReason,
    ftd: u.ftd,
    deposits: u._count.deposits,
  }));
  return buildAffiliateReport({
    users: rows,
    origins: map,
    period: opts.period,
    reasonFilter: opts.reasonFilter,
    mapping: settings.leadStatusMapping,
    capture: opts.capture,
    captureLimit: opts.captureLimit,
  });
}
