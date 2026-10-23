import { NextResponse } from "next/server";
import { postLoginPath } from "./auth";
import { hostnameFromRequest, isCrmHostname, MAIN_SITE_ORIGIN } from "./crm-host";
import { publicAbsoluteUrl } from "./request-origin";

/** Browser form POST (mobile Safari / WebView). JSON API clients stay on JSON. */
export function isDocumentNav(req: Request, body: { nav?: unknown }): boolean {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) return true;
  const nav = body.nav;
  return nav === "1" || nav === "true" || nav === true || nav === 1;
}

export async function readAuthBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const b = await req.json().catch(() => ({}));
    return stringifyBody(b);
  }
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const out: Record<string, string> = {};
    fd.forEach((v, k) => {
      if (typeof v === "string") out[k] = v;
    });
    return out;
  }
  const text = await req.text();
  if (!text) return {};
  try {
    return stringifyBody(JSON.parse(text));
  } catch {
    const params = new URLSearchParams(text);
    const out: Record<string, string> = {};
    params.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
}

function stringifyBody(b: unknown): Record<string, string> {
  if (!b || typeof b !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(b as Record<string, unknown>)) {
    if (v == null) continue;
    out[k] = String(v);
  }
  return out;
}

/**
 * Where a successful sign-in should land.
 * Trading hosts stay on the host that set the cookie (/trade or /izcrm).
 * The CRM host has no trading UI, so non-admins still leave for the main site.
 */
export function loginLandingPath(
  req: Request,
  user: { role?: string | null; crmReadOnly?: boolean | null }
): string {
  const host = hostnameFromRequest({ headers: { get: (n) => req.headers.get(n) } });
  if (isCrmHostname(host)) {
    if (user.role === "ADMIN" && !user.crmReadOnly) return "/izcrm";
    return `${MAIN_SITE_ORIGIN}/trade`;
  }
  return postLoginPath(user);
}

/** Same-host redirect so the session cookie (no Domain attribute) is sent on the next GET. */
export function navRedirect(req: Request, path: string): NextResponse {
  const target =
    path.startsWith("https://") || path.startsWith("http://") ? path : publicAbsoluteUrl(req, path);
  return NextResponse.redirect(new URL(target), 303);
}
