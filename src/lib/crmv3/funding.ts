/** Deposit review queue and segment cards. Figures use loaded rows only. */

export const FUND_KEY = "crmv3-funding-views";
export const SEG_KEY = "crmv3-segment-cards";

export type FundStatus = "" | "PENDING" | "APPROVED" | "REJECTED";
export type FundSort = "new" | "old";

export type FundRow = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  method?: string | null;
  createdAt?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

export type FundFilter = { text: string; currency: string; method: string; min: number | null; sort: FundSort };
export type FundView = FundFilter & { id: string; name: string; status: FundStatus };

export type CashLine = { id: string; amount?: number | null; currency?: string | null; userId?: string | null };

export type SegPerson = {
  id: string;
  name?: string | null;
  country?: string | null;
  saleStatus?: string | null;
  documentsStatus?: string | null;
  currency?: string | null;
};

export type SegAxis = "country" | "saleStatus" | "documentsStatus" | "currency";

export type SegCard = { id: string; label: string; count: number; ids: string[] };

const STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"]);

export function fundQuery(status: FundStatus, skip: number): string {
  const params = new URLSearchParams();
  params.set("take", "40");
  params.set("status", status || "ALL");
  if (skip > 0) params.set("skip", String(Math.trunc(skip)));
  return `/api/admin/deposits?${params.toString()}`;
}

export function fundCurrency(row: { currency?: string | null }): string {
  return String(row.currency || "").trim().toUpperCase();
}

export function ageHours(createdAt: string | null | undefined, nowMs: number): number | null {
  if (!createdAt) return null;
  const time = new Date(createdAt).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, (nowMs - time) / 36e5);
}

export function minApplies(currency: string, min: number | null): boolean {
  return Boolean(currency) && min != null && Number.isFinite(min);
}

function timeOf(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function filterFunds(rows: readonly FundRow[], filter: FundFilter): FundRow[] {
  const text = filter.text.trim().toLowerCase();
  const useMin = minApplies(filter.currency, filter.min);
  const out: FundRow[] = [];
  for (const row of rows) {
    const currency = fundCurrency(row);
    if (filter.currency && currency !== filter.currency) continue;
    const method = String(row.method || "");
    if (filter.method && method !== filter.method) continue;
    if (useMin) {
      const amount = Number(row.amount);
      if (!Number.isFinite(amount) || amount < (filter.min as number)) continue;
    }
    if (text) {
      const blob = `${row.user?.name || ""} ${row.user?.email || ""} ${method}`.toLowerCase();
      if (!blob.includes(text)) continue;
    }
    out.push(row);
  }
  out.sort((a, b) => {
    const at = timeOf(a.createdAt);
    const bt = timeOf(b.createdAt);
    if (at == null && bt == null) return 0;
    if (at == null) return 1;
    if (bt == null) return -1;
    return filter.sort === "old" ? at - bt : bt - at;
  });
  return out;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Pending rows only, one line per currency. */
export function pendingSums(rows: readonly FundRow[]): { currency: string; count: number; amount: number }[] {
  const map: Record<string, { currency: string; count: number; amount: number }> = {};
  for (const row of rows) {
    if (String(row.status || "").toUpperCase() !== "PENDING") continue;
    const currency = fundCurrency(row);
    if (!currency) continue;
    if (!map[currency]) map[currency] = { currency, count: 0, amount: 0 };
    map[currency].count += 1;
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) map[currency].amount = round2(map[currency].amount + amount);
  }
  return Object.keys(map).sort().map((key) => map[key]);
}

export function samePerson(rows: readonly CashLine[], userId: string): CashLine[] {
  if (!userId) return [];
  return rows.filter((row) => String(row.userId || "") === userId);
}

export function uniqueText(values: readonly (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    const text = String(value || "").trim();
    if (text && !out.includes(text)) out.push(text);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function appendFunds<T extends { id: string }>(current: readonly T[], incoming: readonly T[]): T[] {
  const ids = new Set(current.map((row) => row.id));
  return [...current, ...incoming.filter((row) => row.id && !ids.has(row.id))];
}

export function listMove(index: number, length: number, delta: number): number {
  if (length <= 0) return 0;
  const next = index + delta;
  if (next < 0) return 0;
  if (next >= length) return length - 1;
  return next;
}

function clip(name: string): string {
  return name.trim().slice(0, 40);
}

function asStatus(value: unknown): FundStatus {
  const status = String(value || "").toUpperCase();
  return STATUSES.has(status) ? (status as FundStatus) : "";
}

export function readFundViews(raw: unknown): FundView[] {
  if (!Array.isArray(raw)) return [];
  const out: FundView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FundView>;
    const name = clip(String(row.name || ""));
    if (!name) continue;
    const min = row.min == null || row.min === ("" as unknown) ? null : Number(row.min);
    out.push({
      id: String(row.id || name),
      name,
      status: asStatus(row.status),
      currency: String(row.currency || "").toUpperCase(),
      method: String(row.method || ""),
      min: min != null && Number.isFinite(min) ? min : null,
      sort: row.sort === "old" ? "old" : "new",
      text: "",
    });
  }
  return out;
}

export function saveFundView(views: readonly FundView[], view: FundView): FundView[] {
  const name = clip(view.name);
  if (!name) return views.slice();
  return [...views, { ...view, name, id: view.id || name }];
}

export function dropFundView(views: readonly FundView[], id: string): FundView[] {
  return views.filter((view) => view.id !== id);
}

export function segmentCards(rows: readonly SegPerson[], axis: SegAxis): SegCard[] {
  const map: Record<string, SegCard> = {};
  for (const row of rows) {
    const raw = String(row[axis] || "").trim();
    const label = axis === "currency" ? raw.toUpperCase() : raw;
    const id = `${axis}:${label}`;
    if (!map[id]) map[id] = { id, label, count: 0, ids: [] };
    map[id].count += 1;
    if (row.id && !map[id].ids.includes(row.id)) map[id].ids.push(row.id);
  }
  return Object.values(map).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function togglePin(pins: readonly string[], id: string): string[] {
  if (!id) return pins.slice();
  return pins.includes(id) ? pins.filter((item) => item !== id) : [...pins, id];
}

export function orderCards(cards: readonly SegCard[], pins: readonly string[]): SegCard[] {
  return [...cards].sort((a, b) => {
    const ap = pins.includes(a.id) ? 0 : 1;
    const bp = pins.includes(b.id) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return b.count - a.count || a.label.localeCompare(b.label);
  });
}

export function readPins(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 40);
}
