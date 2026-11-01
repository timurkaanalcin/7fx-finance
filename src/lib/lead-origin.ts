/**
 * Declared traffic source vs what the visit actually reveals.
 * Pure functions — no database. Used by intake, landing registration, and the Affiliates desk.
 */

export type OriginSignals = {
  referrer?: string | null;
  landingUrl?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
  msclkid?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
  userAgent?: string | null;
  /** True when the hit is a browser landing with no paid signals → "direct". */
  browser?: boolean;
};

export type Detection = {
  source: string;
  inApp: string | null;
  via: "in-app" | "click-id" | "utm" | "referrer" | "direct" | "none";
};

const EXACT: Record<string, string> = {
  fb: "facebook",
  facebook: "facebook",
  meta: "facebook",
  fbads: "facebook",
  facebookads: "facebook",
  ig: "instagram",
  insta: "instagram",
  instagram: "instagram",
  google: "google",
  adwords: "google",
  googleads: "google",
  goog: "google",
  youtube: "youtube",
  yt: "youtube",
  taboola: "taboola",
  outbrain: "outbrain",
  tiktok: "tiktok",
  tt: "tiktok",
  bing: "bing",
  msn: "bing",
  twitter: "twitter",
  linkedin: "linkedin",
  snap: "snapchat",
  snapchat: "snapchat",
  whatsapp: "whatsapp",
  wa: "whatsapp",
  telegram: "telegram",
  tg: "telegram",
  yandex: "yandex",
  email: "email",
  newsletter: "email",
  mail: "email",
  direct: "direct",
  organic: "organic",
  unknown: "unknown",
};

export function splitList(raw: string | null | undefined): string[] {
  return String(raw || "")
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Canonical network name. Empty / placeholder → "unknown". Unrecognised text is slugified. */
export function normalizeSource(raw: string | null | undefined): string {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[_+/]+/g, " ")
    .replace(/\s+/g, " ");
  if (!s || s === "—" || s === "-" || s === "n/a" || s === "na" || s === "none" || s === "null" || s === "undefined") {
    return "unknown";
  }
  if (EXACT[s]) return EXACT[s];
  const compact = s.replace(/\s+/g, "");
  if (EXACT[compact]) return EXACT[compact];
  if (s.includes("instagram")) return "instagram";
  if (s.includes("tiktok") || s.includes("tik tok")) return "tiktok";
  if (s.includes("youtube")) return "youtube";
  if (s.includes("taboola")) return "taboola";
  if (s.includes("outbrain")) return "outbrain";
  if (s.includes("snapchat")) return "snapchat";
  if (s.includes("whatsapp")) return "whatsapp";
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("telegram")) return "telegram";
  if (s.includes("yandex")) return "yandex";
  if (s.includes("facebook") || compact.includes("fbads")) return "facebook";
  if (s.includes("doubleclick") || s.includes("adwords") || s.includes("google")) return "google";
  if (s.includes("bing")) return "bing";
  if (s.includes("twitter")) return "twitter";
  if (s === "x" || s === "x.com") return "twitter";
  const slug = compact.replace(/[^a-z0-9.-]/g, "").slice(0, 32);
  return slug || "unknown";
}

export function sourcesMismatch(declared: string | null | undefined, detected: string | null | undefined): boolean {
  const a = normalizeSource(declared);
  const b = normalizeSource(detected);
  if (a === "unknown" || b === "unknown") return false;
  return a !== b;
}

export function computeFraudFlag(opts: {
  checkOnFraud: boolean;
  allowedSources?: string | null;
  declared?: string | null;
  detected?: string | null;
  mismatch: boolean;
}): boolean {
  if (!opts.checkOnFraud) return false;
  const allowed = splitList(opts.allowedSources)
    .map((s) => normalizeSource(s))
    .filter((s) => s !== "unknown");
  const det = normalizeSource(opts.detected);
  if (allowed.length && det !== "unknown" && !allowed.includes(det)) return true;
  return opts.mismatch;
}

