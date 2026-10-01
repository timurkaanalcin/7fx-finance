import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("7fx_session")?.value ||
    req.cookies.get("deskflow_session")?.value;
  const { pathname } = req.nextUrl;

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

  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      return applyHeaders(NextResponse.redirect(new URL("/trade", req.url)));
    }
    return applyHeaders(NextResponse.next());
  }

  if (
    (pathname.startsWith("/trade") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/profile")) &&
    !token
  ) {
    return applyHeaders(NextResponse.redirect(new URL("/login", req.url)));
  }

  return applyHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/trade/:path*",
    "/login",
    "/register",
    "/admin/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
