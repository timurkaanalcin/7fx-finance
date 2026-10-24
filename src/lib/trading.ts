import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getSymbol } from "./symbols";
import { getPrice, ensureTicked } from "./price-engine";
import { DEFAULT_RESET_BALANCE, isMarginCall } from "./margin-call";
import {
  getEffectiveRates,
  calcProfitWithRates,
  calcMarginWithRates,
  calcCommission,
  getTradingSettings,
} from "./trading-settings";


/** Live price feed symbol: chartSymbol override if set, else trade symbol. */
function priceFeedSymbol(pos: { symbol: string; chartSymbol?: string | null }): string {
  const chart = pos.chartSymbol?.trim();
  return chart ? chart.toUpperCase() : pos.symbol;
}

/** Thrown when a close loses the race or the position is no longer OPEN. */
export const POSITION_NOT_FOUND = "Position not found";

export function isPositionNotFound(err: unknown): boolean {
  return err instanceof Error && err.message === POSITION_NOT_FOUND;
}

/**
 * Pending limit/stop fills require the full margin. Market fills keep the
 * looser check in placeOrder (`freeMargin < margin * 0.5`).
 * Equality is allowed: only a strict shortfall blocks.
 */
export function pendingFillBlockedByMargin(
  freeMargin: number,
  requiredMargin: number,
  orderType: string
): boolean {
  return orderType !== "MARKET" && freeMargin < requiredMargin;
}

/**
 * Same free-margin definition refreshAccountMetrics persists:
 * balance + open profit − open margin. Used under the account row lock so a
 * second fill sees the first fill's position and commission.
 */
export function bookedFreeMargin(
  balance: number,
  positions: ReadonlyArray<{ margin: number; profit: number }>
): number {
  let usedMargin = 0;
  let floatingPnL = 0;
  for (const pos of positions) {
    usedMargin += pos.margin;
    floatingPnL += pos.profit;
  }
  return balance + floatingPnL - usedMargin;
}

/** Latest account balance. Locking read, so it sees the other fill's commission. */
async function lockAccountForUpdate(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<{ balance: number; leverage: number } | null> {
  const rows = await tx.$queryRaw<Array<{ balance: unknown; leverage: unknown }>>`
    SELECT balance, leverage FROM \`Account\` WHERE userId = ${userId} FOR UPDATE
  `;
  const row = rows[0];
  if (!row) return null;
  const balance = typeof row.balance === "number" ? row.balance : Number(row.balance);
  const leverage = typeof row.leverage === "number" ? row.leverage : Number(row.leverage);
  if (!Number.isFinite(balance) || !Number.isFinite(leverage)) return null;
  return { balance, leverage };
}

/** Same comparisons checkSlTp uses to decide a full close. */
export function positionLevelHit(
  side: string,
  current: number,
  stopLoss: number | null,
  takeProfit: number | null
): boolean {
  if (side === "BUY") {
    if (stopLoss != null && current <= stopLoss) return true;
    if (takeProfit != null && current >= takeProfit) return true;
    return false;
  }
  if (stopLoss != null && current >= stopLoss) return true;
  if (takeProfit != null && current <= takeProfit) return true;
  return false;
}

export async function refreshAccountMetrics(userId: string) {
  await ensureTicked();
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) return null;

  const positions = await prisma.position.findMany({
    where: { userId, status: "OPEN" },
  });

  let floatingPnL = 0;
  let usedMargin = 0;

  for (const pos of positions) {
    const tick = await getPrice(priceFeedSymbol(pos));
    if (!tick) continue;
    const current = pos.side === "BUY" ? tick.bid : tick.ask;
    const rates = await getEffectiveRates(pos.symbol);
    if (!rates) continue;
    const profit = calcProfitWithRates(
      rates,
      pos.side as "BUY" | "SELL",
      pos.volume,
      pos.openPrice,
      current
    );
    floatingPnL += profit;
    usedMargin += pos.margin;
    await prisma.position.update({
      where: { id: pos.id },
      data: { currentPrice: current, profit },
    });
  }

  const equity = account.balance + floatingPnL;
  const freeMargin = equity - usedMargin;
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;
  const settings = await getTradingSettings();
  const marginCall = isMarginCall(
    {
      equity,
      freeMargin,
      margin: usedMargin,
      marginLevel,
    },
    settings.marginCallThresholdPct
  );

  return prisma.account
    .update({
      where: { userId },
      data: {
        equity,
        margin: usedMargin,
        freeMargin,
      },
    })
    .then(async (acc) => ({
      ...acc,
      profitLoss: floatingPnL,
      marginLevel,
      credit: acc.credit ?? 0,
      bonus: (acc as { bonus?: number }).bonus ?? 0,
      marginCall,
    }));
}

