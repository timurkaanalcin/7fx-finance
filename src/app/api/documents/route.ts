import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NO_STORE } from "@/lib/chat/attachments";
import { CUSTOMER_DOCS_LEGACY, pagedOrLegacy } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

/** Customer: own + global documents (metadata only, no staff info). */
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  const searchParams = new URL(req.url).searchParams;
  const paged = searchParams.has("take") || searchParams.has("skip");
  const page = pagedOrLegacy(searchParams.get("take"), searchParams.get("skip"), paged, CUSTOMER_DOCS_LEGACY);
  const docs = await prisma.customerDocument.findMany({
    where: { OR: [{ userId: user.id }, { userId: null }] },
    orderBy: { createdAt: "desc" },
    skip: page.skip,
    take: page.paged ? page.take + 1 : page.take,
    select: { id: true, title: true, mime: true, size: true, createdAt: true },
  });
  const hasMore = page.paged && docs.length > page.take;
  const rows = hasMore ? docs.slice(0, page.take) : docs;
  return NextResponse.json(
    {
      documents: rows.map((d) => ({ ...d, kind: d.mime === "application/pdf" ? "pdf" : "image" })),
      hasMore,
      nextSkip: page.skip + rows.length,
    },
    { headers: NO_STORE }
  );
}
