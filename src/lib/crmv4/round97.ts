/** Local muted customer ids from the loaded list, and order counts grouped by the symbol already on each row. */

export const MUTE_KEY = "crmv4-mute-ids";
export const SYMBOL_KEY = "crmv4-symbol-hide";

export type Person = { id: string; name?: string | null; email?: string | null };

export type SymbolRow = { symbol?: unknown; label?: string | null };

export type SymbolLine = { symbol: string; count: number };

export function customerId(raw: string | null | undefined): string {
  return String(raw || "").trim();
}

/** Blank ids and ids that are not on the loaded list are left out. */
export function readMuted(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => customerId(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = customerId(String(item || ""));
    if (!id || !allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function muteId(muted: readonly string[], id: string, present: readonly string[]): string[] {
  const current = readMuted(muted, present);
  const next = customerId(id);
  if (!next || !present.map((item) => customerId(item)).includes(next) || current.includes(next)) return current;
  return [next, ...current].slice(0, 40);
}

export function unmuteId(muted: readonly string[], id: string, present: readonly string[]): string[] {
  const current = readMuted(muted, present);
  const next = customerId(id);
  if (!next || !current.includes(next)) return current;
  return current.filter((item) => item !== next);
}

export function visiblePeople<T extends Person>(rows: readonly T[], muted: readonly string[], query: string, showMuted: boolean): T[] {
  const gone = new Set(readMuted(muted, rows.map((row) => row.id)));
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const id = customerId(row.id);
    if (!id) return false;
    if (showMuted ? !gone.has(id) : gone.has(id)) return false;
    if (!text) return true;
    return `${row.name || ""} ${row.email || ""}`.toLowerCase().includes(text);
  });
}

export function symbolText(value: unknown): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (value && typeof value === "object" && "symbol" in value) return symbolText((value as { symbol?: unknown }).symbol);
  return "";
}

export function symbolLines(rows: readonly SymbolRow[]): SymbolLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const symbol = symbolText(row.symbol);
    map.set(symbol, (map.get(symbol) || 0) + 1);
  }
  const out: SymbolLine[] = [];
  map.forEach((count, symbol) => out.push({ symbol, count }));
  return out.sort((a, b) => {
    if (!a.symbol) return -1;
    if (!b.symbol) return 1;
    return a.symbol.localeCompare(b.symbol);
  });
}

export function namedSymbols(rows: readonly SymbolRow[]): string[] {
  return symbolLines(rows).map((line) => line.symbol).filter(Boolean);
}

export function readHiddenSymbols(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => symbolText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const symbol = symbolText(String(item || ""));
    if (!symbol || !allow.has(symbol) || out.includes(symbol)) continue;
    out.push(symbol);
  }
  return out;
}

export function toggleSymbol(hidden: readonly string[], symbol: string, present: readonly string[]): string[] {
  const current = readHiddenSymbols(hidden, present);
  const next = symbolText(symbol);
  if (!next || !present.map((item) => symbolText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleSymbols(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSymbols(hidden, present));
  return namedSymbols(present.map((symbol) => ({ symbol }))).filter((symbol) => (showHidden ? gone.has(symbol) : !gone.has(symbol)));
}

export function activeSymbol(selected: string, visible: readonly string[]): string {
  const symbol = symbolText(selected);
  if (!symbol) return "";
  return visible.some((item) => symbolText(item) === symbol) ? symbol : "";
}

export function visibleOrders<T extends SymbolRow>(rows: readonly T[], symbol: string, blank: boolean, query: string): T[] {
  const want = symbolText(symbol);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = symbolText(row.symbol);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
