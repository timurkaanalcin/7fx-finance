/** Public hosts that should appear in search. Admin/login hosts are noindex. */
export const INDEXABLE_HOSTS = ["7fx.customer.org.tr", "7fx.financeunit.co"] as const;

export const KNOWN_HOSTS = [
  "7fx.customer.org.tr",
  "7fx.financeunit.co",
  "7fx.control.org.tr",
  "7fx.login.org.tr",
  "crm7fx.customer.org.tr",
] as const;

export const PRIMARY_ORIGIN = "https://7fx.customer.org.tr";

/** Paths a crawler may index on an indexable host. */
export const MARKETING_PATHS = ["/", "/ios"] as const;

export function normalizeHost(raw: string | null | undefined): string {
  return (raw || "").split(",")[0].trim().split(":")[0].toLowerCase();
}

export function isIndexableHost(host: string): boolean {
  return (INDEXABLE_HOSTS as readonly string[]).includes(host);
}

export function metadataOrigin(host: string): string {
  if ((KNOWN_HOSTS as readonly string[]).includes(host)) return `https://${host}`;
  return PRIMARY_ORIGIN;
}

export function isMarketingPath(pathname: string): boolean {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return path === "/" || path === "/ios";
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
    pathname.startsWith("/profile") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/membership") ||
    pathname.startsWith("/izcrm") ||
    pathname.startsWith("/admin")
  );
}
