import { NextResponse } from "next/server";
import { writeAudit, requireAdmin, requireAdminWrite } from "@/lib/auth";
import {
  ensureSystemSettings,
  getSystemSettings,
  setSystemSettings,
  invalidateSystemSettingsCache,
} from "@/lib/system-settings";
import type { LeadStatusMapping } from "@/lib/lead-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await ensureSystemSettings();
  const settings = await getSystemSettings();
  return NextResponse.json({
    referralCode: settings.referralCode,
    referralRequired: settings.referralRequired !== false,
    terminalImpersonationEnabled: settings.terminalImpersonationEnabled !== false,
    leadStatusMapping: settings.leadStatusMapping,
    updatedAt: settings.updatedAt ?? null,
  });
}

export async function PUT(req: Request) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const opts: {
    referralCode?: string;
    referralRequired?: boolean;
    terminalImpersonationEnabled?: boolean;
    leadStatusMapping?: LeadStatusMapping;
  } = {};

  if (body.referralCode != null) {
    const raw = String(body.referralCode).trim();
    if (!raw) {
      return NextResponse.json({ error: "Referral code cannot be empty" }, { status: 400 });
    }
    if (raw.length > 64) {
      return NextResponse.json({ error: "Referral code is too long" }, { status: 400 });
    }
    opts.referralCode = raw;
  }

  if (body.referralRequired != null) {
    opts.referralRequired = Boolean(body.referralRequired);
  }
  if (body.terminalImpersonationEnabled != null) {
    opts.terminalImpersonationEnabled = Boolean(body.terminalImpersonationEnabled);
  }
  if (body.leadStatusMapping != null && typeof body.leadStatusMapping === "object") {
    opts.leadStatusMapping = body.leadStatusMapping as LeadStatusMapping;
  }

  if (
    opts.referralCode == null &&
    opts.referralRequired == null &&
    opts.terminalImpersonationEnabled == null &&
    opts.leadStatusMapping == null
  ) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const row = await setSystemSettings(opts);
    await writeAudit({
      adminId: admin.id,
      action: "UPDATE_SYSTEM_SETTINGS",
      meta: {
        referralCode: row.referralCode,
        referralRequired: row.referralRequired,
        terminalImpersonationEnabled: row.terminalImpersonationEnabled,
        leadStatusMapping: row.leadStatusMapping,
      },
    });
    invalidateSystemSettingsCache();
    return NextResponse.json({
      ok: true,
      referralCode: row.referralCode,
      referralRequired: row.referralRequired !== false,
      terminalImpersonationEnabled: row.terminalImpersonationEnabled !== false,
      leadStatusMapping: row.leadStatusMapping,
      updatedAt: row.updatedAt ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration error" }, { status: 500 });
  }
}
