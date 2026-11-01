import { NextResponse } from "next/server";
import { requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseStreamWrite } from "@/lib/affiliate-partner";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string; streamId: string } };

async function owned(affiliateId: string, streamId: string) {
  return prisma.affiliateStream.findFirst({ where: { id: streamId, affiliateId }, select: { id: true, name: true } });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const row = await owned(params.id, params.streamId);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseStreamWrite(body, "patch");
  if (parsed.error || !parsed.data || !Object.keys(parsed.data).length) {
    return NextResponse.json({ error: parsed.error || "Nothing to save" }, { status: 400 });
  }
  await prisma.affiliateStream.update({ where: { id: row.id }, data: parsed.data });
  await writeAudit({ adminId: admin.id, action: "AFFILIATE_STREAM_UPDATE", targetId: params.id, note: row.name });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const row = await owned(params.id, params.streamId);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.affiliateStream.delete({ where: { id: row.id } });
  await writeAudit({ adminId: admin.id, action: "AFFILIATE_STREAM_DELETE", targetId: params.id, note: row.name });
  return NextResponse.json({ ok: true });
}
