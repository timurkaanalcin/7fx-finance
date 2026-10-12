import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Staff download (unrestricted). */
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return new Response("Unauthorized", { status: 403 });
  const d = await prisma.customerDocument.findUnique({ where: { id: ctx.params.id } });
  if (!d) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(d.data), {
    headers: {
      "Content-Type": d.mime,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(d.fileName)}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const d = await prisma.customerDocument.findUnique({ where: { id: ctx.params.id }, select: { id: true, title: true, userId: true } });
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.customerDocument.delete({ where: { id: d.id } });
  await writeAudit({ adminId: admin.id, action: "CUSTOMER_DOCUMENT_DELETE", targetId: d.userId || "ALL", note: d.title });
  return NextResponse.json({ ok: true });
}
