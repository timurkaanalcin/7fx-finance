/** Support triage and local desk accents. Assign and close wait for confirm. */

export const PIN_KEY = "crmv3-triage-pins";
export const SNOOZE_KEY = "crmv3-triage-snooze";
export const GOLD_KEY = "crmv3-gold-intensity";
export const CHROME_KEY = "crmv3-chrome-density";

export const GOLD_LEVELS = ["soft", "desk", "deep"] as const;
export type GoldLevel = (typeof GOLD_LEVELS)[number];
export const CHROME_MODES = ["roomy", "dense"] as const;
export type ChromeMode = (typeof CHROME_MODES)[number];

export type TriageMessage = {
  id?: string;
  body?: string | null;
  workerId?: string | null;
  automatic?: boolean | null;
  createdAt?: string | null;
};

export type TriageThread = {
  traderId?: string | null;
  trader?: string | null;
  desk?: string | null;
  lastAt?: string | null;
  messages?: TriageMessage[] | null;
  presence?: { adminLastReadAt?: string | null } | null;
  profile?: { assigneeName?: string | null; currency?: string | null } | null;
};

export function threadId(row: TriageThread): string {
  return String(row.traderId || "").trim();
}

export function lastMessage(row: TriageThread): TriageMessage | null {
  const list = row.messages || [];
  return list.length ? list[list.length - 1] : null;
}

/** Unread when the last loaded message is from the customer, or the desk has not read the thread. */
export function isUnread(row: TriageThread): boolean {
  const last = lastMessage(row);
  if (last && !last.workerId && !last.automatic) return true;
  if (!row.presence?.adminLastReadAt && (row.messages || []).length > 0) return true;
  return false;
}

export function filterThreads(rows: readonly TriageThread[], query: string, unreadOnly: boolean): TriageThread[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!threadId(row)) return false;
    if (unreadOnly && !isUnread(row)) return false;
    if (!text) return true;
    const last = lastMessage(row);
    return `${row.trader || ""} ${row.desk || ""} ${last?.body || ""}`.toLowerCase().includes(text);
  });
}

export function readSnooze(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [id, until] of Object.entries(raw as Record<string, unknown>)) {
    const key = id.trim();
    const at = String(until || "").trim();
    if (key && at) out[key] = at;
  }
  return out;
}

export function snoozeUntil(nowMs: number, minutes = 60): string {
  const span = Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
  return new Date(nowMs + span * 60_000).toISOString();
}

export function isSnoozed(until: string | undefined, nowMs: number): boolean {
  if (!until) return false;
  const at = Date.parse(until);
  return Number.isFinite(at) && at > nowMs;
}

export function withSnooze(map: Record<string, string>, id: string, until: string): Record<string, string> {
  if (!id || !until) return { ...map };
  return { ...map, [id]: until };
}

export function clearSnooze(map: Record<string, string>, id: string): Record<string, string> {
  if (!map[id]) return { ...map };
  const next = { ...map };
  delete next[id];
  return next;
}

export function visibleThreads(
  rows: readonly TriageThread[],
  query: string,
  unreadOnly: boolean,
  snooze: Record<string, string>,
  showSnoozed: boolean,
  nowMs: number,
): TriageThread[] {
  return filterThreads(rows, query, unreadOnly).filter((row) => {
    const hidden = isSnoozed(snooze[threadId(row)], nowMs);
    return showSnoozed ? hidden : !hidden;
  });
}

export function sortThreads<T extends TriageThread>(rows: readonly T[], pins: readonly string[]): T[] {
  return rows.slice().sort((a, b) => {
    const ap = pins.includes(threadId(a));
    const bp = pins.includes(threadId(b));
    if (ap !== bp) return ap ? -1 : 1;
    return String(b.lastAt || "").localeCompare(String(a.lastAt || ""));
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

/** Existing customer assign. A blank person is not sent. A blank note is left out. */
export function assignBody(assigneeId: string, note: string): Record<string, string> | null {
  const id = assigneeId.trim();
  if (!id) return null;
  const body: Record<string, string> = { assigneeId: id };
  const text = note.trim();
  if (text) body.retentionNote = text;
  return body;
}

/** Existing presence mark-read. A blank note is left out so the stored note is not cleared. */
export function closePlan(userId: string, note: string): { presence: { userId: string; markRead: true }; note: { retentionNote: string } | null } | null {
  const id = userId.trim();
  if (!id) return null;
  const text = note.trim();
  return {
    presence: { userId: id, markRead: true },
    note: text ? { retentionNote: text } : null,
  };
}

export function readGold(raw: unknown): GoldLevel {
  const value = String(raw || "");
  return (GOLD_LEVELS as readonly string[]).includes(value) ? (value as GoldLevel) : "desk";
}

export function readChrome(raw: unknown): ChromeMode {
  return raw === "dense" ? "dense" : "roomy";
}
