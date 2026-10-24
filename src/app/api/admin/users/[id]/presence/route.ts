import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePresence } from "@/lib/presence-shared";
import { pageSkip } from "@/lib/position-pages";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const PRESENCE_EVENT_PAGE = 50;

/** GET — admin-only: client's presence + a page of sign-in events. */
export async function GET(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = ctx.params.id;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const skip = pageSkip(new URL(req.url).searchParams.get("skip"));
  const found = await prisma.loginEvent.findMany({
    where: { userId: id },
    orderBy: { at: "desc" },
    skip,
    take: PRESENCE_EVENT_PAGE + 1,
  });
  const eventsHasMore = found.length > PRESENCE_EVENT_PAGE;
  const events = eventsHasMore ? found.slice(0, PRESENCE_EVENT_PAGE) : found;
  const actorIds = Array.from(new Set(events.map((e) => e.actorId).filter((x): x is string => !!x)));
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } })
    : [];
  const actorName = new Map(actors.map((a) => [a.id, a.name || a.email]));

  return NextResponse.json(
    {
      presence: {
        ...serializePresence(user as unknown as Record<string, unknown>),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        lastUserAgent: user.lastUserAgent ?? null,
      },
      events: events.map((e) => ({
        id: e.id,
        at: e.at.toISOString(),
        success: e.success,
        method: e.method,
        reason: e.reason,
        actorName: e.actorId ? actorName.get(e.actorId) || e.actorId : null,
        ip: e.ip,
        country: e.country,
        countryName: e.countryName,
        region: e.region,
        city: e.city,
        device: e.device,
        browser: e.browser,
        os: e.os,
        userAgent: e.userAgent,
      })),
      eventsHasMore,
      eventsNextSkip: skip + events.length,
      serverTime: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
