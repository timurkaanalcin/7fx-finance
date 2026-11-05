/** Local ordered checklist items, and customer counts grouped by the country already on each row. */

export const CHECK_KEY = "crmv4-desk-check";
export const COUNTRY_KEY = "crmv4-country-hide";

export type CheckMode = "open" | "done" | "hidden";

export type Item = {
  id: string;
  text: string;
  done: boolean;
  pinned: boolean;
  hidden: boolean;
  order: number;
};

export type CountryValue = { country?: unknown; registrationCountry?: unknown; region?: unknown } | string | null | undefined;

export type CountryRow = { country?: CountryValue; label?: string | null };

export type CountryLine = { country: string; count: number };

export function itemText(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function readItems(raw: unknown): Item[] {
  if (!Array.isArray(raw)) return [];
  const out: Item[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Item>;
    const id = String(row.id || "").trim();
    const text = itemText(row.text);
    const order = Number(row.order);
    if (!id || !text || out.some((entry) => entry.id === id)) continue;
    out.push({
      id,
      text,
      done: row.done === true,
      pinned: row.pinned === true,
      hidden: row.hidden === true,
      order: Number.isFinite(order) ? order : out.length + 1,
    });
  }
  return out.slice(0, 60);
}

export function addItem(items: readonly Item[], item: { id: string; text: string }): Item[] {
  const id = String(item.id || "").trim();
  const text = itemText(item.text);
  if (!id || !text || items.some((entry) => entry.id === id)) return items.slice();
  const order = items.reduce((max, entry) => Math.max(max, entry.order), 0) + 1;
  return [...items, { id, text, done: false, pinned: false, hidden: false, order }].slice(0, 60);
}

export function setItemDone(items: readonly Item[], id: string, done: boolean): Item[] {
  return items.map((item) => (item.id === id ? { ...item, done } : item));
}

export function toggleItemPin(items: readonly Item[], id: string): Item[] {
  return items.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
}

export function setItemHidden(items: readonly Item[], id: string, hidden: boolean): Item[] {
  return items.map((item) => (item.id === id ? { ...item, hidden } : item));
}

export function moveItem(items: readonly Item[], id: string, direction: -1 | 1): Item[] {
  const ordered = items.slice().sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((item) => item.id === id);
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= ordered.length) return items.slice();
  const next = items.map((item) => ({ ...item }));
  const current = next.find((item) => item.id === ordered[index].id);
  const other = next.find((item) => item.id === ordered[swap].id);
  if (!current || !other) return items.slice();
  const order = current.order;
  current.order = other.order;
  other.order = order;
  return next;
}

export function visibleItems(items: readonly Item[], query: string, mode: CheckMode): Item[] {
  const text = query.trim().toLowerCase();
  return items
    .filter((item) => {
      if (mode === "hidden") return item.hidden;
      if (item.hidden) return false;
      if (mode === "done") return item.done;
      return !item.done;
    })
    .filter((item) => !text || item.text.toLowerCase().includes(text))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.order - b.order;
    });
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** The country already on the row, then the registration country, then a region. A missing value stays blank. */
export function countryText(value: CountryValue): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  return plain(value.country) || plain(value.registrationCountry) || plain(value.region);
}

export function countryLines(rows: readonly CountryRow[]): CountryLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const country = countryText(row.country);
    map.set(country, (map.get(country) || 0) + 1);
  }
  const out: CountryLine[] = [];
  map.forEach((count, country) => out.push({ country, count }));
  return out.sort((a, b) => {
    if (!a.country) return -1;
    if (!b.country) return 1;
    return a.country.localeCompare(b.country);
  });
}

export function namedCountries(rows: readonly CountryRow[]): string[] {
  return countryLines(rows).map((line) => line.country).filter(Boolean);
}

export function readHiddenCountries(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => countryText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const country = countryText(String(item || ""));
    if (!country || !allow.has(country) || out.includes(country)) continue;
    out.push(country);
  }
  return out;
}

export function toggleCountry(hidden: readonly string[], country: string, present: readonly string[]): string[] {
  const current = readHiddenCountries(hidden, present);
  const next = countryText(country);
  if (!next || !present.map((item) => countryText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleCountries(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenCountries(hidden, present));
  return namedCountries(present.map((country) => ({ country }))).filter((country) => (showHidden ? gone.has(country) : !gone.has(country)));
}

export function activeCountry(selected: string, visible: readonly string[]): string {
  const country = countryText(selected);
  if (!country) return "";
  return visible.some((item) => countryText(item) === country) ? country : "";
}

export function visibleCustomers<T extends CountryRow>(rows: readonly T[], country: string, blank: boolean, query: string): T[] {
  const want = countryText(country);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = countryText(row.country);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
