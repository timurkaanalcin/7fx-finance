import { NextResponse } from "next/server";

/** GET /apk → real APK download under /downloads/7FX.apk */
export async function GET() {
  return NextResponse.redirect(new URL("/downloads/7FX.apk", process.env.NEXT_PUBLIC_SITE_URL || "https://7fx.control.org.tr"), 302);
}
