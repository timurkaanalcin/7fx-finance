import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { requireAdmin, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Start TOTP enrollment — returns otpauth URL + QR data URL. Secret stored but not enabled until confirm. */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if ((admin as { crmReadOnly?: boolean }).crmReadOnly) {
    return NextResponse.json({ error: "Read-only admins cannot change 2FA" }, { status: 403 });
  }

  const secret = authenticator.generateSecret();
  await prisma.user.update({
    where: { id: admin.id },
    data: { totpSecret: secret, totpEnabled: false },
  });

  const otpauth = authenticator.keyuri(admin.email, "7FX CRM", secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  await writeAudit({
    adminId: admin.id,
    action: "2FA_SETUP_START",
    targetId: admin.id,
    note: "TOTP enrollment started",
  });

  return NextResponse.json({ ok: true, secret, otpauth, qrDataUrl });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return NextResponse.json({
    totpEnabled: (admin as { totpEnabled?: boolean }).totpEnabled === true,
  });
}
