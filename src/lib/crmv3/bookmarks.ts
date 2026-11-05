/** Named jumps to existing sections, and pending versus approved counts from loaded KYC rows. */

export const BAR_KEY = "crmv3-desk-bookmarks";
export const KYC_KEY = "crmv3-kyc-hide";

export const GLANCE_KINDS = ["pending", "approved"] as const;
export type GlanceKind = (typeof GLANCE_KINDS)[number];

export type Bookmark = {
  id: string;
  name: string;
  sectionId: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type StatusRow = { status?: string | null; label?: string | null };

export type StatusSplit = { pending: number; approved: number };

export type OtherLine = { status: string; count: number };

export function cleanName(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function readBookmarks(raw: unknown, allowed: readonly string[]): Bookmark[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(allowed.map((id) => String(id || "").trim()).filter(Boolean));
  const out: Bookmark[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Bookmark>;
    const id = String(row.id || "").trim();
    const name = cleanName(String(row.name || ""));
    const sectionId = String(row.sectionId || "").trim();
    if (!id || !name || !sectionId || !allow.has(sectionId) || out.some((mark) => mark.id === id)) continue;
    out.push({
      id,
      name,
      sectionId,
      pinned: row.pinned === true,
      hidden: row.hidden === true,
      at: String(row.at || ""),
    });
  }
  return out.slice(0, 40);
}

/** A blank name is left out. A route that is not an existing section is left out. */
export function addBookmark(
  items: readonly Bookmark[],
  mark: { id: string; name: string; sectionId: string; at: string },
  allowed: readonly string[],
): Bookmark[] {
  const id = String(mark.id || "").trim();
  const name = cleanName(mark.name);
  const sectionId = String(mark.sectionId || "").trim();
  if (!id || !name || !sectionId || !allowed.includes(sectionId) || items.some((item) => item.id === id)) return items.slice();
  return [{ id, name, sectionId, pinned: false, hidden: false, at: mark.at }, ...items].slice(0, 40);
}

export function toggleBookmarkPin(items: readonly Bookmark[], id: string): Bookmark[] {
  return items.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
}

export function setBookmarkHidden(items: readonly Bookmark[], id: string, hidden: boolean): Bookmark[] {
  return items.map((item) => (item.id === id ? { ...item, hidden } : item));
}

/** Search uses the saved name. */
export function visibleBookmarks(items: readonly Bookmark[], query: string, hidden: boolean): Bookmark[] {
  const text = query.trim().toLowerCase();
  return items
    .filter((item) => item.hidden === hidden && (!text || item.name.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}

/** Pending and approved only. A blank or any other status is not renamed. */
export function statusKind(raw: string | null | undefined): GlanceKind | "" {
  const value = String(raw || "").trim().toUpperCase();
  if (value === "PENDING") return "pending";
  if (value === "APPROVED") return "approved";
  return "";
}

export function rawStatus(raw: string | null | undefined): string {
  return String(raw || "").trim().toUpperCase();
}

export function statusSplit(rows: readonly StatusRow[]): StatusSplit {
  let pending = 0;
  let approved = 0;
  for (const row of rows) {
    const kind = statusKind(row.status);
    if (kind === "pending") pending += 1;
    else if (kind === "approved") approved += 1;
  }
  return { pending, approved };
}

/** Statuses that are present and are neither pending nor approved. A blank is left out. */
export function otherLines(rows: readonly StatusRow[]): OtherLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const status = rawStatus(row.status);
    if (!status || statusKind(status)) continue;
    map.set(status, (map.get(status) || 0) + 1);
  }
  const out: OtherLine[] = [];
  map.forEach((count, status) => out.push({ status, count }));
  return out.sort((a, b) => a.status.localeCompare(b.status));
}

export function presentKinds(rows: readonly StatusRow[]): GlanceKind[] {
  const split = statusSplit(rows);
  const out: GlanceKind[] = [];
  if (split.pending > 0) out.push("pending");
  if (split.approved > 0) out.push("approved");
  return out;
}

export function readHiddenKinds(raw: unknown): GlanceKind[] {
  if (!Array.isArray(raw)) return [];
  const out: GlanceKind[] = [];
  for (const item of raw) {
    const kind = statusKind(String(item || ""));
    if (kind && !out.includes(kind)) out.push(kind);
  }
  return out;
}

export function toggleKind(hidden: readonly string[], kind: string): GlanceKind[] {
  const current = readHiddenKinds(hidden);
  const next = statusKind(kind);
  if (!next) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleKinds(present: readonly string[], hidden: readonly string[], showHidden: boolean): GlanceKind[] {
  const gone = new Set(readHiddenKinds(hidden));
  return presentKinds(present.map((status) => ({ status }))).filter((kind) => (showHidden ? gone.has(kind) : !gone.has(kind)));
}

/** A selected chip that is not on the open row is cleared. */
export function activeKind(selected: string, visible: readonly string[]): GlanceKind | "" {
  const kind = statusKind(selected);
  if (!kind) return "";
  return visible.some((item) => statusKind(item) === kind) ? kind : "";
}

export function visibleStatus<T extends StatusRow>(rows: readonly T[], kind: string, query: string): T[] {
  const want = statusKind(kind);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = statusKind(row.status);
    if (!got) return false;
    if (want && got !== want) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}
