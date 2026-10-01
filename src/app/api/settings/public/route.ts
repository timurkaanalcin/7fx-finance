import { NextResponse } from "next/server";
import {
  ensureSystemSettings,
  getSystemSettings,
  DEFAULT_REFERRAL_CODE,
} from "@/lib/system-settings";

export const dynamic = "force-dynamic";

/** Public registration policy — does NOT expose secrets. */
export async function GET() {
  await ensureSystemSettings();
  const s = await getSystemSettings();
  return NextResponse.json({
    referralRequired: s.referralRequired !== false,
    // Exact code length hint only — full code is validated server-side.
    // For UX we expose the expected code when required (product uses a single shared invite).
    referralCode: s.referralRequired !== false ? s.referralCode || DEFAULT_REFERRAL_CODE : null,
    referralCodeDigits: String(s.referralCode || DEFAULT_REFERRAL_CODE).length,
  });
}
