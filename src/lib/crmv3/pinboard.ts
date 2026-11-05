/** Local pinboard cards, and active versus pending counts from loaded IB rows. */

export const BOARD_KEY = "crmv3-pinboard";
export const IB_KEY = "crmv3-ib-hide";

export const IB_KINDS = ["active", "pending"] as const;
export type IbKind = (typeof IB_KINDS)[number];

export type Card = {
  id: string;
  text: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type IbRow = { status?: string | null; label?: string | null };

export type IbSplit = { active: number; pending: number };

export type OtherLine = { status: string; count: number };

export function cleanCard(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function readCards(raw: unknown): Card[] {
  if (!Array.isArray(raw)) return [];
  const out: Card[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Card>;
    const id = String(row.id || "").trim();
    const text = cleanCard(String(row.text || ""));
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({ id, text, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

/** A blank card is left out. */
export function addCard(cards: readonly Card[], card: { id: string; text: string; at: string }): Card[] {
  const id = String(card.id || "").trim();
  const text = cleanCard(card.text);
  if (!id || !text || cards.some((item) => item.id === id)) return cards.slice();
  return [{ id, text, pinned: false, hidden: false, at: card.at }, ...cards].slice(0, 40);
}

export function toggleCardPin(cards: readonly Card[], id: string): Card[] {
  return cards.map((card) => (card.id === id ? { ...card, pinned: !card.pinned } : card));
}

export function setCardHidden(cards: readonly Card[], id: string, hidden: boolean): Card[] {
  return cards.map((card) => (card.id === id ? { ...card, hidden } : card));
}

/** Search uses the card text. */
export function visibleCards(cards: readonly Card[], query: string, hidden: boolean): Card[] {
  const text = query.trim().toLowerCase();
  return cards
    .filter((card) => card.hidden === hidden && (!text || card.text.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}

/** Active and pending only. A blank or any other status is not renamed. */
export function ibKind(raw: string | null | undefined): IbKind | "" {
  const value = String(raw || "").trim().toUpperCase();
  if (value === "ACTIVE") return "active";
  if (value === "PENDING") return "pending";
  return "";
}

export function rawStatus(raw: string | null | undefined): string {
  return String(raw || "").trim().toUpperCase();
}

export function ibSplit(rows: readonly IbRow[]): IbSplit {
  let active = 0;
  let pending = 0;
  for (const row of rows) {
    const kind = ibKind(row.status);
    if (kind === "active") active += 1;
    else if (kind === "pending") pending += 1;
  }
  return { active, pending };
}

export function otherStatuses(rows: readonly IbRow[]): OtherLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const status = rawStatus(row.status);
    if (!status || ibKind(status)) continue;
    map.set(status, (map.get(status) || 0) + 1);
  }
  const out: OtherLine[] = [];
  map.forEach((count, status) => out.push({ status, count }));
  return out.sort((a, b) => a.status.localeCompare(b.status));
}

export function presentIbs(rows: readonly IbRow[]): IbKind[] {
  const split = ibSplit(rows);
  const out: IbKind[] = [];
  if (split.active > 0) out.push("active");
  if (split.pending > 0) out.push("pending");
  return out;
}

export function readHiddenIbs(raw: unknown): IbKind[] {
  if (!Array.isArray(raw)) return [];
  const out: IbKind[] = [];
  for (const item of raw) {
    const kind = ibKind(String(item || ""));
    if (kind && !out.includes(kind)) out.push(kind);
  }
  return out;
}

export function toggleIb(hidden: readonly string[], kind: string): IbKind[] {
  const current = readHiddenIbs(hidden);
  const next = ibKind(kind);
  if (!next) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleIbs(present: readonly string[], hidden: readonly string[], showHidden: boolean): IbKind[] {
  const gone = new Set(readHiddenIbs(hidden));
  return presentIbs(present.map((status) => ({ status }))).filter((kind) => (showHidden ? gone.has(kind) : !gone.has(kind)));
}

export function activeIb(selected: string, visible: readonly string[]): IbKind | "" {
  const kind = ibKind(selected);
  if (!kind) return "";
  return visible.some((item) => ibKind(item) === kind) ? kind : "";
}

export function visibleReferrals<T extends IbRow>(rows: readonly T[], kind: string, query: string): T[] {
  const want = ibKind(kind);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = ibKind(row.status);
    if (!got) return false;
    if (want && got !== want) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}
