/** Local multi-line scratch pads, and order counts grouped by the status already on each row. */

export const PAD_KEY = "crmv4-scratch-pads";
export const STATUS_KEY = "crmv4-order-status-hide";

export type Pad = {
  id: string;
  text: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type StatusValue = { status?: unknown } | string | null | undefined;

export type StatusRow = { status?: StatusValue; label?: string | null };

export type StatusLine = { status: string; count: number };

/** Ends are trimmed. Line breaks inside the note stay. A blank note is left out. */
export function padText(raw: string | null | undefined): string {
  return String(raw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\s+|\s+$/g, "").slice(0, 2000);
}

export function readPads(raw: unknown): Pad[] {
  if (!Array.isArray(raw)) return [];
  const out: Pad[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Pad>;
    const id = String(row.id || "").trim();
    const text = padText(row.text);
    if (!id || !text || out.some((pad) => pad.id === id)) continue;
    out.push({ id, text, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addPad(pads: readonly Pad[], pad: { id: string; text: string; at: string }): Pad[] {
  const id = String(pad.id || "").trim();
  const text = padText(pad.text);
  if (!id || !text || pads.some((item) => item.id === id)) return pads.slice();
  return [{ id, text, pinned: false, hidden: false, at: pad.at }, ...pads].slice(0, 40);
}

export function togglePadPin(pads: readonly Pad[], id: string): Pad[] {
  return pads.map((pad) => (pad.id === id ? { ...pad, pinned: !pad.pinned } : pad));
}

export function setPadHidden(pads: readonly Pad[], id: string, hidden: boolean): Pad[] {
  return pads.map((pad) => (pad.id === id ? { ...pad, hidden } : pad));
}

export function visiblePads(pads: readonly Pad[], query: string, hidden: boolean): Pad[] {
  const text = query.trim().toLowerCase();
  return pads
    .filter((pad) => pad.hidden === hidden && (!text || pad.text.toLowerCase().includes(text)))
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

export function visibleOrders<T extends StatusRow>(rows: readonly T[], status: string, blank: boolean, query: string): T[] {
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
