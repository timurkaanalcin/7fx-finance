import { NextResponse } from "next/server";
import { requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { crmPageWindow, serializeDeskTrader, serializeDeskWorker } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = ctx.params.id;
  const desk = await prisma.desk.findUnique({ where: { id } });
  if (!desk) return NextResponse.json({ error: "Desk yok" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const part = searchParams.get("part");
  const paged = searchParams.has("traderTake") || searchParams.has("traderSkip") || searchParams.has("workerTake") || searchParams.has("workerSkip") || part != null;
  const where = {
    OR: [{ deskId: desk.id }, ...(desk.code ? [{ deskId: desk.code }] : []), { desk: desk.name }],
  };
  const traderWhere = { ...where, role: "TRADER" as const };
  const workerWhere = { ...where, role: "ADMIN" as const };
  const wantTraders = part !== "workers";
  const wantWorkers = part !== "traders";
  const traderWindow = paged ? crmPageWindow(searchParams.get("traderTake"), searchParams.get("traderSkip")) : { take: 200, skip: 0 };
  const workerWindow = paged ? crmPageWindow(searchParams.get("workerTake"), searchParams.get("workerSkip")) : { take: 100, skip: 0 };

  const [tradersFound, workersFound, tradersCount, workersCount, balance] = await Promise.all([
    wantTraders
      ? prisma.user.findMany({
          where: traderWhere,
          select: { id: true, name: true, account: { select: { balance: true, currency: true } } },
          take: traderWindow.take + 1,
          skip: traderWindow.skip,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    wantWorkers
      ? prisma.user.findMany({
          where: workerWhere,
          select: { id: true, name: true, email: true },
          take: workerWindow.take + 1,
          skip: workerWindow.skip,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.user.count({ where: traderWhere }),
    prisma.user.count({ where: workerWhere }),
    prisma.account.aggregate({ where: { user: traderWhere }, _sum: { balance: true } }),
  ]);

  const tradersHasMore = wantTraders && tradersFound.length > traderWindow.take;
  const workersHasMore = wantWorkers && workersFound.length > workerWindow.take;
  const traders = (tradersHasMore ? tradersFound.slice(0, traderWindow.take) : tradersFound).map(serializeDeskTrader);
  const workers = (workersHasMore ? workersFound.slice(0, workerWindow.take) : workersFound).map(serializeDeskWorker);

  return NextResponse.json({
    desk,
    traders,
    workers,
    tradersHasMore,
    workersHasMore,
    analytics: {
      tradersCount,
      workersCount,
      totalBalance: balance._sum.balance || 0,
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
