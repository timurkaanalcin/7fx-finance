import { NextResponse } from "next/server";
import { requireAdmin, requireAdminPerm, writeAudit } from "@/lib/auth";
import { applyBalanceDelta, positionEffect } from "@/lib/crm-balance";
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

  // "Bakiyeye yansıt": only when explicitly requested, move balance by realized-P/L delta.
  const applyToBalance = body.applyToBalance === true;
  if (applyToBalance && !(await requireAdminPerm("canAdjustBalance"))) {
    return NextResponse.json({ error: "No permission to adjust balance" }, { status: 403 });
  }

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

  let balance: unknown = null;
  if (applyToBalance) {
    balance = await applyBalanceDelta({
      userId: existing.userId,
      delta: positionEffect(updated) - positionEffect(existing),
      type: "TRADE_PNL",
      comment: `CRM edit: Position ${id} ${updated.symbol}`,
      admin: { id: admin.id, name: admin.name },
      refType: "Position",
      refId: id,
    });
  }

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
      applyToBalance,
      balance,
    },
  });

  return NextResponse.json({ ok: true, position: updated, balance });
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
  for (const k of ["stopLoss", "takeProfit"] as const) {
    if (body[k] !== undefined) {
      if (body[k] === null || body[k] === "") data[k] = null;
      else {
        const v = Number(body[k]);
        if (!Number.isFinite(v)) return NextResponse.json({ error: `Invalid ${k}` }, { status: 400 });
        data[k] = v;
      }
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


function optNum(v: unknown, label: string, opts?: { positive?: boolean; min?: number }): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${label}`);
  if (opts?.positive && n <= 0) throw new Error(`${label} must be > 0`);
  if (opts?.min != null && n < opts.min) throw new Error(`Invalid ${label}`);
  return n;
}

function optDate(v: unknown, label: string): Date | null {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid ${label}`);
  return d;
}

/**
 * Admin: manually add a position (OPEN or CLOSED) or an order for a trader.
 * Body: { entity: "position"|"order", userId, symbol, side, volume, openPrice, ... , applyToBalance? }
 * A CLOSED position with applyToBalance=true credits its realized P/L (TRADE_PNL ledger row).
 */
