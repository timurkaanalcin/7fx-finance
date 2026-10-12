import { NextResponse } from "next/server";
import { requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ATT_MAX_BYTES } from "@/lib/chat/attachments";

export const dynamic = "force-dynamic";

/** Staff upload of a chat attachment (multipart: userId, file). Returns { id }. */
export async function POST(req: Request) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const form = await req.formData().catch(() => null);
  const userId = String(form?.get("userId") || "").trim();
  const file = form?.get("file");
  if (!userId || !file || typeof file === "string") {
    return NextResponse.json({ error: "userId and file required" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > ATT_MAX_BYTES) {
    return NextResponse.json({ error: "File must be 1 B – 8 MB" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const buf = Buffer.from(await file.arrayBuffer());
  const att = await prisma.chatAttachment.create({
    data: {
      userId,
      uploadedById: admin.id,
      fileName: (file.name || "file").slice(0, 255),
      mime: (file.type || "application/octet-stream").slice(0, 120),
      size: buf.length,
      data: buf,
    },
    select: { id: true, fileName: true, mime: true, size: true },
  });
  await writeAudit({ adminId: admin.id, action: "CHAT_ATTACHMENT_UPLOAD", targetId: userId, note: att.fileName });
  return NextResponse.json({ ok: true, attachment: att });
}
