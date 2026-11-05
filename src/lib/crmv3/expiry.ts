/** Document watch from loaded dates, and local panel density. The chrome pad is not changed. */

export const SNOOZE_KEY = "crmv3-doc-snooze";
export const WINDOW_KEY = "crmv3-doc-window";
export const PANEL_KEY = "crmv3-panel-density";

export const WINDOWS = [30, 90] as const;
export const PANELS = ["roomy", "desk", "compact"] as const;
export type DocWindow = (typeof WINDOWS)[number];
export type PanelDensity = (typeof PANELS)[number];
export type DueState = "due" | "fresh" | "none";

export type DocRow = {
  id: string;
  name?: string | null;
  docType?: string | null;
  status?: string | null;
  trader?: string | null;
  traderId?: string | null;
  createdAt?: string | null;
  reviewedAt?: string | null;
};

export function docStatus(row: { status?: string | null }): string {
  return String(row.status || "").trim().toUpperCase();
}

/** Review date when it is loaded. Otherwise the created date. No date is invented. */
export function loadedDate(row: Pick<DocRow, "createdAt" | "reviewedAt">): string | null {
  const reviewed = Date.parse(String(row.reviewedAt || ""));
  if (Number.isFinite(reviewed)) return new Date(reviewed).toISOString();
  const created = Date.parse(String(row.createdAt || ""));
  if (Number.isFinite(created)) return new Date(created).toISOString();
  return null;
}

export function dateSource(row: Pick<DocRow, "createdAt" | "reviewedAt">): "reviewed" | "created" | "none" {
  if (Number.isFinite(Date.parse(String(row.reviewedAt || "")))) return "reviewed";
  if (Number.isFinite(Date.parse(String(row.createdAt || "")))) return "created";
  return "none";
}

export function dueState(row: Pick<DocRow, "createdAt" | "reviewedAt">, now = Date.now(), days: DocWindow = 30): DueState {
  const at = loadedDate(row);
  if (!at) return "none";
  return Date.parse(at) <= now - days * 86400000 ? "due" : "fresh";
}

export function readWindow(raw: unknown): DocWindow {
  return Number(raw) === 90 ? 90 : 30;
}

export function filterDocs(rows: readonly DocRow[], query: string): DocRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (!text) return true;
    return `${row.name || ""} ${row.docType || ""} ${row.trader || ""} ${row.status || ""}`.toLowerCase().includes(text);
  });
}

export function readSnooze(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const id = key.trim();
    const until = String(value || "").trim();
    if (id && Number.isFinite(Date.parse(until))) out[id] = until;
  }
  return out;
}

export function snoozeUntil(now: number, minutes = 60): string {
  return new Date(now + minutes * 60000).toISOString();
}

export function isSnoozed(until: string | undefined, now: number): boolean {
  const time = Date.parse(String(until || ""));
  return Number.isFinite(time) && time > now;
}

export function withSnooze(map: Record<string, string>, id: string, until: string): Record<string, string> {
  if (!id) return { ...map };
  return { ...map, [id]: until };
}

export function clearSnooze(map: Record<string, string>, id: string): Record<string, string> {
  const next = { ...map };
  delete next[id];
  return next;
}

export function visibleDocs(
  rows: readonly DocRow[],
  query: string,
  onlyDue: boolean,
  snooze: Record<string, string>,
  showSnoozed: boolean,
  now = Date.now(),
  days: DocWindow = 30,
): DocRow[] {
  return filterDocs(rows, query).filter((row) => {
    const hidden = isSnoozed(snooze[row.id], now);
    if (showSnoozed) return hidden;
    if (hidden) return false;
    if (onlyDue) return dueState(row, now, days) === "due";
    return true;
  });
}

/** Existing document review. A blank note is left out. Pending is not sent. */
export function reviewPlan(id: string, status: string, note: string): Record<string, string> | null {
  const next = status.trim().toUpperCase();
  const docId = String(id || "").trim();
  if (!docId || (next !== "APPROVED" && next !== "REJECTED")) return null;
  const body: Record<string, string> = { action: "review", id: docId, status: next };
  const text = note.trim();
  if (text) body.note = text;
  return body;
}

export function readPanel(raw: unknown): PanelDensity {
  return raw === "roomy" || raw === "compact" ? raw : "desk";
}
