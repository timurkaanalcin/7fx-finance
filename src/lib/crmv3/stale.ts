/** Stale customers from loaded activity, and local call scripts. Currencies are never added together. */

export const WINDOW_KEY = "crmv3-stale-window";
export const WATCH_KEY = "crmv3-stale-watch";
export const SCRIPT_KEY = "crmv3-call-scripts";

export const WINDOWS = [30, 90] as const;
export type StaleWindow = (typeof WINDOWS)[number];
export type ActivityState = "stale" | "fresh" | "none";

export type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  desk?: string | null;
  lastSeenAt?: string | null;
  lastLoginAt?: string | null;
  lastContactAt?: string | null;
  balance?: number | null;
  currency?: string | null;
};

export type CurrencyTotal = { currency: string; count: number; amount: number };

export type CallScript = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export function readWindow(raw: unknown): StaleWindow {
  return Number(raw) === 90 ? 90 : 30;
}

export function latestActivity(row: Pick<Person, "lastSeenAt" | "lastLoginAt" | "lastContactAt">): number | null {
  const times = [row.lastSeenAt, row.lastLoginAt, row.lastContactAt]
    .map((value) => Date.parse(String(value || "")))
    .filter((value) => Number.isFinite(value));
  if (!times.length) return null;
  return Math.max(...times);
}

/** Stale only when a loaded time is older than the window. A missing time is not treated as old. */
export function activityState(row: Pick<Person, "lastSeenAt" | "lastLoginAt" | "lastContactAt">, now = Date.now(), days: StaleWindow = 30): ActivityState {
  const latest = latestActivity(row);
  if (latest == null) return "none";
  return latest <= now - days * 86400000 ? "stale" : "fresh";
}

export function filterPeople(rows: readonly Person[], query: string, state: "" | ActivityState, now = Date.now(), days: StaleWindow = 30): Person[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (state && activityState(row, now, days) !== state) return false;
    if (!text) return true;
    return `${row.name || ""} ${row.email || ""} ${row.desk || ""} ${row.currency || ""}`.toLowerCase().includes(text);
  });
}

export function readIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 200);
}

export function toggleId(ids: readonly string[], id: string): string[] {
  if (!id) return ids.slice();
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function sortPeople(rows: readonly Person[], pins: readonly string[]): Person[] {
  return rows.slice().sort((a, b) => {
    const ap = pins.includes(a.id);
    const bp = pins.includes(b.id);
    if (ap !== bp) return ap ? -1 : 1;
    const at = latestActivity(a);
    const bt = latestActivity(b);
    if (at == null && bt == null) return String(a.name || "").localeCompare(String(b.name || ""));
    if (at == null) return 1;
    if (bt == null) return -1;
    return at - bt;
  });
}

export function visiblePeople(rows: readonly Person[], query: string, state: "" | ActivityState, pins: readonly string[], now = Date.now(), days: StaleWindow = 30): Person[] {
  return sortPeople(filterPeople(rows, query, state, now, days), pins);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function balanceTotals(rows: readonly Person[]): CurrencyTotal[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    const prev = map.get(currency) || { count: 0, amount: 0 };
    prev.count += 1;
    const amount = Number(row.balance);
    if (Number.isFinite(amount)) prev.amount = round2(prev.amount + amount);
    map.set(currency, prev);
  }
  const out: CurrencyTotal[] = [];
  map.forEach((value, currency) => out.push({ currency, count: value.count, amount: value.amount }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

export function cleanLine(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function readScripts(raw: unknown): CallScript[] {
  if (!Array.isArray(raw)) return [];
  const out: CallScript[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CallScript>;
    const id = String(row.id || "").trim();
    const body = cleanLine(String(row.body || ""));
    const title = cleanLine(String(row.title || ""));
    if (!id || !body || out.some((script) => script.id === id)) continue;
    out.push({ id, title, body, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addScript(scripts: readonly CallScript[], script: { id: string; title: string; body: string; at: string }): CallScript[] {
  const id = String(script.id || "").trim();
  const body = cleanLine(script.body);
  const title = cleanLine(script.title);
  if (!id || !body || scripts.some((item) => item.id === id)) return scripts.slice();
  return [{ id, title, body, pinned: false, hidden: false, at: script.at }, ...scripts].slice(0, 40);
}

export function toggleScriptPin(scripts: readonly CallScript[], id: string): CallScript[] {
  return scripts.map((script) => (script.id === id ? { ...script, pinned: !script.pinned } : script));
}

export function hideScript(scripts: readonly CallScript[], id: string, hidden: boolean): CallScript[] {
  return scripts.map((script) => (script.id === id ? { ...script, hidden } : script));
}

export function removeScript(scripts: readonly CallScript[], id: string): CallScript[] {
  return scripts.filter((script) => script.id !== id);
}

export function visibleScripts(scripts: readonly CallScript[], query: string, hidden: boolean): CallScript[] {
  const text = query.trim().toLowerCase();
  return scripts
    .filter((script) => script.hidden === hidden && (!text || `${script.title} ${script.body}`.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
