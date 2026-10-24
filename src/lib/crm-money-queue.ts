import type { Prisma } from "@prisma/client";

/** One page of the deposit or withdrawal queue. Callers that omit take keep the legacy window. */
export const MONEY_QUEUE_PAGE = 50;

export const MONEY_QUEUE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const MONEY_SORT_KEYS = [
  "created_asc",
  "created_desc",
  "amount_asc",
  "amount_desc",
  "status_asc",
  "status_desc",
  "name_asc",
  "name_desc",
] as const;

const STATUS_SET = new Set<string>(MONEY_QUEUE_STATUSES);
const SORT_SET = new Set<string>(MONEY_SORT_KEYS);

export type MoneyQueueFilters = {
  q: string;
  /** PENDING is the queue default and is omitted from the address bar. ALL means every status. */
  status: string;
  sort: string;
  page: number;
};

function clip(value: string | null, max: number): string {
  return (value || "").trim().slice(0, max);
}

/** Read the queue query string. An unknown status falls back to the pending queue. */
export function parseMoneyQueueQuery(search: string): MoneyQueueFilters {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const sp = new URLSearchParams(raw);
  const statusRaw = clip(sp.get("status"), 20).toUpperCase();
  const status = statusRaw === "ALL" ? "ALL" : STATUS_SET.has(statusRaw) ? statusRaw : "PENDING";
  const sort = clip(sp.get("sort"), 40);
  const pageNum = Number(sp.get("page"));
  const page = Number.isFinite(pageNum) && pageNum > 1 ? Math.min(2000, Math.trunc(pageNum)) : 1;
  return {
    q: clip(sp.get("q"), 80),
    status,
    sort: SORT_SET.has(sort) ? sort : "",
    page,
  };
}

/** Canonical query string. Pending and page 1 are omitted. */
export function moneyQueueSearchString(f: MoneyQueueFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.status === "ALL") sp.set("status", "ALL");
  else if (f.status && f.status !== "PENDING" && STATUS_SET.has(f.status)) sp.set("status", f.status);
  if (f.sort && SORT_SET.has(f.sort)) sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(Math.min(2000, Math.trunc(f.page))));
  return sp.toString();
}

export function moneyQueueSkip(page: number): number {
  const p = Number.isFinite(page) && page > 1 ? Math.min(2000, Math.trunc(page)) : 1;
  return (p - 1) * MONEY_QUEUE_PAGE;
}

/** Inclusive row numbers. An empty page is 0–0, not a full window. */
export function moneyQueueRange(page: number, rowCount: number): { from: number; to: number } {
  if (!Number.isFinite(rowCount) || rowCount <= 0) return { from: 0, to: 0 };
  const from = moneyQueueSkip(page) + 1;
  return { from, to: from + Math.trunc(rowCount) - 1 };
}

/** Status filter. ALL, blank, and unknown values do not narrow the query. */
export function moneyQueueStatus(raw: string | null): string | null {
  const status = clip(raw, 20).toUpperCase();
  if (!status || status === "ALL") return null;
  return STATUS_SET.has(status) ? status : null;
}

/**
 * Name, email, and account id, plus the note and method the queue already showed.
 * Deposit methods are a relation. Withdrawal methods are a string on the request.
 */
export function moneyQueueTextWhere(
  kind: "deposit" | "withdrawal",
  raw: string
): Prisma.DepositRequestWhereInput | Prisma.WithdrawalRequestWhereInput | null {
  const q = raw.trim().slice(0, 80);
  if (!q) return null;
  const user = {
    OR: [{ name: { contains: q } }, { email: { contains: q } }, { accountLoginId: { contains: q } }],
  };
  if (kind === "deposit") {
    return {
      OR: [{ note: { contains: q } }, { user }, { method: { OR: [{ label: { contains: q } }, { type: { contains: q } }] } }],
    };
  }
  return {
    OR: [{ note: { contains: q } }, { method: { contains: q } }, { user }],
  };
}

/** Shared sort shape. Deposit and withdrawal method columns are different Prisma types, so the sort stays on the columns both queues have. */
type MoneyQueueOrder =
  | { createdAt: Prisma.SortOrder }
  | { amount: Prisma.SortOrder }
  | { status: Prisma.SortOrder }
  | { user: { name: Prisma.SortOrder } };

/** Column sort. Unknown keys keep the newest request first. */
export function moneyQueueOrderBy(sort: string): MoneyQueueOrder[] {
  const tie: MoneyQueueOrder = { createdAt: "desc" };
  switch (sort) {
    case "created_asc":
      return [{ createdAt: "asc" }];
    case "amount_asc":
      return [{ amount: "asc" }, tie];
    case "amount_desc":
      return [{ amount: "desc" }, tie];
    case "status_asc":
      return [{ status: "asc" }, tie];
    case "status_desc":
      return [{ status: "desc" }, tie];
    case "name_asc":
      return [{ user: { name: "asc" } }, tie];
    case "name_desc":
      return [{ user: { name: "desc" } }, tie];
    default:
      return [tie];
  }
}

/** Text columns start A→Z. Amount and date start with the largest or newest. */
export function nextMoneySort(current: string, field: string): string {
  const asc = `${field}_asc`;
  const desc = `${field}_desc`;
  if (!SORT_SET.has(asc) || !SORT_SET.has(desc)) return current;
  if (field === "created" && (current === "" || current === "created_desc")) return "created_asc";
  if (current === asc) return desc;
  if (current === desc) return asc;
  if (field === "name" || field === "status") return asc;
  return desc;
}

export function queueStatusTone(status: string): string {
  if (status === "APPROVED") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (status === "REJECTED") return "border-red-300 bg-red-50 text-red-700";
  if (status === "PENDING") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-[#e5e5e5] bg-white text-neutral-600";
}

/** Currency amount in the viewer's locale. The table adds tabular figures. */
export function formatQueueMoney(amount: number, currency: string, locale: string): string {
  const code = /^[A-Za-z]{3}$/.test(currency || "") ? currency.toUpperCase() : "USD";
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  const loc = locale || "en";
  try {
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    try {
      return `${new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${code}`;
    } catch {
      return `${value.toFixed(2)} ${code}`;
    }
  }
}

export type QueueCsvRow = {
  createdAt: string;
  name: string;
  email: string;
  accountLoginId?: string | null;
  method: string;
  amount: number;
  currency: string;
  note: string | null;
  status: string;
};

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV of the rows matching the current filter. Amount stays numeric so a spreadsheet can sum it. */
export function moneyQueueCsv(rows: QueueCsvRow[]): string {
  const header = ["createdAt", "name", "email", "accountId", "method", "amount", "currency", "note", "status"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.createdAt,
        row.name,
        row.email,
        row.accountLoginId || "",
        row.method,
        Number.isFinite(row.amount) ? row.amount.toFixed(2) : "",
        row.currency,
        row.note || "",
        row.status,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  return lines.join("\n");
}
