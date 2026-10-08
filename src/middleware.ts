import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hostnameFromRequest,
  isCrmHostname,
} from "@/lib/crm-host";
import { isAllowedApiOrigin } from "@/lib/security/origins";

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

  const applyHeaders = (res: NextResponse) => {
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"
    );
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    res.headers.set("Content-Security-Policy", STRICT_CSP);
    if (
      pathname === "/izcrm" ||
      pathname.startsWith("/izcrm/") ||
      pathname.startsWith("/api/admin") ||
      crmHost
    ) {
      res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
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
      return applyHeaders(NextResponse.next());
    }

    if (pathname === "/login") {
      if (token) {
        return applyHeaders(NextResponse.redirect(new URL("/izcrm", req.url)));
      }
      return applyHeaders(NextResponse.next());
    }

    if (pathname === "/izcrm" || pathname.startsWith("/izcrm/")) {
      if (!token) {
        return applyHeaders(NextResponse.redirect(new URL("/login", req.url)));
      }
      return applyHeaders(NextResponse.next());
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
      return applyHeaders(NextResponse.redirect(new URL("/trade", req.url)));
    }
    return applyHeaders(NextResponse.next());
  }

  if (
    (pathname.startsWith("/trade") ||
      pathname === "/izcrm" ||
      pathname.startsWith("/izcrm/") ||
      pathname.startsWith("/profile")) &&
    !token
  ) {
    return applyHeaders(NextResponse.redirect(new URL("/login", req.url)));
  }

  return applyHeaders(NextResponse.next());
}

function awaitBlank(): string {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="robots" content="noindex"/><title></title></head><body></body></html>';
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|map|txt|xml|webmanifest|apk)$).*)",
  ],
};
