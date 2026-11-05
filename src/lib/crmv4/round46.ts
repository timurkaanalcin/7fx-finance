/** Withdrawal review queue and staff permission overview. Figures use loaded rows only. */

export type PayoutStatus = "" | "PENDING" | "APPROVED" | "REJECTED";
export type PayoutSort = "new" | "old";

export type PayoutRow = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  method?: string | null;
  createdAt?: string | null;
  reviewedAt?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

export type PayoutFilter = {
  text: string;
  currency: string;
  method: string;
  min: number | null;
  sort: PayoutSort;
};

export type PayoutView = PayoutFilter & { id: string; name: string; status: PayoutStatus };

export const PERM_KEYS = [
  "canManageUsers",
  "canApproveDeposits",
  "canEditRates",
  "canManageMethods",
  "canAdjustBalance",
] as const;

export type PermKey = (typeof PERM_KEYS)[number];
export type AccessLevel = "none" | "limited" | "desk" | "full";
export type ActivePick = "" | "on" | "off";

export type StaffRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  desk?: string | null;
  active?: boolean | null;
  isSelf?: boolean | null;
  isMain?: boolean | null;
  canManageUsers?: boolean | null;
  canApproveDeposits?: boolean | null;
  canEditRates?: boolean | null;
  canManageMethods?: boolean | null;
  canAdjustBalance?: boolean | null;
};

export type AccessFilter = { text: string; title: string; flag: "" | PermKey; active: ActivePick };
export type AccessView = AccessFilter & { id: string; name: string };

export type DeskNote = {
  id: string;
  title?: string | null;
  body?: string | null;
  kind?: string | null;
  readAt?: string | null;
  createdAt?: string | null;
};

const STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"]);

export function payoutQuery(status: PayoutStatus, skip: number): string {
  const params = new URLSearchParams();
  params.set("take", "40");
  params.set("status", status || "ALL");
  if (skip > 0) params.set("skip", String(Math.trunc(skip)));
  return `/api/admin/withdrawals?${params.toString()}`;
}

