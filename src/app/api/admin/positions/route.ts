import { NextResponse } from "next/server";
import { requireAdmin, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { refreshAccountMetrics } from "@/lib/trading";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "OPEN").toUpperCase();
  const tab = (searchParams.get("tab") || "positions").toLowerCase();
  const userId = searchParams.get("userId");

  if (tab === "orders") {
    const orderStatus = searchParams.get("orderStatus");
    const where: Record<string, unknown> = {};
    if (orderStatus) where.status = orderStatus.toUpperCase();
    if (userId) where.userId = userId;
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, brokerName: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return NextResponse.json({
      orders,
      generatedAt: new Date().toISOString(),
    });
  }

  // Live mark-to-market for open positions so CRM reflects terminal activity.
  if (status === "OPEN" || status === "ALL") {
    const openOwners = await prisma.position.findMany({
      where: {
        status: "OPEN",
        ...(userId ? { userId } : {}),
      },
      select: { userId: true },
      distinct: ["userId"],
      take: 100,
    });
    await Promise.all(
      openOwners.map((o) => refreshAccountMetrics(o.userId).catch(() => null))
    );
  }

  const where: Record<string, unknown> = status === "ALL" ? {} : { status };
  if (userId) where.userId = userId;
  const positions = await prisma.position.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, brokerName: true, desk: true, account: true },
      },
    },
    orderBy: { openedAt: "desc" },
    take: 300,
  });

  return NextResponse.json({
    positions: positions.map((p) => ({
      ...p,
      tradingAccountId: p.user.account?.id ?? null,
      traderName: p.user.name,
      traderEmail: p.user.email,
      broker: p.user.brokerName,
      desk: p.user.desk,
    })),
    generatedAt: new Date().toISOString(),
  });
}

/**
 * Admin edit of a position row: volume, prices, PnL, status (OPEN/CLOSED).
 * Closing with custom PnL sets closeProfit/profit and closedAt.
 */
export async function PATCH(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.position.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Position not found" }, { status: 404 });

  const data: Record<string, unknown> = {};

  if (body.volume != null) {
    const v = Number(body.volume);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: "Invalid volume" }, { status: 400 });
    }
    data.volume = v;
  }
  if (body.openPrice != null) {
    const v = Number(body.openPrice);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: "Invalid open price" }, { status: 400 });
    }
    data.openPrice = v;
  }
  if (body.currentPrice != null) {
    const v = Number(body.currentPrice);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "Invalid current price" }, { status: 400 });
    }
    data.currentPrice = v;
  }
  if (body.closePrice != null && body.closePrice !== "") {
    const v = Number(body.closePrice);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "Invalid close price" }, { status: 400 });
    }
    data.closePrice = v;
  }
  if (body.profit != null) {
    const v = Number(body.profit);
    if (!Number.isFinite(v)) {
      return NextResponse.json({ error: "Invalid profit" }, { status: 400 });
    }
    data.profit = v;
  }
  if (body.closeProfit != null && body.closeProfit !== "") {
    const v = Number(body.closeProfit);
    if (!Number.isFinite(v)) {
      return NextResponse.json({ error: "Invalid close profit" }, { status: 400 });
    }
    data.closeProfit = v;
  }
  if (body.margin != null) {
    const v = Number(body.margin);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "Invalid margin" }, { status: 400 });
    }
    data.margin = v;
  }
  if (body.stopLoss !== undefined) {
    if (body.stopLoss === null || body.stopLoss === "") data.stopLoss = null;
    else {
      const v = Number(body.stopLoss);
      if (!Number.isFinite(v)) return NextResponse.json({ error: "Invalid stop loss" }, { status: 400 });
      data.stopLoss = v;
    }
  }
  if (body.takeProfit !== undefined) {
    if (body.takeProfit === null || body.takeProfit === "") data.takeProfit = null;
    else {
      const v = Number(body.takeProfit);
      if (!Number.isFinite(v)) return NextResponse.json({ error: "Invalid take profit" }, { status: 400 });
      data.takeProfit = v;
    }
  }

  const nextStatus =
    body.status != null ? String(body.status).toUpperCase() : existing.status;
  if (nextStatus !== "OPEN" && nextStatus !== "CLOSED") {
    return NextResponse.json({ error: "status must be OPEN or CLOSED" }, { status: 400 });
  }
  data.status = nextStatus;

  if (nextStatus === "CLOSED") {
    // Custom realized PnL: prefer closeProfit, else profit
    const realized =
      body.closeProfit != null && body.closeProfit !== ""
        ? Number(body.closeProfit)
        : body.profit != null
          ? Number(body.profit)
          : existing.closeProfit ?? existing.profit;
    if (!Number.isFinite(realized)) {
      return NextResponse.json({ error: "Invalid realized PnL" }, { status: 400 });
    }
    data.profit = realized;
    data.closeProfit = realized;
    if (body.closePrice != null && body.closePrice !== "") {
      data.closePrice = Number(body.closePrice);
    } else if (existing.closePrice == null) {
      data.closePrice =
        body.currentPrice != null
          ? Number(body.currentPrice)
          : existing.currentPrice;
    }
    if (body.currentPrice != null) {
      data.currentPrice = Number(body.currentPrice);
    } else if (data.closePrice != null) {
      data.currentPrice = data.closePrice;
    }
    data.closedAt = existing.closedAt ?? new Date();
    if (body.closedAt) {
      const d = new Date(String(body.closedAt));
      if (!Number.isNaN(d.getTime())) data.closedAt = d;
    }
  } else {
    // Re-open
    data.closedAt = null;
    if (body.clearCloseFields) {
      data.closePrice = null;
      data.closeProfit = null;
    }
  }

  if (Object.keys(data).length <= 1 && data.status === existing.status) {
    // only status same and nothing else — still allow explicit no-op save
  }

  const updated = await prisma.position.update({
    where: { id },
    data,
  });

  await refreshAccountMetrics(existing.userId).catch(() => null);

  await writeAudit({
    adminId: admin.id,
    action: "EDIT_POSITION",
    targetId: id,
    meta: {
      userId: existing.userId,
      before: {
        volume: existing.volume,
        openPrice: existing.openPrice,
        currentPrice: existing.currentPrice,
        profit: existing.profit,
        closeProfit: existing.closeProfit,
        status: existing.status,
      },
      after: {
        volume: updated.volume,
        openPrice: updated.openPrice,
        currentPrice: updated.currentPrice,
        profit: updated.profit,
        closeProfit: updated.closeProfit,
        status: updated.status,
      },
    },
  });

  return NextResponse.json({ ok: true, position: updated });
}
