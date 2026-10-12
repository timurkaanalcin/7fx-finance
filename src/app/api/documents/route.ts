import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NO_STORE } from "@/lib/chat/attachments";

export const dynamic = "force-dynamic";

/** Customer: own + global documents (metadata only, no staff info). */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  const docs = await prisma.customerDocument.findMany({
    where: { OR: [{ userId: user.id }, { userId: null }] },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, title: true, mime: true, size: true, createdAt: true },
  });
  return NextResponse.json({ documents: docs.map((d) => ({ ...d, kind: d.mime === "application/pdf" ? "pdf" : "image" })) }, { headers: NO_STORE });
}
