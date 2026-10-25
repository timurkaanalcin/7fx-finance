import type { Prisma } from "@prisma/client";
import { TRADER_PAGE } from "@/lib/trader-list";

/** Server sort keys for the traders table. Unknown values fall back to registration date. */
export const TRADER_SORT_KEYS = [
  "name_asc",
  "name_desc",
  "email_asc",
  "email_desc",
  "account_asc",
  "account_desc",
  "balance_asc",
  "balance_desc",
  "created_asc",
  "created_desc",
  "login_asc",
  "login_desc",
  "sale_asc",
  "sale_desc",
  "lastContact_asc",
  "lastContact_desc",
] as const;

const SORT_SET = new Set<string>(TRADER_SORT_KEYS);

export type TraderListFilters = {
  q: string;
  status: string;
  desk: string;
  country: string;
  saleStatus: string;
  accountType: string;
  dateFrom: string;
  dateTo: string;
  retentionStatus: string;
  presence: string;
  ftdOnly: boolean;
  followUp: string;
  lastContactFrom: string;
  lastContactTo: string;
  sort: string;
  page: number;
  take: number;
};

export const EMPTY_TRADER_LIST_FILTERS: TraderListFilters = {
  q: "",
  status: "all",
  desk: "",
  country: "",
  saleStatus: "",
  accountType: "",
  dateFrom: "",
  dateTo: "",
  retentionStatus: "",
  presence: "",
  ftdOnly: false,
  followUp: "",
  lastContactFrom: "",
  lastContactTo: "",
  sort: "",
  page: 1,
  take: TRADER_PAGE,
};

function clip(value: string | null, max: number): string {
  return (value || "").trim().slice(0, max);
}

/** Read the traders-list query string. Invalid sort and page values are dropped. */
export function parseTraderListQuery(search: string): TraderListFilters {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const sp = new URLSearchParams(raw);
  const sort = clip(sp.get("sort"), 40);
  const pageNum = Number(sp.get("page"));
  const page = Number.isFinite(pageNum) && pageNum > 1 ? Math.min(2000, Math.trunc(pageNum)) : 1;
  return {
    q: clip(sp.get("q"), 80),
    status: clip(sp.get("status"), 80) || "all",
    desk: clip(sp.get("desk"), 200),
    country: clip(sp.get("country"), 40),
    saleStatus: clip(sp.get("saleStatus"), 200),
    accountType: clip(sp.get("accountType"), 40),
    dateFrom: clip(sp.get("dateFrom"), 10),
    dateTo: clip(sp.get("dateTo"), 10),
    retentionStatus: clip(sp.get("retentionStatus"), 200),
    presence: clip(sp.get("presence"), 20),
    ftdOnly: sp.get("ftd") === "1",
    followUp: clip(sp.get("followUp"), 80),
    lastContactFrom: clip(sp.get("lastContactFrom"), 10),
    lastContactTo: clip(sp.get("lastContactTo"), 10),
    sort: SORT_SET.has(sort) ? sort : "",
    page,
    take: clipListTake(sp.get("take"), TRADER_TAKES, TRADER_PAGE),
  };
}

/** Canonical query string for the address bar. Page 1 and empty filters are omitted. */
export function traderListSearchString(f: TraderListFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.status && f.status !== "all") sp.set("status", f.status);
  if (f.desk) sp.set("desk", f.desk);
  if (f.country) sp.set("country", f.country);
  if (f.saleStatus) sp.set("saleStatus", f.saleStatus);
  if (f.accountType) sp.set("accountType", f.accountType);
  if (f.dateFrom) sp.set("dateFrom", f.dateFrom);
  if (f.dateTo) sp.set("dateTo", f.dateTo);
  if (f.retentionStatus) sp.set("retentionStatus", f.retentionStatus);
  if (f.presence) sp.set("presence", f.presence);
  if (f.ftdOnly) sp.set("ftd", "1");
  if (f.followUp) sp.set("followUp", f.followUp);
  if (f.lastContactFrom) sp.set("lastContactFrom", f.lastContactFrom);
  if (f.lastContactTo) sp.set("lastContactTo", f.lastContactTo);
  if (f.sort && SORT_SET.has(f.sort)) sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(Math.min(2000, Math.trunc(f.page))));
  if (f.take && f.take !== TRADER_PAGE) sp.set("take", String(f.take));
  return sp.toString();
}

