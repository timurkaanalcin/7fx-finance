/** Pure helpers for CRM v3 timeline and desk arrangement. Layout stays in the browser. Rows stay in their own currency. */

export const LINE_KINDS = ["deposit", "withdrawal", "position", "ticket", "note", "call"] as const;
export type LineKind = (typeof LINE_KINDS)[number];

export type LineItem = {
  id: string;
  kind: LineKind;
  at: string;
  title: string;
  detail: string;
  amount: number | null;
  currency: string;
};

/** Cards that already sit on the CRM v3 overview, below the fixed header. */
export const OVERVIEW_CARDS = [
  "rules", "fx", "goal", "funnel", "tasks", "churn", "pins", "cities", "book", "workload", "heat", "watch", "team",
] as const;
export type OverviewCard = (typeof OVERVIEW_CARDS)[number];
export type OverviewLayout = { order: OverviewCard[]; hidden: OverviewCard[] };

type MoneyRow = { id: string; createdAt?: string | null; amount?: number | null; currency?: string | null; status?: string | null; method?: unknown };
type PositionRow = { id: string; openedAt?: string | null; symbol?: string | null; side?: string | null; volume?: number | null; status?: string | null; profit?: number | null };
type TicketRow = { id: string; openedAt?: string | null; kind?: string | null; amount?: number | null; currency?: string | null; status?: string | null };
type NoteRow = { id: string; body?: string | null; createdAt?: string | null; authorName?: string | null };
type CallRow = { id: string; at: string; outcome?: string | null; note?: string | null; minutes?: number | null };

function moneyText(amount: number | null | undefined, currency: string | null | undefined, status: string | null | undefined): { amount: number | null; currency: string; detail: string } {
  const code = String(currency || "").toUpperCase();
  const value = Number(amount);
  const has = Number.isFinite(value);
  return {
    amount: has ? value : null,
    currency: code,
    detail: [status || "", code].filter(Boolean).join(" · "),
  };
}

function methodLabel(method: unknown): string {
  if (!method) return "";
  if (typeof method === "string") return method;
  if (typeof method === "object" && method && "label" in method) return String((method as { label?: string }).label || "");
  return "";
}

