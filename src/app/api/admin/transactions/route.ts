import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const where: Record<string, unknown> = {};
  if (type) where.type = type.toUpperCase();
  if (userId) where.userId = userId;

  const entries = await prisma.balanceLedger.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, brokerName: true } } },
    orderBy: { createdAt: "desc" },
    take: 400,
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
      broker: e.user.brokerName,
      tradingAccountId: e.tradingAccountId,
      balanceBefore: e.balanceBefore,
      balanceAfter: e.balanceAfter,
      comment: e.comment,
      createdByName: e.createdByName,
      createdAt: e.createdAt,
    })),
  });
}