export async function processPendingOrders(userId: string) {
  await ensureTicked();
  const pending = await prisma.order.findMany({
    where: { userId, status: "PENDING" },
  });

  for (const order of pending) {
    const tick = await getPrice(order.symbol);
    if (!tick || order.price == null) continue;
    const bid = tick.bid;
    const ask = tick.ask;
    let trigger = false;
    if (order.type === "LIMIT") {
      if (order.side === "BUY" && ask <= order.price) trigger = true;
      if (order.side === "SELL" && bid >= order.price) trigger = true;
    } else if (order.type === "STOP") {
      if (order.side === "BUY" && ask >= order.price) trigger = true;
      if (order.side === "SELL" && bid <= order.price) trigger = true;
    }
    if (trigger) {
      await fillOrder(order.id, order.side === "BUY" ? ask : bid);
    }
  }
}

export async function fillOrder(orderId: string, fillPrice: number) {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing || existing.status !== "PENDING") return null;

  const rates = await getEffectiveRates(existing.symbol);
  if (!rates || !rates.enabled) return null;

  const position = await prisma.$transaction(async (tx) => {
    // Lock the account before any plain read so this transaction's snapshot
    // starts after the previous fill has committed.
    const account = await lockAccountForUpdate(tx, existing.userId);
    if (!account) return null;

    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "PENDING" || order.userId !== existing.userId) return null;

    const margin = calcMarginWithRates(rates, order.volume, fillPrice, account.leverage);
    const commission = calcCommission(rates, order.volume);
    const openBook = await tx.position.findMany({
      where: { userId: order.userId, status: "OPEN" },
      select: { margin: true, profit: true },
    });
    const freeMargin = bookedFreeMargin(account.balance, openBook);
    // Leave the working order PENDING. There is no reason column to explain a
    // REJECTED row, and CANCELLED is the user/reset cancel. The next open-position
    // tick or engine cron retries; the trader can still cancel while margin is short.
    if (pendingFillBlockedByMargin(freeMargin, margin, order.type)) {
      return null;
    }

    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: {
        status: "FILLED",
        openPrice: fillPrice,
        filledAt: new Date(),
      },
    });
    if (claimed.count !== 1) return null;

    const created = await tx.position.create({
      data: {
        userId: order.userId,
        symbol: order.symbol,
        side: order.side,
        volume: order.volume,
        openPrice: fillPrice,
        currentPrice: fillPrice,
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
        profit: 0,
        margin,
        status: "OPEN",
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { positionId: created.id },
    });

    if (commission > 0) {
      await tx.account.update({
        where: { userId: order.userId },
        data: { balance: account.balance - commission },
      });
    }

    return created;
  });

  if (!position) return null;
  await refreshAccountMetrics(existing.userId);
  return position;
}

export async function placeOrder(input: {
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | "STOP";
  volume: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
}) {
  await ensureTicked();
  // Load rates first: this also refreshes the live (admin-editable) symbol catalog.
  const rates = await getEffectiveRates(input.symbol);
  const def = getSymbol(input.symbol);
  if (!def || !rates) throw new Error("Invalid symbol");
  if (!(input.volume > 0)) throw new Error("Invalid volume");
  if (!rates.enabled) throw new Error("Symbol is closed for trading");
  if (input.volume < rates.minVolume || input.volume > rates.maxVolume) {
    throw new Error(`Volume must be between ${rates.minVolume}–${rates.maxVolume}`);
  }
  if (rates.volumeStep && rates.volumeStep > 0) {
    const base = rates.minVolume > 0 ? rates.minVolume : 0;
    const steps = (input.volume - base) / rates.volumeStep;
    if (Math.abs(steps - Math.round(steps)) > 1e-6) {
      throw new Error(`Volume step is ${rates.volumeStep}`);
    }
  }

  const tick = await getPrice(input.symbol);
  if (!tick) throw new Error("Price yok");

  const account = await prisma.account.findUnique({ where: { userId: input.userId } });
  if (!account) throw new Error("Account not found");

  if (input.type === "MARKET") {
    const fillPrice = input.side === "BUY" ? tick.ask : tick.bid;
    const margin = calcMarginWithRates(rates, input.volume, fillPrice, account.leverage);
    if (account.freeMargin < margin * 0.5) {
      throw new Error("Yetersiz serbest marj");
    }

    const order = await prisma.order.create({
      data: {
        userId: input.userId,
        symbol: input.symbol,
        side: input.side,
        type: "MARKET",
        volume: input.volume,
        price: fillPrice,
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,
        status: "PENDING",
      },
    });
    return fillOrder(order.id, fillPrice);
  }

  if (input.price == null || input.price <= 0) {
    throw new Error("Price required for Limit/Stop");
  }

  return prisma.order.create({
    data: {
      userId: input.userId,
      symbol: input.symbol,
      side: input.side,
      type: input.type,
      volume: input.volume,
      price: input.price,
      stopLoss: input.stopLoss,
      takeProfit: input.takeProfit,
      status: "PENDING",
    },
  });
}

