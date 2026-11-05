/** Local shortcuts to existing CRM v3 sections, and deposit counts grouped by the status already on each row. */

import { CRM_V3_SECTIONS } from "@/lib/crmv3/sections";

export const RAIL_KEY = "crmv3-pin-rail";
export const DEP_STATUS_KEY = "crmv3-dep-status-hide";

export type Shortcut = {
  id: string;
  name: string;
  section: string;
  pinned: boolean;
  hidden: boolean;
  order: number;
};

export type StatusRow = { status?: unknown; label?: string | null };

export type StatusLine = { status: string; count: number };

export function shortcutName(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

/** Only a section id that already exists. A path or an unknown id is left out. */
export function sectionId(raw: string | null | undefined): string {
  const id = String(raw || "").trim();
  return CRM_V3_SECTIONS.some((section) => section.id === id) ? id : "";
}

export function sectionPath(id: string): string {
  return CRM_V3_SECTIONS.find((section) => section.id === id)?.path ?? "";
}

export function readShortcuts(raw: unknown): Shortcut[] {
  if (!Array.isArray(raw)) return [];
  const out: Shortcut[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Shortcut>;
    const id = String(row.id || "").trim();
    const name = shortcutName(row.name);
    const section = sectionId(row.section);
    const order = Number(row.order);
    if (!id || !name || !section || out.some((item) => item.id === id || item.name === name || item.section === section)) continue;
    out.push({
      id,
      name,
      section,
      pinned: row.pinned === true,
      hidden: row.hidden === true,
      order: Number.isFinite(order) ? order : out.length + 1,
    });
  }
  return out.slice(0, 40);
}

export function addShortcut(shortcuts: readonly Shortcut[], shortcut: { id: string; name: string; section: string }): Shortcut[] {
  const id = String(shortcut.id || "").trim();
  const name = shortcutName(shortcut.name);
  const section = sectionId(shortcut.section);
  if (!id || !name || !section || shortcuts.some((item) => item.id === id || item.name === name || item.section === section)) return shortcuts.slice();
  const order = shortcuts.reduce((max, item) => Math.max(max, item.order), 0) + 1;
  return [...shortcuts, { id, name, section, pinned: false, hidden: false, order }].slice(0, 40);
}

export function toggleShortcutPin(shortcuts: readonly Shortcut[], id: string): Shortcut[] {
  return shortcuts.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
}

export function setShortcutHidden(shortcuts: readonly Shortcut[], id: string, hidden: boolean): Shortcut[] {
  return shortcuts.map((item) => (item.id === id ? { ...item, hidden } : item));
}

export function moveShortcut(shortcuts: readonly Shortcut[], id: string, direction: -1 | 1): Shortcut[] {
  const ordered = shortcuts.slice().sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((item) => item.id === id);
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= ordered.length) return shortcuts.slice();
  const next = shortcuts.map((item) => ({ ...item }));
  const current = next.find((item) => item.id === ordered[index].id);
  const other = next.find((item) => item.id === ordered[swap].id);
  if (!current || !other) return shortcuts.slice();
  const order = current.order;
  current.order = other.order;
  other.order = order;
  return next;
}

export function visibleShortcuts(shortcuts: readonly Shortcut[], query: string, hidden: boolean): Shortcut[] {
  const text = query.trim().toLowerCase();
  return shortcuts
    .filter((item) => item.hidden === hidden && (!text || item.name.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.order - b.order;
    });
}

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

export function visibleDeposits<T extends StatusRow>(rows: readonly T[], status: string, blank: boolean, query: string): T[] {
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
