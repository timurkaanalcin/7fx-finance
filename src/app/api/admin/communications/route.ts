import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdmin, requireAdminWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { touchLastContact } from "@/lib/last-contact";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { crmListWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "").trim();
  const q = (searchParams.get("q") || "").trim();
  const { take, skip, legacy } = crmListWindow(searchParams.get("take"), searchParams.get("skip"));
  const where = commWhere(type, q, true);
  const wantCounts = searchParams.get("counts") === "1";

  const [found, groups] = await Promise.all([
    prisma.communication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: legacy ? take : take + 1,
      include: { user: { select: { id: true, name: true, email: true, desk: true } } },
    }),
    wantCounts
      ? prisma.communication.groupBy({
          by: ["type"],
          where: commWhere(type, q, false),
          _count: true,
        })
      : Promise.resolve(null),
  ]);

  const hasMore = !legacy && found.length > take;
  const page = hasMore ? found.slice(0, take) : found;
  return NextResponse.json({
    communications: page.map(mapComm),
    hasMore,
    nextSkip: skip + page.length,
    ...(groups ? { counts: countMap(groups) } : {}),
  });
}

function commWhere(type: string, q: string, withType: boolean): Prisma.CommunicationWhereInput {
  const where: Prisma.CommunicationWhereInput = {};
  if (withType && type) where.type = type;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { workerName: { contains: q } },
      { user: { name: { contains: q } } },
      { user: { email: { contains: q } } },
      { user: { desk: { contains: q } } },
    ];
  }
  return where;
}

function mapComm(c: {
  id: string;
  type: string;
  title: string | null;
  description: string;
  workerName: string | null;
  workerId: string | null;
  userId: string;
  createdAt: Date;
  user: { name: string; email: string; desk: string | null };
}) {
  return {
    id: c.id,
    type: c.type,
    title: c.title,
    description: c.description,
    workerName: c.workerName,
    workerId: c.workerId,
    traderId: c.userId,
    trader: c.user.name,
    traderEmail: c.user.email,
    desk: c.user.desk,
    createdAt: c.createdAt,
  };
}

function countMap(groups: { type: string; _count: number }[]) {
  const byKey: Record<string, number> = {};
  let total = 0;
  for (const g of groups) {
    byKey[g.type] = g._count;
    total += g._count;
  }
  return { total, byKey };
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "").trim();
  const type = String(body.type || "NOTE").toUpperCase();
  const title = body.title != null ? String(body.title).trim() : null;
  const description = String(body.description || "").trim();
  if (!userId || !description) {
    return NextResponse.json({ error: "userId ve description zorunlu" }, { status: 400 });
  }
  if (!["CHAT", "CALL", "NOTE"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Trader not found" }, { status: 404 });

  const row = await prisma.communication.create({
    data: {
      userId,
      type,
      title,
      description,
      workerName: admin.name,
      workerId: admin.id,
    },
  });
  await touchLastContact(userId, row.createdAt);
  return NextResponse.json({ ok: true, id: row.id });
}
