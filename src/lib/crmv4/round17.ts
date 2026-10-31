/** Pure helpers for CRM v4 round 17. Call outcomes stay in the browser. */

export type FeedKind = "note" | "call" | "status" | "money";

export type FeedItem = {
  id: string;
  kind: FeedKind;
  at: string;
  title: string;
  detail: string;
};

export type CallLog = {
  id: string;
  at: string;
  outcome: string;
  minutes: number;
  next: string;
  note: string;
};

export function mergeFeed(input: {
  notes: { id: string; body?: string | null; authorName?: string | null; createdAt?: string | null }[];
  events: { id: string; kind?: string | null; path?: string | null; createdAt?: string | null }[];
  calls: CallLog[];
  money: { id: string; type?: string | null; amount?: number | null; currency?: string | null; createdAt?: string | null; comment?: string | null }[];
}): FeedItem[] {
  const items: FeedItem[] = [
    ...input.notes.map((row) => ({
      id: `note-${row.id}`,
      kind: "note" as const,
      at: String(row.createdAt || ""),
      title: String(row.body || ""),
      detail: String(row.authorName || ""),
    })),
    ...input.events.map((row) => ({
      id: `event-${row.id}`,
      kind: "status" as const,
      at: String(row.createdAt || ""),
      title: String(row.kind || ""),
      detail: String(row.path || ""),
    })),
    ...input.calls.map((row) => ({
      id: `call-${row.id}`,
      kind: "call" as const,
      at: row.at,
      title: row.outcome,
      detail: [row.minutes ? `${row.minutes}m` : "", row.next, row.note].filter(Boolean).join(" · "),
    })),
    ...input.money.map((row) => ({
      id: `money-${row.id}`,
      kind: "money" as const,
      at: String(row.createdAt || ""),
      title: `${row.type || ""} ${row.amount ?? ""} ${row.currency || ""}`.trim(),
      detail: String(row.comment || ""),
    })),
  ];
  return items.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function filterFeed(items: FeedItem[], kind: "" | FeedKind, query: string): FeedItem[] {
  const text = query.trim().toLowerCase();
  return items.filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (!text) return true;
    return `${item.title} ${item.detail} ${item.kind}`.toLowerCase().includes(text);
  });
}

export function dayBucket(at: string, today: string): "today" | "earlier" {
  return at.slice(0, 10) === today ? "today" : "earlier";
}

export function lastContact(items: FeedItem[]): string {
  return items.map((item) => item.at).filter(Boolean).sort().reverse()[0] || "";
}

export function callCount(items: FeedItem[]): number {
  return items.filter((item) => item.kind === "call").length;
}

export function pinFirst(items: FeedItem[], pins: string[]): FeedItem[] {
  const on = new Set(pins);
  return [...items.filter((item) => on.has(item.id)), ...items.filter((item) => !on.has(item.id))];
}

export function emailOk(value: string): boolean {
  const text = value.trim();
  if (!text) return true;
  const at = text.indexOf("@");
  return at > 0 && text.indexOf(".", at) > at + 1 && !text.includes(" ");
}

export function phoneShort(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 && digits.length < 7;
}

export function missingFields(fields: { name: string; email: string; phone: string; country: string }): string[] {
  const out: string[] = [];
  if (!fields.name.trim()) out.push("name");
  if (!fields.email.trim()) out.push("email");
  if (!fields.phone.trim()) out.push("phone");
  if (!fields.country.trim()) out.push("country");
  return out;
}

export function formScore(fields: { name: string; email: string; phone: string; country: string }): number {
  const checks = [
    Boolean(fields.name.trim()),
    emailOk(fields.email) && Boolean(fields.email.trim()),
    Boolean(fields.phone.trim()) && !phoneShort(fields.phone),
    Boolean(fields.country.trim()),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function sameEntry(a: { name: string; email: string; phone: string; country: string }, b: { name: string; email: string; phone: string; country: string }): boolean {
  return a.name === b.name && a.email === b.email && a.phone === b.phone && a.country === b.country;
}

export function splitName(value: string): { first: string; last: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { first: parts[0] || "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function passwordHint(value: string): "empty" | "short" | "ok" {
  if (!value) return "empty";
  return value.length < 6 ? "short" : "ok";
}
