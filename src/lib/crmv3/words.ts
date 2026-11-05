/** Local watch words, and customer counts grouped by the language already on each row. */

export const WATCH_KEY = "crmv3-watch-words";
export const LANG_KEY = "crmv3-lang-hide";

export type WatchWord = {
  id: string;
  text: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type LangRow = { language?: unknown; locale?: unknown; label?: string | null };

export type LangLine = { language: string; count: number };

export type Part = { text: string; hit: boolean };

export function wordText(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function readWords(raw: unknown): WatchWord[] {
  if (!Array.isArray(raw)) return [];
  const out: WatchWord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WatchWord>;
    const id = String(row.id || "").trim();
    const text = wordText(row.text);
    if (!id || !text || out.some((word) => word.id === id || word.text.toLowerCase() === text.toLowerCase())) continue;
    out.push({ id, text, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addWord(words: readonly WatchWord[], word: { id: string; text: string; at: string }): WatchWord[] {
  const id = String(word.id || "").trim();
  const text = wordText(word.text);
  if (!id || !text || words.some((item) => item.id === id || item.text.toLowerCase() === text.toLowerCase())) return words.slice();
  return [{ id, text, pinned: false, hidden: false, at: word.at }, ...words].slice(0, 40);
}

export function toggleWordPin(words: readonly WatchWord[], id: string): WatchWord[] {
  return words.map((word) => (word.id === id ? { ...word, pinned: !word.pinned } : word));
}

export function setWordHidden(words: readonly WatchWord[], id: string, hidden: boolean): WatchWord[] {
  return words.map((word) => (word.id === id ? { ...word, hidden } : word));
}

export function visibleWords(words: readonly WatchWord[], query: string, hidden: boolean): WatchWord[] {
  const text = query.trim().toLowerCase();
  return words
    .filter((word) => word.hidden === hidden && (!text || word.text.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** Split already-loaded text. A word that is not in the text adds no hit. */
export function highlightParts(text: string, words: readonly string[]): Part[] {
  const source = String(text || "");
  const needles = Array.from(new Set(words.map((word) => wordText(word).toLowerCase()).filter(Boolean))).sort((a, b) => b.length - a.length);
  if (!source || !needles.length) return [{ text: source, hit: false }];
  const lower = source.toLowerCase();
  const marks: { start: number; end: number }[] = [];
  for (const needle of needles) {
    let from = 0;
    while (from < lower.length) {
      const at = lower.indexOf(needle, from);
      if (at < 0) break;
      marks.push({ start: at, end: at + needle.length });
      from = at + needle.length;
    }
  }
  marks.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: { start: number; end: number }[] = [];
  for (const mark of marks) {
    const last = merged[merged.length - 1];
    if (!last || mark.start > last.end) merged.push({ ...mark });
    else last.end = Math.max(last.end, mark.end);
  }
  const out: Part[] = [];
  let cursor = 0;
  for (const mark of merged) {
    if (mark.start > cursor) out.push({ text: source.slice(cursor, mark.start), hit: false });
    out.push({ text: source.slice(mark.start, mark.end), hit: true });
    cursor = mark.end;
  }
  if (cursor < source.length) out.push({ text: source.slice(cursor), hit: false });
  return out.length ? out : [{ text: source, hit: false }];
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** The language already on the row, then a locale. A missing value stays blank. */
export function languageText(value: unknown): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  const row = value as { language?: unknown; locale?: unknown };
  return plain(row.language) || plain(row.locale);
}

export function languageLines(rows: readonly LangRow[]): LangLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const language = languageText(row);
    map.set(language, (map.get(language) || 0) + 1);
  }
  const out: LangLine[] = [];
  map.forEach((count, language) => out.push({ language, count }));
  return out.sort((a, b) => {
    if (!a.language) return -1;
    if (!b.language) return 1;
    return a.language.localeCompare(b.language);
  });
}

export function namedLanguages(rows: readonly LangRow[]): string[] {
  return languageLines(rows).map((line) => line.language).filter(Boolean);
}

export function readHiddenLanguages(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => languageText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const language = languageText(String(item || ""));
    if (!language || !allow.has(language) || out.includes(language)) continue;
    out.push(language);
  }
  return out;
}

export function toggleLanguage(hidden: readonly string[], language: string, present: readonly string[]): string[] {
  const current = readHiddenLanguages(hidden, present);
  const next = languageText(language);
  if (!next || !present.map((item) => languageText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleLanguages(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenLanguages(hidden, present));
  return namedLanguages(present.map((language) => ({ language }))).filter((language) => (showHidden ? gone.has(language) : !gone.has(language)));
}

export function activeLanguage(selected: string, visible: readonly string[]): string {
  const language = languageText(selected);
  if (!language) return "";
  return visible.some((item) => languageText(item) === language) ? language : "";
}

export function visibleCustomers<T extends LangRow>(rows: readonly T[], language: string, blank: boolean, query: string): T[] {
  const want = languageText(language);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = languageText(row);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