export function buildLine(input: {
  deposits: MoneyRow[];
  withdrawals: MoneyRow[];
  positions: PositionRow[];
  tickets: TicketRow[];
  notes: NoteRow[];
  calls: CallRow[];
}): LineItem[] {
  const seen = new Set<string>();
  const items: LineItem[] = [];
  for (const row of input.deposits) {
    seen.add(row.id);
    const money = moneyText(row.amount, row.currency, row.status);
    items.push({
      id: `deposit-${row.id}`,
      kind: "deposit",
      at: String(row.createdAt || ""),
      title: methodLabel(row.method) || row.id,
      detail: money.detail,
      amount: money.amount,
      currency: money.currency,
    });
  }
  for (const row of input.withdrawals) {
    seen.add(row.id);
    const money = moneyText(row.amount, row.currency, row.status);
    items.push({
      id: `withdrawal-${row.id}`,
      kind: "withdrawal",
      at: String(row.createdAt || ""),
      title: methodLabel(row.method) || row.id,
      detail: money.detail,
      amount: money.amount,
      currency: money.currency,
    });
  }
  for (const row of input.positions) {
    const profit = Number(row.profit);
    items.push({
      id: `position-${row.id}`,
      kind: "position",
      at: String(row.openedAt || ""),
      title: [row.symbol || "—", row.side || ""].filter(Boolean).join(" "),
      detail: [row.status || "", row.volume != null ? String(row.volume) : "", Number.isFinite(profit) ? `P/L ${profit}` : ""].filter(Boolean).join(" · "),
      amount: null,
      currency: "",
    });
  }
  for (const row of input.tickets) {
    if (seen.has(row.id)) continue;
    const money = moneyText(row.amount, row.currency, row.status);
    items.push({
      id: `ticket-${row.id}`,
      kind: "ticket",
      at: String(row.openedAt || ""),
      title: String(row.kind || row.id),
      detail: money.detail,
      amount: money.currency ? money.amount : null,
      currency: money.currency,
    });
  }
  for (const row of input.notes) {
    items.push({
      id: `note-${row.id}`,
      kind: "note",
      at: String(row.createdAt || ""),
      title: String(row.body || "—"),
      detail: String(row.authorName || ""),
      amount: null,
      currency: "",
    });
  }
  for (const row of input.calls) {
    items.push({
      id: `call-${row.id}`,
      kind: "call",
      at: String(row.at || ""),
      title: String(row.outcome || "—"),
      detail: [row.minutes ? `${row.minutes}m` : "", row.note || ""].filter(Boolean).join(" · "),
      amount: null,
      currency: "",
    });
  }
  return items.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function filterLine(items: LineItem[], kinds: LineKind[], query: string): LineItem[] {
  const allow = new Set(kinds);
  const text = query.trim().toLowerCase();
  return items.filter((item) => {
    if (!allow.has(item.kind)) return false;
    if (!text) return true;
    return `${item.title} ${item.detail} ${item.kind} ${item.currency}`.toLowerCase().includes(text);
  });
}

export function dayGroups(items: LineItem[]): { day: string; items: LineItem[] }[] {
  const map = new Map<string, LineItem[]>();
  for (const item of items) {
    const day = item.at.slice(0, 10);
    const list = map.get(day) || [];
    list.push(item);
    map.set(day, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => {
      if (!a[0]) return 1;
      if (!b[0]) return -1;
      return b[0].localeCompare(a[0]);
    })
    .map(([day, rows]) => ({ day, items: rows }));
}

export function kindCounts(items: LineItem[]): Record<LineKind, number> {
  const counts = { deposit: 0, withdrawal: 0, position: 0, ticket: 0, note: 0, call: 0 };
  for (const item of items) counts[item.kind] += 1;
  return counts;
}

export function currencySums(items: LineItem[], kind: LineKind): { currency: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (item.kind !== kind || !item.currency || item.amount == null) continue;
    map.set(item.currency, (map.get(item.currency) || 0) + item.amount);
  }
  return Array.from(map.entries())
    .map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

function isCard(id: string): id is OverviewCard {
  return (OVERVIEW_CARDS as readonly string[]).includes(id);
}

export function defaultLayout(): OverviewLayout {
  return { order: [...OVERVIEW_CARDS], hidden: [] };
}

export function readLayout(raw: unknown): OverviewLayout {
  const row = raw && typeof raw === "object" ? raw as { order?: unknown; hidden?: unknown } : {};
  const order: OverviewCard[] = [];
  if (Array.isArray(row.order)) {
    for (const id of row.order) if (typeof id === "string" && isCard(id) && !order.includes(id)) order.push(id);
  }
  for (const id of OVERVIEW_CARDS) if (!order.includes(id)) order.push(id);
  const hidden: OverviewCard[] = [];
  if (Array.isArray(row.hidden)) {
    for (const id of row.hidden) if (typeof id === "string" && isCard(id) && !hidden.includes(id)) hidden.push(id);
  }
  return { order, hidden };
}

export function toggleHidden(layout: OverviewLayout, id: OverviewCard): OverviewLayout {
  const hidden = layout.hidden.includes(id) ? layout.hidden.filter((item) => item !== id) : [...layout.hidden, id];
  return { ...layout, hidden };
}

export function moveCard(layout: OverviewLayout, id: OverviewCard, dir: -1 | 1): OverviewLayout {
  const order = layout.order.slice();
  const index = order.indexOf(id);
  const next = index + dir;
  if (index < 0 || next < 0 || next >= order.length) return layout;
  const [picked] = order.splice(index, 1);
  order.splice(next, 0, picked);
  return { ...layout, order };
}

export function visibleCards(layout: OverviewLayout): OverviewCard[] {
  const hidden = new Set(layout.hidden);
  return layout.order.filter((id) => !hidden.has(id));
}