export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const entity = String(body.entity || "position").toLowerCase();
  const userId = String(body.userId || "").trim();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { account: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const applyToBalance = body.applyToBalance === true;
  if (applyToBalance && !(await requireAdminPerm("canAdjustBalance"))) {
    return NextResponse.json({ error: "No permission to adjust balance" }, { status: 403 });
  }

  try {
    const symbol = String(body.symbol || "").trim().toUpperCase();
    if (!symbol) throw new Error("symbol required");
    const side = String(body.side || "BUY").toUpperCase();
    if (side !== "BUY" && side !== "SELL") throw new Error("side must be BUY or SELL");
    const volume = optNum(body.volume, "volume", { positive: true });
    if (volume == null) throw new Error("volume required");

    if (entity === "order") {
      const type = String(body.type || "MARKET").toUpperCase();
      if (!["MARKET", "LIMIT", "STOP"].includes(type)) throw new Error("Invalid order type");
      const status = String(body.status || "PENDING").toUpperCase();
      if (!["PENDING", "FILLED", "CANCELLED", "REJECTED"].includes(status)) throw new Error("Invalid order status");
      const order = await prisma.order.create({
        data: {
          userId,
          symbol,
          side,
          type,
          volume,
          price: optNum(body.price, "price"),
          openPrice: optNum(body.openPrice, "openPrice"),
          stopLoss: optNum(body.stopLoss, "stopLoss"),
          takeProfit: optNum(body.takeProfit, "takeProfit"),
          status,
          createdAt: optDate(body.createdAt, "createdAt") ?? new Date(),
          filledAt: optDate(body.filledAt, "filledAt"),
        },
      });
      await writeAudit({ adminId: admin.id, action: "CREATE_ORDER", targetId: order.id, meta: { userId, order } });
      return NextResponse.json({ ok: true, order });
    }

    const openPrice = optNum(body.openPrice, "openPrice", { positive: true });
    if (openPrice == null) throw new Error("openPrice required");
    const status = String(body.status || "OPEN").toUpperCase();
    if (status !== "OPEN" && status !== "CLOSED") throw new Error("status must be OPEN or CLOSED");
    let chartSymbol: string | null = null;
    if (body.chartSymbol) {
      chartSymbol = String(body.chartSymbol).trim().toUpperCase();
      if (!getSymbol(chartSymbol)) throw new Error(`Unknown chart symbol: ${chartSymbol}`);
    }
    const closePrice = optNum(body.closePrice, "closePrice", { min: 0 });
    const currentPrice = optNum(body.currentPrice, "currentPrice", { min: 0 }) ?? closePrice ?? openPrice;
    const rates = await getEffectiveRates(symbol);
    const exit = status === "CLOSED" ? closePrice ?? currentPrice : currentPrice;
    let profit = optNum(status === "CLOSED" ? body.closeProfit ?? body.profit : body.profit, "profit");
    if (profit == null) {
      profit = rates ? calcProfitWithRates(rates, normalizeSide(side), volume, openPrice, exit) : 0;
    }
    const lev = Math.max(1, user.account?.leverage ?? 100);
    let margin = optNum(body.margin, "margin", { min: 0 });
    if (margin == null) {
      margin = rates
        ? calcMarginWithRates(rates, volume, openPrice, lev)
        : (volume * (getSymbol(symbol)?.contractSize ?? 1) * openPrice) / lev;
    }
    const openedAt = optDate(body.openedAt, "openedAt") ?? new Date();
    const position = await prisma.position.create({
      data: {
        userId,
        symbol,
        chartSymbol,
        side,
        volume,
        openPrice,
        currentPrice: exit,
        stopLoss: optNum(body.stopLoss, "stopLoss"),
        takeProfit: optNum(body.takeProfit, "takeProfit"),
        profit,
        margin,
        status,
        openedAt,
        closedAt: status === "CLOSED" ? optDate(body.closedAt, "closedAt") ?? new Date() : null,
        closePrice: status === "CLOSED" ? exit : null,
        closeProfit: status === "CLOSED" ? profit : null,
      },
    });
    let balance: unknown = null;
    if (applyToBalance) {
      balance = await applyBalanceDelta({
        userId,
        delta: positionEffect(position),
        type: "TRADE_PNL",
        comment: `CRM add: Position ${position.id} ${symbol}`,
        admin: { id: admin.id, name: admin.name },
        refType: "Position",
        refId: position.id,
      });
    }
    await refreshAccountMetrics(userId).catch(() => null);
    await writeAudit({
      adminId: admin.id,
      action: "CREATE_POSITION",
      targetId: position.id,
      meta: { userId, position, applyToBalance, balance },
    });
    return NextResponse.json({ ok: true, position, balance });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid input" }, { status: 400 });
  }
}

/**
 * Admin: delete a position or order. Deleting a CLOSED position with
 * applyToBalance=true reverses its realized P/L on the balance.
 */
export async function DELETE(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const entity = String(body.entity || url.searchParams.get("entity") || "position").toLowerCase();
  const id = String(body.id || url.searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const applyToBalance = body.applyToBalance === true || url.searchParams.get("applyToBalance") === "true";
  if (applyToBalance && !(await requireAdminPerm("canAdjustBalance"))) {
    return NextResponse.json({ error: "No permission to adjust balance" }, { status: 403 });
  }

  if (entity === "order") {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    await prisma.order.delete({ where: { id } });
    await writeAudit({ adminId: admin.id, action: "DELETE_ORDER", targetId: id, meta: { before: existing } });
    return NextResponse.json({ ok: true });
  }

  const existing = await prisma.position.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Position not found" }, { status: 404 });
  await prisma.position.delete({ where: { id } });
  let balance: unknown = null;
  if (applyToBalance) {
    balance = await applyBalanceDelta({
      userId: existing.userId,
      delta: -positionEffect(existing),
      type: "TRADE_PNL",
      comment: `CRM delete: Position ${id} ${existing.symbol}`,
      admin: { id: admin.id, name: admin.name },
      refType: "Position",
      refId: id,
    });
  }
  await refreshAccountMetrics(existing.userId).catch(() => null);
  await writeAudit({
    adminId: admin.id,
    action: "DELETE_POSITION",
    targetId: id,
    meta: { before: existing, applyToBalance, balance },
  });
  return NextResponse.json({ ok: true, balance });
}
