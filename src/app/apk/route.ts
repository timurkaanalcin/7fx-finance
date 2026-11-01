import { NextResponse } from "next/server";
import { fallbackSiteOrigin } from "@/lib/site-origin";

/** GET /apk → real APK download under /downloads/7FX.apk */
export async function GET() {
  return NextResponse.redirect(new URL("/downloads/7FX.apk", fallbackSiteOrigin()), 302);
}
