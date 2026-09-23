import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("deskflow_session")?.value;
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/trade", req.url));
    }
    return NextResponse.redirect(new URL("/?auth=login", req.url));
  }

  if (
    (pathname.startsWith("/trade") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/profile")) &&
    !token
  ) {
    return NextResponse.redirect(new URL("/?auth=login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/trade/:path*", "/login", "/admin/:path*", "/profile", "/profile/:path*"],
};
