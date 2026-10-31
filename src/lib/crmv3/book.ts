/** Pure helpers for the read-only book and the follow-up agenda. The book does not trade. */

export type BookRow = {
  id: string;
  symbol?: string | null;
  side?: string | null;
  volume?: number | null;
  status?: string | null;
  profit?: number | null;
  closeProfit?: number | null;
  openedAt?: string | null;
  closedAt?: string | null;
};

export type BookFilter = "all" | "open" | "closed";

export type FollowCard = {
  id: string;
  name: string;
  day: string;
  source: "loaded" | "browser";
};

export const FOLLOW_KEY = "crmv3-lead-follow";

export function bookStatus(row: BookRow): "open" | "closed" {
  return String(row.status || "OPEN").toUpperCase() === "CLOSED" ? "closed" : "open";
}

export function loadedPnl(row: BookRow): number | null {
  const raw = bookStatus(row) === "closed" && row.closeProfit != null ? row.closeProfit : row.profit;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function filterBook(rows: BookRow[], status: BookFilter, symbol: string): BookRow[] {
  const text = symbol.trim().toLowerCase();
  return rows.filter((row) => {
    if (status !== "all" && bookStatus(row) !== status) return false;
    if (text && !String(row.symbol || "").toLowerCase().includes(text)) return false;
    return true;
  });
}

export function symbolSummary(rows: BookRow[]): { symbol: string; count: number; pnl: number | null }[] {
  const map = new Map<string, { count: number; pnl: number; any: boolean }>();
  for (const row of rows) {
    const symbol = String(row.symbol || "—");
    const current = map.get(symbol) || { count: 0, pnl: 0, any: false };
    current.count += 1;
    const pnl = loadedPnl(row);
    if (pnl != null) {
      current.pnl = Math.round((current.pnl + pnl) * 100) / 100;
      current.any = true;
    }
    map.set(symbol, current);
  }
  const symbols: string[] = [];
  map.forEach((_value, symbol) => symbols.push(symbol));
  return symbols.sort((a, b) => a.localeCompare(b)).map((symbol) => {
    const value = map.get(symbol) || { count: 0, pnl: 0, any: false };
    return { symbol, count: value.count, pnl: value.any ? value.pnl : null };
  });
}

export function dayKey(iso: string | null | undefined): string {
  if (!iso) return "";
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return "";
  return new Date(at).toISOString().slice(0, 10);
}

export function weekDays(anchor: string): string[] {
  const at = Date.parse(`${anchor}T00:00:00Z`);
  if (!Number.isFinite(at)) return [];
  const weekday = new Date(at).getUTCDay();
  const start = at - ((weekday + 6) % 7) * 86_400_000;
  return Array.from({ length: 7 }, (_item, index) => new Date(start + index * 86_400_000).toISOString().slice(0, 10));
}

export function followCards(
  loaded: { id: string; name?: string | null; at?: string | null }[],
  browser: Record<string, string>,
  names: Record<string, string>,
): FollowCard[] {
  const out: FollowCard[] = [];
  for (const row of loaded) {
    const day = dayKey(row.at);
    if (!day) continue;
    out.push({ id: row.id, name: row.name || names[row.id] || row.id, day, source: "loaded" });
  }
  for (const [id, raw] of Object.entries(browser)) {
    const day = dayKey(raw) || (/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "");
    if (!day) continue;
    out.push({ id, name: names[id] || id, day, source: "browser" });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || a.name.localeCompare(b.name));
}

export function overdueCards(cards: FollowCard[], today: string): FollowCard[] {
  return cards.filter((card) => card.day < today);
}

export function cardsOn(cards: FollowCard[], day: string): FollowCard[] {
  return cards.filter((card) => card.day === day);
}

export function setBrowserFollow(map: Record<string, string>, id: string, day: string): Record<string, string> {
  const next = { ...map };
  const value = day.trim();
  if (!value) delete next[id];
  else next[id] = value;
  return next;
}

export function shiftDay(day: string, by: number): string {
  const at = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(at)) return day;
  return new Date(at + by * 86_400_000).toISOString().slice(0, 10);
}
