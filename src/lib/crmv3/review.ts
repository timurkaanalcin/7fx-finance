/** Pure helpers for CRM v3 document review and reports. The checklist stays in the browser. Totals stay per currency. */

export const CHECK_ITEMS = ["name", "photo", "expiry", "readable"] as const;
export type CheckItem = (typeof CHECK_ITEMS)[number];
export type DocChecks = Record<CheckItem, boolean>;

export type ReviewDoc = {
  id: string;
  name?: string | null;
  docType?: string | null;
  status?: string | null;
  traderId?: string | null;
  trader?: string | null;
  traderEmail?: string | null;
  desk?: string | null;
  createdAt?: string | null;
};

export type ReviewPerson = {
  id: string;
  name: string;
  email: string;
  desk: string;
  docs: ReviewDoc[];
};

export type FileRow = { id: string; userId?: string | null; title?: string | null; fileName?: string | null; mime?: string | null };

export type MoneyLine = { id: string; amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; openedAt?: string | null; name?: string | null; kind?: string | null };

const EMPTY: DocChecks = { name: false, photo: false, expiry: false, readable: false };

export function emptyChecks(): DocChecks {
  return { ...EMPTY };
}

export function readChecks(raw: unknown): Record<string, DocChecks> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, DocChecks> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Record<string, unknown>;
    out[id] = {
      name: row.name === true,
      photo: row.photo === true,
      expiry: row.expiry === true,
      readable: row.readable === true,
    };
  }
  return out;
}

export function setCheck(map: Record<string, DocChecks>, id: string, item: CheckItem, on: boolean): Record<string, DocChecks> {
  const current = map[id] || emptyChecks();
  return { ...map, [id]: { ...current, [item]: on } };
}

export function checksDone(checks: DocChecks | undefined): number {
  if (!checks) return 0;
  return CHECK_ITEMS.filter((item) => checks[item]).length;
}

export function reviewQueue(docs: ReviewDoc[]): ReviewPerson[] {
  const map = new Map<string, ReviewPerson>();
  for (const doc of docs) {
    if (String(doc.status || "").toUpperCase() !== "PENDING") continue;
    const id = String(doc.traderId || "");
    if (!id) continue;
    const current = map.get(id) || {
      id,
      name: String(doc.trader || "—"),
      email: String(doc.traderEmail || ""),
      desk: String(doc.desk || "—"),
      docs: [],
    };
    current.docs.push(doc);
    map.set(id, current);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function matchQuery(people: ReviewPerson[], query: string): ReviewPerson[] {
  const text = query.trim().toLowerCase();
  if (!text) return people;
  return people.filter((person) => `${person.name} ${person.email} ${person.desk} ${person.docs.map((doc) => `${doc.name || ""} ${doc.docType || ""}`).join(" ")}`.toLowerCase().includes(text));
}

export function fileFor(userId: string, files: FileRow[]): FileRow | null {
  return files.find((file) => String(file.userId || "") === userId) || null;
}

export function isPdf(file: FileRow | null): boolean {
  if (!file) return false;
  return String(file.mime || file.fileName || "").toLowerCase().includes("pdf");
}

export type CurrencySum = { currency: string; count: number; amount: number };

export function sumsByCurrency(rows: MoneyLine[]): CurrencySum[] {
  const map = new Map<string, CurrencySum>();
  for (const row of rows) {
    const currency = String(row.currency || "").toUpperCase();
    if (!currency) continue;
    const amount = Number(row.amount);
    const current = map.get(currency) || { currency, count: 0, amount: 0 };
    current.count += 1;
    if (Number.isFinite(amount)) current.amount = Math.round((current.amount + amount) * 100) / 100;
    map.set(currency, current);
  }
  return Array.from(map.values()).sort((a, b) => a.currency.localeCompare(b.currency));
}

export function rowsForCurrency(rows: MoneyLine[], currency: string): MoneyLine[] {
  if (!currency) return rows;
  return rows.filter((row) => String(row.currency || "").toUpperCase() === currency.toUpperCase());
}
