/** Local hide for non-essential chrome, and open versus waiting counts from loaded tickets. */

export const FOCUS_KEY = "crmv4-desk-focus";
export const QUEUE_KEY = "crmv4-queue-hide";

export const FOCUS_PANELS = ["sections", "rail", "tools"] as const;
export type FocusPanel = (typeof FOCUS_PANELS)[number];

export const QUEUE_KINDS = ["open", "waiting"] as const;
export type QueueKind = (typeof QUEUE_KINDS)[number];

export type QueueRow = { status?: string | null; label?: string | null };

export type QueueSplit = { open: number; waiting: number };

export type OtherLine = { status: string; count: number };

export function isPanel(value: string): value is FocusPanel {
  return (FOCUS_PANELS as readonly string[]).includes(value);
}

export function readFocus(raw: unknown): FocusPanel[] {
  if (!Array.isArray(raw)) return [];
  const out: FocusPanel[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (isPanel(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function togglePanel(hidden: readonly string[], id: string): FocusPanel[] {
  const current = readFocus(hidden);
  if (!isPanel(id)) return current;
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

export function visiblePanels(hidden: readonly string[], query: string, showHidden: boolean, names: Record<string, string> = {}): FocusPanel[] {
  const text = query.trim().toLowerCase();
  const gone = new Set(readFocus(hidden));
  return FOCUS_PANELS.filter((id) => {
    if (showHidden !== gone.has(id)) return false;
    if (!text) return true;
    return `${names[id] || ""} ${id}`.toLowerCase().includes(text);
  });
}

/** Open and waiting only. A blank or any other status is not renamed. */
export function queueKind(raw: string | null | undefined): QueueKind | "" {
  const value = String(raw || "").trim().toUpperCase();
  if (value === "OPEN") return "open";
  if (value === "WAITING") return "waiting";
  return "";
}

export function rawStatus(raw: string | null | undefined): string {
  return String(raw || "").trim().toUpperCase();
}

export function queueSplit(rows: readonly QueueRow[]): QueueSplit {
  let open = 0;
  let waiting = 0;
  for (const row of rows) {
    const kind = queueKind(row.status);
    if (kind === "open") open += 1;
    else if (kind === "waiting") waiting += 1;
  }
  return { open, waiting };
}

export function otherStatuses(rows: readonly QueueRow[]): OtherLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const status = rawStatus(row.status);
    if (!status || queueKind(status)) continue;
    map.set(status, (map.get(status) || 0) + 1);
  }
  const out: OtherLine[] = [];
  map.forEach((count, status) => out.push({ status, count }));
  return out.sort((a, b) => a.status.localeCompare(b.status));
}

export function presentQueues(rows: readonly QueueRow[]): QueueKind[] {
  const split = queueSplit(rows);
  const out: QueueKind[] = [];
  if (split.open > 0) out.push("open");
  if (split.waiting > 0) out.push("waiting");
  return out;
}

export function readHiddenQueues(raw: unknown): QueueKind[] {
  if (!Array.isArray(raw)) return [];
  const out: QueueKind[] = [];
  for (const item of raw) {
    const kind = queueKind(String(item || ""));
    if (kind && !out.includes(kind)) out.push(kind);
  }
  return out;
}

export function toggleQueue(hidden: readonly string[], kind: string): QueueKind[] {
  const current = readHiddenQueues(hidden);
  const next = queueKind(kind);
  if (!next) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleQueues(present: readonly string[], hidden: readonly string[], showHidden: boolean): QueueKind[] {
  const gone = new Set(readHiddenQueues(hidden));
  return presentQueues(present.map((status) => ({ status }))).filter((kind) => (showHidden ? gone.has(kind) : !gone.has(kind)));
}

export function activeQueue(selected: string, visible: readonly string[]): QueueKind | "" {
  const kind = queueKind(selected);
  if (!kind) return "";
  return visible.some((item) => queueKind(item) === kind) ? kind : "";
}

export function visibleTickets<T extends QueueRow>(rows: readonly T[], kind: string, query: string): T[] {
  const want = queueKind(kind);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = queueKind(row.status);
    if (!got) return false;
    if (want && got !== want) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}
