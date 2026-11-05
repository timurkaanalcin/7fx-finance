/** Local named desk views, and document counts grouped by the status already on each row. */

import { FOCUS_PANELS, type FocusPanel } from "@/lib/crmv3/deskfocus";

export const VIEW_KEY = "crmv3-saved-views";
export const KYC_STATUS_KEY = "crmv3-kyc-status-hide";

export type DeskFilters = { q?: string; marked?: "1" };

export type DeskView = {
  id: string;
  name: string;
  panels: FocusPanel[];
  filters: DeskFilters;
  at: string;
};

export type StatusRow = { status?: unknown; label?: string | null };

export type StatusLine = { status: string; count: number };

export function viewName(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function panelList(raw: unknown): FocusPanel[] {
  if (!Array.isArray(raw)) return [];
  const out: FocusPanel[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if ((FOCUS_PANELS as readonly string[]).includes(id) && !out.includes(id as FocusPanel)) out.push(id as FocusPanel);
  }
  return out;
}

/** Only the search and marked filters this desk already uses. */
export function deskFilters(raw: unknown): DeskFilters {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  const out: DeskFilters = {};
  const query = String(row.q || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (query) out.q = query;
  if (String(row.marked || "").trim() === "1") out.marked = "1";
  return out;
}

export function readViews(raw: unknown): DeskView[] {
  if (!Array.isArray(raw)) return [];
  const out: DeskView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DeskView>;
    const id = String(row.id || "").trim();
    const name = viewName(row.name);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({ id, name, panels: panelList(row.panels), filters: deskFilters(row.filters), at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addView(views: readonly DeskView[], view: { id: string; name: string; panels: unknown; filters: unknown; at: string }): DeskView[] {
  const id = String(view.id || "").trim();
  const name = viewName(view.name);
  if (!id || !name || views.some((item) => item.id === id || item.name === name)) return views.slice();
  return [{ id, name, panels: panelList(view.panels), filters: deskFilters(view.filters), at: view.at }, ...views].slice(0, 40);
}

export function clearView(views: readonly DeskView[], id: string): DeskView[] {
  const next = String(id || "").trim();
  return readViews(views).filter((view) => view.id !== next);
}

export function visibleViews(views: readonly DeskView[], query: string): DeskView[] {
  const text = query.trim().toLowerCase();
  return views
    .filter((view) => !text || `${view.name} ${view.panels.join(" ")} ${view.filters.q || ""}`.toLowerCase().includes(text))
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** Panels not stored as active are the ones the desk hides. */
export function hiddenPanels(view: { panels?: unknown }): FocusPanel[] {
  const active = new Set(panelList(view.panels));
  return FOCUS_PANELS.filter((id) => !active.has(id));
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

export function visibleDocs<T extends StatusRow>(rows: readonly T[], status: string, blank: boolean, query: string): T[] {
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
