import { prisma } from "@/lib/prisma";
import { geolocateIp, isPrivateIp } from "@/lib/geoip";
import { affiliateSourceName } from "@/lib/affiliate-report";
import {
  computeFraudFlag,
  detectTrafficSource,
  sourcesMismatch,
  type OriginSignals,
} from "@/lib/lead-origin";

function clip(v: string | null | undefined, n: number): string | null {
  const s = String(v || "").trim();
  if (!s) return null;
  return s.slice(0, n);
}

function cleanIp(raw: string | null | undefined): string | null {
  const s = String(raw || "")
    .trim()
    .replace(/^::ffff:/i, "")
    .slice(0, 64);
  if (!s || !/^[0-9a-fA-F:.]+$/.test(s)) return null;
  return s;
}

export type PartnerFraud = {
  id: string;
  sourceKey: string;
  checkOnFraud: boolean;
  allowedSources: string | null;
  active?: boolean;
};

export type ComposedOrigin = {
  affiliateId: string | null;
  streamId: string | null;
  /** Value to store on User.affiliateA when the lead has none yet. */
  affiliateA: string | null;
  campaign: string | null;
  declaredSource: string | null;
  detectedSource: string;
  mismatch: boolean;
  fraudFlag: boolean;
  referrer: string | null;
  landingUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  fbclid: string | null;
  gclid: string | null;
  ttclid: string | null;
  msclkid: string | null;
  userAgent: string | null;
  inAppBrowser: string | null;
  ip: string | null;
  country: string | null;
  countryName: string | null;
  region: string | null;
  city: string | null;
  intakeIp: string | null;
  intakeUserAgent: string | null;
  rawSignals: string | null;
};

export async function composeOrigin(opts: {
  signals: OriginSignals;
  declaredSource?: string | null;
  partner?: PartnerFraud | null;
  stream?: { id: string; name: string; declaredSource: string; active: boolean } | null;
  leadIp?: string | null;
  intakeIp?: string | null;
  intakeUserAgent?: string | null;
}): Promise<ComposedOrigin> {
  const detection = detectTrafficSource(opts.signals);
  const declaredStored = clip(opts.declaredSource || (opts.stream?.active ? opts.stream.declaredSource : null), 120);
  const mismatch = sourcesMismatch(declaredStored, detection.source);
  const partner = opts.partner || null;
  const fraudFlag = partner
    ? computeFraudFlag({
        checkOnFraud: partner.checkOnFraud,
        allowedSources: partner.allowedSources,
        declared: declaredStored,
        detected: detection.source,
        mismatch,
      })
    : false;
  const leadIp = cleanIp(opts.leadIp);
  let country: string | null = null;
  let countryName: string | null = null;
  let region: string | null = null;
  let city: string | null = null;
  if (leadIp && !isPrivateIp(leadIp)) {
    const g = await geolocateIp(leadIp);
    country = g.country;
    countryName = g.countryName;
    region = g.region;
    city = g.city;
  }
  const affiliateA = partner?.sourceKey || declaredStored || null;
  const campaign = clip(opts.stream?.name || opts.signals.utmCampaign || null, 191);
  const raw = JSON.stringify({ via: detection.via, wbraid: clip(opts.signals.wbraid, 255), gbraid: clip(opts.signals.gbraid, 255) }).slice(0, 4000);
  return {
    affiliateId: partner?.id || null,
    streamId: opts.stream?.active ? opts.stream.id : null,
    affiliateA,
    campaign,
    declaredSource: declaredStored,
    detectedSource: detection.source.slice(0, 80),
    mismatch,
    fraudFlag,
    referrer: clip(opts.signals.referrer, 4000),
    landingUrl: clip(opts.signals.landingUrl, 4000),
    utmSource: clip(opts.signals.utmSource, 120),
    utmMedium: clip(opts.signals.utmMedium, 120),
    utmCampaign: clip(opts.signals.utmCampaign, 191),
    utmContent: clip(opts.signals.utmContent, 191),
    utmTerm: clip(opts.signals.utmTerm, 191),
    fbclid: clip(opts.signals.fbclid, 255),
    gclid: clip(opts.signals.gclid, 255),
    ttclid: clip(opts.signals.ttclid, 255),
    msclkid: clip(opts.signals.msclkid, 255),
    userAgent: clip(opts.signals.userAgent, 512),
    inAppBrowser: detection.inApp,
    ip: leadIp,
    country: clip(country, 8),
    countryName: clip(countryName, 96),
    region: clip(region, 128),
    city: clip(city, 128),
    intakeIp: cleanIp(opts.intakeIp),
    intakeUserAgent: clip(opts.intakeUserAgent, 512),
    rawSignals: raw,
  };
}

