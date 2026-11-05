/** Local color tags for loaded customers, and order counts grouped by the side already on each row. */

import { PALETTE, paletteColor, type PaletteColor } from "@/lib/crmv3/palette";

export const TAG_KEY = "crmv3-color-tags";
export const ASSIGN_KEY = "crmv3-color-assign";
export const SIDE_KEY = "crmv3-trade-side-hide";

export type ColorTag = {
  id: string;
  text: string;
  color: PaletteColor;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type Assignment = { id: string; tagId: string };

export type SideRow = { side?: unknown; label?: string | null };

export type SideLine = { side: string; count: number };

export function tagText(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function customerId(raw: string | null | undefined): string {
  return String(raw || "").trim();
}

export function readTags(raw: unknown): ColorTag[] {
  if (!Array.isArray(raw)) return [];
  const out: ColorTag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ColorTag>;
    const id = String(row.id || "").trim();
    const text = tagText(row.text);
    const color = paletteColor(row.color);
    if (!id || !text || !color || out.some((tag) => tag.id === id || tag.text === text)) continue;
    out.push({ id, text, color, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addTag(tags: readonly ColorTag[], tag: { id: string; text: string; color: string; at: string }): ColorTag[] {
  const id = String(tag.id || "").trim();
  const text = tagText(tag.text);
  const color = paletteColor(tag.color);
  if (!id || !text || !color || tags.some((item) => item.id === id || item.text === text)) return tags.slice();
  return [{ id, text, color, pinned: false, hidden: false, at: tag.at }, ...tags].slice(0, 40);
}

export function toggleTagPin(tags: readonly ColorTag[], id: string): ColorTag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, pinned: !tag.pinned } : tag));
}

export function setTagHidden(tags: readonly ColorTag[], id: string, hidden: boolean): ColorTag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, hidden } : tag));
}

export function visibleTags(tags: readonly ColorTag[], query: string, hidden: boolean): ColorTag[] {
  const text = query.trim().toLowerCase();
  return tags
    .filter((tag) => tag.hidden === hidden && (!text || `${tag.text} ${tag.color}`.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** Blank ids, unknown ids, and tags that are not saved are left out. */
export function readAssignments(raw: unknown, present: readonly string[], tagIds: readonly string[]): Assignment[] {
  const allow = new Set(present.map((item) => customerId(item)).filter(Boolean));
  const tags = new Set(tagIds.map((item) => String(item || "").trim()).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: Assignment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Assignment>;
    const id = customerId(row.id);
    const tagId = String(row.tagId || "").trim();
    if (!id || !tagId || !allow.has(id) || !tags.has(tagId) || out.some((entry) => entry.id === id)) continue;
    out.push({ id, tagId });
  }
  return out;
}

export function assignTag(assignments: readonly Assignment[], id: string, tagId: string, present: readonly string[], tagIds: readonly string[]): Assignment[] {
  const next = customerId(id);
  const tag = String(tagId || "").trim();
  const current = readAssignments(assignments, present, tagIds);
  if (!next || !tag || !present.map((item) => customerId(item)).includes(next) || !tagIds.includes(tag)) return current;
  return [{ id: next, tagId: tag }, ...current.filter((item) => item.id !== next)];
}

export function clearAssignment(assignments: readonly Assignment[], id: string, present: readonly string[], tagIds: readonly string[]): Assignment[] {
  const next = customerId(id);
  return readAssignments(assignments, present, tagIds).filter((item) => item.id !== next);
}

/** The side already on the row. Order type is not a side. */
export function sideText(value: unknown): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (value && typeof value === "object" && "side" in value) return sideText((value as { side?: unknown }).side);
  return "";
}

export function sideLines(rows: readonly SideRow[]): SideLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const side = sideText(row.side);
    map.set(side, (map.get(side) || 0) + 1);
  }
  const out: SideLine[] = [];
  map.forEach((count, side) => out.push({ side, count }));
  return out.sort((a, b) => {
    if (!a.side) return -1;
    if (!b.side) return 1;
    return a.side.localeCompare(b.side);
  });
}

export function namedSides(rows: readonly SideRow[]): string[] {
  return sideLines(rows).map((line) => line.side).filter(Boolean);
}

export function readHiddenSides(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => sideText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const side = sideText(String(item || ""));
    if (!side || !allow.has(side) || out.includes(side)) continue;
    out.push(side);
  }
  return out;
}

export function toggleSide(hidden: readonly string[], side: string, present: readonly string[]): string[] {
  const current = readHiddenSides(hidden, present);
  const next = sideText(side);
  if (!next || !present.map((item) => sideText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleSides(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSides(hidden, present));
  return namedSides(present.map((side) => ({ side }))).filter((side) => (showHidden ? gone.has(side) : !gone.has(side)));
}

export function activeSide(selected: string, visible: readonly string[]): string {
  const side = sideText(selected);
  if (!side) return "";
  return visible.some((item) => sideText(item) === side) ? side : "";
}

export function visibleOrders<T extends SideRow>(rows: readonly T[], side: string, blank: boolean, query: string): T[] {
  const want = sideText(side);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = sideText(row.side);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}

export { PALETTE };
