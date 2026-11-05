/** Trade blotter and the local desk pad. Rows stay loaded. Currencies are never added together. */

export const PAD_KEY = "crmv4-desk-pad";

export type BlotterRow = {
  id: string;
  userId?: string | null;
  symbol?: string | null;
  side?: string | null;
  type?: string | null;
  volume?: number | null;
  price?: number | null;
  openPrice?: number | null;
  status?: string | null;
  traderName?: string | null;
};

export type ProfitRow = {
  id?: string;
  userId?: string | null;
  profit?: number | null;
  closeProfit?: number | null;
  status?: string | null;
};

export type CurrencyLine = { currency: string; profit: number; count: number };

export type DeskNote = {
  id: string;
  customerId: string;
  body: string;
  pinned: boolean;
  archived: boolean;
  at: string;
};

export type PadCustomer = { id: string; name?: string | null; email?: string | null };

export function orderStatus(row: { status?: string | null }): string {
  return String(row.status || "").trim().toUpperCase();
}

export function isFill(row: { status?: string | null }): boolean {
  return orderStatus(row) === "FILLED";
}

export function isOpenOrder(row: { status?: string | null }): boolean {
  return orderStatus(row) === "PENDING";
}

export function sideLabel(side: string | null | undefined): string {
  return String(side || "").trim().toUpperCase();
}

export function filterBlotter(rows: readonly BlotterRow[], kind: "" | "fill" | "open" | "all", query: string): BlotterRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (kind === "fill" && !isFill(row)) return false;
    if (kind === "open" && !isOpenOrder(row)) return false;
    if (kind === "" && !isFill(row) && !isOpenOrder(row)) return false;
    if (!text) return true;
    return `${row.symbol || ""} ${row.traderName || ""} ${row.side || ""} ${row.type || ""}`.toLowerCase().includes(text);
  });
}

export function rowPrice(row: BlotterRow): string {
  const price = row.price ?? row.openPrice;
  if (price == null || price === ("" as unknown)) return "";
  const n = Number(price);
  return Number.isFinite(n) ? String(n) : "";
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function profitOf(row: ProfitRow): number | null {
  const raw = orderStatus(row) === "CLOSED" ? row.closeProfit ?? row.profit : row.profit;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** One line per currency. A missing currency stays on its own line. */
export function currencyLines(rows: readonly ProfitRow[], currencies: Readonly<Record<string, string>>): CurrencyLine[] {
  const map = new Map<string, { profit: number; count: number }>();
  for (const row of rows) {
    if (orderStatus(row) !== "CLOSED") continue;
    const profit = profitOf(row);
    if (profit == null) continue;
    const id = String(row.userId || "");
    const currency = String(currencies[id] || "").trim().toUpperCase();
    const prev = map.get(currency) || { profit: 0, count: 0 };
    prev.profit = roundMoney(prev.profit + profit);
    prev.count += 1;
    map.set(currency, prev);
  }
  const out: CurrencyLine[] = [];
  map.forEach((value, currency) => out.push({ currency, profit: value.profit, count: value.count }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

export function currencyMap(rows: readonly { id: string; currency?: string | null; account?: { currency?: string | null } | null }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    if (!row.id) continue;
    const code = String(row.currency || row.account?.currency || "").trim().toUpperCase();
    if (code) out[row.id] = code;
  }
  return out;
}

export function cleanBody(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 280);
}

export function readNotes(raw: unknown): DeskNote[] {
  if (!Array.isArray(raw)) return [];
  const out: DeskNote[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DeskNote>;
    const id = String(row.id || "").trim();
    const customerId = String(row.customerId || "").trim();
    const body = cleanBody(String(row.body || ""));
    if (!id || !customerId || !body) continue;
    if (out.some((note) => note.id === id)) continue;
    out.push({
      id,
      customerId,
      body,
      pinned: row.pinned === true,
      archived: row.archived === true,
      at: String(row.at || ""),
    });
  }
  return out.slice(0, 200);
}

export function addNote(notes: readonly DeskNote[], note: { id: string; customerId: string; body: string; at: string }): DeskNote[] {
  const body = cleanBody(note.body);
  const id = String(note.id || "").trim();
  const customerId = String(note.customerId || "").trim();
  if (!id || !customerId || !body) return notes.slice();
  if (notes.some((item) => item.id === id)) return notes.slice();
  return [{ id, customerId, body, pinned: false, archived: false, at: note.at }, ...notes].slice(0, 200);
}

export function togglePin(notes: readonly DeskNote[], id: string): DeskNote[] {
  return notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
}

export function toggleArchive(notes: readonly DeskNote[], id: string): DeskNote[] {
  return notes.map((note) => (note.id === id ? { ...note, archived: !note.archived } : note));
}

export function removeNote(notes: readonly DeskNote[], id: string): DeskNote[] {
  return notes.filter((note) => note.id !== id);
}

export function sortPad(notes: readonly DeskNote[]): DeskNote[] {
  return notes.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return String(b.at).localeCompare(String(a.at));
  });
}

export function visibleNotes(
  notes: readonly DeskNote[],
  customers: readonly PadCustomer[],
  query: string,
  archived: boolean,
): DeskNote[] {
  const names = new Map<string, string>();
  const ids = new Set<string>();
  for (const row of customers) {
    if (!row.id) continue;
    ids.add(row.id);
    names.set(row.id, `${row.name || ""} ${row.email || ""}`.toLowerCase());
  }
  const text = query.trim().toLowerCase();
  return sortPad(notes.filter((note) => {
    if (!ids.has(note.customerId)) return false;
    if (note.archived !== archived) return false;
    if (!text) return true;
    return `${note.body} ${names.get(note.customerId) || ""}`.toLowerCase().includes(text);
  }));
}
