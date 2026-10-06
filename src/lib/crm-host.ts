/** CRM-dedicated hosts (admin UI). Main trading site stays on 7fx.customer.org.tr. */
export const CRM_HOSTNAMES = new Set([
  "crm7fx.customer.org.tr",
]);

export const MAIN_SITE_ORIGIN = "https://7fx.customer.org.tr";

export function hostnameFromRequest(req: { headers: { get: (n: string) => string | null } }): string {
  const raw =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "";
  return raw.split(",")[0].trim().split(":")[0].toLowerCase();
}

export function isCrmHostname(host: string): boolean {
  if (!host) return false;
  if (CRM_HOSTNAMES.has(host)) return true;
  // Local/dev preview
  if (host === "crm7fx.localhost" || host.endsWith(".crm7fx.localhost")) return true;
  return false;
}

export function blankHtmlResponse(status = 200): Response {
  const html =
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"/><meta name=\"robots\" content=\"noindex\"/><title></title></head><body></body></html>";
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
