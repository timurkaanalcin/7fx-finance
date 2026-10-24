import type { Prisma } from "@prisma/client";
import { serializePresence } from "./presence-shared";

/** Traders table page size. The list opts in; callers that omit `take` keep the old window. */
export const TRADER_PAGE = 50;
/** Largest window a paged request may ask for (refresh of rows already on screen). */
export const TRADER_TAKE_CAP = 200;
/** Callers that omit `take` still receive this window. Search pickers pass `take` instead. */
export const TRADER_LEGACY_TAKE = 500;

/** Columns the traders table and its CSV actually render, plus the presence cell. */
export const TRADER_TABLE_SELECT = {
  id: true,
  email: true,
  accountLoginId: true,
  name: true,
  role: true,
  active: true,
  tradingEnabled: true,
  withdrawalsEnabled: true,
  loginEnabled: true,
  lastLoginAt: true,
  createdAt: true,
  phone: true,
  country: true,
  accountType: true,
  desk: true,
  saleStatus: true,
  retentionStatus: true,
  brokerName: true,
  assigneeName: true,
  retentionFollowUpAt: true,
  retentionNote: true,
  lastContactAt: true,
  ftd: true,
  lastSeenAt: true,
  lastIp: true,
  lastDevice: true,
  lastBrowser: true,
  lastOs: true,
  lastCountry: true,
  lastCountryName: true,
  lastRegion: true,
  lastCity: true,
  account: {
    select: {
      id: true,
      balance: true,
      equity: true,
      credit: true,
      bonus: true,
      currency: true,
    },
  },
} satisfies Prisma.UserSelect;

export function traderListWindow(
  takeRaw: string | null,
  skipRaw: string | null
): { take: number; skip: number } {
  const skipNum = Number(skipRaw);
  const skip = Number.isFinite(skipNum) && skipNum > 0 ? Math.min(100_000, Math.trunc(skipNum)) : 0;
  if (takeRaw == null || takeRaw === "") return { take: TRADER_LEGACY_TAKE, skip };
  const takeNum = Math.trunc(Number(takeRaw));
  const take = Number.isFinite(takeNum) && takeNum > 0 ? Math.min(TRADER_TAKE_CAP, takeNum) : TRADER_PAGE;
  return { take, skip };
}

/** Follow-up and retention counts run only when the list asks for them. */
export function wantTraderCounts(raw: string | null): boolean {
  return raw === "1";
}

/** Traders table asks for the narrow column set. Other callers keep the full membership payload. */
export function wantTraderTable(raw: string | null): boolean {
  return raw === "table";
}

/** Transfer and trader search pickers ask for id, name, email, login id, role, and balance. */
export function wantTraderPicker(raw: string | null): boolean {
  return raw === "picker";
}

export const TRADER_PICKER_SELECT = {
  id: true,
  name: true,
  email: true,
  accountLoginId: true,
  role: true,
  account: {
    select: {
      balance: true,
      currency: true,
    },
  },
} satisfies Prisma.UserSelect;

/** CRM list page size. Callers that omit `take` keep the old 300-row window. */
export const CRM_LIST_PAGE = 50;
export const CRM_LIST_TAKE_CAP = 100;
export const CRM_LIST_LEGACY = 300;

export function crmListWindow(
  takeRaw: string | null,
  skipRaw: string | null
): { take: number; skip: number; legacy: boolean } {
  const skipNum = Number(skipRaw);
  const skip = Number.isFinite(skipNum) && skipNum > 0 ? Math.min(100_000, Math.trunc(skipNum)) : 0;
  if (takeRaw == null || takeRaw === "") return { take: CRM_LIST_LEGACY, skip, legacy: true };
  const takeNum = Math.trunc(Number(takeRaw));
  const take = Number.isFinite(takeNum) && takeNum > 0 ? Math.min(CRM_LIST_TAKE_CAP, takeNum) : CRM_LIST_PAGE;
  return { take, skip, legacy: false };
}

/** Paged ledger window. Used only when the request sends `skip` or `take`. */
export function crmPageWindow(takeRaw: string | null, skipRaw: string | null): { take: number; skip: number } {
  const skipNum = Number(skipRaw);
  const skip = Number.isFinite(skipNum) && skipNum > 0 ? Math.min(100_000, Math.trunc(skipNum)) : 0;
  if (takeRaw == null || takeRaw === "") return { take: CRM_LIST_PAGE, skip };
  const takeNum = Math.trunc(Number(takeRaw));
  const take = Number.isFinite(takeNum) && takeNum > 0 ? Math.min(CRM_LIST_TAKE_CAP, takeNum) : CRM_LIST_PAGE;
  return { take, skip };
}

