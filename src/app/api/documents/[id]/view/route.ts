import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ATT_VIEWABLE, NO_STORE, verifyAttachmentToken } from "@/lib/chat/attachments";

export const dynamic = "force-dynamic";

/** Customer view bytes: session + short-lived token (X-View-Token). Inline, no-store, fetch-only. */
export async function GET(req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return new Response("Unauthorized", { status: 401, headers: NO_STORE });
  const token = req.headers.get("x-view-token") || "";
  if (!(await verifyAttachmentToken(token, `doc:${ctx.params.id}`, user.id))) return new Response("Forbidden", { status: 403, headers: NO_STORE });
  if (req.headers.get("sec-fetch-dest") === "document") return new Response("Forbidden", { status: 403, headers: NO_STORE });
  const d = await prisma.customerDocument.findUnique({ where: { id: ctx.params.id } });
  if (!d || (d.userId !== null && d.userId !== user.id) || !ATT_VIEWABLE.includes(d.mime)) return new Response("Not found", { status: 404, headers: NO_STORE });
  return new Response(new Uint8Array(d.data), {
    headers: { ...NO_STORE, "Content-Type": d.mime, "Content-Disposition": "inline", "Content-Security-Policy": "default-src 'none'; sandbox" },
  });
}
