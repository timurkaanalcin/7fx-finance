/** Local contact labels, and balance counts grouped by whether a loaded amount is zero. */

export const CONTACT_KEY = "crmv3-contact-chips";
export const ZERO_KEY = "crmv3-zero-hide";

export type Contact = {
  id: string;
  label: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type Kind = "zero" | "nonzero";

export type BalanceRow = {
  balance?: unknown;
  account?: { balance?: unknown; currency?: unknown } | null;
  label?: string | null;
  currency?: string | null;
};

export type KindLine = { kind: Kind | ""; count: number };

export function contactLabel(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function readContacts(raw: unknown): Contact[] {
  if (!Array.isArray(raw)) return [];
  const out: Contact[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Contact>;
    const id = String(row.id || "").trim();
    const label = contactLabel(row.label);
    if (!id || !label || out.some((contact) => contact.id === id || contact.label === label)) continue;
    out.push({ id, label, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addContact(contacts: readonly Contact[], contact: { id: string; label: string; at: string }): Contact[] {
  const id = String(contact.id || "").trim();
  const label = contactLabel(contact.label);
  if (!id || !label || contacts.some((item) => item.id === id || item.label === label)) return contacts.slice();
  return [{ id, label, pinned: false, hidden: false, at: contact.at }, ...contacts].slice(0, 40);
}

export function toggleContactPin(contacts: readonly Contact[], id: string): Contact[] {
  return contacts.map((contact) => (contact.id === id ? { ...contact, pinned: !contact.pinned } : contact));
}

export function setContactHidden(contacts: readonly Contact[], id: string, hidden: boolean): Contact[] {
  return contacts.map((contact) => (contact.id === id ? { ...contact, hidden } : contact));
}

export function visibleContacts(contacts: readonly Contact[], query: string, hidden: boolean): Contact[] {
  const text = query.trim().toLowerCase();
  return contacts
    .filter((contact) => contact.hidden === hidden && (!text || contact.label.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** The amount already on the row. A missing amount stays missing and is not turned into zero. */
export function loadedAmount(row: { balance?: unknown; account?: { balance?: unknown } | null } | null | undefined): number | null {
  if (!row || typeof row !== "object") return null;
  const direct = finite(row.balance);
  if (direct !== null) return direct;
  if (row.balance !== undefined && row.balance !== null && row.balance !== "") return null;
  return finite(row.account?.balance);
}

function finite(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function amountKind(amount: number | null): Kind | "" {
  if (amount === null) return "";
  return amount === 0 ? "zero" : "nonzero";
}

export function loadedCurrency(row: BalanceRow | null | undefined): string {
  if (!row || typeof row !== "object") return "";
  const direct = code(row.currency);
  if (direct) return direct;
  return code(row.account?.currency);
}

function code(value: unknown): string {
  const text = String(value || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(text) ? text : "";
}

export function kindLines(rows: readonly BalanceRow[]): KindLine[] {
  const map = new Map<Kind | "", number>();
  for (const row of rows) {
    const kind = amountKind(loadedAmount(row));
    map.set(kind, (map.get(kind) || 0) + 1);
  }
  const out: KindLine[] = [];
  map.forEach((count, kind) => out.push({ kind, count }));
  return out.sort((a, b) => {
    if (!a.kind) return -1;
    if (!b.kind) return 1;
    return a.kind.localeCompare(b.kind);
  });
}

export function namedKinds(rows: readonly BalanceRow[]): Kind[] {
  return kindLines(rows).map((line) => line.kind).filter((kind): kind is Kind => kind === "zero" || kind === "nonzero");
}

export function readHiddenKinds(raw: unknown, present: readonly string[]): Kind[] {
  const allow = new Set(present.filter((item): item is Kind => item === "zero" || item === "nonzero"));
  if (!Array.isArray(raw)) return [];
  const out: Kind[] = [];
  for (const item of raw) {
    const kind = item === "zero" || item === "nonzero" ? item : "";
    if (!kind || !allow.has(kind) || out.includes(kind)) continue;
    out.push(kind);
  }
  return out;
}

export function toggleKind(hidden: readonly string[], kind: string, present: readonly string[]): Kind[] {
  const current = readHiddenKinds(hidden, present);
  if (kind !== "zero" && kind !== "nonzero") return current;
  if (!present.includes(kind)) return current;
  return current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind];
}

export function visibleKinds(present: readonly string[], hidden: readonly string[], showHidden: boolean): Kind[] {
  const gone = new Set(readHiddenKinds(hidden, present));
  return namedKinds(present.map((kind) => ({ balance: kind === "zero" ? 0 : kind === "nonzero" ? 1 : null }))).filter((kind) => (showHidden ? gone.has(kind) : !gone.has(kind)));
}

export function activeKind(selected: string, visible: readonly string[]): Kind | "" {
  if (selected !== "zero" && selected !== "nonzero") return "";
  return visible.includes(selected) ? selected : "";
}

export function visibleBalances<T extends BalanceRow>(rows: readonly T[], kind: string, missing: boolean, query: string): T[] {
  const want = kind === "zero" || kind === "nonzero" ? kind : "";
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = amountKind(loadedAmount(row));
    if (missing) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${loadedCurrency(row)}`.toLowerCase().includes(text);
  });
}