/** Unpaged admin customer-document list. Paged requests use the shared CRM page window. */
export const CRM_DOCS_LEGACY = 500;

export function customerDocsWindow(
  takeRaw: string | null,
  skipRaw: string | null,
  paged: boolean
): { take: number; skip: number; paged: boolean } {
  if (!paged) return { take: CRM_DOCS_LEGACY, skip: 0, paged: false };
  const page = crmPageWindow(takeRaw, skipRaw);
  return { take: page.take, skip: page.skip, paged: true };
}

/** Customer document list when the client omits take and skip. */
export const CUSTOMER_DOCS_LEGACY = 200;
/** AI membership list when the client omits take and skip. */
export const CRM_MEMBERSHIP_LEGACY = 500;
/** Deposit and withdrawal queues when the client omits take and skip. */
export const CRM_MONEY_LIST_LEGACY = 200;

/** Shared page window. Omit both params to keep `legacy`. */
export function pagedOrLegacy(
  takeRaw: string | null,
  skipRaw: string | null,
  paged: boolean,
  legacy: number
): { take: number; skip: number; paged: boolean } {
  if (!paged) return { take: legacy, skip: 0, paged: false };
  const page = crmPageWindow(takeRaw, skipRaw);
  return { take: page.take, skip: page.skip, paged: true };
}

/**
 * Trader detail views. `full` is the existing payload (post-save refresh).
 * The others load one tab and skip the rest of the related tables.
 */
const TRADER_DETAIL_SCOPES = [
  "full",
  "profile",
  "positions",
  "finance",
  "comms",
  "tickets",
  "ledger",
  "documents",
  "reminders",
] as const;

export type TraderDetailScope = (typeof TRADER_DETAIL_SCOPES)[number];

/** Tabs that fetch their own payload the first time they open. Profile covers notes and permissions. */
export const TRADER_LAZY_SCOPES: readonly Exclude<TraderDetailScope, "full" | "profile">[] = [
  "comms",
  "tickets",
  "positions",
  "ledger",
  "documents",
  "reminders",
  "finance",
];

export function traderDetailScope(raw: string | null): TraderDetailScope {
  if (raw && (TRADER_DETAIL_SCOPES as readonly string[]).includes(raw)) return raw as TraderDetailScope;
  return "full";
}

/** Map a trader-detail tab id to the payload it needs. Profile, notes, and permissions stay on the first load. */
export function traderDetailScopeForTab(tab: string): TraderDetailScope | null {
  switch (tab) {
    case "iletisim":
      return "comms";
    case "biletler":
      return "tickets";
    case "pozisyonlar":
      return "positions";
    case "ledger":
    case "bonus":
      return "ledger";
    case "belgeler":
      return "documents";
    case "takvim":
      return "reminders";
    case "finans":
      return "finance";
    default:
      return null;
  }
}

/** Desk trader row: the desk page renders name, balance, and currency. */
export function serializeDeskTrader(u: {
  id: string;
  name: string;
  account?: { balance?: number | null; currency?: string | null } | null;
}) {
  const balance = Number(u.account?.balance);
  return {
    id: u.id,
    name: u.name,
    balance: Number.isFinite(balance) ? balance : 0,
    currency: u.account?.currency || "USD",
  };
}

/** Desk worker row: the desk page renders name and email. */
export function serializeDeskWorker(u: { id: string; name: string; email: string }) {
  return { id: u.id, name: u.name, email: u.email };
}

/** Chat thread list page. The idle poll refreshes the loaded window, capped here. */
export const CHAT_THREAD_PAGE = 20;
export const CHAT_THREAD_CAP = 40;

export function chatThreadWindow(takeRaw: string | null, skipRaw: string | null): { take: number; skip: number } {
  const skipNum = Number(skipRaw);
  const skip = Number.isFinite(skipNum) && skipNum > 0 ? Math.min(100_000, Math.trunc(skipNum)) : 0;
  if (takeRaw == null || takeRaw === "") return { take: CHAT_THREAD_PAGE, skip };
  const takeNum = Math.trunc(Number(takeRaw));
  const take = Number.isFinite(takeNum) && takeNum > 0 ? Math.min(CHAT_THREAD_CAP, takeNum) : CHAT_THREAD_PAGE;
  return { take, skip };
}

