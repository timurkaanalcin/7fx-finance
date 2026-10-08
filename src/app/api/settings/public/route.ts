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
    // Security: the invite code itself is never exposed publicly (it used to be returned here,
    // which made invite-only registration bypassable). Only the length hint is shared; the
    // full code is validated server-side in /api/auth/register.
    referralCodeDigits: String(s.referralCode || DEFAULT_REFERRAL_CODE).length,
  });
}
