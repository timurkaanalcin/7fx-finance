/** Local CSV column presets, and UTC days already on loaded audit rows. */

import { LIST_COLS, readCols, type ListCol } from "@/lib/crmv3/table";

export const CSV_PRESET_KEY = "crmv3-csv-presets";
export const CSV_ACTIVE_KEY = "crmv3-csv-columns";
export const AUDIT_DAY_KEY = "crmv3-audit-day-hide";

export type CsvPreset = { id: string; name: string; columns: ListCol[] };

export type CsvPerson = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  desk?: string | null;
  saleStatus?: string | null;
  retentionStatus?: string | null;
  balance?: unknown;
  currency?: string | null;
  active?: boolean | null;
  account?: { balance?: unknown; currency?: string | null } | null;
};

export type DayRow = {
  id: string;
  at?: unknown;
  action?: string | null;
  actor?: string | null;
  target?: string | null;
};

export type DayLine = { day: string; count: number };

function isCol(value: string): value is ListCol {
  return (LIST_COLS as readonly string[]).includes(value);
}

/** Columns already visible on the customer table. Unknown and repeated keys are left out. */
export function tableColumns(raw: unknown): ListCol[] {
  const out: ListCol[] = [];
  for (const col of readCols(raw).columns) if (!out.includes(col)) out.push(col);
  return out;
}

/** Keeps known, visible keys once, in the table's column order. */
export function keepColumns(raw: readonly unknown[], visible: readonly string[]): ListCol[] {
  const wanted = new Set<string>();
  for (const item of raw) {
    const key = String(item ?? "").trim();
    if (isCol(key)) wanted.add(key);
  }
  const out: ListCol[] = [];
  for (const item of visible) {
    const key = String(item || "").trim();
    if (!isCol(key) || !wanted.has(key) || out.includes(key)) continue;
    out.push(key);
  }
  return out;
}

export function resetColumns(visible: readonly string[]): ListCol[] {
  return keepColumns(visible, visible);
}

export function activePresetColumns(raw: unknown, visible: readonly string[]): ListCol[] {
  const picked = keepColumns(Array.isArray(raw) ? raw : [], visible);
  return picked.length ? picked : resetColumns(visible);
}

export function readPresets(raw: unknown, visible: readonly string[]): CsvPreset[] {
  if (!Array.isArray(raw)) return [];
  const out: CsvPreset[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: unknown; name?: unknown; columns?: unknown };
    const name = String(row.name || "").replace(/\s+/g, " ").trim();
    if (!name) continue;
    const columns = keepColumns(Array.isArray(row.columns) ? row.columns : [], visible);
    if (!columns.length) continue;
    const id = String(row.id || name).trim();
    if (!id || out.some((preset) => preset.id === id)) continue;
    out.push({ id, name, columns });
  }
  return out;
}

export function upsertPreset(presets: readonly CsvPreset[], name: string, columns: readonly unknown[], visible: readonly string[]): CsvPreset[] {
  const current = readPresets(presets, visible);
  const label = name.replace(/\s+/g, " ").trim();
  const picked = keepColumns(columns, visible);
  if (!label || !picked.length) return current;
  const id = label.toLowerCase();
  return [...current.filter((row) => row.id !== id), { id, name: label, columns: picked }];
}

function currencyCode(row: CsvPerson): string {
  const code = String(row.currency || row.account?.currency || "").trim();
  return /^[A-Za-z]{3}$/.test(code) ? code.toUpperCase() : "";
}

function numberText(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (value == null) return "";
  return String(value).trim();
}

/** One row, its own currency. A missing currency is left blank. Nothing is added together. */
export function columnText(col: ListCol, row: CsvPerson): string {
  if (col === "customer") return [row.name, row.email].map((item) => String(item || "").trim()).filter(Boolean).join(" ");
  if (col === "country") return String(row.country || "").trim();
  if (col === "desk") return String(row.desk || "").trim();
  if (col === "sale") return String(row.saleStatus || "").trim();
  if (col === "retention") return String(row.retentionStatus || "").trim();
  if (col === "balance") {
    const text = numberText(row.balance ?? row.account?.balance);
    if (!text) return "";
    const code = currencyCode(row);
    return code ? `${text} ${code}` : text;
  }
  return row.active === false ? "frozen" : "active";
}

export function csvLines(rows: readonly CsvPerson[], columns: readonly ListCol[]): string[][] {
  return rows.map((row) => columns.map((col) => columnText(col, row)));
}

/** UTC calendar day already on the timestamp. A missing or unreadable value stays blank. */
export function utcDay(value: unknown): string {
  let at = Number.NaN;
  if (value instanceof Date) at = value.getTime();
  else if (typeof value === "number") at = value;
  else if (typeof value === "string" && value.trim()) at = Date.parse(value.trim());
  if (!Number.isFinite(at)) return "";
  return new Date(at).toISOString().slice(0, 10);
}

export function dayLines(rows: readonly DayRow[]): DayLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const day = utcDay(row.at);
    map.set(day, (map.get(day) || 0) + 1);
  }
  const out: DayLine[] = [];
  map.forEach((count, day) => out.push({ day, count }));
  return out.sort((a, b) => {
    if (!a.day) return -1;
    if (!b.day) return 1;
    return b.day.localeCompare(a.day);
  });
}

export function namedDays(rows: readonly DayRow[]): string[] {
  return dayLines(rows).map((line) => line.day).filter(Boolean);
}

export function readHiddenDays(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => utcDay(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const day = utcDay(String(item || ""));
    if (!day || !allow.has(day) || out.includes(day)) continue;
    out.push(day);
  }
  return out;
}

export function toggleDay(hidden: readonly string[], day: string, present: readonly string[]): string[] {
  const current = readHiddenDays(hidden, present);
  const next = utcDay(day);
  if (!next || !present.map((item) => utcDay(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleDays(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenDays(hidden, present));
  return namedDays(present.map((day) => ({ id: day, at: day }))).filter((day) => (showHidden ? gone.has(day) : !gone.has(day)));
}

export function activeDay(selected: string, visible: readonly string[]): string {
  const day = utcDay(selected);
  if (!day) return "";
  return visible.some((item) => utcDay(item) === day) ? day : "";
}

export function visibleAudits<T extends DayRow>(rows: readonly T[], day: string, blank: boolean, query: string): T[] {
  const want = utcDay(day);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = utcDay(row.at);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.action || ""} ${row.actor || ""} ${row.target || ""}`.toLowerCase().includes(text);
  });
}
