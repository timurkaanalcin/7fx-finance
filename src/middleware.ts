import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "7fx_session";
const LEGACY_COOKIE_NAME = "deskflow_session";

function getAuthSecret(): Uint8Array | null {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "deskflow-trade-demo-secret");
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token =
    req.cookies.get(COOKIE_NAME)?.value ||
    req.cookies.get(LEGACY_COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = getAuthSecret();
  if (!secret) return Boolean(token); // can't verify — treat presence as ok
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

function clearSessionCookies(res: NextResponse) {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  res.cookies.set(COOKIE_NAME, "", base);
  res.cookies.set(LEGACY_COOKIE_NAME, "", base);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const valid = await hasValidSession(req);

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
    if (valid) {
      return applyHeaders(NextResponse.redirect(new URL("/trade", req.url)));
    }
    // Stale cookie present but invalid — clear so login can set a fresh one
    const res = applyHeaders(NextResponse.next());
    if (
      req.cookies.get(COOKIE_NAME)?.value ||
      req.cookies.get(LEGACY_COOKIE_NAME)?.value
    ) {
      clearSessionCookies(res);
    }
    return res;
  }

  if (
    (pathname.startsWith("/trade") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/profile")) &&
    !valid
  ) {
    const res = applyHeaders(NextResponse.redirect(new URL("/login", req.url)));
    clearSessionCookies(res);
    return res;
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
