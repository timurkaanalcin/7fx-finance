import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hostnameFromRequest,
  isCrmHostname,
} from "@/lib/crm-host";
import { locationForRequest } from "@/lib/request-origin";
import { isAllowedApiOrigin } from "@/lib/security/origins";
import { HSTS_VALUE, PERMISSIONS_POLICY, requestIsHttps } from "@/lib/security/response-headers.cjs";
import { isIndexableHost, isMarketingPath, isPrivateHtmlPath, shouldNoindex } from "@/lib/seo-hosts";

const STRICT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://query1.finance.yahoo.com https://query2.finance.yahoo.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("7fx_session")?.value ||
    req.cookies.get("deskflow_session")?.value;
  const { pathname } = req.nextUrl;
  const host = hostnameFromRequest(req);
  const crmHost = isCrmHostname(host);

  // Server-trusted request path/method for CRM scope checks (always overwrites any client value).
  const passNext = () => {
    const h = new Headers(req.headers);
    h.set("x-7fx-url", pathname + (req.nextUrl.search || ""));
    h.set("x-7fx-method", req.method.toUpperCase());
    return NextResponse.next({ request: { headers: h } });
  };

  const applyHeaders = (res: NextResponse) => {
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    res.headers.set("Content-Security-Policy", STRICT_CSP);
    if (shouldNoindex(host, pathname) || crmHost) {
      res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }
    // Public HTML still varies by fx_lang and by the session (home redirect, sign-in chrome).
    // The root layout reads that cookie, so these routes stay dynamic. Anonymous requests
    // on an indexable host share one CDN entry. A session or language cookie must not reuse it.
    if (hasPersonalizationCookie(req) || isPrivateHtmlPath(pathname) || crmHost) {
      res.headers.set("Cache-Control", "private, no-store");
    } else if (isMarketingPath(pathname) && isIndexableHost(host)) {
      res.headers.set(
        "Cache-Control",
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
      );
      res.headers.append("Vary", "Cookie");
    } else if (isMarketingPath(pathname)) {
      res.headers.set("Cache-Control", "private, no-store");
    }
    // Replaces the camera/microphone/geolocation line above. payment and usb stay off.
    // HSTS only on HTTPS so local HTTP does not pin the browser.
    res.headers.set("Permissions-Policy", PERMISSIONS_POLICY);
    if (requestIsHttps(req.headers.get("x-forwarded-proto"), req.nextUrl.protocol)) {
      res.headers.set("Strict-Transport-Security", HSTS_VALUE);
    }
    return res;
  };

  // API origin allowlist (credentialed browser calls). Missing Origin allowed (native / same-origin).
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    if (origin && !isAllowedApiOrigin(origin)) {
      return applyHeaders(
        NextResponse.json({ error: "Origin not allowed" }, { status: 403 })
      );
    }
    if (req.method === "OPTIONS") {
      // No open CORS — browsers on allowed origins are same-site or listed; deny preflight from strangers.
      if (origin && isAllowedApiOrigin(origin)) {
        const res = new NextResponse(null, { status: 204 });
        res.headers.set("Access-Control-Allow-Origin", origin);
        res.headers.set("Access-Control-Allow-Credentials", "true");
        res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return applyHeaders(res);
      }
      return applyHeaders(new NextResponse(null, { status: 403 }));
    }
  }

  // ——— CRM host (crm7fx.customer.org.tr) ———
  if (crmHost) {
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname === "/favicon.ico" ||
      pathname.startsWith("/icons/") ||
      pathname.startsWith("/sw.js")
    ) {
      return applyHeaders(passNext());
    }

    if (pathname === "/login") {
      if (token) {
        return applyHeaders(NextResponse.redirect(locationForRequest(req, "/izcrm")));
      }
      return applyHeaders(passNext());
    }

    if (pathname === "/izcrm" || pathname.startsWith("/izcrm/")) {
      if (!token) {
        return applyHeaders(NextResponse.redirect(locationForRequest(req, "/login")));
      }
      return applyHeaders(passNext());
    }

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return applyHeaders(
        new NextResponse("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }

    return applyHeaders(
      new NextResponse(awaitBlank(), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      })
    );
  }

  // ——— Main trading host ———
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return applyHeaders(
      new NextResponse("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }

  // TEMP: /izcrm re-enabled on trading host until Natro crm7fx.customer.org.tr is live.
  // Remove this auth-gate restore and re-cutover once crm7fx Natro CRM is serving.

  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      return applyHeaders(NextResponse.redirect(locationForRequest(req, "/trade")));
    }
    return applyHeaders(passNext());
  }

  if (
    (pathname.startsWith("/trade") ||
      pathname === "/izcrm" ||
      pathname.startsWith("/izcrm/") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/documents") ||
      pathname.startsWith("/assistant") ||
      pathname.startsWith("/membership")) &&
    !token
  ) {
    return applyHeaders(NextResponse.redirect(locationForRequest(req, "/login")));
  }

  return applyHeaders(passNext());
}

/** Session or a chosen public language. Those responses must not enter the shared cache. */
function hasPersonalizationCookie(req: NextRequest): boolean {
  if (req.cookies.get("7fx_session")?.value) return true;
  if (req.cookies.get("deskflow_session")?.value) return true;
  if (req.cookies.get("7fx_impersonation")?.value) return true;
  const lang = req.cookies.get("fx_lang")?.value;
  return typeof lang === "string" && lang.trim() !== "";
}

function awaitBlank(): string {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="robots" content="noindex"/><title></title></head><body></body></html>';
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|map|txt|xml|webmanifest|apk)$).*)",
  ],
};
