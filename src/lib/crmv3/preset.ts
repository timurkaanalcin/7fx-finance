/** Local filter presets for this board, and document counts grouped by the status already on each row. */

export const PRESET_KEY = "crmv3-filter-presets";
export const DOC_STATUS_KEY = "crmv3-doc-status-hide";

/** Filters this board already shows. Any other key is left out. */
export const BOARD_FILTERS = ["q", "marked"] as const;

export type BoardFilter = (typeof BOARD_FILTERS)[number];

export type Filters = Partial<Record<BoardFilter, string>>;

export type Preset = {
  id: string;
  name: string;
  filters: Filters;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type StatusRow = { status?: unknown; label?: string | null };

export type StatusLine = { status: string; count: number };

export function presetName(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function boardFilters(raw: unknown): Filters {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  const out: Filters = {};
  const query = String(row.q || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (query) out.q = query;
  if (String(row.marked || "").trim() === "1") out.marked = "1";
  return out;
}

export function readPresets(raw: unknown): Preset[] {
  if (!Array.isArray(raw)) return [];
  const out: Preset[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Preset>;
    const id = String(row.id || "").trim();
    const name = presetName(row.name);
    if (!id || !name || out.some((preset) => preset.id === id || preset.name === name)) continue;
    out.push({ id, name, filters: boardFilters(row.filters), pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addPreset(presets: readonly Preset[], preset: { id: string; name: string; filters: unknown; at: string }): Preset[] {
  const id = String(preset.id || "").trim();
  const name = presetName(preset.name);
  if (!id || !name || presets.some((item) => item.id === id || item.name === name)) return presets.slice();
  return [{ id, name, filters: boardFilters(preset.filters), pinned: false, hidden: false, at: preset.at }, ...presets].slice(0, 40);
}

export function togglePresetPin(presets: readonly Preset[], id: string): Preset[] {
  return presets.map((preset) => (preset.id === id ? { ...preset, pinned: !preset.pinned } : preset));
}

export function setPresetHidden(presets: readonly Preset[], id: string, hidden: boolean): Preset[] {
  return presets.map((preset) => (preset.id === id ? { ...preset, hidden } : preset));
}

export function visiblePresets(presets: readonly Preset[], query: string, hidden: boolean): Preset[] {
  const text = query.trim().toLowerCase();
  return presets
    .filter((preset) => preset.hidden === hidden && (!text || preset.name.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** The status already on the row. A missing status stays blank. */
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
