import { NextResponse } from "next/server";
import { requireAdmin, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { refreshAccountMetrics } from "@/lib/trading";
import {
  calcExitPriceWithRates,
  calcOpenPriceWithRates,
  calcMarginWithRates,
  calcProfitWithRates,
  getEffectiveRates,
} from "@/lib/trading-settings";
import { normalizeSide } from "@/lib/pnl";
import { getSymbol } from "@/lib/symbols";

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
 * Body.recalcFrom = "profit" → solve open (OPEN) or close (CLOSED) from PnL;
 * "prices" (or price/volume/side edits) → recompute profit from engine formula.
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

  const entity = String(body.entity || body.kind || "position").toLowerCase();
  if (entity === "order") {
    return patchOrder(admin.id, body);
  }

  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.position.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Position not found" }, { status: 404 });

  const data: Record<string, unknown> = {};

  if (body.symbol != null && String(body.symbol).trim()) {
    data.symbol = String(body.symbol).trim().toUpperCase();
  }
  if (body.chartSymbol !== undefined) {
    const raw = body.chartSymbol;
    if (raw === null || raw === "") {
      data.chartSymbol = null;
    } else {
      const cs = String(raw).trim().toUpperCase();
      if (!getSymbol(cs)) {
        return NextResponse.json(
          { error: `Unknown chart symbol: ${cs}` },
          { status: 400 }
        );
      }
      data.chartSymbol = cs;
    }
  }
  if (body.side != null) {
    const side = String(body.side).toUpperCase();
    if (side !== "BUY" && side !== "SELL") {
      return NextResponse.json({ error: "side must be BUY or SELL" }, { status: 400 });
    }
    data.side = side;
  }
  if (body.openedAt != null && body.openedAt !== "") {
    const d = new Date(String(body.openedAt));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid openedAt" }, { status: 400 });
    }
    data.openedAt = d;
  }

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

  // Keep profit ↔ prices consistent with trade engine (volume×contractSize×delta).
  const recalcFrom = String(body.recalcFrom || "").toLowerCase();
  const mergedSymbol = String(data.symbol ?? existing.symbol);
  const mergedSide = normalizeSide(data.side ?? existing.side);
  const mergedVolume = Number(data.volume ?? existing.volume);
  const rates = await getEffectiveRates(mergedSymbol);
  if (rates && Number.isFinite(mergedVolume) && mergedVolume > 0) {
    if (recalcFrom === "profit") {
      const targetProfit =
        nextStatus === "CLOSED"
          ? Number(
              data.closeProfit ??
                data.profit ??
                existing.closeProfit ??
                existing.profit
            )
          : Number(data.profit ?? existing.profit);
      if (Number.isFinite(targetProfit)) {
        if (nextStatus === "CLOSED") {
          const open = Number(data.openPrice ?? existing.openPrice);
          const exit = calcExitPriceWithRates(
            rates,
            mergedSide,
            mergedVolume,
            open,
            targetProfit
          );
          if (exit != null && exit >= 0) {
            data.closePrice = exit;
            data.currentPrice = exit;
            data.profit = targetProfit;
            data.closeProfit = targetProfit;
          }
        } else {
          const exit = Number(data.currentPrice ?? existing.currentPrice);
          const open = calcOpenPriceWithRates(
            rates,
            mergedSide,
            mergedVolume,
            exit,
            targetProfit
          );
          if (open != null && open > 0) {
            data.openPrice = open;
            data.profit = targetProfit;
          }
        }
      }
    } else if (recalcFrom === "prices") {
      const open = Number(data.openPrice ?? existing.openPrice);
      const exit =
        nextStatus === "CLOSED"
          ? Number(
              data.closePrice ??
                data.currentPrice ??
                existing.closePrice ??
                existing.currentPrice
            )
          : Number(data.currentPrice ?? existing.currentPrice);
      if (Number.isFinite(open) && Number.isFinite(exit)) {
        const profit = calcProfitWithRates(
          rates,
          mergedSide,
          mergedVolume,
          open,
          exit
        );
        data.profit = profit;
        if (nextStatus === "CLOSED") {
          data.closeProfit = profit;
        }
      }
    }
  }

  // Opening notional/amount: lot × contract × openPrice — refresh margin when price/volume/symbol change
  // (unless admin sent an explicit margin). Margin = notional / leverage.
  const priceOrSizeChanged =
    data.openPrice != null || data.volume != null || data.symbol != null;
  if (priceOrSizeChanged && body.margin == null) {
    const mergedOpen = Number(data.openPrice ?? existing.openPrice);
    const mergedVol = Number(data.volume ?? existing.volume);
    const mergedSym = String(data.symbol ?? existing.symbol);
    const ratesForMargin = rates ?? (await getEffectiveRates(mergedSym));
    const account = await prisma.account.findUnique({
      where: { userId: existing.userId },
      select: { leverage: true },
    });
    const lev = Math.max(1, account?.leverage ?? 100);
    if (ratesForMargin && Number.isFinite(mergedOpen) && Number.isFinite(mergedVol) && mergedVol > 0) {
      data.margin = calcMarginWithRates(ratesForMargin, mergedVol, mergedOpen, lev);
    } else {
      const cs = getSymbol(mergedSym)?.contractSize ?? 1;
      const notional = mergedVol * cs * mergedOpen;
      if (Number.isFinite(notional) && notional >= 0) {
        data.margin = notional / lev;
      }
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


/** PATCH order row (admin): symbol, side, type, volume, price, status, createdAt */
async function patchOrder(adminId: string, body: Record<string, unknown>) {
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.symbol != null && String(body.symbol).trim()) {
    data.symbol = String(body.symbol).trim().toUpperCase();
  }
  if (body.side != null) {
    const side = String(body.side).toUpperCase();
    if (side !== "BUY" && side !== "SELL") {
      return NextResponse.json({ error: "side must be BUY or SELL" }, { status: 400 });
    }
    data.side = side;
  }
  if (body.type != null) {
    const typ = String(body.type).toUpperCase();
    if (!["MARKET", "LIMIT", "STOP"].includes(typ)) {
      return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
    }
    data.type = typ;
  }
  if (body.volume != null) {
    const v = Number(body.volume);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: "Invalid volume" }, { status: 400 });
    }
    data.volume = v;
  }
  if (body.price !== undefined) {
    if (body.price === null || body.price === "") data.price = null;
    else {
      const v = Number(body.price);
      if (!Number.isFinite(v)) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      data.price = v;
    }
  }
  if (body.openPrice !== undefined) {
    if (body.openPrice === null || body.openPrice === "") data.openPrice = null;
    else {
      const v = Number(body.openPrice);
      if (!Number.isFinite(v)) return NextResponse.json({ error: "Invalid openPrice" }, { status: 400 });
      data.openPrice = v;
    }
  }
  if (body.status != null) {
    const st = String(body.status).toUpperCase();
    if (!["PENDING", "FILLED", "CANCELLED", "REJECTED"].includes(st)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }
    data.status = st;
  }
  if (body.createdAt != null && body.createdAt !== "") {
    const d = new Date(String(body.createdAt));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid createdAt" }, { status: 400 });
    }
    data.createdAt = d;
  }
  if (body.filledAt !== undefined) {
    if (body.filledAt === null || body.filledAt === "") data.filledAt = null;
    else {
      const d = new Date(String(body.filledAt));
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid filledAt" }, { status: 400 });
      }
      data.filledAt = d;
    }
  }

  const updated = await prisma.order.update({ where: { id }, data });
  await writeAudit({
    adminId,
    action: "EDIT_ORDER",
    targetId: id,
    meta: { before: existing, after: updated },
  });
  return NextResponse.json({ ok: true, order: updated });
}
