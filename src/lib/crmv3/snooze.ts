/** Local snooze for loaded follow-ups, and buy versus sell counts from loaded orders. */

export const FOLLOW_KEY = "crmv3-follow-snooze";
export const SIDE_KEY = "crmv3-side-hide";

export const SIDE_KINDS = ["buy", "sell"] as const;
export type SideKind = (typeof SIDE_KINDS)[number];

export type Follow = { id: string; name: string; at: string };

export type Snooze = { id: string; until: string; at: string };

export type SideRow = { side?: string | null; label?: string | null };

export type SideSplit = { buy: number; sell: number };

export type OtherLine = { side: string; count: number };

/** A bare datetime is UTC. A blank or unparseable value is left out. */
export function utcInstant(raw: string | null | undefined): string {
  const text = String(raw || "").trim();
  if (!text) return "";
  const bare = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?$/.exec(text);
  const source = bare ? `${bare[1]}:${bare[2] || "00"}Z` : text;
  const ms = Date.parse(source);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toISOString();
}

export function followRows(rows: readonly { id?: string | null; name?: string | null; at?: string | null }[]): Follow[] {
  const out: Follow[] = [];
  for (const row of rows) {
    const id = String(row.id || "").trim();
    const at = utcInstant(row.at);
    if (!id || !at || out.some((item) => item.id === id)) continue;
    out.push({ id, name: String(row.name || "").trim(), at });
  }
  return out;
}

export function readSnoozes(raw: unknown, known: readonly string[]): Snooze[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(known.map((id) => String(id || "").trim()).filter(Boolean));
  const out: Snooze[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Snooze>;
    const id = String(row.id || "").trim();
    const until = utcInstant(row.until);
    if (!id || !until || !allow.has(id) || out.some((snooze) => snooze.id === id)) continue;
    out.push({ id, until, at: String(row.at || "") });
  }
  return out;
}

/** A blank time is left out. A customer who is not a loaded follow-up is left out. */
export function setSnooze(items: readonly Snooze[], id: string, until: string, known: readonly string[], at: string): Snooze[] {
  const nextId = String(id || "").trim();
  const nextUntil = utcInstant(until);
  if (!nextId || !nextUntil || !known.includes(nextId)) return items.slice();
  return [{ id: nextId, until: nextUntil, at }, ...items.filter((item) => item.id !== nextId)].slice(0, 40);
}

export function clearSnooze(items: readonly Snooze[], id: string): Snooze[] {
  return items.filter((item) => item.id !== id);
}

export function snoozeActive(item: Snooze | undefined, nowMs: number): boolean {
  if (!item) return false;
  const until = Date.parse(item.until);
  return Number.isFinite(until) && until > nowMs;
}

export function visibleFollows(rows: readonly Follow[], snoozes: readonly Snooze[], nowMs: number, query: string, snoozed: boolean): Follow[] {
  const text = query.trim().toLowerCase();
  const byId = new Map(snoozes.map((item) => [item.id, item]));
  return rows
    .filter((row) => {
      if (snoozeActive(byId.get(row.id), nowMs) !== snoozed) return false;
      if (!text) return true;
      return row.name.toLowerCase().includes(text);
    })
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** Buy and sell only. A blank or any other side is not renamed. */
export function sideKind(raw: string | null | undefined): SideKind | "" {
  const value = String(raw || "").trim().toUpperCase();
  if (value === "BUY") return "buy";
  if (value === "SELL") return "sell";
  return "";
}

export function rawSide(raw: string | null | undefined): string {
  return String(raw || "").trim().toUpperCase();
}

export function sideSplit(rows: readonly SideRow[]): SideSplit {
  let buy = 0;
  let sell = 0;
  for (const row of rows) {
    const kind = sideKind(row.side);
    if (kind === "buy") buy += 1;
    else if (kind === "sell") sell += 1;
  }
  return { buy, sell };
}

export function otherSides(rows: readonly SideRow[]): OtherLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const side = rawSide(row.side);
    if (!side || sideKind(side)) continue;
    map.set(side, (map.get(side) || 0) + 1);
  }
  const out: OtherLine[] = [];
  map.forEach((count, side) => out.push({ side, count }));
  return out.sort((a, b) => a.side.localeCompare(b.side));
}

export function presentSides(rows: readonly SideRow[]): SideKind[] {
  const split = sideSplit(rows);
  const out: SideKind[] = [];
  if (split.buy > 0) out.push("buy");
  if (split.sell > 0) out.push("sell");
  return out;
}

export function readHiddenSides(raw: unknown): SideKind[] {
  if (!Array.isArray(raw)) return [];
  const out: SideKind[] = [];
  for (const item of raw) {
    const kind = sideKind(String(item || ""));
    if (kind && !out.includes(kind)) out.push(kind);
  }
  return out;
}

export function toggleSide(hidden: readonly string[], kind: string): SideKind[] {
  const current = readHiddenSides(hidden);
  const next = sideKind(kind);
  if (!next) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleSides(present: readonly string[], hidden: readonly string[], showHidden: boolean): SideKind[] {
  const gone = new Set(readHiddenSides(hidden));
  return presentSides(present.map((side) => ({ side }))).filter((kind) => (showHidden ? gone.has(kind) : !gone.has(kind)));
}

export function activeSide(selected: string, visible: readonly string[]): SideKind | "" {
  const kind = sideKind(selected);
  if (!kind) return "";
  return visible.some((item) => sideKind(item) === kind) ? kind : "";
}

export function visibleOrders<T extends SideRow>(rows: readonly T[], kind: string, query: string): T[] {
  const want = sideKind(kind);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = sideKind(row.side);
    if (!got) return false;
    if (want && got !== want) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}
