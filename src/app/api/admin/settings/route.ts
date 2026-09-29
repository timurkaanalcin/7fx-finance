import { NextResponse } from "next/server";
import { requireAdmin, writeAudit } from "@/lib/auth";
import {
  ensureSystemSettings,
  getSystemSettings,
  setSystemSettings,
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
    referralRequired: settings.referralRequired !== false,
    updatedAt: settings.updatedAt ?? null,
  });
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const opts: { referralCode?: string; referralRequired?: boolean } = {};

  if (body.referralCode != null) {
    const raw = String(body.referralCode).trim();
    if (!raw) {
      return NextResponse.json({ error: "Referans kodu boş olamaz" }, { status: 400 });
    }
    if (raw.length > 64) {
      return NextResponse.json({ error: "Referans kodu çok uzun" }, { status: 400 });
    }
    // Prefer digits-style codes (allow non-digit if admin insists, but warn via pattern)
    opts.referralCode = raw;
  }

  if (body.referralRequired != null) {
    opts.referralRequired = Boolean(body.referralRequired);
  }

  if (opts.referralCode == null && opts.referralRequired == null) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  try {
    const row = await setSystemSettings(opts);
    await writeAudit({
      adminId: admin.id,
      action: "UPDATE_SYSTEM_SETTINGS",
      meta: {
        referralCode: row.referralCode,
        referralRequired: row.referralRequired,
      },
    });
    invalidateSystemSettingsCache();
    return NextResponse.json({
      ok: true,
      referralCode: row.referralCode,
      referralRequired: row.referralRequired !== false,
      updatedAt: row.updatedAt ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kayıt hatası" }, { status: 500 });
  }
}
