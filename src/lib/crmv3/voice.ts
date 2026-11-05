/** Local call snippets, and withdrawal counts grouped by the note already on each row. */

export const VOICE_KEY = "crmv3-voice-snippets";
export const REASON_KEY = "crmv3-reason-hide";

export type Snippet = {
  id: string;
  text: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type ReasonRow = { note?: string | null; label?: string | null };

export type ReasonLine = { reason: string; count: number };

export function cleanSnippet(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

/** The loaded note, with extra spaces collapsed. A blank stays blank. */
export function reasonText(raw: string | null | undefined): string {
  return String(raw || "").replace(/\s+/g, " ").trim();
}

export function readSnippets(raw: unknown): Snippet[] {
  if (!Array.isArray(raw)) return [];
  const out: Snippet[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Snippet>;
    const id = String(row.id || "").trim();
    const text = cleanSnippet(String(row.text || ""));
    if (!id || !text || out.some((snippet) => snippet.id === id)) continue;
    out.push({ id, text, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

/** A blank snippet is left out. */
export function addSnippet(items: readonly Snippet[], snippet: { id: string; text: string; at: string }): Snippet[] {
  const id = String(snippet.id || "").trim();
  const text = cleanSnippet(snippet.text);
  if (!id || !text || items.some((item) => item.id === id)) return items.slice();
  return [{ id, text, pinned: false, hidden: false, at: snippet.at }, ...items].slice(0, 40);
}

export function toggleSnippetPin(items: readonly Snippet[], id: string): Snippet[] {
  return items.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
}

export function setSnippetHidden(items: readonly Snippet[], id: string, hidden: boolean): Snippet[] {
  return items.map((item) => (item.id === id ? { ...item, hidden } : item));
}

/** Search uses the snippet text. */
export function visibleSnippets(items: readonly Snippet[], query: string, hidden: boolean): Snippet[] {
  const text = query.trim().toLowerCase();
  return items
    .filter((item) => item.hidden === hidden && (!text || item.text.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}

/** One line per loaded note. A blank note stays on its own line. */
export function reasonLines(rows: readonly ReasonRow[]): ReasonLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const reason = reasonText(row.note);
    map.set(reason, (map.get(reason) || 0) + 1);
  }
  const out: ReasonLine[] = [];
  map.forEach((count, reason) => out.push({ reason, count }));
  return out.sort((a, b) => {
    if (!a.reason) return -1;
    if (!b.reason) return 1;
    return a.reason.localeCompare(b.reason);
  });
}

export function namedReasons(rows: readonly ReasonRow[]): string[] {
  return reasonLines(rows).map((line) => line.reason).filter(Boolean);
}

export function readHiddenReasons(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => reasonText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const reason = reasonText(String(item || ""));
    if (!reason || !allow.has(reason) || out.includes(reason)) continue;
    out.push(reason);
  }
  return out;
}

export function toggleReason(hidden: readonly string[], reason: string, present: readonly string[]): string[] {
  const current = readHiddenReasons(hidden, present);
  const next = reasonText(reason);
  if (!next || !present.map((item) => reasonText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleReasons(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenReasons(hidden, present));
  return namedReasons(present.map((reason) => ({ note: reason }))).filter((reason) => (showHidden ? gone.has(reason) : !gone.has(reason)));
}

/** A selected chip that is not on the open row is cleared. Blank is a separate filter. */
export function activeReason(selected: string, visible: readonly string[]): string {
  const reason = reasonText(selected);
  if (!reason) return "";
  return visible.some((item) => reasonText(item) === reason) ? reason : "";
}

export function visibleWithdrawals<T extends ReasonRow>(rows: readonly T[], reason: string, blank: boolean, query: string): T[] {
  const want = reasonText(reason);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = reasonText(row.note);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
