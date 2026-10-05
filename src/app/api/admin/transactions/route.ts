import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

/**
 * Global balance ledger (read). Filters: type, userId, q (trader name/email/login id/phone),
 * from / to (ISO date-time, inclusive), limit (≤ 1000).
 * Writes go through /api/admin/users/[id]/records (entity=ledger) — same API as the
 * trader-detail "Bakiye geçmişi" tab, so the 'Bakiyeye yansıt' rule is identical.
 */
export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const q = (searchParams.get("q") || "").trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(1000, Math.max(1, Number(searchParams.get("limit")) || 400));

  const where: Record<string, unknown> = {};
  if (type) where.type = type.toUpperCase();
  if (userId) where.userId = userId;
  const createdAt: Record<string, Date> = {};
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

  const entries = await prisma.balanceLedger.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, brokerName: true, accountLoginId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    transactions: entries.map((e) => ({
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
  });
}