function assertVolumeStep(volume: number, minVolume: number, volumeStep: number | null) {
  if (!(volume > 0)) throw new Error("Invalid volume");
  if (volume < minVolume) {
    throw new Error(`Volume must be at least ${minVolume}`);
  }
  if (volumeStep && volumeStep > 0) {
    const base = minVolume > 0 ? minVolume : 0;
    const steps = (volume - base) / volumeStep;
    if (Math.abs(steps - Math.round(steps)) > 1e-6) {
      throw new Error(`Volume step is ${volumeStep}`);
    }
  }
}

/**
 * Close an open position. Optional `volume` closes only that slice (partial close).
 * Omitting volume or passing >= position.volume performs a full close.
 */
export async function closePosition(
  userId: string,
  positionId: string,
  volume?: number
) {
  await ensureTicked();
  const pos = await prisma.position.findFirst({
    where: { id: positionId, userId, status: "OPEN" },
  });
  if (!pos) throw new Error(POSITION_NOT_FOUND);

  const tick = await getPrice(priceFeedSymbol(pos));
  if (!tick) throw new Error("Price yok");

  const closePrice = pos.side === "BUY" ? tick.bid : tick.ask;
  const rates = await getEffectiveRates(pos.symbol);
  if (!rates) throw new Error("No symbol settings");

  const wantPartial =
    volume != null && Number.isFinite(volume) && volume > 0 && volume < pos.volume;

  if (wantPartial) {
    const closedVol = volume as number;
    assertVolumeStep(closedVol, rates.minVolume, rates.volumeStep);
    const remaining = Math.round((pos.volume - closedVol) * 1e8) / 1e8;
    if (remaining > 0) {
      assertVolumeStep(remaining, rates.minVolume, rates.volumeStep);
    }

    const profit = calcProfitWithRates(
      rates,
      pos.side as "BUY" | "SELL",
      closedVol,
      pos.openPrice,
      closePrice
    );

    const account = await prisma.account.findUnique({ where: { userId } });
    if (!account) throw new Error("Account not found");

    const remainMargin = calcMarginWithRates(
      rates,
      remaining,
      pos.openPrice,
      account.leverage
    );
    const remainProfit = calcProfitWithRates(
      rates,
      pos.side as "BUY" | "SELL",
      remaining,
      pos.openPrice,
      closePrice
    );

    await prisma.$transaction(async (tx) => {
      // Claim the open size first. A lost race rolls back before any ledger row or balance credit.
      const claimed = await tx.position.updateMany({
        where: { id: pos.id, userId, status: "OPEN", volume: pos.volume },
        data: {
          volume: remaining,
          margin: remainMargin,
          currentPrice: closePrice,
          profit: remainProfit,
        },
      });
      if (claimed.count !== 1) throw new Error(POSITION_NOT_FOUND);

      await tx.position.create({
        data: {
          userId,
          symbol: pos.symbol,
          chartSymbol: pos.chartSymbol,
          side: pos.side,
          volume: closedVol,
          openPrice: pos.openPrice,
          currentPrice: closePrice,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit,
          profit,
          margin: 0,
          status: "CLOSED",
          openedAt: pos.openedAt,
          closedAt: new Date(),
          closePrice,
          closeProfit: profit,
        },
      });

      const latest = await lockAccountForUpdate(tx, userId);
      if (!latest) throw new Error("Account not found");
      await tx.account.update({
        where: { userId },
        data: { balance: latest.balance + profit },
      });
    });

    return refreshAccountMetrics(userId);
  }

  // Full close (volume omitted, invalid, or >= position.volume)
  if (volume != null && Number.isFinite(volume) && volume > 0 && volume > pos.volume) {
    throw new Error("Volume exceeds position size");
  }

  const profit = calcProfitWithRates(
    rates,
    pos.side as "BUY" | "SELL",
    pos.volume,
    pos.openPrice,
    closePrice
  );

  await prisma.$transaction(async (tx) => {
    // status OPEN plus the volume we priced. A partial that already reduced size wins;
    // this full close must not credit profit computed on the old volume.
    const claimed = await tx.position.updateMany({
      where: { id: pos.id, userId, status: "OPEN", volume: pos.volume },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closePrice,
        closeProfit: profit,
        currentPrice: closePrice,
        profit,
      },
    });
    if (claimed.count !== 1) throw new Error(POSITION_NOT_FOUND);

    const account = await lockAccountForUpdate(tx, userId);
    if (account) {
      await tx.account.update({
        where: { userId },
        data: { balance: account.balance + profit },
      });
    }
  });

  return refreshAccountMetrics(userId);
}

