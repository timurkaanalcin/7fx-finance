/** Compliance cases and the local shortcut rail. Status changes wait for confirm. */

export const PIN_KEY = "crmv3-case-pins";
export const SHORTCUT_KEY = "crmv3-shortcuts";

export const CASE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export type CaseRow = {
  id: string;
  name?: string | null;
  docType?: string | null;
  status?: string | null;
  trader?: string | null;
  traderId?: string | null;
  desk?: string | null;
  createdAt?: string | null;
};

export type Shortcut = { id: string; hidden: boolean };

export function caseStatus(row: { status?: string | null }): string {
  return String(row.status || "").trim().toUpperCase();
}

export function filterCases(rows: readonly CaseRow[], status: string, query: string): CaseRow[] {
  const want = status.trim().toUpperCase();
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (want && caseStatus(row) !== want) return false;
    if (!text) return true;
    return `${row.name || ""} ${row.docType || ""} ${row.trader || ""} ${row.desk || ""} ${row.status || ""}`.toLowerCase().includes(text);
  });
}

export function sortCases<T extends { id: string; name?: string | null }>(rows: readonly T[], pins: readonly string[]): T[] {
  return rows.slice().sort((a, b) => {
    const ap = pins.includes(a.id);
    const bp = pins.includes(b.id);
    if (ap !== bp) return ap ? -1 : 1;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function toggleId(ids: readonly string[], id: string): string[] {
  if (!id) return ids.slice();
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function readIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 200);
}

/** Existing document review call. A blank reason is left out. */
export function reviewBody(id: string, status: string, reason: string): Record<string, string> | null {
  const next = status.trim().toUpperCase();
  const caseId = String(id || "").trim();
  if (!caseId || !(CASE_STATUSES as readonly string[]).includes(next)) return null;
  const body: Record<string, string> = { action: "review", id: caseId, status: next };
  const note = reason.trim();
  if (note) body.note = note;
  return body;
}

export function readShortcuts(raw: unknown, allowed: readonly string[]): Shortcut[] {
  if (!Array.isArray(raw)) return [];
  const out: Shortcut[] = [];
  for (const item of raw) {
    const id = typeof item === "string" ? item.trim() : String((item as { id?: unknown })?.id || "").trim();
    if (!id || !allowed.includes(id) || out.some((row) => row.id === id)) continue;
    const hidden = Boolean(item && typeof item === "object" && (item as { hidden?: unknown }).hidden === true);
    out.push({ id, hidden });
  }
  return out.slice(0, 24);
}

export function addShortcut(list: readonly Shortcut[], id: string, allowed: readonly string[]): Shortcut[] {
  const key = String(id || "").trim();
  if (!key || !allowed.includes(key) || list.some((row) => row.id === key)) return list.slice();
  return [...list, { id: key, hidden: false }].slice(0, 24);
}

export function moveVisible(list: readonly Shortcut[], id: string, by: number): Shortcut[] {
  const visible = list.filter((row) => !row.hidden);
  const index = visible.findIndex((row) => row.id === id);
  const target = visible[index + by];
  if (index < 0 || !target) return list.slice();
  const copy = list.slice();
  const from = copy.findIndex((row) => row.id === id);
  const to = copy.findIndex((row) => row.id === target.id);
  const held = copy[from];
  copy[from] = copy[to];
  copy[to] = held;
  return copy;
}

export function toggleHidden(list: readonly Shortcut[], id: string): Shortcut[] {
  return list.map((row) => (row.id === id ? { ...row, hidden: !row.hidden } : row));
}

export function removeShortcut(list: readonly Shortcut[], id: string): Shortcut[] {
  return list.filter((row) => row.id !== id);
}

export function visibleShortcuts(list: readonly Shortcut[]): Shortcut[] {
  return list.filter((row) => !row.hidden);
}
