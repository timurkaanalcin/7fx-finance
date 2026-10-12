import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NO_STORE } from "@/lib/chat/attachments";

export const dynamic = "force-dynamic";

/** Staff download (Content-Disposition: attachment). */
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return new Response("Unauthorized", { status: 403 });
  const att = await prisma.chatAttachment.findUnique({ where: { id: ctx.params.id } });
  if (!att) return new Response("Not found", { status: 404 });
  const name = encodeURIComponent(att.fileName);
  return new Response(new Uint8Array(att.data), {
    headers: {
      ...NO_STORE,
      "Content-Type": att.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${name}`,
    },
  });
}