/** Caller IP must be listed when the partner set an allow-list. Empty list allows every caller. */
export function requestIpAllowed(ip: string | null | undefined, allowedIps: string | null | undefined): boolean {
  const list = splitList(allowedIps);
  if (!list.length) return true;
  if (!ip) return false;
  const norm = ip.replace(/^::ffff:/i, "");
  return list.some((x) => x === ip || x === norm);
}

export function inAppBrowser(ua: string | null | undefined): string | null {
  const s = String(ua || "");
  if (!s) return null;
  if (/Instagram/i.test(s)) return "instagram";
  if (/TikTok|musical_ly|BytedanceWebview|ByteLocale/i.test(s)) return "tiktok";
  if (/Snapchat/i.test(s)) return "snapchat";
  if (/LinkedInApp/i.test(s)) return "linkedin";
  if (/WhatsApp/i.test(s)) return "whatsapp";
  if (/\bTelegram\b/i.test(s)) return "telegram";
  if (/TwitterAndroid|\bTwitter\b/i.test(s)) return "twitter";
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(s)) return "facebook";
  return null;
}

function hostOf(raw: string | null | undefined): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    return new URL(s).hostname.toLowerCase();
  } catch {
    const m = s.match(/([a-z0-9.-]+\.[a-z]{2,})/i);
    return m ? m[1].toLowerCase() : "";
  }
}

function sourceFromHost(host: string): string | null {
  if (!host) return null;
  const h = host.replace(/^www\./, "");
  if (h === "instagram.com" || h.endsWith(".instagram.com")) return "instagram";
  if (h === "facebook.com" || h.endsWith(".facebook.com") || h === "fb.com" || h.endsWith(".fb.com") || h === "fb.me") return "facebook";
  if (h === "youtube.com" || h.endsWith(".youtube.com") || h === "youtu.be") return "youtube";
  if (h.includes("taboola")) return "taboola";
  if (h.includes("outbrain")) return "outbrain";
  if (h.includes("tiktok")) return "tiktok";
  if (h === "bing.com" || h.endsWith(".bing.com")) return "bing";
  if (h === "t.co" || h === "twitter.com" || h.endsWith(".twitter.com") || h === "x.com" || h.endsWith(".x.com")) return "twitter";
  if (h.includes("linkedin.com") || h === "lnkd.in") return "linkedin";
  if (h.includes("snapchat.com")) return "snapchat";
  if (h === "wa.me" || h.includes("whatsapp")) return "whatsapp";
  if (h === "t.me" || h.includes("telegram")) return "telegram";
  if (h.includes("yandex.")) return "yandex";
  if (h.includes("google.") || h.includes("googleadservices") || h.includes("googlesyndication") || h.includes("doubleclick")) return "google";
  if (h.startsWith("mail.") || h.includes("outlook.")) return "email";
  return null;
}

export function signalsFromUrl(raw: string | null | undefined): Partial<OriginSignals> {
  const s = String(raw || "").trim();
  if (!s) return {};
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return {};
  }
  const g = (...keys: string[]) => {
    for (const k of keys) {
      const v = url.searchParams.get(k);
      if (v && v.trim()) return v.trim();
    }
    return "";
  };
  const out: Partial<OriginSignals> = {};
  const utmSource = g("utm_source");
  const utmMedium = g("utm_medium");
  const utmCampaign = g("utm_campaign");
  const utmContent = g("utm_content");
  const utmTerm = g("utm_term");
  const fbclid = g("fbclid");
  const gclid = g("gclid");
  const ttclid = g("ttclid");
  const msclkid = g("msclkid");
  const wbraid = g("wbraid");
  const gbraid = g("gbraid");
  if (utmSource) out.utmSource = utmSource;
  if (utmMedium) out.utmMedium = utmMedium;
  if (utmCampaign) out.utmCampaign = utmCampaign;
  if (utmContent) out.utmContent = utmContent;
  if (utmTerm) out.utmTerm = utmTerm;
  if (fbclid) out.fbclid = fbclid;
  if (gclid) out.gclid = gclid;
  if (ttclid) out.ttclid = ttclid;
  if (msclkid) out.msclkid = msclkid;
  if (wbraid) out.wbraid = wbraid;
  if (gbraid) out.gbraid = gbraid;
  return out;
}

