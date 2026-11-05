/** Notice inbox and the customer tag board. Both stay on loaded rows. */

export const READ_KEY = "crmv4-inbox-local-read";
export const TAG_KEY = "crmv4-tags";
export const PIN_KEY = "crmv4-tag-board-pins";
export const HIDE_KEY = "crmv4-tag-board-hidden";

export type InboxNote = {
  id: string;
  kind?: string | null;
  title?: string | null;
  body?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt?: string | null;
};

export type TagCustomer = {
  id: string;
  name?: string | null;
  email?: string | null;
  currency?: string | null;
  account?: { currency?: string | null } | null;
  tags?: unknown;
};

export type TagChip = { name: string; count: number; pinned: boolean };

const ID_RE = /^[a-z0-9]{20,32}$/i;

export function readIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(-400);
}

export function noteKinds(rows: readonly InboxNote[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const kind = String(row.kind || "").trim();
    if (kind && !out.includes(kind)) out.push(kind);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function kindKey(kind: string): "ibKindChat" | "ibKindHandoff" | "ibKindInfo" | "" {
  if (kind === "chat") return "ibKindChat";
  if (kind === "handoff") return "ibKindHandoff";
  if (kind === "info") return "ibKindInfo";
  return "";
}

export function bodyPreview(body: string | null | undefined, max = 140): string {
  const text = String(body || "").replace(/\s+/g, " ").trim();
  const size = Math.max(1, Math.floor(max));
  return text.length <= size ? text : text.slice(0, size).trimEnd();
}

export function filterNotes(
  rows: readonly InboxNote[],
  kind: string,
  query: string,
  unreadOnly: boolean,
  localRead: readonly string[],
): InboxNote[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (kind && String(row.kind || "") !== kind) return false;
    if (unreadOnly && localRead.includes(row.id)) return false;
    if (!text) return true;
    return `${row.title || ""} ${row.body || ""}`.toLowerCase().includes(text);
  });
}

export function sortNotes(rows: readonly InboxNote[], newest: boolean): InboxNote[] {
  return rows.slice().sort((a, b) => {
    const left = Date.parse(String(a.createdAt || "")) || 0;
    const right = Date.parse(String(b.createdAt || "")) || 0;
    return newest ? right - left : left - right;
  });
}

export function markShown(read: readonly string[], shown: readonly { id: string }[]): string[] {
  const next = read.slice();
  for (const row of shown) {
    const id = String(row.id || "").trim();
    if (id && !next.includes(id)) next.push(id);
  }
  return next.slice(-400);
}

export function unreadCount(rows: readonly { id: string }[], localRead: readonly string[]): number {
  return rows.filter((row) => row.id && !localRead.includes(row.id)).length;
}

export function customerIdOf(note: { href?: string | null; body?: string | null }): string {
  const href = String(note.href || "").trim();
  if (href && !/^javascript:/i.test(href)) {
    const query = href.match(/[?&](?:user|customer)=([a-z0-9]{20,32})(?:&|#|$)/i);
    if (query && ID_RE.test(query[1])) return query[1];
    const path = href.match(/\/customers\/([a-z0-9]{20,32})(?:[/?#]|$)/i);
    if (path && ID_RE.test(path[1])) return path[1];
  }
  const body = String(note.body || "").match(/\(([a-z0-9]{20,32})\)/i);
  return body && ID_RE.test(body[1]) ? body[1] : "";
}

export function storedRead(note: { readAt?: string | null }): boolean {
  return Boolean(String(note.readAt || "").trim());
}

export function cleanTag(raw: string): string {
  return String(raw || "").trim().replace(/\s+/g, " ").slice(0, 40);
}

export function readTagMap(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string[]> = {};
  for (const [id, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || !Array.isArray(list)) continue;
    const tags: string[] = [];
    for (const item of list) {
      const name = cleanTag(String(item || ""));
      if (name && !tags.includes(name)) tags.push(name);
    }
    if (tags.length) out[id] = tags;
  }
  return out;
}

export function tagsFor(row: TagCustomer, local: Record<string, string[]>): string[] {
  const out: string[] = [];
  const fromRow = Array.isArray(row.tags) ? row.tags : [];
  for (const item of [...fromRow, ...(local[row.id] || [])]) {
    const name = cleanTag(String(item || ""));
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

export function currencyLabel(row: TagCustomer): string {
  const top = String(row.currency || "").trim();
  if (top) return top;
  return String(row.account?.currency || "").trim();
}

export function namesOnPage(rows: readonly TagCustomer[], local: Record<string, string[]>): string[] {
  const out: string[] = [];
  for (const row of rows) {
    for (const tag of tagsFor(row, local)) if (!out.includes(tag)) out.push(tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function tagChips(
  rows: readonly TagCustomer[],
  local: Record<string, string[]>,
  hidden: readonly string[],
  pinned: readonly string[],
): TagChip[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const tag of tagsFor(row, local)) {
      if (hidden.includes(tag)) continue;
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  const chips: TagChip[] = [];
  counts.forEach((count, name) => chips.push({ name, count, pinned: pinned.includes(name) }));
  chips.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return chips;
}

export function hiddenOnPage(names: readonly string[], hidden: readonly string[]): string[] {
  return names.filter((name) => hidden.includes(name));
}

export function filterByTag(
  rows: readonly TagCustomer[],
  local: Record<string, string[]>,
  tag: string,
  query: string,
): TagCustomer[] {
  const text = query.trim().toLowerCase();
  const picked = cleanTag(tag);
  return rows.filter((row) => {
    if (!row.id) return false;
    if (picked && !tagsFor(row, local).includes(picked)) return false;
    if (!text) return true;
    return `${row.name || ""} ${row.email || ""}`.toLowerCase().includes(text);
  });
}

export function toggleName(list: readonly string[], name: string): string[] {
  const clean = cleanTag(name);
  if (!clean) return list.slice();
  return list.includes(clean) ? list.filter((item) => item !== clean) : [...list, clean];
}

export function attachTag(local: Record<string, string[]>, id: string, tag: string): Record<string, string[]> {
  const name = cleanTag(tag);
  if (!id || !name) return local;
  const current = local[id] || [];
  if (current.includes(name)) return local;
  return { ...local, [id]: [...current, name] };
}

export function detachTag(local: Record<string, string[]>, id: string, tag: string): Record<string, string[]> {
  const name = cleanTag(tag);
  if (!id || !name || !local[id]?.includes(name)) return local;
  return { ...local, [id]: local[id].filter((item) => item !== name) };
}
