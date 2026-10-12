import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ATT_VIEWABLE, NO_STORE, verifyAttachmentToken } from "@/lib/chat/attachments";

export const dynamic = "force-dynamic";

/** Customer view bytes: needs session (owner) + short-lived token in X-View-Token. Inline, no-store. */
export async function GET(req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return new Response("Unauthorized", { status: 401, headers: NO_STORE });
  const token = req.headers.get("x-view-token") || "";
  if (!(await verifyAttachmentToken(token, ctx.params.id, user.id))) {
    return new Response("Forbidden", { status: 403, headers: NO_STORE });
  }
  // Only fetch()/XHR from our viewer — a direct navigation (address bar / link) is refused.
  if (req.headers.get("sec-fetch-dest") === "document") return new Response("Forbidden", { status: 403, headers: NO_STORE });
  const att = await prisma.chatAttachment.findUnique({ where: { id: ctx.params.id } });
  if (!att || att.userId !== user.id || !ATT_VIEWABLE.includes(att.mime)) {
    return new Response("Not found", { status: 404, headers: NO_STORE });
  }
  return new Response(new Uint8Array(att.data), {
    headers: {
      ...NO_STORE,
      "Content-Type": att.mime,
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
