/** Pure helpers for CRM v4 round 43. Periods and the day desk use loaded rows only. */

export type WindowKind = "week" | "month";

export type Windows = {
  currentFrom: string;
  currentTo: string;
  previousFrom: string;
  previousTo: string;
};

export type MoneyStamp = { amount?: number | null; currency?: string | null; at?: string | null };

export type CompareRow = {
  currency: string;
  currentCount: number;
  currentAmount: number;
  previousCount: number;
  previousAmount: number;
};

function dayMs(iso: string): number {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, (month || 1) - 1, day || 1);
}

function fmt(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return fmt(dayMs(iso) + days * 86400000);
}

export function isDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.slice(0, 10)) && !Number.isNaN(dayMs(value));
}

/** This window ends today. The previous window has the same number of UTC days. */
export function compareWindows(today: string, kind: WindowKind): Windows {
  const currentTo = today.slice(0, 10);
  let currentFrom = currentTo;
  if (kind === "week") {
    const weekday = new Date(dayMs(currentTo)).getUTCDay();
    const back = weekday === 0 ? 6 : weekday - 1;
    currentFrom = addDays(currentTo, -back);
  } else {
    currentFrom = `${currentTo.slice(0, 7)}-01`;
  }
  const span = Math.round((dayMs(currentTo) - dayMs(currentFrom)) / 86400000);
  const previousTo = addDays(currentFrom, -1);
  const previousFrom = addDays(previousTo, -span);
  return { currentFrom, currentTo, previousFrom, previousTo };
}

export function inWindow(at: string | null | undefined, from: string, to: string): boolean {
  const day = String(at || "").slice(0, 10);
  if (!isDay(day)) return false;
  return day >= from && day <= to;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function currencyCompare(rows: readonly MoneyStamp[], windows: Windows): CompareRow[] {
  const map: Record<string, CompareRow> = {};
  function bucket(currency: string): CompareRow {
    if (!map[currency]) {
      map[currency] = { currency, currentCount: 0, currentAmount: 0, previousCount: 0, previousAmount: 0 };
    }
    return map[currency];
  }
  for (const row of rows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    if (!currency) continue;
    const amount = Number(row.amount);
    const add = Number.isFinite(amount) ? amount : 0;
    if (inWindow(row.at, windows.currentFrom, windows.currentTo)) {
      const item = bucket(currency);
      item.currentCount += 1;
      item.currentAmount = round2(item.currentAmount + add);
    } else if (inWindow(row.at, windows.previousFrom, windows.previousTo)) {
      const item = bucket(currency);
      item.previousCount += 1;
      item.previousAmount = round2(item.previousAmount + add);
    }
  }
  const keys = Object.keys(map).sort();
  const out: CompareRow[] = [];
  for (const key of keys) out.push(map[key]);
  return out;
}

export function leftOut(rows: readonly MoneyStamp[], windows: Windows): { noDate: number; outside: number; noCurrency: number } {
  let noDate = 0;
  let outside = 0;
  let noCurrency = 0;
  for (const row of rows) {
    const currency = String(row.currency || "").trim();
    if (!currency) noCurrency += 1;
    const day = String(row.at || "").slice(0, 10);
    if (!isDay(day)) noDate += 1;
    else if (!inWindow(day, windows.currentFrom, windows.currentTo) && !inWindow(day, windows.previousFrom, windows.previousTo)) outside += 1;
  }
  return { noDate, outside, noCurrency };
}

export function datedCount(rows: readonly { at?: string | null }[], from: string, to: string): number {
  let count = 0;
  for (const row of rows) if (inWindow(row.at, from, to)) count += 1;
  return count;
}

export type StaffRow = {
  id: string;
  name?: string | null;
  assigneeName?: string | null;
  retentionFollowUpAt?: string | null;
};

export function assignedTo<T extends StaffRow>(rows: readonly T[], staff: string): T[] {
  const name = staff.trim().toLowerCase();
  if (!name) return [];
  const out: T[] = [];
  for (const row of rows) {
    if (String(row.assigneeName || "").trim().toLowerCase() === name) out.push(row);
  }
  return out;
}

export function overdueFollows<T extends StaffRow>(rows: readonly T[], today: string): T[] {
  const out: T[] = [];
  for (const row of rows) {
    const day = String(row.retentionFollowUpAt || "").slice(0, 10);
    if (isDay(day) && day < today.slice(0, 10)) out.push(row);
  }
  return out;
}

export type FlatTask = { customerId: string; id: string; text: string; done: boolean };

export function flatTasks(map: Record<string, { id: string; text: string; done: boolean }[]>): FlatTask[] {
  const out: FlatTask[] = [];
  const ids = Object.keys(map).sort();
  for (const customerId of ids) {
    for (const task of map[customerId] || []) out.push({ customerId, id: task.id, text: task.text, done: task.done });
  }
  return out;
}

export function readPins(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

export function togglePin(pins: readonly string[], id: string): string[] {
  if (!id) return pins.slice();
  return pins.includes(id) ? pins.filter((item) => item !== id) : [...pins, id];
}
