/** Chrome edge accent, and local tags on loaded calls. Nothing is sent. */

import { ACCENTS, accentOf, type Accent } from "@/lib/crmv4/round4";

export const EDGE_KEY = "crmv4-accent";
export const TAG_KEY = "crmv4-call-tags";
export const CALL_LIST = "/api/admin/communications?type=CALL&take=40";

export const OUTCOMES = ["answered", "missed", "callback"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export type CallRow = {
  id?: string | null;
  traderId?: string | null;
  trader?: string | null;
};

export type CallTag = {
  id: string;
  customerId: string;
  callId: string;
  kind: Outcome;
  body: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export function readEdge(raw: string | null | undefined): Accent {
  return accentOf(raw);
}

export function edgeChoices(): readonly Accent[] {
  return ACCENTS;
}

export function isOutcome(value: string): value is Outcome {
  return (OUTCOMES as readonly string[]).includes(value);
}

export function cleanTag(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Customers who already appear on a loaded call. */
export function callPeople(rows: readonly CallRow[]): { id: string; name: string; callId: string }[] {
  const out: { id: string; name: string; callId: string }[] = [];
  for (const row of rows) {
    const id = String(row.traderId || "").trim();
    const callId = String(row.id || "").trim();
    if (!id || !callId || out.some((item) => item.id === id)) continue;
    out.push({ id, name: String(row.trader || id), callId });
  }
  return out;
}

export function readTags(raw: unknown, people: readonly { id: string }[]): CallTag[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(people.map((person) => person.id));
  const out: CallTag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CallTag>;
    const id = String(row.id || "").trim();
    const customerId = String(row.customerId || "").trim();
    const callId = String(row.callId || "").trim();
    const body = cleanTag(String(row.body || ""));
    const kind = String(row.kind || "");
    if (!id || !customerId || !allow.has(customerId) || !body || !isOutcome(kind) || out.some((tag) => tag.id === id)) continue;
    out.push({ id, customerId, callId, kind, body, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 80);
}

export function addTag(tags: readonly CallTag[], tag: { id: string; customerId: string; callId: string; kind: string; body: string; at: string }, people: readonly { id: string; callId: string }[]): CallTag[] {
  const id = String(tag.id || "").trim();
  const customerId = String(tag.customerId || "").trim();
  const person = people.find((item) => item.id === customerId);
  const callId = String(tag.callId || person?.callId || "").trim();
  const body = cleanTag(tag.body);
  const kind = String(tag.kind || "");
  if (!id || !person || person.callId !== callId || !body || !isOutcome(kind) || tags.some((item) => item.id === id)) return tags.slice();
  return [{ id, customerId, callId, kind, body, pinned: false, hidden: false, at: tag.at }, ...tags].slice(0, 80);
}

export function toggleTagPin(tags: readonly CallTag[], id: string): CallTag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, pinned: !tag.pinned } : tag));
}

export function setTagHidden(tags: readonly CallTag[], id: string, hidden: boolean): CallTag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, hidden } : tag));
}

export function visibleTags(tags: readonly CallTag[], query: string, hidden: boolean): CallTag[] {
  const text = query.trim().toLowerCase();
  return tags
    .filter((tag) => tag.hidden === hidden && (!text || `${tag.body} ${tag.kind}`.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
