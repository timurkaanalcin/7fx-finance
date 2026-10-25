import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vapidPublicKey } from "@/lib/notify";

export const dynamic = "force-dynamic";

const NOTE_PAGE = 30;
const NOTE_CAP = 100;

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const search = new URL(req.url).searchParams;
  const skipNum = Number(search.get("skip"));
  const skip = Number.isFinite(skipNum) && skipNum > 0 ? Math.min(100_000, Math.trunc(skipNum)) : 0;
  const takeRaw = search.get("take");
  let take = NOTE_PAGE;
  if (takeRaw != null && takeRaw !== "") {
    const n = Math.trunc(Number(takeRaw));
    take = Number.isFinite(n) && n > 0 ? Math.min(NOTE_CAP, n) : NOTE_PAGE;
  }
  const [found, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: take + 1,
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  const hasMore = found.length > take;
  const items = hasMore ? found.slice(0, take) : found;
  return NextResponse.json({
    items,
    unread,
    hasMore,
    nextSkip: skip + items.length,
    vapidPublicKey: vapidPublicKey(),
  });
}

/** PATCH { id } marks one read; { all: true } marks all read. */
export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const where = b.all ? { userId: user.id, readAt: null } : { userId: user.id, id: String(b.id || "") };
  await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}
