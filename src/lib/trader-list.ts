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

/** Trader detail poll. `full` is the existing payload. The other two skip unrelated tables. */
export type TraderDetailScope = "full" | "positions" | "finance";

export function traderDetailScope(raw: string | null): TraderDetailScope {
  if (raw === "positions" || raw === "finance") return raw;
  return "full";
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
