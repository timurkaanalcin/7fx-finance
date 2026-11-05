/** Local bookmarks of existing sections, and withdrawal counts grouped by the status already on each row. */

import { CRM_V3_SECTIONS } from "@/lib/crmv3/sections";

export const BOOK_KEY = "crmv3-bookmark-board";
export const WD_GLANCE_KEY = "crmv3-wd-glance-hide";

export type Bookmark = {
  id: string;
  label: string;
  section: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type StatusRow = { status?: unknown; label?: string | null };

export type StatusLine = { status: string; count: number };

/** A line break becomes a space. A blank label is left out. */
export function bookmarkLabel(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

/** Only a section id that already exists. A path or an unknown route is left out. */
export function sectionId(raw: string | null | undefined): string {
  const id = String(raw || "").trim();
  if (!id || id.includes("/") || id.includes(":") || id.includes("?")) return "";
  return CRM_V3_SECTIONS.some((section) => section.id === id) ? id : "";
}

export function sectionPath(id: string): string {
  return CRM_V3_SECTIONS.find((section) => section.id === sectionId(id))?.path ?? "";
}

export function readBookmarks(raw: unknown): Bookmark[] {
  if (!Array.isArray(raw)) return [];
  const out: Bookmark[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Bookmark>;
    const id = String(row.id || "").trim();
    const label = bookmarkLabel(row.label);
    const section = sectionId(row.section);
    if (!id || !label || !section || out.some((item) => item.id === id || item.label === label || item.section === section)) continue;
    out.push({ id, label, section, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addBookmark(bookmarks: readonly Bookmark[], bookmark: { id: string; label: string; section: string; at: string }): Bookmark[] {
  const id = String(bookmark.id || "").trim();
  const label = bookmarkLabel(bookmark.label);
  const section = sectionId(bookmark.section);
  if (!id || !label || !section || bookmarks.some((item) => item.id === id || item.label === label || item.section === section)) return bookmarks.slice();
  return [{ id, label, section, pinned: false, hidden: false, at: bookmark.at }, ...bookmarks].slice(0, 40);
}

export function toggleBookmarkPin(bookmarks: readonly Bookmark[], id: string): Bookmark[] {
  return bookmarks.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
}

export function setBookmarkHidden(bookmarks: readonly Bookmark[], id: string, hidden: boolean): Bookmark[] {
  return bookmarks.map((item) => (item.id === id ? { ...item, hidden } : item));
}

export function visibleBookmarks(bookmarks: readonly Bookmark[], query: string, hidden: boolean): Bookmark[] {
  const text = query.trim().toLowerCase();
  return bookmarks
    .filter((item) => item.hidden === hidden && (!text || item.label.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** The status already on the row. A method is not a status. */
export function statusText(value: unknown): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (value && typeof value === "object" && "status" in value) return statusText((value as { status?: unknown }).status);
  return "";
}

export function statusLines(rows: readonly StatusRow[]): StatusLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const status = statusText(row.status);
    map.set(status, (map.get(status) || 0) + 1);
  }
  const out: StatusLine[] = [];
  map.forEach((count, status) => out.push({ status, count }));
  return out.sort((a, b) => {
    if (!a.status) return -1;
    if (!b.status) return 1;
    return a.status.localeCompare(b.status);
  });
}

export function namedStatuses(rows: readonly StatusRow[]): string[] {
  return statusLines(rows).map((line) => line.status).filter(Boolean);
}

export function readHiddenStatuses(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => statusText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const status = statusText(String(item || ""));
    if (!status || !allow.has(status) || out.includes(status)) continue;
    out.push(status);
  }
  return out;
}

export function toggleStatus(hidden: readonly string[], status: string, present: readonly string[]): string[] {
  const current = readHiddenStatuses(hidden, present);
  const next = statusText(status);
  if (!next || !present.map((item) => statusText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleStatuses(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenStatuses(hidden, present));
  return namedStatuses(present.map((status) => ({ status }))).filter((status) => (showHidden ? gone.has(status) : !gone.has(status)));
}

export function activeStatus(selected: string, visible: readonly string[]): string {
  const status = statusText(selected);
  if (!status) return "";
  return visible.some((item) => statusText(item) === status) ? status : "";
}

export function visibleWithdrawals<T extends StatusRow>(rows: readonly T[], status: string, blank: boolean, query: string): T[] {
  const want = statusText(status);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = statusText(row.status);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
