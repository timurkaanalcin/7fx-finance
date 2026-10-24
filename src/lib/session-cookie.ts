/**
 * Session cookies are host-only unless COOKIE_DOMAIN is set. Older sessions were
 * also stored with Domain=<host> or Domain=<registrable parent> (for example
 * Domain=customer.org.tr). Browsers treat those as different cookies, and
 * Next's cookie map keeps only one Set-Cookie per name, so logout must append
 * a raw expiry line for every variant.
 */

export const SESSION_COOKIE_NAMES = ["7fx_session", "deskflow_session", "7fx_admin_backup"] as const;

const EPOCH = "Thu, 01 Jan 1970 00:00:00 GMT";

/** Multi-label public suffixes we actually serve or may set a parent cookie on. */
const MULTI_LABEL_SUFFIXES = new Set([
  "com.tr",
  "org.tr",
  "net.tr",
  "gen.tr",
  "biz.tr",
  "info.tr",
  "web.tr",
  "tv.tr",
  "name.tr",
  "gov.tr",
  "edu.tr",
  "bel.tr",
  "k12.tr",
  "av.tr",
  "dr.tr",
  "pol.tr",
  "co.uk",
  "org.uk",
  "me.uk",
  "net.uk",
  "com.au",
  "net.au",
  "org.au",
  "co.jp",
  "com.br",
  "com.mx",
  "co.za",
]);

export function normalizeCookieHost(host: string | null | undefined): string {
  return (host || "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

function isHostOnlyOnly(host: string): boolean {
  if (!host || host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.includes(":")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return false;
}

/** eTLD+1 for a hostname, or null when no parent Domain attribute is meaningful. */
export function registrableDomain(host: string): string | null {
  if (isHostOnlyOnly(host)) return null;
  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) return null;
  const last2 = labels.slice(-2).join(".");
  const last3 = labels.length >= 3 ? labels.slice(-3).join(".") : "";
  const suffixLen = MULTI_LABEL_SUFFIXES.has(last2) ? 2 : MULTI_LABEL_SUFFIXES.has(last3) ? 3 : 1;
  if (labels.length <= suffixLen) return null;
  return labels.slice(-(suffixLen + 1)).join(".");
}

/**
 * Domain attribute values to expire. "" means a host-only cookie (no Domain=).
 * Always includes the exact host and its registrable parent when those differ.
 */
export function cookieDomainsForHost(host: string | null | undefined): string[] {
  const normalized = normalizeCookieHost(host);
  const domains = new Set<string>();
  domains.add("");
  if (!isHostOnlyOnly(normalized) && normalized.includes(".")) {
    domains.add(normalized);
    const parent = registrableDomain(normalized);
    if (parent) domains.add(parent);
  }
  const env = (process.env.COOKIE_DOMAIN || "").trim().replace(/^\./, "").toLowerCase();
  if (env) domains.add(env);
  return Array.from(domains);
}

/**
 * Set-Cookie lines that expire every session cookie variant for this host.
 * Production emits both Secure and non-Secure expiries; HTTP dev only emits
 * non-Secure (a Secure clear is ignored by the browser on http://).
 */
export function sessionClearCookieHeaders(host?: string | null, secureVariants?: boolean): string[] {
  const both = secureVariants ?? process.env.NODE_ENV === "production";
  const secures = both ? [false, true] : [false];
  const lines: string[] = [];
  for (const name of SESSION_COOKIE_NAMES) {
    for (const domain of cookieDomainsForHost(host)) {
      for (const secure of secures) {
        const parts = [
          `${name}=`,
          "Path=/",
          domain ? `Domain=${domain}` : "",
          "Max-Age=0",
          `Expires=${EPOCH}`,
          "HttpOnly",
          "SameSite=Lax",
          secure ? "Secure" : "",
        ].filter(Boolean);
        lines.push(parts.join("; "));
      }
    }
  }
  return lines;
}

export function appendClearSessionCookies(
  res: { headers: { append: (name: string, value: string) => void } },
  host?: string | null
) {
  for (const line of sessionClearCookieHeaders(host)) {
    res.headers.append("set-cookie", line);
  }
}
