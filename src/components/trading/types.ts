export type AccountMetrics = {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
  profitLoss: number;
  marginLevel: number;
  credit: number;
  bonus?: number;
  marginCall?: boolean;
};

export type UserInfo = {
  id: string;
  email: string;
  name: string;
  role?: string;
};

export type PriceTick = {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  change: number;
  changePct: number;
  ts: number;
};

export type PositionRow = {
  id: string;
  symbol: string;
  side: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number;
  margin: number;
  status: string;
  openedAt: string;
  closedAt?: string | null;
  closePrice?: number | null;
  closeProfit?: number | null;
};

export type OrderRow = {
  id: string;
  symbol: string;
  side: string;
  type: string;
  volume: number;
  price: number | null;
  openPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  status: string;
  createdAt: string;
  filledAt: string | null;
};

export type SymbolDef = {
  symbol: string;
  name: string;
  class: string;
  digits: number;
  pipSize: number;
  contractSize: number;
  basePrice: number;
  spread: number;
  flag?: string;
};
