/** One focused customer from the loaded list, and order counts grouped by the type already on each row. */

export const FOCUS_CUSTOMER_KEY = "crmv3-focus-customer";
export const ORDER_TYPE_KEY = "crmv3-order-type-hide";

export type Person = { id: string; name?: string | null; email?: string | null };

export type TypeRow = { type?: unknown; label?: string | null };

export type TypeLine = { type: string; count: number };

export function customerId(raw: string | null | undefined): string {
  return String(raw || "").trim();
}

/** A blank id, or an id that is not on the loaded list, is left out. */
export function readFocus(raw: unknown, present: readonly string[]): string {
  const id = customerId(typeof raw === "string" ? raw : "");
  if (!id) return "";
  return present.map((item) => customerId(item)).includes(id) ? id : "";
}

/** One id. An unknown id does not replace the current focus. */
export function setFocus(current: string, id: string, present: readonly string[]): string {
  const next = customerId(id);
  const allow = present.map((item) => customerId(item));
  if (!next || !allow.includes(next)) return readFocus(current, present);
  return next;
}

export function clearFocus(): string {
  return "";
}

export function visiblePeople<T extends Person>(rows: readonly T[], query: string): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!customerId(row.id)) return false;
    if (!text) return true;
    return `${row.name || ""} ${row.email || ""}`.toLowerCase().includes(text);
  });
}

/** The order type already on the row. Side and status are not a type. */
export function orderType(value: unknown): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (value && typeof value === "object" && "type" in value) return orderType((value as { type?: unknown }).type);
  return "";
}

export function typeLines(rows: readonly TypeRow[]): TypeLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const type = orderType(row.type);
    map.set(type, (map.get(type) || 0) + 1);
  }
  const out: TypeLine[] = [];
  map.forEach((count, type) => out.push({ type, count }));
  return out.sort((a, b) => {
    if (!a.type) return -1;
    if (!b.type) return 1;
    return a.type.localeCompare(b.type);
  });
}

export function namedTypes(rows: readonly TypeRow[]): string[] {
  return typeLines(rows).map((line) => line.type).filter(Boolean);
}

export function readHiddenTypes(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => orderType(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const type = orderType(String(item || ""));
    if (!type || !allow.has(type) || out.includes(type)) continue;
    out.push(type);
  }
  return out;
}

export function toggleType(hidden: readonly string[], type: string, present: readonly string[]): string[] {
  const current = readHiddenTypes(hidden, present);
  const next = orderType(type);
  if (!next || !present.map((item) => orderType(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleTypes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenTypes(hidden, present));
  return namedTypes(present.map((type) => ({ type }))).filter((type) => (showHidden ? gone.has(type) : !gone.has(type)));
}

export function activeType(selected: string, visible: readonly string[]): string {
  const type = orderType(selected);
  if (!type) return "";
  return visible.some((item) => orderType(item) === type) ? type : "";
}

export function visibleOrders<T extends TypeRow>(rows: readonly T[], type: string, blank: boolean, query: string): T[] {
  const want = orderType(type);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = orderType(row.type);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
