import { NextResponse } from "next/server";
import { requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newAffiliateToken } from "@/lib/affiliate-partner";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const existing = await prisma.affiliatePartner.findUnique({ where: { id: params.id }, select: { id: true, sourceKey: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const token = newAffiliateToken();
  await prisma.affiliatePartner.update({ where: { id: existing.id }, data: { token } });
  await writeAudit({ adminId: admin.id, action: "AFFILIATE_TOKEN", targetId: existing.id, note: existing.sourceKey });
  return NextResponse.json({ ok: true, token });
}
