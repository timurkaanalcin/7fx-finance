import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdmin, requireAdminWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { crmListWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

const PENDING_CAP = 100;

async function pendingTraders(q: string) {
  const found = await prisma.user.findMany({
    where: {
      role: "TRADER",
      documentsStatus: { in: ["PENDING", "REJECTED"] },
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
    select: { id: true, name: true, email: true, documentsStatus: true, desk: true },
    orderBy: { name: "asc" },
    take: PENDING_CAP + 1,
  });
  return {
    pendingUsers: found.length > PENDING_CAP ? found.slice(0, PENDING_CAP) : found,
    pendingUsersPartial: found.length > PENDING_CAP,
  };
}

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "").trim();
  const q = (searchParams.get("q") || "").trim();
  const { take, skip, legacy } = crmListWindow(searchParams.get("take"), searchParams.get("skip"));
  const where = docWhere(status, q, true);
  const wantCounts = searchParams.get("counts") === "1";
  const pendingQ = (searchParams.get("pendingQ") || "").trim().slice(0, 80);
  if (searchParams.get("lookup") === "pending") {
    return NextResponse.json(await pendingTraders(pendingQ));
  }

  const [found, groups, pending] = await Promise.all([
    prisma.documentRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: legacy ? take : take + 1,
      include: { user: { select: { id: true, name: true, email: true, documentsStatus: true, desk: true } } },
    }),
    wantCounts
      ? prisma.documentRecord.groupBy({
          by: ["status"],
          where: docWhere(status, q, false),
          _count: true,
        })
      : Promise.resolve(null),
    skip === 0 ? pendingTraders(pendingQ) : Promise.resolve(null),
  ]);

  const hasMore = !legacy && found.length > take;
  const page = hasMore ? found.slice(0, take) : found;
  return NextResponse.json({
    documents: page.map((d) => ({
      id: d.id,
      name: d.name,
      docType: d.docType,
      status: d.status,
      note: d.note,
      traderId: d.userId,
      trader: d.user.name,
      traderEmail: d.user.email,
      desk: d.user.desk,
      userDocumentsStatus: d.user.documentsStatus,
      createdAt: d.createdAt,
      reviewedAt: d.reviewedAt,
    })),
    ...(pending
      ? { pendingUsers: pending.pendingUsers, pendingUsersPartial: pending.pendingUsersPartial }
      : {}),
    hasMore,
    nextSkip: skip + page.length,
    ...(groups
      ? {
          counts: groups.reduce(
            (acc, g) => {
              acc.byKey[g.status] = g._count;
              acc.total += g._count;
              return acc;
            },
            { total: 0, byKey: {} as Record<string, number> }
          ),
        }
      : {}),
  });
}

function docWhere(status: string, q: string, withStatus: boolean): Prisma.DocumentRecordWhereInput {
  const where: Prisma.DocumentRecordWhereInput = {};
  if (withStatus && status) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { note: { contains: q } },
      { docType: { contains: q } },
      { user: { name: { contains: q } } },
      { user: { email: { contains: q } } },
      { user: { desk: { contains: q } } },
    ];
  }
  return where;
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "create");

  if (action === "create") {
    const userId = String(body.userId || "").trim();
    const name = String(body.name || "").trim();
    const docType = String(body.docType || "OTHER").toUpperCase();
    if (!userId || !name) {
      return NextResponse.json({ error: "userId ve name zorunlu" }, { status: 400 });
    }
    const row = await prisma.documentRecord.create({
      data: { userId, name, docType, status: "PENDING", note: body.note ? String(body.note) : null },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { documentsStatus: "PENDING" },
    }).catch(() => null);
    return NextResponse.json({ ok: true, id: row.id });
  }

  if (action === "review") {
    const id = String(body.id || "").trim();
    const status = String(body.status || "").toUpperCase();
    if (!id || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "id ve status gerekli" }, { status: 400 });
    }
    const row = await prisma.documentRecord.update({
      where: { id },
      data: {
        status,
        note: body.note != null ? String(body.note) : undefined,
        reviewedAt: status === "PENDING" ? null : new Date(),
      },
    });
    // Sync user.documentsStatus from latest docs
    const docs = await prisma.documentRecord.findMany({ where: { userId: row.userId } });
    let userStatus = "NONE";
    if (docs.some((d) => d.status === "PENDING")) userStatus = "PENDING";
    else if (docs.some((d) => d.status === "REJECTED")) userStatus = "REJECTED";
    else if (docs.length && docs.every((d) => d.status === "APPROVED")) userStatus = "APPROVED";
    await prisma.user.update({ where: { id: row.userId }, data: { documentsStatus: userStatus } });
    return NextResponse.json({ ok: true, userStatus });
  }

  return NextResponse.json({ error: "Bilinmeyen action" }, { status: 400 });
}
