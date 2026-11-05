/** One local note for the current UTC day, and withdrawal counts grouped by the status already on each row. */

export const NOTE_KEY = "crmv3-session-note";
export const WD_STATUS_KEY = "crmv3-wd-status-hide";

export type SessionNote = { day: string; text: string };

export type StatusRow = { status?: unknown; label?: string | null };

export type StatusLine = { status: string; count: number };

export function utcDay(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function noteText(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
}

/** A note from another UTC day is not today's note. A blank note is left out. */
export function readSession(raw: unknown, day: string): string {
  if (!day || !raw || typeof raw !== "object") return "";
  const row = raw as Partial<SessionNote>;
  if (String(row.day || "") !== day) return "";
  return noteText(row.text);
}

export function saveSession(day: string, text: string): SessionNote | null {
  const body = noteText(text);
  if (!day || !body) return null;
  return { day, text: body };
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