export const TRADER_TAKES = [25, 50, 100, 200];

function clipListTake(raw: string | null, allowed: readonly number[], fallback: number): number {
  const n = Math.trunc(Number(raw));
  return allowed.includes(n) ? n : fallback;
}

/** Skip for a 1-based page. The size defaults to `TRADER_PAGE`. */
export function traderPageSkip(page: number, pageSize = TRADER_PAGE): number {
  const p = Number.isFinite(page) && page > 1 ? Math.min(2000, Math.trunc(page)) : 1;
  const size = clipListTake(String(pageSize), TRADER_TAKES, TRADER_PAGE);
  return (p - 1) * size;
}

/** Inclusive row numbers for the page. An empty page is 0–0, not a full window. */
export function traderPageRange(page: number, rowCount: number, pageSize = TRADER_PAGE): { from: number; to: number } {
  if (!Number.isFinite(rowCount) || rowCount <= 0) return { from: 0, to: 0 };
  const from = traderPageSkip(page, pageSize) + 1;
  return { from, to: from + Math.trunc(rowCount) - 1 };
}

/**
 * Next sort when a column header is clicked.
 * Text columns start A→Z. Dates and amounts start with the newest or largest.
 */
export function nextTraderSort(current: string, field: string): string {
  const asc = `${field}_asc`;
  const desc = `${field}_desc`;
  if (!SORT_SET.has(asc) || !SORT_SET.has(desc)) return current;
  if (current === asc) return desc;
  if (current === desc) return asc;
  const textFirst = field === "name" || field === "email" || field === "account" || field === "sale";
  return textFirst ? asc : desc;
}

/** Name, email, and account id (plus the existing phone and broker fields) match on the server. */
export function traderTextSearch(raw: string): Prisma.UserWhereInput | null {
  const q = raw.trim().slice(0, 80);
  if (!q) return null;
  return {
    OR: [
      { email: { contains: q } },
      { accountLoginId: { contains: q } },
      { name: { contains: q } },
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { phone: { contains: q } },
      { brokerName: { contains: q } },
    ],
  };
}

/** Order the traders table. Follow-up queues keep their date order unless a column sort is set. */
export function traderListOrderBy(
  sort: string,
  followUpActive: boolean
): Prisma.UserOrderByWithRelationInput[] {
  const tie: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };
  switch (sort) {
    case "name_asc":
      return [{ name: "asc" }, tie];
    case "name_desc":
      return [{ name: "desc" }, tie];
    case "email_asc":
      return [{ email: "asc" }, tie];
    case "email_desc":
      return [{ email: "desc" }, tie];
    case "account_asc":
      return [{ accountLoginId: { sort: "asc", nulls: "last" } }, tie];
    case "account_desc":
      return [{ accountLoginId: { sort: "desc", nulls: "last" } }, tie];
    case "balance_asc":
      return [{ account: { balance: "asc" } }, tie];
    case "balance_desc":
      return [{ account: { balance: "desc" } }, tie];
    case "created_asc":
      return [{ createdAt: "asc" }];
    case "created_desc":
      return [{ createdAt: "desc" }];
    case "login_asc":
      return [{ lastLoginAt: { sort: "asc", nulls: "last" } }, tie];
    case "login_desc":
      return [{ lastLoginAt: { sort: "desc", nulls: "last" } }, tie];
    case "sale_asc":
      return [{ saleStatus: { sort: "asc", nulls: "last" } }, tie];
    case "sale_desc":
      return [{ saleStatus: { sort: "desc", nulls: "last" } }, tie];
    case "lastContact_asc":
      return [{ lastContactAt: { sort: "asc", nulls: "last" } }, tie];
    case "lastContact_desc":
      return [{ lastContactAt: { sort: "desc", nulls: "last" } }, tie];
    default:
      return followUpActive ? [{ retentionFollowUpAt: "asc" }, tie] : [tie];
  }
}
