/** URL state for CRM lists. Parsing only — it does not call the server. */

export const CRM_LIST_TAKES = [25, 50, 100] as const;
export const CHAT_LIST_TAKES = [20, 40] as const;

const TICKET_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"]);
const TICKET_KINDS = new Set(["deposit", "margin", "withdraw"]);
const POS_TABS = new Set(["OPEN", "CLOSED", "ALL", "ORDERS"]);
const CHAT_TABS = new Set(["all", "new", "unanswered"]);

function clip(value: string | null, max: number): string {
  return (value || "").trim().slice(0, max);
}

export function clipListPage(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 1) return 1;
  return Math.min(2000, Math.trunc(n));
}

/** Unknown sizes fall back. The API still caps `take`; this only accepts sizes the list offers. */
export function clipListTake(raw: string | null, allowed: readonly number[], fallback: number): number {
  const n = Math.trunc(Number(raw));
  return allowed.includes(n) ? n : fallback;
}

export function listPageSkip(page: number, take: number): number {
  const p = Number.isFinite(page) && page > 1 ? Math.min(2000, Math.trunc(page)) : 1;
  const size = Number.isFinite(take) && take > 0 ? Math.trunc(take) : 50;
  return (p - 1) * size;
}

/** Inclusive row numbers. An empty page is 0–0, not a full window. */
export function listPageRange(page: number, take: number, rowCount: number): { from: number; to: number } {
  if (!Number.isFinite(rowCount) || rowCount <= 0) return { from: 0, to: 0 };
  const from = listPageSkip(page, take) + 1;
  return { from, to: from + Math.trunc(rowCount) - 1 };
}

function readSearch(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

function clipSkip(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100_000, Math.trunc(n));
}

export type LedgerListQuery = {
  q: string;
  type: string;
  userId: string;
  from: string;
  to: string;
  page: number;
  take: number;
};

export function parseLedgerListQuery(search: string): LedgerListQuery {
  const sp = readSearch(search);
  return {
    q: clip(sp.get("q"), 80),
    type: clip(sp.get("type"), 40).toUpperCase(),
    userId: clip(sp.get("userId"), 40),
    from: clip(sp.get("from"), 10),
    to: clip(sp.get("to"), 10),
    page: clipListPage(sp.get("page")),
    take: clipListTake(sp.get("take"), CRM_LIST_TAKES, 50),
  };
}

export function ledgerListSearchString(f: LedgerListQuery): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.type) sp.set("type", f.type);
  if (f.userId) sp.set("userId", f.userId);
  if (f.from) sp.set("from", f.from);
  if (f.to) sp.set("to", f.to);
  if (f.page > 1) sp.set("page", String(f.page));
  if (f.take && f.take !== 50) sp.set("take", String(f.take));
  return sp.toString();
}

export type PositionListQuery = {
  q: string;
  tab: "OPEN" | "CLOSED" | "ALL" | "ORDERS";
  page: number;
  take: number;
};

export function parsePositionListQuery(search: string): PositionListQuery {
  const sp = readSearch(search);
  const tab = clip(sp.get("tab"), 20).toUpperCase();
  return {
    q: clip(sp.get("q"), 80),
    tab: POS_TABS.has(tab) ? (tab as PositionListQuery["tab"]) : "OPEN",
    page: clipListPage(sp.get("page")),
    take: clipListTake(sp.get("take"), CRM_LIST_TAKES, 50),
  };
}

export function positionListSearchString(f: PositionListQuery): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.tab && f.tab !== "OPEN") sp.set("tab", f.tab);
  if (f.page > 1) sp.set("page", String(f.page));
  if (f.take && f.take !== 50) sp.set("take", String(f.take));
  return sp.toString();
}

export type TicketCursor = { deposit: number; margin: number; withdraw: number };

export type TicketListQuery = {
  q: string;
  /** Empty string means every status. PENDING is the default and is omitted from the URL. */
  status: string;
  kind: string;
  from: string;
  to: string;
  take: number;
  cursor: TicketCursor;
  stack: TicketCursor[];
};

function parseCursorTriple(raw: string): TicketCursor | null {
  const parts = raw.split("-");
  if (parts.length !== 3) return null;
  return { deposit: clipSkip(parts[0]), margin: clipSkip(parts[1]), withdraw: clipSkip(parts[2]) };
}

export function parseTicketStack(raw: string | null): TicketCursor[] {
  if (!raw) return [];
  const frames: TicketCursor[] = [];
  for (const part of raw.split(".").slice(0, 8)) {
    const cursor = parseCursorTriple(part);
    if (cursor) frames.push(cursor);
  }
  return frames;
}

export function ticketStackString(stack: TicketCursor[]): string {
  return stack
    .slice(-8)
    .map((c) => `${c.deposit}-${c.margin}-${c.withdraw}`)
    .join(".");
}

export function parseTicketListQuery(search: string): TicketListQuery {
  const sp = readSearch(search);
  const statusRaw = clip(sp.get("status"), 20).toUpperCase();
  const status = statusRaw === "ALL" ? "" : TICKET_STATUSES.has(statusRaw) ? statusRaw : "PENDING";
  const kindRaw = clip(sp.get("kind"), 20).toLowerCase();
  return {
    q: clip(sp.get("q"), 80),
    status,
    kind: TICKET_KINDS.has(kindRaw) ? kindRaw : "all",
    from: clip(sp.get("from"), 10),
    to: clip(sp.get("to"), 10),
    take: clipListTake(sp.get("take"), CRM_LIST_TAKES, 50),
    cursor: {
      deposit: clipSkip(sp.get("depSkip")),
      margin: clipSkip(sp.get("marginSkip")),
      withdraw: clipSkip(sp.get("wdSkip")),
    },
    stack: parseTicketStack(sp.get("stack")),
  };
}

export function ticketListSearchString(f: TicketListQuery): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.status === "") sp.set("status", "ALL");
  else if (f.status && f.status !== "PENDING") sp.set("status", f.status);
  if (f.kind && f.kind !== "all") sp.set("kind", f.kind);
  if (f.from) sp.set("from", f.from);
  if (f.to) sp.set("to", f.to);
  if (f.take && f.take !== 50) sp.set("take", String(f.take));
  if (f.cursor.deposit) sp.set("depSkip", String(f.cursor.deposit));
  if (f.cursor.margin) sp.set("marginSkip", String(f.cursor.margin));
  if (f.cursor.withdraw) sp.set("wdSkip", String(f.cursor.withdraw));
  const stack = ticketStackString(f.stack);
  if (stack) sp.set("stack", stack);
  return sp.toString();
}

export type ChatListQuery = {
  q: string;
  tab: "all" | "new" | "unanswered";
  page: number;
  take: number;
  user: string;
};

export function parseChatListQuery(search: string): ChatListQuery {
  const sp = readSearch(search);
  const tab = clip(sp.get("tab"), 20).toLowerCase();
  return {
    q: clip(sp.get("q"), 80),
    tab: CHAT_TABS.has(tab) ? (tab as ChatListQuery["tab"]) : "all",
    page: clipListPage(sp.get("page")),
    take: clipListTake(sp.get("take"), CHAT_LIST_TAKES, 20),
    user: clip(sp.get("user"), 40),
  };
}

export function chatListSearchString(f: ChatListQuery): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.tab && f.tab !== "all") sp.set("tab", f.tab);
  if (f.page > 1) sp.set("page", String(f.page));
  if (f.take && f.take !== 20) sp.set("take", String(f.take));
  if (f.user) sp.set("user", f.user);
  return sp.toString();
}