export function originCreateData(userId: string, c: ComposedOrigin) {
  return {
    userId,
    affiliateId: c.affiliateId,
    streamId: c.streamId,
    declaredSource: c.declaredSource,
    detectedSource: c.detectedSource,
    mismatch: c.mismatch,
    fraudFlag: c.fraudFlag,
    referrer: c.referrer,
    landingUrl: c.landingUrl,
    utmSource: c.utmSource,
    utmMedium: c.utmMedium,
    utmCampaign: c.utmCampaign,
    utmContent: c.utmContent,
    utmTerm: c.utmTerm,
    fbclid: c.fbclid,
    gclid: c.gclid,
    ttclid: c.ttclid,
    msclkid: c.msclkid,
    userAgent: c.userAgent,
    inAppBrowser: c.inAppBrowser,
    ip: c.ip,
    country: c.country,
    countryName: c.countryName,
    region: c.region,
    city: c.city,
    intakeIp: c.intakeIp,
    intakeUserAgent: c.intakeUserAgent,
    rawSignals: c.rawSignals,
  };
}

/** Best-effort capture for register / landing. Never throws. */
export async function recordLeadOrigin(opts: {
  userId: string;
  signals: OriginSignals;
  declaredSource?: string | null;
  affToken?: string | null;
  streamRef?: string | null;
  leadIp?: string | null;
  intakeIp?: string | null;
  intakeUserAgent?: string | null;
  linkAffiliateA?: boolean;
}): Promise<void> {
  try {
    let partner: PartnerFraud | null = null;
    if (opts.affToken) {
      const row = await prisma.affiliatePartner.findUnique({ where: { token: opts.affToken } });
      if (row?.active) {
        partner = { id: row.id, sourceKey: row.sourceKey, checkOnFraud: row.checkOnFraud, allowedSources: row.allowedSources, active: row.active };
      }
    }
    let stream: { id: string; name: string; declaredSource: string; active: boolean } | null = null;
    if (partner && opts.streamRef) {
      const streams = await prisma.affiliateStream.findMany({ where: { affiliateId: partner.id, active: true } });
      const ref = opts.streamRef.trim().toLowerCase();
      const hit = streams.find((s) => s.id === opts.streamRef || s.name.toLowerCase() === ref);
      if (hit) stream = hit;
    }
    if (!partner && opts.declaredSource) {
      const byName = await prisma.affiliatePartner.findUnique({ where: { sourceKey: opts.declaredSource.trim() } });
      if (byName?.active) {
        partner = { id: byName.id, sourceKey: byName.sourceKey, checkOnFraud: byName.checkOnFraud, allowedSources: byName.allowedSources, active: true };
      }
    }
    const composed = await composeOrigin({
      signals: opts.signals,
      declaredSource: opts.declaredSource,
      partner,
      stream,
      leadIp: opts.leadIp,
      intakeIp: opts.intakeIp,
      intakeUserAgent: opts.intakeUserAgent,
    });
    await prisma.leadOrigin.upsert({
      where: { userId: opts.userId },
      create: originCreateData(opts.userId, composed),
      update: originCreateData(opts.userId, composed),
    });
    if (opts.linkAffiliateA && composed.affiliateA) {
      const user = await prisma.user.findUnique({ where: { id: opts.userId }, select: { affiliateA: true, campaign: true, role: true } });
      if (user && user.role === "TRADER") {
        const data: { affiliateA?: string; campaign?: string } = {};
        if (!user.affiliateA) data.affiliateA = composed.affiliateA.slice(0, 80);
        if (!user.campaign && composed.campaign) data.campaign = composed.campaign;
        if (Object.keys(data).length) await prisma.user.update({ where: { id: opts.userId }, data });
      }
    }
  } catch (e) {
    console.error("[lead-origin] record", e);
  }
}

/** Keep declared source in sync when staff set the affiliate name on a lead. Does not wipe detected signals. */
export async function syncDeclaredSource(userId: string, source: string | null | undefined): Promise<void> {
  try {
    const declared = clip(source, 120);
    if (!declared || declared === "—") return;
    const existing = await prisma.leadOrigin.findUnique({ where: { userId } });
    const partner = await prisma.affiliatePartner.findUnique({ where: { sourceKey: declared } });
    if (!existing) {
      await prisma.leadOrigin.create({
        data: {
          userId,
          declaredSource: declared,
          detectedSource: "unknown",
          mismatch: false,
          fraudFlag: false,
          affiliateId: partner?.id ?? null,
        },
      });
      return;
    }
    if (existing.declaredSource === declared && (existing.affiliateId || !partner)) return;
    const mismatch = sourcesMismatch(declared, existing.detectedSource);
    const fraudFlag = partner
      ? computeFraudFlag({
          checkOnFraud: partner.checkOnFraud,
          allowedSources: partner.allowedSources,
          declared,
          detected: existing.detectedSource,
          mismatch,
        })
      : existing.fraudFlag;
    await prisma.leadOrigin.update({
      where: { userId },
      data: {
        declaredSource: declared,
        mismatch,
        fraudFlag,
        affiliateId: existing.affiliateId || partner?.id || null,
      },
    });
  } catch (e) {
    console.error("[lead-origin] sync", e);
  }
}

export async function syncUserAffiliateName(user: {
  id: string;
  role?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
  campaign?: string | null;
}): Promise<void> {
  if (user.role && user.role !== "TRADER") return;
  await syncDeclaredSource(user.id, affiliateSourceName(user));
}
