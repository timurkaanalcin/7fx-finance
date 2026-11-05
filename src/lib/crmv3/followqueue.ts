/** Local ordered follow-ups, and ticket counts grouped by the status already on each row. */

export const FOLLOW_KEY = "crmv3-follow-queue";
export const TICKET_STATUS_KEY = "crmv3-ticket-status-hide";

export type Follow = {
  id: string;
  note: string;
  done: boolean;
  order: number;
};

export type StatusRow = { status?: unknown; label?: string | null };

export type StatusLine = { status: string; count: number };

export function customerId(raw: string | null | undefined): string {
  return String(raw || "").trim();
}

/** A blank note stays blank. A line break becomes a space. */
export function noteText(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Blank ids and ids that are not on the loaded list are left out. */
export function readFollows(raw: unknown, present: readonly string[]): Follow[] {
  const allow = new Set(present.map((item) => customerId(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: Follow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Follow>;
    const id = customerId(row.id);
    const order = Number(row.order);
    if (!id || !allow.has(id) || out.some((entry) => entry.id === id)) continue;
    out.push({ id, note: noteText(row.note), done: row.done === true, order: Number.isFinite(order) ? order : out.length + 1 });
  }
  return out.slice(0, 40);
}

export function addFollow(follows: readonly Follow[], follow: { id: string; note: string }, present: readonly string[]): Follow[] {
  const id = customerId(follow.id);
  const current = readFollows(follows, present);
  if (!id || !present.map((item) => customerId(item)).includes(id) || current.some((item) => item.id === id)) return current;
  const order = current.reduce((max, item) => Math.max(max, item.order), 0) + 1;
  return [...current, { id, note: noteText(follow.note), done: false, order }].slice(0, 40);
}

export function setFollowDone(follows: readonly Follow[], id: string, done: boolean, present: readonly string[]): Follow[] {
  const next = customerId(id);
  return readFollows(follows, present).map((item) => (item.id === next ? { ...item, done } : item));
}

export function clearFollow(follows: readonly Follow[], id: string, present: readonly string[]): Follow[] {
  const next = customerId(id);
  return readFollows(follows, present).filter((item) => item.id !== next);
}

export function clearFollows(): Follow[] {
  return [];
}

export function moveFollow(follows: readonly Follow[], id: string, direction: -1 | 1, present: readonly string[]): Follow[] {
  const current = readFollows(follows, present);
  const ordered = current.slice().sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((item) => item.id === customerId(id));
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= ordered.length) return current;
  const next = current.map((item) => ({ ...item }));
  const left = next.find((item) => item.id === ordered[index].id);
  const right = next.find((item) => item.id === ordered[swap].id);
  if (!left || !right) return current;
  const order = left.order;
  left.order = right.order;
  right.order = order;
  return next;
}

export function visibleFollows<T extends { id: string; name?: string | null; email?: string | null }>(rows: readonly T[], follows: readonly Follow[], query: string, done: boolean): Array<T & { note: string; order: number }> {
  const byId = new Map(follows.map((item) => [item.id, item]));
  const text = query.trim().toLowerCase();
  return rows.flatMap((row) => {
    const item = byId.get(customerId(row.id));
    if (!item || item.done !== done) return [];
    if (text && !`${row.name || ""} ${row.email || ""} ${item.note}`.toLowerCase().includes(text)) return [];
    return [{ ...row, note: item.note, order: item.order }];
  }).sort((a, b) => a.order - b.order);
}

/** The status already on the row. Kind is not a status. */
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

export function visibleTickets<T extends StatusRow>(rows: readonly T[], status: string, blank: boolean, query: string): T[] {
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
