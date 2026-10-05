import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePresence } from "@/lib/presence-shared";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** GET — admin-only: client's presence + last 50 sign-in events. */
export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = ctx.params.id;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const events = await prisma.loginEvent.findMany({
    where: { userId: id },
    orderBy: { at: "desc" },
    take: 50,
  });
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
      serverTime: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
