import { NextResponse } from "next/server";
import { requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseStreamWrite } from "@/lib/affiliate-partner";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const partner = await prisma.affiliatePartner.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseStreamWrite(body, "create");
  if (!parsed.data?.name || !parsed.data.declaredSource) {
    return NextResponse.json({ error: parsed.error || "Stream name is required" }, { status: 400 });
  }
  const row = await prisma.affiliateStream.create({
    data: {
      affiliateId: partner.id,
      name: parsed.data.name,
      declaredSource: parsed.data.declaredSource,
      landingUrl: parsed.data.landingUrl ?? null,
      note: parsed.data.note ?? null,
      active: parsed.data.active !== false,
    },
  });
  await writeAudit({ adminId: admin.id, action: "AFFILIATE_STREAM_CREATE", targetId: partner.id, note: row.name });
  return NextResponse.json({ ok: true, id: row.id });
}
