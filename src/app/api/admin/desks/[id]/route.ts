import { NextResponse } from "next/server";
import { requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeUserMembership } from "@/lib/membership";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = ctx.params.id;
  const desk = await prisma.desk.findUnique({ where: { id } });
  if (!desk) return NextResponse.json({ error: "Desk yok" }, { status: 404 });

  const where = {
    OR: [{ deskId: desk.id }, ...(desk.code ? [{ deskId: desk.code }] : []), { desk: desk.name }],
  };

  const [traders, workers] = await Promise.all([
    prisma.user.findMany({
      where: { ...where, role: "TRADER" },
      include: { account: true },
      take: 200,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { ...where, role: "ADMIN" },
      include: { account: true },
      take: 100,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    desk,
    traders: traders.map((u) => serializeUserMembership(u as unknown as Record<string, unknown>)),
    workers: workers.map((u) => serializeUserMembership(u as unknown as Record<string, unknown>)),
    analytics: {
      tradersCount: traders.length,
      workersCount: workers.length,
      totalBalance: traders.reduce((s, u) => s + (u.account?.balance || 0), 0),
      note: "Analytics stub — finance / affiliation / scoreboard per desk in a later iteration",
    },
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const id = ctx.params.id;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).slice(0, 120);
  if (body.code !== undefined) data.code = body.code ? String(body.code).slice(0, 40) : null;
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.chatStatus === "boolean") data.chatStatus = body.chatStatus;
  if (body.minimalDeposit !== undefined && Number.isFinite(Number(body.minimalDeposit)))
    data.minimalDeposit = Number(body.minimalDeposit);
  if (body.maximumDeposit !== undefined && Number.isFinite(Number(body.maximumDeposit)))
    data.maximumDeposit = Number(body.maximumDeposit);
  if (body.tradePlatformLink !== undefined)
    data.tradePlatformLink = body.tradePlatformLink
      ? String(body.tradePlatformLink).slice(0, 300)
      : null;
  if (body.defaultEmail !== undefined)
    data.defaultEmail = body.defaultEmail ? String(body.defaultEmail).slice(0, 120) : null;
  if (body.office !== undefined) data.office = body.office ? String(body.office).slice(0, 80) : null;

  const desk = await prisma.desk.update({ where: { id }, data });
  return NextResponse.json({ ok: true, desk });
}
