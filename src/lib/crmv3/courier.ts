/** Local courier notes, and partner counts grouped by the country already on each row. */

export const COURIER_KEY = "crmv3-courier-notes";
export const IB_COUNTRY_KEY = "crmv3-ib-ctry-hide";

/** Country fields the loaded membership row already carries. A region is not a country. */
export const COUNTRY_FIELDS = ["country", "registrationCountry"] as const;

/** Introducer fields already on the row. A campaign is not an introducer. */
export const PARTNER_FIELDS = ["affiliateA", "affiliateB", "affiliateC"] as const;

export type Note = {
  id: string;
  text: string;
  spot: string;
  pinned: boolean;
  hidden: boolean;
};

export type CountryValue = { country?: unknown; registrationCountry?: unknown } | string | null | undefined;

export type PartnerValue = { affiliateA?: unknown; affiliateB?: unknown; affiliateC?: unknown } | null | undefined;

export type CountryRow = { country?: CountryValue; label?: string | null };

export type CountryLine = { country: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank locker or desk label stays blank. It is not filled in. */
export function spotLabel(raw: unknown): string {
  return clip(raw, 40);
}

export function readNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  const out: Note[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Note>;
    const id = String(row.id || "").trim();
    const text = noteText(row.text);
    if (!id || !text || out.some((note) => note.id === id)) continue;
    out.push({ id, text, spot: spotLabel(row.spot), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; spot?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const spot = spotLabel(note.spot);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, spot, pinned: false, hidden: false }, ...current].slice(0, 40);
}

export function toggleNotePin(notes: readonly Note[], id: string): Note[] {
  return readNotes(notes).map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
}

export function setNoteHidden(notes: readonly Note[], id: string, hidden: boolean): Note[] {
  return readNotes(notes).map((note) => (note.id === id ? { ...note, hidden } : note));
}

export function resetNotes(): Note[] {
  return [];
}

/** Search stays on the note text. The locker or desk label is not part of the query. */
export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The first introducer code already on the row. A blank code is not a partner. */
export function partnerText(value: PartnerValue): string {
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  for (const field of PARTNER_FIELDS) {
    const text = plain(row[field]);
    if (text) return text;
  }
  return "";
}

/** Country, then registration country. A region or a number is not a country. */
export function countryText(value: CountryValue): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  for (const field of COUNTRY_FIELDS) {
    const text = plain(row[field]);
    if (text) return text;
  }
  return "";
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

export function visiblePartners<T extends CountryRow>(rows: readonly T[], country: string, blank: boolean, query: string): T[] {
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