/** One page of an open chat thread. Omitting `take` uses this page, not a 400-row dump. */
export const CHAT_MESSAGE_PAGE = 40;
export const CHAT_MESSAGE_CAP = 80;

export function chatMessageWindow(takeRaw: string | null, skipRaw: string | null): { take: number; skip: number } {
  const skipNum = Number(skipRaw);
  const skip = Number.isFinite(skipNum) && skipNum > 0 ? Math.min(100_000, Math.trunc(skipNum)) : 0;
  if (takeRaw == null || takeRaw === "") return { take: CHAT_MESSAGE_PAGE, skip };
  const takeNum = Math.trunc(Number(takeRaw));
  const take = Number.isFinite(takeNum) && takeNum > 0 ? Math.min(CHAT_MESSAGE_CAP, takeNum) : CHAT_MESSAGE_PAGE;
  return { take, skip };
}

/** Older history is prepended. Messages already on screen stay in place. */
export function prependChatMessages<T extends { id: string }>(existing: T[], older: T[]): T[] {
  if (older.length === 0) return existing;
  const seen = new Set(existing.map((m) => m.id));
  const head = older.filter((m) => !seen.has(m.id));
  return head.length ? head.concat(existing) : existing;
}

/** Which trader-detail payload a record save should refresh. Unknown entities keep the full reload. */
export function traderDetailScopeForEntity(entity: string): TraderDetailScope {
  switch (entity) {
    case "communication":
      return "comms";
    case "deposit":
    case "withdrawal":
    case "balanceRequest":
      return "tickets";
    case "ledger":
      return "ledger";
    case "document":
      return "documents";
    case "reminder":
      return "reminders";
    case "note":
      return "profile";
    case "position":
    case "order":
      return "positions";
    default:
      return "full";
  }
}

export type ExposureBucket = { symbol: string; buy: number; sell: number; count: number; pnl: number };

/** Fold open-position group totals into the exposure table. Display only; amounts are already stored. */
export function exposureFromPositionGroups(
  groups: { symbol: string; side: string; volume: number; profit: number; count: number }[]
): ExposureBucket[] {
  const map = new Map<string, ExposureBucket>();
  for (const g of groups) {
    const sym = (g.symbol || "—").toUpperCase();
    const row = map.get(sym) ?? { symbol: sym, buy: 0, sell: 0, count: 0, pnl: 0 };
    const volume = Number.isFinite(g.volume) ? g.volume : 0;
    const profit = Number.isFinite(g.profit) ? g.profit : 0;
    if (String(g.side || "").toUpperCase() === "SELL") row.sell += volume;
    else row.buy += volume;
    row.count += Number.isFinite(g.count) ? g.count : 0;
    row.pnl += profit;
    map.set(sym, row);
  }
  return Array.from(map.values()).sort((a, b) => b.buy + b.sell - (a.buy + a.sell));
}

type PositionListUser = {
  id: string;
  name: string;
  email: string;
  brokerName: string | null;
  desk: string | null;
  account: { id: string } | null;
};

/** Global positions row: table columns plus the trader name. Omits the trading account balances. */
export function serializePositionListRow(p: {
  id: string;
  userId: string;
  symbol: string;
  chartSymbol: string | null;
  side: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number;
  margin: number;
  status: string;
  openedAt: Date | string;
  closedAt: Date | string | null;
  closePrice: number | null;
  closeProfit: number | null;
  user: PositionListUser;
}) {
  return {
    id: p.id,
    userId: p.userId,
    symbol: p.symbol,
    chartSymbol: p.chartSymbol,
    side: p.side,
    volume: p.volume,
    openPrice: p.openPrice,
    currentPrice: p.currentPrice,
    stopLoss: p.stopLoss,
    takeProfit: p.takeProfit,
    profit: p.profit,
    margin: p.margin,
    status: p.status,
    openedAt: p.openedAt,
    closedAt: p.closedAt,
    closePrice: p.closePrice,
    closeProfit: p.closeProfit,
    traderName: p.user.name,
    traderEmail: p.user.email,
    broker: p.user.brokerName,
    desk: p.user.desk,
    tradingAccountId: p.user.account?.id ?? null,
    user: { id: p.user.id, name: p.user.name, email: p.user.email, brokerName: p.user.brokerName },
  };
}

