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
    const tick = await getPrice(pos.symbol);
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
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING") return null;

  const account = await prisma.account.findUnique({ where: { userId: order.userId } });
  if (!account) return null;

  const rates = await getEffectiveRates(order.symbol);
  if (!rates || !rates.enabled) return null;
  const margin = calcMarginWithRates(rates, order.volume, fillPrice, account.leverage);
  const commission = calcCommission(rates, order.volume);
  if (account.freeMargin < margin && order.type !== "MARKET") {
    // still allow if close enough for demo
  }

  const position = await prisma.position.create({
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

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "FILLED",
      openPrice: fillPrice,
      filledAt: new Date(),
      positionId: position.id,
    },
  });

  if (commission > 0) {
    await prisma.account.update({
      where: { userId: order.userId },
      data: { balance: account.balance - commission },
    });
  }

  await refreshAccountMetrics(order.userId);
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
  const def = getSymbol(input.symbol);
  if (!def) throw new Error("Geçersiz sembol");
  if (input.volume <= 0) throw new Error("Hacim geçersiz");

  const rates = await getEffectiveRates(input.symbol);
  if (!rates || !rates.enabled) throw new Error("Sembol işlemeye kapalı");
  if (input.volume < rates.minVolume || input.volume > rates.maxVolume) {
    throw new Error(`Hacim ${rates.minVolume}–${rates.maxVolume} arasında olmalı`);
  }

  const tick = await getPrice(input.symbol);
  if (!tick) throw new Error("Fiyat yok");

  const account = await prisma.account.findUnique({ where: { userId: input.userId } });
  if (!account) throw new Error("Hesap bulunamadı");

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
    throw new Error("Limit/Stop için fiyat gerekli");
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

export async function closePosition(userId: string, positionId: string) {
  await ensureTicked();
  const pos = await prisma.position.findFirst({
    where: { id: positionId, userId, status: "OPEN" },
  });
  if (!pos) throw new Error("Pozisyon bulunamadı");

  const tick = await getPrice(pos.symbol);
  if (!tick) throw new Error("Fiyat yok");

  const closePrice = pos.side === "BUY" ? tick.bid : tick.ask;
  const rates = await getEffectiveRates(pos.symbol);
  if (!rates) throw new Error("Sembol ayarı yok");
  const profit = calcProfitWithRates(
    rates,
    pos.side as "BUY" | "SELL",
    pos.volume,
    pos.openPrice,
    closePrice
  );

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

  const account = await prisma.account.findUnique({ where: { userId } });
  if (account) {
    await prisma.account.update({
      where: { userId },
      data: { balance: account.balance + profit },
    });
  }

  return refreshAccountMetrics(userId);
}

export async function checkSlTp(userId: string) {
  await ensureTicked();
  const positions = await prisma.position.findMany({
    where: { userId, status: "OPEN" },
  });
  for (const pos of positions) {
    const tick = await getPrice(pos.symbol);
    if (!tick) continue;
    const current = pos.side === "BUY" ? tick.bid : tick.ask;
    let hit = false;
    if (pos.side === "BUY") {
      if (pos.stopLoss != null && current <= pos.stopLoss) hit = true;
      if (pos.takeProfit != null && current >= pos.takeProfit) hit = true;
    } else {
      if (pos.stopLoss != null && current >= pos.stopLoss) hit = true;
      if (pos.takeProfit != null && current <= pos.takeProfit) hit = true;
    }
    if (hit) {
      await closePosition(userId, pos.id);
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
    const tick = await getPrice(pos.symbol);
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
  if (!account) throw new Error("Hesap bulunamadı");
  await prisma.account.update({
    where: { userId },
    data: { balance: account.balance + amount },
  });
  return refreshAccountMetrics(userId);
}
