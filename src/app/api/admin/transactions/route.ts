import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { crmPageWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

/**
 * Global balance ledger (read). Filters: type, userId, q (trader name/email/login id/phone),
 * from / to (ISO date-time, inclusive), limit (≤ 1000 when skip/take are omitted).
 * `skip` or `take` pages the list (page size 50, cap 100) and returns hasMore.
 * Writes go through /api/admin/users/[id]/records (entity=ledger) — same API as the
 * trader-detail "Bakiye geçmişi" tab, so the 'Bakiyeye yansıt' rule is identical.
 */
export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const paged = searchParams.has("skip") || searchParams.has("take");
  const pageWindow = paged ? crmPageWindow(searchParams.get("take"), searchParams.get("skip")) : null;
  const limit = pageWindow ? pageWindow.take : Math.min(1000, Math.max(1, Number(searchParams.get("limit")) || 400));
  const skip = pageWindow ? pageWindow.skip : 0;
  const where = ledgerWhere(searchParams, true);
  const wantCounts = searchParams.get("counts") === "1";

  const [found, groups] = await Promise.all([
    prisma.balanceLedger.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, brokerName: true, accountLoginId: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageWindow ? limit + 1 : limit,
    }),
    wantCounts
      ? prisma.balanceLedger.groupBy({
          by: ["type"],
          where: ledgerWhere(searchParams, false),
          _count: true,
        })
      : Promise.resolve(null),
  ]);

  const hasMore = Boolean(pageWindow) && found.length > limit;
  const page = hasMore ? found.slice(0, limit) : found;
  return NextResponse.json({
    transactions: page.map((e) => ({
      id: e.id,
      amount: e.amount,
      type: e.type,
      currency: e.currency,
      trader: e.user.name,
      traderId: e.userId,
      traderEmail: e.user.email,
      accountLoginId: e.user.accountLoginId,
      broker: e.user.brokerName,
      tradingAccountId: e.tradingAccountId,
      balanceBefore: e.balanceBefore,
      balanceAfter: e.balanceAfter,
      comment: e.comment,
      createdById: e.createdById,
      createdByName: e.createdByName,
      refType: e.refType,
      refId: e.refId,
      createdAt: e.createdAt,
    })),
    limit,
    hasMore,
    nextSkip: skip + page.length,
    ...(groups
      ? {
          counts: groups.reduce(
            (acc, g) => {
              acc.byKey[g.type] = g._count;
              acc.total += g._count;
              return acc;
            },
            { total: 0, byKey: {} as Record<string, number> }
          ),
        }
      : {}),
  });
}

function ledgerWhere(searchParams: URLSearchParams, withType: boolean): Prisma.BalanceLedgerWhereInput {
  const where: Prisma.BalanceLedgerWhereInput = {};
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const q = (searchParams.get("q") || "").trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (withType && type) where.type = type.toUpperCase();
  if (userId) where.userId = userId;
  const createdAt: Prisma.DateTimeFilter = {};
  if (from && !Number.isNaN(new Date(from).getTime())) createdAt.gte = new Date(from);
  if (to && !Number.isNaN(new Date(to).getTime())) createdAt.lte = new Date(to);
  if (Object.keys(createdAt).length) where.createdAt = createdAt;
  if (q) {
    where.user = {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { accountLoginId: { contains: q } },
        { phone: { contains: q } },
      ],
    };
  }
  return where;
}
