import net from "node:net";

/** IP → approximate location. Never throws; never takes longer than ~1.5s per provider.
 *  Order: in-memory cache → ipwho.is (HTTPS, no key) → ipapi.co (HTTPS, no key) → offline
 *  GeoLite2 country DB (geoip-country, bundled npm data) as country-only fallback. */

export type GeoResult = {
  country: string | null; // ISO alpha-2
  countryName: string | null;
  region: string | null;
  city: string | null;
  source: "ipwho.is" | "ipapi.co" | "geoip-country" | "private" | "none";
};

const EMPTY: GeoResult = { country: null, countryName: null, region: null, city: null, source: "none" };
const TIMEOUT_MS = 1500;
const TTL_OK = 24 * 60 * 60 * 1000;
const TTL_FAIL = 10 * 60 * 1000;
const MAX_CACHE = 5000;

type Entry = { at: number; ttl: number; value: GeoResult };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<GeoResult>>();

export function isPrivateIp(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (!v) return true;
  if (net.isIPv4(v)) {
    const [a, b] = v.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT / Railway internal
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (net.isIPv6(v)) {
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
    return false;
  }
  return true;
}

function clean(s: unknown, max = 128): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  return t ? t.slice(0, max) : null;
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json", "User-Agent": "7fx-crm/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function viaIpwho(ip: string): Promise<GeoResult | null> {
  const d = await fetchJson(
    `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,country_code,region,city`
  );
  if (!d || d.success !== true) return null;
  const country = clean(d.country_code, 8)?.toUpperCase() || null;
  if (!country) return null;
  return {
    country,
    countryName: clean(d.country, 96),
    region: clean(d.region),
    city: clean(d.city),
    source: "ipwho.is",
  };
}

async function viaIpapi(ip: string): Promise<GeoResult | null> {
  const d = await fetchJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
  if (!d || d.error) return null;
  const country = clean(d.country_code ?? d.country, 8)?.toUpperCase() || null;
  if (!country) return null;
  return {
    country,
    countryName: clean(d.country_name, 96),
    region: clean(d.region),
    city: clean(d.city),
    source: "ipapi.co",
  };
}

let offlineMod: { lookup: (ip: string) => { country?: string; name?: string } | null } | null | undefined;
function viaOffline(ip: string): GeoResult | null {
  try {
    if (offlineMod === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      offlineMod = require("geoip-country");
    }
    const r = offlineMod?.lookup(ip);
    if (!r?.country) return null;
    return { country: r.country, countryName: r.name || null, region: null, city: null, source: "geoip-country" };
  } catch (e) {
    console.error("[geoip] offline lookup failed", e);
    offlineMod = null;
    return null;
  }
}

async function resolve(ip: string): Promise<GeoResult> {
  if (isPrivateIp(ip)) return { ...EMPTY, source: "private" };
  const r = (await viaIpwho(ip)) || (await viaIpapi(ip)) || viaOffline(ip);
  return r || EMPTY;
}

export async function geolocateIp(ipRaw: string | null | undefined): Promise<GeoResult> {
  const ip = String(ipRaw || "").trim();
  if (!ip) return EMPTY;
  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.value;
  const pending = inflight.get(ip);
  if (pending) return pending;
  const p = resolve(ip)
    .catch(() => EMPTY)
    .then((value) => {
      if (cache.size >= MAX_CACHE) {
        const first = cache.keys().next().value;
        if (first !== undefined) cache.delete(first);
      }
      cache.set(ip, { at: Date.now(), ttl: value.city || value.source === "private" ? TTL_OK : TTL_FAIL, value });
      inflight.delete(ip);
      return value;
    });
  inflight.set(ip, p);
  return p;
}
