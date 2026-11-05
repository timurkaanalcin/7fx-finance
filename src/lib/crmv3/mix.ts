/** Source counts from loaded rows, and a local win/loss log. No currency is added. */

export const PIN_KEY = "crmv3-referral-pins";
export const LOG_KEY = "crmv3-winloss-log";

export const SOURCE_FIELDS = ["affiliateA", "affiliateB", "affiliateC", "referralCodeUsed", "campaign"] as const;

export type SourceField = (typeof SOURCE_FIELDS)[number];

export type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
  referralCodeUsed?: string | null;
  campaign?: string | null;
};

export type SourceGroup = {
  id: string;
  field: SourceField;
  value: string;
  count: number;
  people: { id: string; name: string }[];
};

export type NoteKind = "win" | "loss";

export type Note = {
  id: string;
  kind: NoteKind;
  body: string;
  customerId: string;
  pinned: boolean;
  archived: boolean;
  at: string;
};

export function isSourceField(value: string): value is SourceField {
  return (SOURCE_FIELDS as readonly string[]).includes(value);
}

export function sourceValue(person: Person, field: SourceField): string {
  return String(person[field] || "").trim();
}

/** One field at a time. A blank value is its own group. The figure is a count. */
export function sourceGroups(people: readonly Person[], field: SourceField, query: string, pinned: readonly string[]): SourceGroup[] {
  const text = query.trim().toLowerCase();
  const shown = people.filter((person) => {
    if (!person.id) return false;
    if (!text) return true;
    const value = sourceValue(person, field);
    return `${person.name || ""} ${person.email || ""} ${value}`.toLowerCase().includes(text);
  });
  const buckets = new Map<string, Person[]>();
  for (const person of shown) {
    const value = sourceValue(person, field);
    const list = buckets.get(value) || [];
    list.push(person);
    buckets.set(value, list);
  }
  const out: SourceGroup[] = [];
  buckets.forEach((list, value) => {
    out.push({
      id: `${field}:${value}`,
      field,
      value,
      count: list.length,
      people: list.map((person) => ({ id: person.id, name: String(person.name || person.email || person.id) })),
    });
  });
  return out.sort((a, b) => {
    const pinA = pinned.includes(a.id) ? 1 : 0;
    const pinB = pinned.includes(b.id) ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    if (a.count !== b.count) return b.count - a.count;
    return a.value.localeCompare(b.value);
  });
}

export function mixCount(groups: readonly SourceGroup[]): number {
  return groups.reduce((sum, group) => sum + group.count, 0);
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

export function cleanNote(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 180);
}

export function readNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  const out: Note[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Note>;
    const id = String(row.id || "").trim();
    const body = cleanNote(String(row.body || ""));
    const kind = row.kind === "loss" ? "loss" : row.kind === "win" ? "win" : "";
    if (!id || !body || !kind || out.some((note) => note.id === id)) continue;
    out.push({
      id,
      kind,
      body,
      customerId: String(row.customerId || "").trim(),
      pinned: row.pinned === true,
      archived: row.archived === true,
      at: String(row.at || ""),
    });
  }
  return out.slice(0, 80);
}

export function addNote(notes: readonly Note[], note: { id: string; kind: string; body: string; customerId?: string; at: string }): Note[] {
  const id = String(note.id || "").trim();
  const body = cleanNote(note.body);
  const kind: NoteKind | "" = note.kind === "loss" ? "loss" : note.kind === "win" ? "win" : "";
  if (!id || !body || !kind || notes.some((item) => item.id === id)) return notes.slice();
  return [{
    id,
    kind,
    body,
    customerId: String(note.customerId || "").trim(),
    pinned: false,
    archived: false,
    at: note.at,
  }, ...notes].slice(0, 80);
}

export function toggleNotePin(notes: readonly Note[], id: string): Note[] {
  return notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
}

export function setArchived(notes: readonly Note[], id: string, archived: boolean): Note[] {
  return notes.map((note) => (note.id === id ? { ...note, archived } : note));
}

export function visibleNotes(
  notes: readonly Note[],
  kind: "" | NoteKind,
  query: string,
  archived: boolean,
  names: Readonly<Record<string, string>>,
): Note[] {
  const text = query.trim().toLowerCase();
  return notes
    .filter((note) => {
      if (note.archived !== archived) return false;
      if (kind && note.kind !== kind) return false;
      if (!text) return true;
      const name = names[note.customerId] || "";
      return `${note.body} ${name} ${note.customerId}`.toLowerCase().includes(text);
    })
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
