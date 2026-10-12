import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ATT_MAX_BYTES, ATT_VIEWABLE } from "@/lib/chat/attachments";

export const dynamic = "force-dynamic";

/** Staff: list customer documents ("Evraklar"). ?userId= filters (includes global ones). */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const userId = new URL(req.url).searchParams.get("userId") || "";
  const docs = await prisma.customerDocument.findMany({
    where: userId ? { OR: [{ userId }, { userId: null }] } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { id: true, userId: true, title: true, fileName: true, mime: true, size: true, createdAt: true, uploadedById: true },
  });
  const ids = Array.from(new Set(docs.map((d) => d.userId).filter(Boolean) as string[]));
  const users = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true, accountLoginId: true } })
    : [];
  const byId = new Map(users.map((u) => [u.id, u]));
  return NextResponse.json({
    documents: docs.map((d) => ({ ...d, user: d.userId ? byId.get(d.userId) ?? null : null })),
  });
}

/** Staff upload (multipart: file, title, userId | global=1). */
export async function POST(req: Request) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const form = await req.formData().catch(() => null);
  const global = String(form?.get("global") || "") === "1";
  const userId = global ? null : String(form?.get("userId") || "").trim();
  const title = String(form?.get("title") || "").trim().slice(0, 200);
  const file = form?.get("file");
  if ((!global && !userId) || !file || typeof file === "string") {
    return NextResponse.json({ error: "Customer and file required" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > ATT_MAX_BYTES) return NextResponse.json({ error: "File must be 1 B – 8 MB" }, { status: 400 });
  const mime = (file.type || "").slice(0, 120);
  if (!ATT_VIEWABLE.includes(mime)) return NextResponse.json({ error: "Only PNG, JPEG, WEBP, GIF or PDF" }, { status: 400 });
  if (userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const doc = await prisma.customerDocument.create({
    data: { userId, title: title || (file.name || "Document").slice(0, 200), fileName: (file.name || "file").slice(0, 255), mime, size: buf.length, data: buf, uploadedById: admin.id },
    select: { id: true, title: true },
  });
  await writeAudit({ adminId: admin.id, action: "CUSTOMER_DOCUMENT_UPLOAD", targetId: userId || "ALL", note: doc.title });
  return NextResponse.json({ ok: true, document: doc });
}
