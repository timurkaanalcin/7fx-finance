import { NextResponse } from "next/server";
import { requireAdmin, writeAudit } from "@/lib/auth";
import {
  ensureSystemSettings,
  getSystemSettings,
  setReferralCode,
  invalidateSystemSettingsCache,
} from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  await ensureSystemSettings();
  const settings = await getSystemSettings();
  return NextResponse.json({
    referralCode: settings.referralCode,
    updatedAt: settings.updatedAt ?? null,
  });
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const raw = body.referralCode != null ? String(body.referralCode).trim() : "";
  if (!raw) {
    return NextResponse.json({ error: "Referans kodu boş olamaz" }, { status: 400 });
  }
  if (raw.length > 64) {
    return NextResponse.json({ error: "Referans kodu çok uzun" }, { status: 400 });
  }

  try {
    const row = await setReferralCode(raw);
    await writeAudit({
      adminId: admin.id,
      action: "UPDATE_REFERRAL_CODE",
      meta: { referralCode: row.referralCode },
    });
    invalidateSystemSettingsCache();
    return NextResponse.json({
      ok: true,
      referralCode: row.referralCode,
      updatedAt: row.updatedAt ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kayıt hatası" }, { status: 500 });
  }
}
