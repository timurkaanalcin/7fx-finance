/** Local lock for the saved desk layout, and introducer counts grouped by the status already on each row. */

import { moveCard, readLayout, toggleHidden, type OverviewCard, type OverviewLayout } from "@/lib/crmv3/line";

export const LOCK_KEY = "crmv3-layout-lock";
export const IB_STATUS_KEY = "crmv3-ib-status-hide";

export type DeskLock = {
  locked: boolean;
  order: OverviewCard[];
  hidden: OverviewCard[];
};

export type StatusRow = { status?: unknown; label?: string | null };

export type StatusLine = { status: string; count: number };

export function readLock(raw: unknown): DeskLock {
  const row = raw && typeof raw === "object" ? raw as { locked?: unknown; order?: unknown; hidden?: unknown } : {};
  const layout = readLayout({ order: row.order, hidden: row.hidden });
  return { locked: row.locked === true, order: layout.order, hidden: layout.hidden };
}

/** Keep the current order and visibility, and stop further edits. */
export function lockDesk(layout: OverviewLayout): DeskLock {
  const clean = readLayout(layout);
  return { locked: true, order: clean.order, hidden: clean.hidden };
}

/** Keep the frozen arrangement and allow edits again. */
export function unlockDesk(lock: DeskLock): DeskLock {
  const clean = readLock(lock);
  return { locked: false, order: clean.order, hidden: clean.hidden };
}

/** While locked, the desk keeps the frozen order and visibility. */
export function shownLayout(lock: DeskLock, saved: OverviewLayout): OverviewLayout {
  if (lock.locked) return { order: lock.order.slice(), hidden: lock.hidden.slice() };
  return readLayout(saved);
}

export function changeLayout(lock: DeskLock, next: OverviewLayout): OverviewLayout {
  if (lock.locked) return { order: lock.order.slice(), hidden: lock.hidden.slice() };
  return readLayout(next);
}

export function movePanel(layout: OverviewLayout, id: string, direction: -1 | 1): OverviewLayout {
  const clean = readLayout(layout);
  if (!(clean.order as readonly string[]).includes(id)) return clean;
  return moveCard(clean, id as OverviewCard, direction);
}

export function togglePanel(layout: OverviewLayout, id: string): OverviewLayout {
  const clean = readLayout(layout);
  if (!(clean.order as readonly string[]).includes(id)) return clean;
  return toggleHidden(clean, id as OverviewCard);
}

export function matchingPanels(layout: OverviewLayout, query: string, names: Record<string, string> = {}): OverviewCard[] {
  const text = query.trim().toLowerCase();
  return layout.order.filter((id) => !text || `${names[id] || ""} ${id}`.toLowerCase().includes(text));
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

export function visibleIntroducers<T extends StatusRow>(rows: readonly T[], status: string, blank: boolean, query: string): T[] {
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
