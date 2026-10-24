import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { crmPageWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

const TRADER_LOOKUP_CAP = 200;
const TRADER_SEARCH_CAP = 50;
const WORKER_LOOKUP_CAP = 200;

async function traderLookup(q: string, cap: number) {
  const found = await prisma.user.findMany({
    where: {
      role: "TRADER",
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { accountLoginId: { contains: q } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: cap + 1,
  });
  return {
    traders: found.length > cap ? found.slice(0, cap) : found,
    tradersPartial: found.length > cap,
  };
}

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const workerId = (searchParams.get("workerId") || "").trim();
  const where = workerId ? { workerId } : undefined;
  const paged = searchParams.has("take") || searchParams.has("skip");
  const pageWindow = paged ? crmPageWindow(searchParams.get("take"), searchParams.get("skip")) : null;
  const take = pageWindow ? pageWindow.take : 300;
  const skip = pageWindow ? pageWindow.skip : 0;
  const includeLookups = !pageWindow || skip === 0;
  const traderQ = (searchParams.get("traderQ") || "").trim().slice(0, 80);
  if (searchParams.get("lookup") === "traders") {
    const cap = traderQ ? TRADER_SEARCH_CAP : TRADER_LOOKUP_CAP;
    return NextResponse.json(await traderLookup(traderQ, cap));
  }

  const [found, workers, traders] = await Promise.all([
    prisma.reminder.findMany({
      where,
      orderBy: { remindAt: "asc" },
      skip,
      take: pageWindow ? take + 1 : take,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    includeLookups
      ? prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: WORKER_LOOKUP_CAP + 1,
        })
      : Promise.resolve(undefined),
    includeLookups ? traderLookup("", TRADER_LOOKUP_CAP) : Promise.resolve(undefined),
  ]);

  const hasMore = Boolean(pageWindow) && found.length > take;
  const rows = hasMore ? found.slice(0, take) : found;

  return NextResponse.json({
    reminders: rows.map((r) => ({
      id: r.id,
      body: r.body,
      remindAt: r.remindAt,
      color: r.color,
      workerId: r.workerId,
      workerName: r.workerName,
      traderId: r.userId,
      trader: r.user?.name || null,
      traderEmail: r.user?.email || null,
      createdAt: r.createdAt,
    })),
    hasMore,
    nextSkip: skip + rows.length,
    ...(workers
      ? {
          workers: workers.length > WORKER_LOOKUP_CAP ? workers.slice(0, WORKER_LOOKUP_CAP) : workers,
          workersPartial: workers.length > WORKER_LOOKUP_CAP,
        }
      : {}),
    ...(traders ? { traders: traders.traders, tradersPartial: traders.tradersPartial } : {}),
  });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "create");

  if (action === "delete") {
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  const text = String(body.body || "").trim();
  const remindAt = body.remindAt ? new Date(String(body.remindAt)) : null;
  if (!text || !remindAt || Number.isNaN(remindAt.getTime())) {
    return NextResponse.json({ error: "body ve remindAt zorunlu" }, { status: 400 });
  }
  const row = await prisma.reminder.create({
    data: {
      body: text,
      remindAt,
      color: String(body.color || "#3b82f6"),
      userId: body.userId ? String(body.userId) : null,
      workerId: admin.id,
      workerName: admin.name,
    },
  });
  return NextResponse.json({ ok: true, id: row.id });
}