export function rowCurrency(row: { currency?: string | null }): string {
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

/** Local filter. A minimum is used only when one currency is selected. */
export function filterPayouts(rows: readonly PayoutRow[], filter: PayoutFilter): PayoutRow[] {
  const text = filter.text.trim().toLowerCase();
  const useMin = minApplies(filter.currency, filter.min);
  const out: PayoutRow[] = [];
  for (const row of rows) {
    const currency = rowCurrency(row);
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

/** One line per currency. Currencies are never added together. */
export function payoutSums(rows: readonly PayoutRow[]): { currency: string; count: number; amount: number }[] {
  const map: Record<string, { currency: string; count: number; amount: number }> = {};
  for (const row of rows) {
    const currency = rowCurrency(row);
    if (!currency) continue;
    if (!map[currency]) map[currency] = { currency, count: 0, amount: 0 };
    map[currency].count += 1;
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) map[currency].amount = round2(map[currency].amount + amount);
  }
  return Object.keys(map).sort().map((key) => map[key]);
}

export function uniqueValues(values: readonly (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    const text = String(value || "").trim();
    if (text && !out.includes(text)) out.push(text);
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

export function appendRows<T extends { id: string }>(current: readonly T[], incoming: readonly T[]): T[] {
  const ids = new Set(current.map((row) => row.id));
  const extra = incoming.filter((row) => row.id && !ids.has(row.id));
  return [...current, ...extra];
}

export function listMove(index: number, length: number, delta: number): number {
  if (length <= 0) return 0;
  const next = index + delta;
  if (next < 0) return 0;
  if (next >= length) return length - 1;
  return next;
}

function clipName(name: string): string {
  return name.trim().slice(0, 40);
}

function asStatus(value: unknown): PayoutStatus {
  const status = String(value || "").toUpperCase();
  return STATUSES.has(status) ? (status as PayoutStatus) : "";
}

function asMin(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function readPayoutViews(raw: unknown): PayoutView[] {
  if (!Array.isArray(raw)) return [];
  const out: PayoutView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PayoutView>;
    const name = clipName(String(row.name || ""));
    if (!name) continue;
    out.push({
      id: String(row.id || name),
      name,
      status: asStatus(row.status),
      currency: String(row.currency || "").toUpperCase(),
      method: String(row.method || ""),
      min: asMin(row.min),
      sort: row.sort === "old" ? "old" : "new",
      text: "",
    });
  }
  return out;
}

export function savePayoutView(views: readonly PayoutView[], view: PayoutView): PayoutView[] {
  const name = clipName(view.name);
  if (!name) return views.slice();
  return [...views, { ...view, name, id: view.id || name }];
}

export function renameView<T extends { id: string; name: string }>(views: readonly T[], id: string, name: string): T[] {
  const next = clipName(name);
  if (!next) return views.slice();
  return views.map((view) => (view.id === id ? { ...view, name: next } : view));
}

export function dropView<T extends { id: string }>(views: readonly T[], id: string): T[] {
  return views.filter((view) => view.id !== id);
}

export function payoutCsv(rows: readonly PayoutRow[]): string[][] {
  return rows.map((row) => [
    String(row.user?.name || ""),
    String(row.user?.email || ""),
    Number.isFinite(Number(row.amount)) ? String(row.amount) : "",
    rowCurrency(row),
    String(row.status || ""),
    String(row.method || ""),
    String(row.createdAt || ""),
  ]);
}

export function flagOn(value: boolean | null | undefined): boolean {
  return value === true;
}

export function flagCount(row: StaffRow): number {
  let count = 0;
  for (const key of PERM_KEYS) if (flagOn(row[key])) count += 1;
  return count;
}

export function accessLevel(count: number): AccessLevel {
  if (count >= PERM_KEYS.length) return "full";
  if (count >= 3) return "desk";
  if (count >= 1) return "limited";
  return "none";
}

export function filterStaff(rows: readonly StaffRow[], filter: AccessFilter): StaffRow[] {
  const text = filter.text.trim().toLowerCase();
  const out: StaffRow[] = [];
  for (const row of rows) {
    if (filter.title && String(row.jobTitle || "") !== filter.title) continue;
    if (filter.flag && !flagOn(row[filter.flag])) continue;
    if (filter.active === "on" && row.active === false) continue;
    if (filter.active === "off" && row.active !== false) continue;
    if (text) {
      const blob = `${row.name || ""} ${row.email || ""} ${row.desk || ""}`.toLowerCase();
      if (!blob.includes(text)) continue;
    }
    out.push(row);
  }
  return out;
}

export function permCounts(rows: readonly StaffRow[]): Record<PermKey, number> {
  const counts = {
    canManageUsers: 0,
    canApproveDeposits: 0,
    canEditRates: 0,
    canManageMethods: 0,
    canAdjustBalance: 0,
  };
  for (const row of rows) {
    for (const key of PERM_KEYS) if (flagOn(row[key])) counts[key] += 1;
  }
  return counts;
}

function asFlag(value: unknown): "" | PermKey {
  const flag = String(value || "");
  return (PERM_KEYS as readonly string[]).includes(flag) ? (flag as PermKey) : "";
}

function asActive(value: unknown): ActivePick {
  return value === "on" || value === "off" ? value : "";
}

export function readAccessViews(raw: unknown): AccessView[] {
  if (!Array.isArray(raw)) return [];
  const out: AccessView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AccessView>;
    const name = clipName(String(row.name || ""));
    if (!name) continue;
    out.push({
      id: String(row.id || name),
      name,
      text: String(row.text || ""),
      title: String(row.title || ""),
      flag: asFlag(row.flag),
      active: asActive(row.active),
    });
  }
  return out;
}

export function saveAccessView(views: readonly AccessView[], view: AccessView): AccessView[] {
  const name = clipName(view.name);
  if (!name) return views.slice();
  return [...views, { ...view, name, id: view.id || name }];
}

export function staffCsv(rows: readonly StaffRow[]): string[][] {
  return rows.map((row) => [
    String(row.name || ""),
    String(row.email || ""),
    String(row.jobTitle || ""),
    String(row.desk || ""),
    row.active === false ? "no" : "yes",
    accessLevel(flagCount(row)),
    ...PERM_KEYS.map((key) => (flagOn(row[key]) ? "yes" : "no")),
  ]);
}

export function unreadNotes(rows: readonly DeskNote[], onlyUnread: boolean): DeskNote[] {
  if (!onlyUnread) return rows.slice();
  return rows.filter((row) => !row.readAt);
}
