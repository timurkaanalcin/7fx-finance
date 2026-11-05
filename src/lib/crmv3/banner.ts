/** Local one-line desk banners, and document counts grouped by the type already on each row. */

export const BANNER_KEY = "crmv3-status-banners";
export const TYPE_KEY = "crmv3-doctype-hide";

export type Banner = {
  id: string;
  text: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type TypeValue = { docType?: string | null; type?: string | null; kind?: string | null } | string | null | undefined;

export type TypeRow = { type?: TypeValue; label?: string | null };

export type TypeLine = { type: string; count: number };

/** Newlines become spaces. A blank line is left out. */
export function oneLine(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function readBanners(raw: unknown): Banner[] {
  if (!Array.isArray(raw)) return [];
  const out: Banner[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Banner>;
    const id = String(row.id || "").trim();
    const text = oneLine(row.text);
    if (!id || !text || out.some((banner) => banner.id === id || banner.text === text)) continue;
    out.push({ id, text, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addBanner(banners: readonly Banner[], banner: { id: string; text: string; at: string }): Banner[] {
  const id = String(banner.id || "").trim();
  const text = oneLine(banner.text);
  if (!id || !text || banners.some((item) => item.id === id || item.text === text)) return banners.slice();
  return [{ id, text, pinned: false, hidden: false, at: banner.at }, ...banners].slice(0, 40);
}

export function toggleBannerPin(banners: readonly Banner[], id: string): Banner[] {
  return banners.map((banner) => (banner.id === id ? { ...banner, pinned: !banner.pinned } : banner));
}

export function setBannerHidden(banners: readonly Banner[], id: string, hidden: boolean): Banner[] {
  return banners.map((banner) => (banner.id === id ? { ...banner, hidden } : banner));
}

export function visibleBanners(banners: readonly Banner[], query: string, hidden: boolean): Banner[] {
  const text = query.trim().toLowerCase();
  return banners
    .filter((banner) => banner.hidden === hidden && (!text || banner.text.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** The document type, kind, or docType already on the row. A missing type stays blank. */
export function typeText(value: TypeValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  const text = value.docType || value.type || value.kind || "";
  return String(text).replace(/\s+/g, " ").trim();
}

export function typeLines(rows: readonly TypeRow[]): TypeLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const type = typeText(row.type);
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
  const allow = new Set(present.map((item) => typeText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const type = typeText(String(item || ""));
    if (!type || !allow.has(type) || out.includes(type)) continue;
    out.push(type);
  }
  return out;
}

export function toggleType(hidden: readonly string[], type: string, present: readonly string[]): string[] {
  const current = readHiddenTypes(hidden, present);
  const next = typeText(type);
  if (!next || !present.map((item) => typeText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleTypes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenTypes(hidden, present));
  return namedTypes(present.map((type) => ({ type }))).filter((type) => (showHidden ? gone.has(type) : !gone.has(type)));
}

export function activeType(selected: string, visible: readonly string[]): string {
  const type = typeText(selected);
  if (!type) return "";
  return visible.some((item) => typeText(item) === type) ? type : "";
}

export function visibleDocs<T extends TypeRow>(rows: readonly T[], type: string, blank: boolean, query: string): T[] {
  const want = typeText(type);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = typeText(row.type);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
