import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { requireAdmin, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if ((admin as { crmReadOnly?: boolean }).crmReadOnly) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const code = String((await req.json().catch(() => ({}))).code || "").replace(/\s+/g, "");
  const secret = (admin as { totpSecret?: string | null }).totpSecret;
  if ((admin as { totpEnabled?: boolean }).totpEnabled && secret) {
    if (!authenticator.check(code, secret)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
  }
  await prisma.user.update({
    where: { id: admin.id },
    data: { totpEnabled: false, totpSecret: null },
  });
  await writeAudit({ adminId: admin.id, action: "2FA_DISABLED", targetId: admin.id });
  return NextResponse.json({ ok: true, totpEnabled: false });
}
