import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hostnameFromRequest,
  isCrmHostname,
} from "@/lib/crm-host";

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("7fx_session")?.value ||
    req.cookies.get("deskflow_session")?.value;
  const { pathname } = req.nextUrl;
  const host = hostnameFromRequest(req);
  const crmHost = isCrmHostname(host);

  const applyHeaders = (res: NextResponse) => {
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://query1.finance.yahoo.com https://query2.finance.yahoo.com",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
    );
    return res;
  };

  // ——— CRM host (crm7fx.customer.org.tr) ———
  if (crmHost) {
    // APIs and Next internals pass through (session cookie is host-scoped).
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

    // /admin never reveals CRM on this host either
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return applyHeaders(
        new NextResponse("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }

    // `/` and any other path → blank empty page (no branding, no redirect).
    return applyHeaders(new NextResponse(awaitBlank(), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } }));
  }

  // ——— Main trading host ———
  // Legacy CRM path — plain 404 (do not redirect / reveal).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return applyHeaders(
      new NextResponse("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }

  // NOTE: /izcrm on main host stays available until crm7fx is verified with TLS.
  // After cutover, mirror the /admin 404 here.

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
  return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"/><meta name=\"robots\" content=\"noindex\"/><title></title></head><body></body></html>";
}

export const config = {
  matcher: [
    /*
     * All app paths except static file-like URLs.
     * Needed so the CRM host can blank `/` and unknown routes.
     */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|map|txt|xml|webmanifest|apk)$).*)",
  ],
};
