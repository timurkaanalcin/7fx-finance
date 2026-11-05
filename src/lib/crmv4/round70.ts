/** VIP watch from loaded rows, and a handoff packet from pins already in this browser. Currencies are never added together. */

import { DIGEST_SOURCES, readDigest, type DigestItem } from "@/lib/crmv4/round65";

export const RULE_KEY = "crmv4-vip-rule";
export const PIN_KEY = "crmv4-vip-pins";
export const PACKET_KEY = "crmv4-handoff-packet";

export const VIP_FIELDS = ["balance", "lastLogin", "lastContact"] as const;
export type VipField = (typeof VIP_FIELDS)[number];

export type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  balance?: number | null;
  currency?: string | null;
  lastLoginAt?: string | null;
  lastContactAt?: string | null;
};

export type VipRule = { field: VipField; amount: number; currency: string };

export type MoneyLine = { currency: string; count: number; amount: number };

export type Packet = { ids: string[]; note: string };

const DAY = 86400000;

const EXTRA_SOURCES = [
  { key: "crmv4-source-pins", source: "sources", kind: "pin" as const, shape: "ids" as const },
  { key: "crmv4-meeting-prep", source: "prep", kind: "pin" as const, shape: "rows" as const },
  { key: "crmv4-winloss", source: "winlog", kind: "pin" as const, shape: "rows" as const },
  { key: PIN_KEY, source: "vip", kind: "pin" as const, shape: "ids" as const },
];

export function isVipField(value: string): value is VipField {
  return (VIP_FIELDS as readonly string[]).includes(value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function cleanNote(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 180);
}

export function readRule(raw: unknown): VipRule {
  const row = raw && typeof raw === "object" ? (raw as Partial<VipRule>) : {};
  const field: VipField = row.field === "lastLogin" || row.field === "lastContact" ? row.field : "balance";
  const amount = Number(row.amount);
  const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const currency = String(row.currency || "").trim().toUpperCase();
  return {
    field,
    amount: field === "balance" ? round2(safe) : Math.min(3650, Math.floor(safe)),
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "",
  };
}

function currencyOf(person: Person): string {
  return String(person.currency || "").trim().toUpperCase();
}

function passes(person: Person, rule: VipRule, now: number): boolean {
  if (rule.field === "balance") {
    if (!rule.currency || currencyOf(person) !== rule.currency) return false;
    const amount = Number(person.balance);
    return Number.isFinite(amount) && amount >= rule.amount;
  }
  const raw = rule.field === "lastLogin" ? person.lastLoginAt : person.lastContactAt;
  const at = raw ? new Date(String(raw)).getTime() : NaN;
  if (!Number.isFinite(at)) return false;
  const age = now - at;
  return age >= 0 && age <= rule.amount * DAY;
}

/** Loaded customers who meet one saved rule. A balance rule never crosses currencies. */
export function watchPeople(people: readonly Person[], rule: VipRule, query: string, pinned: readonly string[], now = Date.now()): Person[] {
  const text = query.trim().toLowerCase();
  return people
    .filter((person) => {
      if (!person.id) return false;
      if (text && !`${person.name || ""} ${person.email || ""} ${currencyOf(person)}`.toLowerCase().includes(text)) return false;
      return passes(person, rule, now);
    })
    .slice()
    .sort((a, b) => {
      const pinA = pinned.includes(a.id) ? 1 : 0;
      const pinB = pinned.includes(b.id) ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return String(a.name || a.email || a.id).localeCompare(String(b.name || b.email || b.id));
    });
}

/** One line per currency. A missing currency stays on its own line. */
export function currencyLines(people: readonly Person[]): MoneyLine[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const person of people) {
    const currency = currencyOf(person);
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

export function loadedCurrencies(people: readonly Person[]): string[] {
  const out: string[] = [];
  for (const person of people) {
    const currency = currencyOf(person);
    if (/^[A-Z]{3}$/.test(currency) && !out.includes(currency)) out.push(currency);
  }
  return out.sort();
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

function cleanId(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function pushItem(out: DigestItem[], source: string, rawId: string, label: string) {
  const id = `${source}:pin:${rawId}`;
  if (!rawId || out.some((item) => item.id === id)) return;
  out.push({ id, source, kind: "pin", label: label || rawId });
}

/** Pins and marks already stored in this browser. Nothing is created here. */
export function openItems(bag: Record<string, unknown>): DigestItem[] {
  const out = readDigest(bag);
  for (const source of EXTRA_SOURCES) {
    const raw = bag[source.key];
    if (source.shape === "ids" && Array.isArray(raw)) {
      for (const item of raw) pushItem(out, source.source, cleanId(String(item || "")), cleanId(String(item || "")));
    } else if (source.shape === "rows" && Array.isArray(raw)) {
      for (const item of raw) {
        if (!item || typeof item !== "object") continue;
        const row = item as Record<string, unknown>;
        if (row.pinned !== true || row.archived === true) continue;
        const rawId = cleanId(String(row.id || ""));
        const label = cleanId(String(row.body || row.open || rawId));
        pushItem(out, source.source, rawId, label);
      }
    }
  }
  return out.slice(0, 80);
}

export function packetSources(): string[] {
  return [...DIGEST_SOURCES.map((source) => source.key), ...EXTRA_SOURCES.map((source) => source.key)];
}

export function readPacket(raw: unknown): Packet {
  const row = raw && typeof raw === "object" ? (raw as { ids?: unknown; note?: unknown }) : {};
  return { ids: readIds(row.ids), note: cleanNote(String(row.note || "")) };
}

export function togglePacketId(packet: Packet, id: string): Packet {
  return { ...packet, ids: toggleId(packet.ids, id) };
}

export function withNote(packet: Packet, note: string): Packet {
  return { ...packet, note: cleanNote(note) };
}

export function chosenItems(items: readonly DigestItem[], packet: Packet): DigestItem[] {
  return items.filter((item) => packet.ids.includes(item.id));
}

export function visibleItems(items: readonly DigestItem[], query: string): DigestItem[] {
  const text = query.trim().toLowerCase();
  if (!text) return items.slice();
  return items.filter((item) => `${item.source} ${item.kind} ${item.label}`.toLowerCase().includes(text));
}

function csvCell(value: string): string {
  const text = String(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

/** A file the button builds in this browser. It is not uploaded. */
export function packetCsv(items: readonly DigestItem[], note: string): string {
  const lines = [["source", "kind", "label"]];
  const text = cleanNote(note);
  if (text) lines.push(["note", "note", text]);
  for (const item of items) lines.push([item.source, item.kind, item.label]);
  return lines.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function canExport(items: readonly DigestItem[], note: string): boolean {
  return items.length > 0 || cleanNote(note).length > 0;
}