/** Global orders row: the editable order columns and the trader name. */
export function serializeOrderListRow(o: {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  type: string;
  volume: number;
  price: number | null;
  openPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  status: string;
  filledAt: Date | string | null;
  createdAt: Date | string;
  positionId: string | null;
  user: { id: string; name: string; email: string; brokerName: string | null };
}) {
  return {
    id: o.id,
    userId: o.userId,
    symbol: o.symbol,
    side: o.side,
    type: o.type,
    volume: o.volume,
    price: o.price,
    openPrice: o.openPrice,
    stopLoss: o.stopLoss,
    takeProfit: o.takeProfit,
    status: o.status,
    filledAt: o.filledAt,
    createdAt: o.createdAt,
    positionId: o.positionId,
    traderName: o.user.name,
    user: { id: o.user.id, name: o.user.name, email: o.user.email, brokerName: o.user.brokerName },
  };
}

/** Latest login shown on the workers page, taken from the user row (no login-event scan). */
export function workerLastLogin(u: {
  lastLoginAt: Date | string | null;
  lastIp: string | null;
  lastCity: string | null;
  lastRegion: string | null;
  lastCountry: string | null;
  lastCountryName: string | null;
  lastDevice: string | null;
  lastBrowser: string | null;
  lastOs: string | null;
}) {
  if (!u.lastLoginAt && !u.lastIp && !u.lastCity && !u.lastCountryName) return null;
  return {
    at: u.lastLoginAt instanceof Date ? u.lastLoginAt.toISOString() : u.lastLoginAt,
    ip: u.lastIp,
    city: u.lastCity,
    region: u.lastRegion,
    country: u.lastCountry,
    countryName: u.lastCountryName,
    device: u.lastDevice,
    browser: u.lastBrowser,
    os: u.lastOs,
    method: null as string | null,
  };
}

function isoOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/**
 * JSON row for the traders table. Same keys the table and CSV read.
 * Omits membership fields the grid never renders (address, affiliates, margin, permissions).
 */
export function serializeTraderTableRow(u: Record<string, unknown>) {
  const account = (u.account as {
    id?: string | null;
    balance?: number | null;
    equity?: number | null;
    credit?: number | null;
    bonus?: number | null;
    currency?: string | null;
  } | null) ?? null;
  return {
    id: u.id,
    email: u.email,
    accountLoginId: (u.accountLoginId as string | null) ?? null,
    name: u.name,
    role: u.role,
    active: u.active !== false,
    tradingEnabled: u.tradingEnabled !== false,
    withdrawalsEnabled: u.withdrawalsEnabled !== false,
    loginEnabled: u.loginEnabled !== false,
    lastLoginAt: isoOrNull(u.lastLoginAt),
    createdAt: isoOrNull(u.createdAt),
    phone: (u.phone as string | null) ?? null,
    country: (u.country as string | null) ?? null,
    accountType: (u.accountType as string | null) ?? "STANDARD",
    desk: (u.desk as string | null) ?? null,
    saleStatus: (u.saleStatus as string | null) ?? null,
    retentionStatus: (u.retentionStatus as string | null) ?? null,
    brokerName: (u.brokerName as string | null) ?? null,
    assigneeName: (u.assigneeName as string | null) ?? null,
    retentionFollowUpAt: isoOrNull(u.retentionFollowUpAt),
    retentionNote: (u.retentionNote as string | null) ?? null,
    lastContactAt: isoOrNull(u.lastContactAt),
    ftd: Boolean(u.ftd),
    tradingAccountId: account?.id ?? null,
    balance: account?.balance ?? 0,
    equity: account?.equity ?? 0,
    credit: account?.credit ?? 0,
    bonus: account?.bonus ?? 0,
    currency: account?.currency ?? "USD",
    ...serializePresence(u),
  };
}

/** JSON row for the transfer picker and the communications/documents search. */
export function serializeTraderPickerRow(u: Record<string, unknown>) {
  const account = (u.account as { balance?: number | null; currency?: string | null } | null) ?? null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    accountLoginId: (u.accountLoginId as string | null) ?? null,
    role: (u.role as string | null) ?? "TRADER",
    balance: account?.balance ?? 0,
    currency: account?.currency ?? "USD",
  };
}
