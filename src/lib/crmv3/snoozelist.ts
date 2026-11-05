/** Local snoozes for loaded customers, and deposit counts grouped by the method already on each row. */

export const SNOOZE_KEY = "crmv3-customer-snooze";
export const METHOD_KEY = "crmv3-dep-method-hide";

export type Person = { id: string; name?: string | null; email?: string | null };

export type Snooze = { id: string; note: string };

export type Method = { label?: string | null; type?: string | null } | string | null | undefined;

export type MethodRow = { method?: Method; label?: string | null };

export type MethodLine = { method: string; count: number };

export function customerId(raw: string | null | undefined): string {
  return String(raw || "").trim();
}

/** A blank note stays blank. A line break becomes a space. */
export function noteText(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Blank ids and ids that are not on the loaded list are left out. */
export function readSnoozes(raw: unknown, present: readonly string[]): Snooze[] {
  const allow = new Set(present.map((item) => customerId(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: Snooze[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Snooze>;
    const id = customerId(row.id);
    if (!id || !allow.has(id) || out.some((snooze) => snooze.id === id)) continue;
    out.push({ id, note: noteText(row.note) });
  }
  return out.slice(0, 40);
}

/** An unknown id does not join the list. A blank note is kept. */
export function snoozeCustomer(snoozes: readonly Snooze[], id: string, note: string, present: readonly string[]): Snooze[] {
  const next = customerId(id);
  if (!next || !present.map((item) => customerId(item)).includes(next)) return readSnoozes(snoozes, present);
  const text = noteText(note);
  const rest = readSnoozes(snoozes, present).filter((item) => item.id !== next);
  return [{ id: next, note: text }, ...rest].slice(0, 40);
}

export function wakeCustomer(snoozes: readonly Snooze[], id: string, present: readonly string[]): Snooze[] {
  const next = customerId(id);
  return readSnoozes(snoozes, present).filter((item) => item.id !== next);
}

export function clearSnoozes(): Snooze[] {
  return [];
}

export function visiblePeople<T extends Person>(rows: readonly T[], snoozes: readonly Snooze[], query: string, snoozed: boolean): T[] {
  const byId = new Map(snoozes.map((item) => [item.id, item.note]));
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const id = customerId(row.id);
    if (!id) return false;
    const note = byId.get(id);
    if ((note !== undefined) !== snoozed) return false;
    if (!text) return true;
    return `${row.name || ""} ${row.email || ""} ${note || ""}`.toLowerCase().includes(text);
  });
}

/** The method label, or the method type when the label is blank. A missing method stays blank. */
export function methodText(method: Method): string {
  if (typeof method === "string") return method.replace(/\s+/g, " ").trim();
  if (!method || typeof method !== "object") return "";
  const label = String(method.label || "").replace(/\s+/g, " ").trim();
  if (label) return label;
  return String(method.type || "").replace(/\s+/g, " ").trim();
}

export function methodLines(rows: readonly MethodRow[]): MethodLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const method = methodText(row.method);
    map.set(method, (map.get(method) || 0) + 1);
  }
  const out: MethodLine[] = [];
  map.forEach((count, method) => out.push({ method, count }));
  return out.sort((a, b) => {
    if (!a.method) return -1;
    if (!b.method) return 1;
    return a.method.localeCompare(b.method);
  });
}

export function namedMethods(rows: readonly MethodRow[]): string[] {
  return methodLines(rows).map((line) => line.method).filter(Boolean);
}

export function readHiddenMethods(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => methodText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const method = methodText(String(item || ""));
    if (!method || !allow.has(method) || out.includes(method)) continue;
    out.push(method);
  }
  return out;
}

export function toggleMethod(hidden: readonly string[], method: string, present: readonly string[]): string[] {
  const current = readHiddenMethods(hidden, present);
  const next = methodText(method);
  if (!next || !present.map((item) => methodText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleMethods(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenMethods(hidden, present));
  return namedMethods(present.map((method) => ({ method }))).filter((method) => (showHidden ? gone.has(method) : !gone.has(method)));
}

export function activeMethod(selected: string, visible: readonly string[]): string {
  const method = methodText(selected);
  if (!method) return "";
  return visible.some((item) => methodText(item) === method) ? method : "";
}

export function visibleDeposits<T extends MethodRow>(rows: readonly T[], method: string, blank: boolean, query: string): T[] {
  const want = methodText(method);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = methodText(row.method);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
