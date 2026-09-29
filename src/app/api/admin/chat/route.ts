import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = (searchParams.get("userId") || "").trim();

  const where = userId ? { type: "CHAT", userId } : { type: "CHAT" };
  const rows = await prisma.communication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 400,
    include: { user: { select: { id: true, name: true, email: true, desk: true, active: true } } },
  });

  // Group into threads by trader
  const threadsMap = new Map<
    string,
    {
      traderId: string;
      trader: string;
      traderEmail: string;
      desk: string | null;
      active: boolean;
      lastAt: string;
      messages: {
        id: string;
        title: string | null;
        body: string;
        workerName: string | null;
        createdAt: string;
      }[];
    }
  >();

  for (const c of rows) {
    let t = threadsMap.get(c.userId);
    if (!t) {
      t = {
        traderId: c.userId,
        trader: c.user.name,
        traderEmail: c.user.email,
        desk: c.user.desk,
        active: c.user.active,
        lastAt: c.createdAt.toISOString(),
        messages: [],
      };
      threadsMap.set(c.userId, t);
    }
    t.messages.push({
      id: c.id,
      title: c.title,
      body: c.description,
      workerName: c.workerName,
      createdAt: c.createdAt.toISOString(),
    });
  }

  const threads = Array.from(threadsMap.values()).map((t) => ({
    ...t,
    messages: t.messages.reverse(),
  }));

  const traders = await prisma.user.findMany({
    where: { role: "TRADER" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  return NextResponse.json({ threads, traders });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "").trim();
  const message = String(body.message || body.description || "").trim();
  const title = body.title != null ? String(body.title).trim() : "Sohbet";
  if (!userId || !message) {
    return NextResponse.json({ error: "userId ve message zorunlu" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Trader bulunamadı" }, { status: 404 });

  const row = await prisma.communication.create({
    data: {
      userId,
      type: "CHAT",
      title,
      description: message,
      workerName: admin.name,
      workerId: admin.id,
    },
  });
  return NextResponse.json({ ok: true, id: row.id });
}