/**
 * Update stop loss / take profit on an open position without closing it.
 * Pass null to clear a level; omit a field to leave it unchanged.
 */
export async function modifyPositionSlTp(
  userId: string,
  positionId: string,
  levels: { stopLoss?: number | null; takeProfit?: number | null }
) {
  await ensureTicked();
  const pos = await prisma.position.findFirst({
    where: { id: positionId, userId, status: "OPEN" },
  });
  if (!pos) throw new Error(POSITION_NOT_FOUND);

  const tick = await getPrice(priceFeedSymbol(pos));
  const current =
    tick != null
      ? pos.side === "BUY"
        ? tick.bid
        : tick.ask
      : pos.currentPrice || pos.openPrice;
  const ref = Number.isFinite(current) && current > 0 ? current : pos.openPrice;
  const side = pos.side as "BUY" | "SELL";

  const data: { stopLoss?: number | null; takeProfit?: number | null } = {};

  if ("stopLoss" in levels) {
    const sl = levels.stopLoss;
    if (sl == null) {
      data.stopLoss = null;
    } else if (!Number.isFinite(sl) || sl <= 0) {
      throw new Error("Invalid stop loss");
    } else {
      if (side === "BUY" && sl >= ref) {
        throw new Error("Stop loss must be below current price for BUY");
      }
      if (side === "SELL" && sl <= ref) {
        throw new Error("Stop loss must be above current price for SELL");
      }
      data.stopLoss = sl;
    }
  }

  if ("takeProfit" in levels) {
    const tp = levels.takeProfit;
    if (tp == null) {
      data.takeProfit = null;
    } else if (!Number.isFinite(tp) || tp <= 0) {
      throw new Error("Invalid take profit");
    } else {
      if (side === "BUY" && tp <= ref) {
        throw new Error("Take profit must be above current price for BUY");
      }
      if (side === "SELL" && tp >= ref) {
        throw new Error("Take profit must be below current price for SELL");
      }
      data.takeProfit = tp;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error("Nothing to update");
  }

  await prisma.position.update({
    where: { id: pos.id },
    data,
  });

  return prisma.position.findUnique({ where: { id: pos.id } });
}

export async function checkSlTp(userId: string) {
  await ensureTicked();
  const positions = await prisma.position.findMany({
    where: { userId, status: "OPEN" },
  });
  for (const pos of positions) {
    const tick = await getPrice(priceFeedSymbol(pos));
    if (!tick) continue;
    const current = pos.side === "BUY" ? tick.bid : tick.ask;
    if (positionLevelHit(pos.side, current, pos.stopLoss, pos.takeProfit)) {
      try {
        await closePosition(userId, pos.id);
      } catch (err) {
        // A parallel open tick already closed it. Keep checking the rest of the book.
        if (isPositionNotFound(err)) continue;
        throw err;
      }
    }
  }
}

/**
 * Force-close all open positions without applying PnL to balance,
 * cancel pending orders, then set balance to DEFAULT_RESET_BALANCE.
 */
export async function applyBalanceReset(userId: string) {
  await ensureTicked();
  const open = await prisma.position.findMany({
    where: { userId, status: "OPEN" },
  });

  for (const pos of open) {
    const tick = await getPrice(priceFeedSymbol(pos));
    const closePrice = tick
      ? pos.side === "BUY"
        ? tick.bid
        : tick.ask
      : pos.currentPrice;
    const r = await getEffectiveRates(pos.symbol);
    const profit = r
      ? calcProfitWithRates(r, pos.side as "BUY" | "SELL", pos.volume, pos.openPrice, closePrice)
      : 0;
    await prisma.position.update({
      where: { id: pos.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closePrice,
        closeProfit: profit,
        currentPrice: closePrice,
        profit,
      },
    });
  }

  await prisma.order.updateMany({
    where: { userId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  await prisma.account.update({
    where: { userId },
    data: {
      balance: DEFAULT_RESET_BALANCE,
      equity: DEFAULT_RESET_BALANCE,
      margin: 0,
      freeMargin: DEFAULT_RESET_BALANCE,
    },
  });

  return refreshAccountMetrics(userId);
}

export async function applyBalanceAdd(userId: string, amount: number) {
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) throw new Error("Account not found");
  await prisma.account.update({
    where: { userId },
    data: { balance: account.balance + amount },
  });
  return refreshAccountMetrics(userId);
}
