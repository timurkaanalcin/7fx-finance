import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { crmPageWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

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
        })
      : Promise.resolve(undefined),
    includeLookups
      ? prisma.user.findMany({
          where: { role: "TRADER" },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
          take: 201,
        })
      : Promise.resolve(undefined),
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
    ...(workers ? { workers } : {}),
    ...(traders
      ? { traders: traders.length > 200 ? traders.slice(0, 200) : traders, tradersPartial: traders.length > 200 }
      : {}),
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
