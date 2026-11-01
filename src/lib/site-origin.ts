/**
 * Public site origin for redirects.
 * APP_URL and MAIN_SITE_ORIGIN are read at runtime (dynamic lookup) so a Railway
 * process can point this build at https://mfx.customer.org.tr without a baked-in host.
 * The static `bundled` copies exist only so Next middleware, which inlines
 * process.env.NAME at build time, still sees those values in the edge bundle.
 */

const SITE_KEYS = [
  "APP_URL",
  "MAIN_SITE_ORIGIN",
  "NEXT_PUBLIC_SITE_ORIGIN",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
] as const;

type SiteKey = (typeof SITE_KEYS)[number];

const bundled: Record<SiteKey, string> = {
  APP_URL: process.env.APP_URL || "",
  MAIN_SITE_ORIGIN: process.env.MAIN_SITE_ORIGIN || "",
  NEXT_PUBLIC_SITE_ORIGIN: process.env.NEXT_PUBLIC_SITE_ORIGIN || "",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
};

/** Non-public keys first. These are the ones a running server must honor. */
const RUNTIME_ORIGIN_KEYS: SiteKey[] = ["APP_URL", "MAIN_SITE_ORIGIN", "NEXT_PUBLIC_SITE_ORIGIN"];

export function readSiteEnv(name: SiteKey): string {
  const live = process.env[name];
  if (typeof live === "string" && live.trim()) return live.trim();
  return (bundled[name] || "").trim();
}

export function originFromEnvValue(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!url.hostname || url.hostname === "0.0.0.0") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function originsFor(keys: readonly SiteKey[]): string[] {
  const out: string[] = [];
  for (const key of keys) {
    const origin = originFromEnvValue(readSiteEnv(key));
    if (origin && !out.includes(origin)) out.push(origin);
  }
  return out;
}

/** APP_URL, then MAIN_SITE_ORIGIN, then NEXT_PUBLIC_SITE_ORIGIN. Null when none are set. */
export function configuredSiteOrigin(): string | null {
  return originsFor(RUNTIME_ORIGIN_KEYS)[0] || null;
}

export function configuredSiteOrigins(): string[] {
  return originsFor(SITE_KEYS);
}

export function configuredSiteHosts(): string[] {
  const hosts: string[] = [];
  for (const origin of configuredSiteOrigins()) {
    try {
      const host = new URL(origin).hostname.toLowerCase();
      if (host && !hosts.includes(host)) hosts.push(host);
    } catch {
      /* ignore */
    }
  }
  return hosts;
}

/** Env origin when one is configured, otherwise the historical 7fx host. */
export function fallbackSiteOrigin(): string {
  return configuredSiteOrigins()[0] || "https://7fx.customer.org.tr";
}
