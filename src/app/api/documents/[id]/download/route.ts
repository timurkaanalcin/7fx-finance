import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NO_STORE } from "@/lib/chat/attachments";

export const dynamic = "force-dynamic";

/** Customer download of the original file (own or global documents only). */
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return new Response("Unauthorized", { status: 401, headers: NO_STORE });
  const d = await prisma.customerDocument.findUnique({ where: { id: ctx.params.id } });
  if (!d || (d.userId !== null && d.userId !== user.id)) return new Response("Not found", { status: 404, headers: NO_STORE });
  const name = (d.fileName || d.title || "document").replace(/[\r\n"]/g, "_");
  const ascii = name.replace(/[^\x20-\x7E]/g, "_");
  return new Response(new Uint8Array(d.data), {
    headers: {
      ...NO_STORE,
      "Content-Type": d.mime || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Content-Length": String(d.data.length),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
