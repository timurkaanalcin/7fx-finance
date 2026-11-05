/** Exact duplicate groups from loaded rows, and local meeting bullets. Currencies are never added together. */

export const DISMISS_KEY = "crmv4-dupe-dismiss";
export const PREP_KEY = "crmv4-meeting-prep";

export type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  balance?: number | null;
  currency?: string | null;
};

export type MoneyLine = { currency: string; count: number; amount: number };

export type DupeGroup = {
  id: string;
  kind: "email" | "phone";
  value: string;
  people: Person[];
  lines: MoneyLine[];
};

export type Bullet = {
  id: string;
  customerId: string;
  body: string;
  pinned: boolean;
  at: string;
};

export function emailKey(raw: string | null | undefined): string {
  return String(raw || "").trim().toLowerCase();
}

export function phoneKey(raw: string | null | undefined): string {
  return String(raw || "").replace(/\D+/g, "");
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function linesOf(people: readonly Person[]): MoneyLine[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const person of people) {
    const currency = String(person.currency || "").trim().toUpperCase();
    const prev = map.get(currency) || { count: 0, amount: 0 };
    prev.count += 1;
    const amount = Number(person.balance);
    if (Number.isFinite(amount)) prev.amount = round2(prev.amount + amount);
    map.set(currency, prev);
  }
  const out: MoneyLine[] = [];
  map.forEach((value, currency) => out.push({ currency, count: value.count, amount: value.amount }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

function groupsFor(people: readonly Person[], kind: "email" | "phone", keyOf: (person: Person) => string): DupeGroup[] {
  const buckets = new Map<string, Person[]>();
  for (const person of people) {
    if (!person.id) continue;
    const value = keyOf(person);
    if (!value) continue;
    const list = buckets.get(value) || [];
    list.push(person);
    buckets.set(value, list);
  }
  const out: DupeGroup[] = [];
  buckets.forEach((list, value) => {
    if (list.length < 2) return;
    out.push({ id: `${kind}:${value}`, kind, value, people: list, lines: linesOf(list) });
  });
  return out;
}

/** Exact email or exact phone digits. A blank value never forms a group. */
export function duplicateGroups(people: readonly Person[], query: string, dismissed: readonly string[], showDismissed: boolean): DupeGroup[] {
  const text = query.trim().toLowerCase();
  const shown = people.filter((person) => {
    if (!person.id) return false;
    if (!text) return true;
    return `${person.name || ""} ${person.email || ""} ${person.phone || ""}`.toLowerCase().includes(text);
  });
  return [...groupsFor(shown, "email", (person) => emailKey(person.email)), ...groupsFor(shown, "phone", (person) => phoneKey(person.phone))]
    .filter((group) => (showDismissed ? dismissed.includes(group.id) : !dismissed.includes(group.id)))
    .sort((a, b) => b.people.length - a.people.length || a.id.localeCompare(b.id));
}

export function readIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 80);
}

export function toggleId(ids: readonly string[], id: string): string[] {
  if (!id) return ids.slice();
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function cleanLine(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function readBullets(raw: unknown): Bullet[] {
  if (!Array.isArray(raw)) return [];
  const out: Bullet[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Bullet>;
    const id = String(row.id || "").trim();
    const customerId = String(row.customerId || "").trim();
    const body = cleanLine(String(row.body || ""));
    if (!id || !customerId || !body || out.some((bullet) => bullet.id === id)) continue;
    out.push({ id, customerId, body, pinned: row.pinned === true, at: String(row.at || "") });
  }
  return out.slice(0, 80);
}

export function addBullet(bullets: readonly Bullet[], bullet: { id: string; customerId: string; body: string; at: string }): Bullet[] {
  const id = String(bullet.id || "").trim();
  const customerId = String(bullet.customerId || "").trim();
  const body = cleanLine(bullet.body);
  if (!id || !customerId || !body || bullets.some((item) => item.id === id)) return bullets.slice();
  return [{ id, customerId, body, pinned: false, at: bullet.at }, ...bullets].slice(0, 80);
}

export function toggleBulletPin(bullets: readonly Bullet[], id: string): Bullet[] {
  return bullets.map((bullet) => (bullet.id === id ? { ...bullet, pinned: !bullet.pinned } : bullet));
}

export function clearCustomer(bullets: readonly Bullet[], customerId: string): Bullet[] {
  return bullets.filter((bullet) => bullet.customerId !== customerId);
}

export function visibleBullets(bullets: readonly Bullet[], customerId: string, query: string): Bullet[] {
  const text = query.trim().toLowerCase();
  return bullets
    .filter((bullet) => bullet.customerId === customerId && (!text || bullet.body.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
