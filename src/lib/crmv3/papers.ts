/** Document gallery and audit history. Both use loaded rows only. */

export const GALLERY_KEY = "crmv3-gallery-checks";

export type DocCard = {
  id: string;
  name?: string | null;
  docType?: string | null;
  status?: string | null;
  traderId?: string | null;
  trader?: string | null;
  traderEmail?: string | null;
  createdAt?: string | null;
};

export type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  desk?: string | null;
  documentsStatus?: string | null;
};

export type Checks = { name: boolean; photo: boolean; expiry: boolean; readable: boolean };
export const EMPTY_CHECKS: Checks = { name: false, photo: false, expiry: false, readable: false };
export const CHECK_KEYS = ["name", "photo", "expiry", "readable"] as const;

export type AuditRow = {
  id: string;
  at?: string | null;
  action?: string | null;
  actor?: string | null;
  target?: string | null;
  level?: string | null;
  detail?: string | null;
};

export function filterDocs(rows: readonly DocCard[], type: string, text: string): DocCard[] {
  const kind = type.trim();
  const query = text.trim().toLowerCase();
  return rows.filter((row) => {
    if (kind && String(row.docType || "") !== kind) return false;
    if (!query) return true;
    return `${row.name || ""} ${row.trader || ""} ${row.traderEmail || ""} ${row.docType || ""}`.toLowerCase().includes(query);
  });
}

export function docTypes(rows: readonly DocCard[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const name = String(row.docType || "").trim();
    if (name && !out.includes(name)) out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function personOf(people: readonly Person[], id: string): Person | null {
  if (!id) return null;
  return people.find((row) => row.id === id) || null;
}

export function readChecks(raw: unknown): Record<string, Checks> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, Checks> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || !value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    out[key] = {
      name: row.name === true,
      photo: row.photo === true,
      expiry: row.expiry === true,
      readable: row.readable === true,
    };
  }
  return out;
}

export function setCheck(map: Record<string, Checks>, id: string, key: keyof Checks, on: boolean): Record<string, Checks> {
  if (!id) return map;
  const current = map[id] || EMPTY_CHECKS;
  return { ...map, [id]: { ...current, [key]: on } };
}

export function checkCount(checks: Checks): number {
  return CHECK_KEYS.filter((key) => checks[key]).length;
}

export function dayOf(value: string | null | undefined): string {
  const day = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

export function filterAudit(rows: readonly AuditRow[], level: string): AuditRow[] {
  if (!level) return rows.slice();
  return rows.filter((row) => String(row.level || "") === level);
}

export function auditLevels(rows: readonly AuditRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const level = String(row.level || "").trim();
    if (level && !out.includes(level)) out.push(level);
  }
  return out.sort();
}

export function groupAudit(rows: readonly AuditRow[]): { day: string; rows: AuditRow[] }[] {
  const map: Record<string, AuditRow[]> = {};
  const sorted = [...rows].sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  for (const row of sorted) {
    const key = dayOf(row.at);
    if (!map[key]) map[key] = [];
    map[key].push(row);
  }
  const keys = Object.keys(map).sort((a, b) => {
    if (!a) return 1;
    if (!b) return -1;
    return b.localeCompare(a);
  });
  return keys.map((day) => ({ day, rows: map[day] }));
}

export function findDay(days: readonly string[], query: string): string {
  const day = String(query || "").slice(0, 10);
  return days.includes(day) ? day : "";
}

/** Money only when the loaded detail already has both an amount and a currency. */
export function moneyOf(detail: unknown): { currency: string; amount: number } | null {
  let obj: unknown = detail;
  if (typeof detail === "string") {
    const text = detail.trim();
    if (!text) return null;
    try { obj = JSON.parse(text); } catch { return null; }
  }
  if (!obj || typeof obj !== "object") return null;
  const row = obj as Record<string, unknown>;
  const meta = row.meta && typeof row.meta === "object" ? row.meta as Record<string, unknown> : {};
  const currency = String(meta.currency || row.currency || "").trim().toUpperCase();
  const amount = Number(meta.amount ?? row.amount);
  if (!currency || currency.length > 8 || !Number.isFinite(amount)) return null;
  return { currency, amount };
}

export function moneyLines(rows: readonly AuditRow[]): { currency: string; count: number; amount: number }[] {
  const map: Record<string, { currency: string; count: number; amount: number }> = {};
  for (const row of rows) {
    const money = moneyOf(row.detail);
    if (!money) continue;
    if (!map[money.currency]) map[money.currency] = { currency: money.currency, count: 0, amount: 0 };
    map[money.currency].count += 1;
    map[money.currency].amount = Math.round((map[money.currency].amount + money.amount) * 100) / 100;
  }
  return Object.keys(map).sort().map((key) => map[key]);
}

export function historyCsv(rows: readonly AuditRow[]): string[][] {
  return rows.map((row) => {
    const money = moneyOf(row.detail);
    return [
      String(row.at || ""),
      String(row.action || ""),
      String(row.actor || ""),
      String(row.target || ""),
      String(row.level || ""),
      money ? money.currency : "",
      money ? String(money.amount) : "",
    ];
  });
}
