/** Ticket inbox and introducer stats. Figures use loaded rows only. */

export type SlaMark = "none" | "ok" | "due" | "breached";

export type SlaClock = { hours: number; left: number; mark: SlaMark; replyHours: number | null };

export const SLA_KEY = "crmv3-sla-hours";
export const DUE_KEY = "crmv3-ticket-due";
export const VIEW_KEY = "crmv3-ticket-views";
export const ROLE_KEY = "crmv3-desk-role";

export function deskRole(raw: unknown): "desk" | "viewer" {
  return raw === "viewer" ? "viewer" : "desk";
}

export function formatAge(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function slaClock(
  openedAt: string | null | undefined,
  closedAt: string | null | undefined,
  nowMs: number,
  limitHours: number,
  dueHours: number,
): SlaClock {
  const opened = openedAt ? new Date(openedAt).getTime() : NaN;
  if (!Number.isFinite(opened)) return { hours: 0, left: 0, mark: "none", replyHours: replyAge(closedAt, nowMs) };
  const hours = Math.max(0, (nowMs - opened) / 36e5);
  const limit = Number.isFinite(limitHours) && limitHours > 0 ? limitHours : 24;
  const due = Number.isFinite(dueHours) && dueHours > 0 ? dueHours : 4;
  const left = limit - hours;
  let mark: SlaMark = "ok";
  if (left < 0) mark = "breached";
  else if (left <= due) mark = "due";
  return { hours, left, mark, replyHours: replyAge(closedAt, nowMs) };
}

function replyAge(closedAt: string | null | undefined, nowMs: number): number | null {
  if (!closedAt) return null;
  const time = new Date(closedAt).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, (nowMs - time) / 36e5);
}

export type TicketFilter = { status: string; kind: string; sla: "" | "due" | "breached" };

export function filterTickets<T extends { status?: string | null; kind?: string | null; openedAt?: string | null; closedAt?: string | null }>(
  rows: readonly T[],
  filter: TicketFilter,
  nowMs: number,
  limitHours: number,
  dueHours: number,
): T[] {
  const out: T[] = [];
  for (const row of rows) {
    if (filter.status && String(row.status || "") !== filter.status) continue;
    if (filter.kind && String(row.kind || "") !== filter.kind) continue;
    if (filter.sla) {
      const clock = slaClock(row.openedAt, row.closedAt, nowMs, limitHours, dueHours);
      if (clock.mark !== filter.sla) continue;
    }
    out.push(row);
  }
  return out;
}

export type TicketView = { id: string; name: string; status: string; kind: string; sla: "" | "due" | "breached" };

export function readViews(raw: unknown): TicketView[] {
  if (!Array.isArray(raw)) return [];
  const out: TicketView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: unknown; name?: unknown; status?: unknown; kind?: unknown; sla?: unknown };
    const name = String(row.name || "").trim();
    if (!name) continue;
    const sla = row.sla === "due" || row.sla === "breached" ? row.sla : "";
    out.push({ id: String(row.id || name), name: name.slice(0, 40), status: String(row.status || ""), kind: String(row.kind || ""), sla });
  }
  return out;
}

export function saveView(views: readonly TicketView[], view: TicketView): TicketView[] {
  const name = view.name.trim();
  if (!name) return views.slice();
  return [...views, { ...view, name: name.slice(0, 40), id: view.id || name }];
}

export type Person = { id: string; affiliateA?: string | null };
export type Cash = { userId?: string | null; amount?: number | null; currency?: string | null };

export type Introducer = {
  name: string;
  customers: number;
  withDeposit: number;
  sums: { currency: string; count: number; amount: number }[];
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Customers and deposits stay in the introducer's own rows. Currencies are not added together. */
export function introducers(people: readonly Person[], deposits: readonly Cash[]): Introducer[] {
  const groups: Record<string, { ids: string[] }> = {};
  for (const person of people) {
    const name = String(person.affiliateA || "").trim();
    if (!groups[name]) groups[name] = { ids: [] };
    if (!groups[name].ids.includes(person.id)) groups[name].ids.push(person.id);
  }
  const names = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  const out: Introducer[] = [];
  for (const name of names) {
    const ids = groups[name].ids;
    const mine = deposits.filter((row) => ids.includes(String(row.userId || "")));
    const funded = new Set<string>();
    const sums: Record<string, { currency: string; count: number; amount: number }> = {};
    for (const row of mine) {
      const userId = String(row.userId || "");
      if (userId) funded.add(userId);
      const currency = String(row.currency || "").trim().toUpperCase();
      if (!currency) continue;
      if (!sums[currency]) sums[currency] = { currency, count: 0, amount: 0 };
      sums[currency].count += 1;
      const amount = Number(row.amount);
      if (Number.isFinite(amount)) sums[currency].amount = round2(sums[currency].amount + amount);
    }
    const keys = Object.keys(sums).sort();
    const list: Introducer["sums"] = [];
    for (const key of keys) list.push(sums[key]);
    out.push({ name, customers: ids.length, withDeposit: funded.size, sums: list });
  }
  return out;
}

export function csvMatrix(rows: readonly Introducer[], currencies: readonly string[]): string[][] {
  return rows.map((row) => {
    const line = [row.name, String(row.customers), String(row.withDeposit)];
    for (const currency of currencies) {
      const found = row.sums.find((item) => item.currency === currency);
      line.push(found ? String(found.amount) : "");
    }
    return line;
  });
}

export function ticketMove(index: number, length: number, dir: 1 | -1): number {
  if (!length) return 0;
  const next = index + dir;
  if (next < 0) return 0;
  if (next >= length) return length - 1;
  return next;
}