function first(...vals: (string | null | undefined)[]): string {
  for (const v of vals) {
    const s = String(v || "").trim();
    if (s) return s;
  }
  return "";
}

/** Click id / in-app UA / UTM / referrer, in that strength order. Instagram in-app wins over fbclid. */
export function detectTrafficSource(input: OriginSignals): Detection {
  const fromUrl = signalsFromUrl(input.landingUrl);
  const fbclid = first(input.fbclid, fromUrl.fbclid);
  const gclid = first(input.gclid, fromUrl.gclid);
  const ttclid = first(input.ttclid, fromUrl.ttclid);
  const msclkid = first(input.msclkid, fromUrl.msclkid);
  const wbraid = first(input.wbraid, fromUrl.wbraid);
  const gbraid = first(input.gbraid, fromUrl.gbraid);
  const utm = first(input.utmSource, fromUrl.utmSource);
  const inApp = inAppBrowser(input.userAgent);
  if (inApp === "instagram") return { source: "instagram", inApp, via: "in-app" };
  if (inApp && inApp !== "facebook") return { source: inApp, inApp, via: "in-app" };
  if (fbclid || inApp === "facebook") return { source: "facebook", inApp, via: fbclid ? "click-id" : "in-app" };
  if (gclid || wbraid || gbraid) return { source: "google", inApp, via: "click-id" };
  if (ttclid) return { source: "tiktok", inApp, via: "click-id" };
  if (msclkid) return { source: "bing", inApp, via: "click-id" };
  const utmNorm = normalizeSource(utm);
  if (utmNorm !== "unknown") return { source: utmNorm, inApp, via: "utm" };
  const ref = sourceFromHost(hostOf(input.referrer));
  if (ref) return { source: ref, inApp, via: "referrer" };
  const bare = !first(input.referrer) && !utm && !fbclid && !gclid && !ttclid && !msclkid && !wbraid && !gbraid;
  if (input.browser && bare) return { source: "direct", inApp, via: "direct" };
  return { source: "unknown", inApp, via: "none" };
}

function bagPick(bag: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = bag[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

/** Read origin fields from an intake or register body. Header referrer / UA fill gaps. */
export function readOriginPayload(
  body: Record<string, unknown>,
  headers: { get(name: string): string | null },
  opts?: { browser?: boolean }
): { signals: OriginSignals; declared: string | null; affToken: string | null; streamRef: string | null; leadIp: string | null } {
  const nested = body.origin && typeof body.origin === "object" && !Array.isArray(body.origin) ? (body.origin as Record<string, unknown>) : {};
  const bag: Record<string, unknown> = { ...body, ...nested };
  const declared = bagPick(bag, "source", "declaredSource", "declared_source");
  const affToken = bagPick(bag, "aff", "affiliate", "affiliateToken");
  const streamRef = bagPick(bag, "stream", "streamId", "stream_id");
  const signals: OriginSignals = {
    referrer: bagPick(bag, "referrer", "referer") || headers.get("referer") || headers.get("referrer") || "",
    landingUrl: bagPick(bag, "landingUrl", "landing_url", "url", "landing"),
    utmSource: bagPick(bag, "utmSource", "utm_source"),
    utmMedium: bagPick(bag, "utmMedium", "utm_medium"),
    utmCampaign: bagPick(bag, "utmCampaign", "utm_campaign"),
    utmContent: bagPick(bag, "utmContent", "utm_content"),
    utmTerm: bagPick(bag, "utmTerm", "utm_term"),
    fbclid: bagPick(bag, "fbclid"),
    gclid: bagPick(bag, "gclid"),
    ttclid: bagPick(bag, "ttclid"),
    msclkid: bagPick(bag, "msclkid"),
    wbraid: bagPick(bag, "wbraid"),
    gbraid: bagPick(bag, "gbraid"),
    userAgent: bagPick(bag, "userAgent", "user_agent") || headers.get("user-agent") || "",
    browser: Boolean(opts?.browser),
  };
  const leadIp = bagPick(bag, "ip", "leadIp", "lead_ip");
  return {
    signals,
    declared: declared || null,
    affToken: affToken || null,
    streamRef: streamRef || null,
    leadIp: leadIp || null,
  };
}
