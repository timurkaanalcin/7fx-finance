import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ATT_VIEWABLE, NO_STORE, signAttachmentToken } from "@/lib/chat/attachments";

export const dynamic = "force-dynamic";

/** Customer: get a 60 s view token for one of THEIR chat attachments. */
export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  const att = await prisma.chatAttachment.findUnique({
    where: { id: ctx.params.id },
    select: { id: true, userId: true, mime: true, fileName: true },
  });
  if (!att || att.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  if (!ATT_VIEWABLE.includes(att.mime)) {
    return NextResponse.json({ error: "Preview not available" }, { status: 415, headers: NO_STORE });
  }
  const token = await signAttachmentToken(att.id, user.id);
  return NextResponse.json(
    {
      token,
      kind: att.mime === "application/pdf" ? "pdf" : "image",
      fileName: att.fileName,
      watermark: `${user.name || user.email} · ${user.accountLoginId || user.id}`,
    },
    { headers: NO_STORE }
  );
}
