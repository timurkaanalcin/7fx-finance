import { configuredSiteHosts, configuredSiteOrigin } from "@/lib/site-origin";

/** Public hosts that should appear in search. Admin/login hosts are noindex. */
export const INDEXABLE_HOSTS = ["7fx.customer.org.tr", "7fx.financeunit.co"] as const;

export const KNOWN_HOSTS = [
  "7fx.customer.org.tr",
  "7fx.financeunit.co",
  "7fx.control.org.tr",
  "7fx.login.org.tr",
  "crm7fx.customer.org.tr",
] as const;

/** Historical default. primaryOrigin() follows APP_URL / MAIN_SITE_ORIGIN when set. */
export const PRIMARY_ORIGIN = "https://7fx.customer.org.tr";

export function primaryOrigin(): string {
  return configuredSiteOrigin() || PRIMARY_ORIGIN;
}

/** Paths a crawler may index on an indexable host. */
export const MARKETING_PATHS = [
  "/",
  "/markets",
  "/markets/crypto",
  "/markets/forex",
  "/markets/commodities",
  "/markets/indices",
  "/markets/stocks",
  "/platform",
  "/faq",
  "/licenses",
  "/ios",
] as const;

export function normalizeHost(raw: string | null | undefined): string {
  return (raw || "").split(",")[0].trim().split(":")[0].toLowerCase();
}

export function isIndexableHost(host: string): boolean {
  if ((INDEXABLE_HOSTS as readonly string[]).includes(host)) return true;
  const configured = configuredSiteOrigin();
  if (!configured) return false;
  try {
    return new URL(configured).hostname.toLowerCase() === host;
  } catch {
    return false;
  }
}

export function metadataOrigin(host: string): string {
  if ((KNOWN_HOSTS as readonly string[]).includes(host) || configuredSiteHosts().includes(host)) {
    return `https://${host}`;
  }
  return primaryOrigin();
}

export function isMarketingPath(pathname: string): boolean {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return (MARKETING_PATHS as readonly string[]).includes(path);
}

/** True when this host+path must not be indexed. */
export function shouldNoindex(host: string, pathname: string): boolean {
  if (!isIndexableHost(host)) return true;
  return !isMarketingPath(pathname);
}

export function isPrivateHtmlPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/trade") ||
    pathname === "/tw" ||
    pathname.startsWith("/tw/") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/membership") ||
    pathname.startsWith("/izcrm") ||
    pathname === "/crmv2" ||
    pathname.startsWith("/crmv2/") ||
    pathname === "/crmv3" ||
    pathname.startsWith("/crmv3/") ||
    pathname.startsWith("/admin")
  );
}
