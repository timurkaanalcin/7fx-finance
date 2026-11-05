/** Desk clocks for chosen time zones, and local message snippets. No market session is invented. */

import { inQuiet } from "@/lib/crmv4/round56";

export const CLOCK_KEY = "crmv4-desk-clocks";
export const SNIP_KEY = "crmv4-snippets";

export const DESK_ZONES = [
  { id: "istanbul", zone: "Europe/Istanbul" },
  { id: "london", zone: "Europe/London" },
  { id: "berlin", zone: "Europe/Berlin" },
  { id: "moscow", zone: "Europe/Moscow" },
  { id: "dubai", zone: "Asia/Dubai" },
  { id: "newyork", zone: "America/New_York" },
  { id: "utc", zone: "UTC" },
] as const;

export type ZoneId = (typeof DESK_ZONES)[number]["id"];
export type SnipKind = "thanks" | "follow";

export type DeskClock = {
  id: ZoneId;
  zone: string;
  time: string;
  quiet: boolean;
};

export type Snippet = {
  id: string;
  kind: SnipKind;
  body: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

const KNOWN = new Set<string>(DESK_ZONES.map((item) => item.id));

export function isZoneId(value: string): value is ZoneId {
  return KNOWN.has(value);
}

export function readZones(raw: unknown): ZoneId[] {
  if (!Array.isArray(raw)) return [];
  const out: ZoneId[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (isZoneId(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleZone(ids: readonly string[], id: string): ZoneId[] {
  const current = readZones(ids);
  if (!isZoneId(id)) return current;
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

export function zoneParts(zone: string, now: Date): { time: string; minutes: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const hourText = parts.find((part) => part.type === "hour")?.value || "";
    const minuteText = parts.find((part) => part.type === "minute")?.value || "";
    let hour = Number(hourText);
    const minute = Number(minuteText);
    if (hour === 24) hour = 0;
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) return null;
    return { time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, minutes: hour * 60 + minute };
  } catch {
    return null;
  }
}

/** Current hour and minute in each chosen zone. Quiet uses the saved window only. */
export function deskClocks(ids: readonly string[], quiet: { start: string; end: string }, now = new Date()): DeskClock[] {
  const chosen = readZones(ids);
  const out: DeskClock[] = [];
  for (const item of DESK_ZONES) {
    if (!chosen.includes(item.id)) continue;
    const parts = zoneParts(item.zone, now);
    if (!parts) continue;
    out.push({ id: item.id, zone: item.zone, time: parts.time, quiet: inQuiet(parts.minutes, quiet.start, quiet.end) });
  }
  return out;
}

export function cleanBody(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 180);
}

export function readSnippets(raw: unknown): Snippet[] {
  if (!Array.isArray(raw)) return [];
  const out: Snippet[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Snippet>;
    const id = String(row.id || "").trim();
    const body = cleanBody(String(row.body || ""));
    const kind: SnipKind | "" = row.kind === "follow" ? "follow" : row.kind === "thanks" ? "thanks" : "";
    if (!id || !body || !kind || out.some((snippet) => snippet.id === id)) continue;
    out.push({ id, kind, body, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 80);
}

export function addSnippet(snippets: readonly Snippet[], snippet: { id: string; kind: string; body: string; at: string }): Snippet[] {
  const id = String(snippet.id || "").trim();
  const body = cleanBody(snippet.body);
  const kind: SnipKind | "" = snippet.kind === "follow" ? "follow" : snippet.kind === "thanks" ? "thanks" : "";
  if (!id || !body || !kind || snippets.some((item) => item.id === id)) return snippets.slice();
  return [{ id, kind, body, pinned: false, hidden: false, at: snippet.at }, ...snippets].slice(0, 80);
}

export function toggleSnippetPin(snippets: readonly Snippet[], id: string): Snippet[] {
  return snippets.map((snippet) => (snippet.id === id ? { ...snippet, pinned: !snippet.pinned } : snippet));
}

export function setSnippetHidden(snippets: readonly Snippet[], id: string, hidden: boolean): Snippet[] {
  return snippets.map((snippet) => (snippet.id === id ? { ...snippet, hidden } : snippet));
}

export function visibleSnippets(snippets: readonly Snippet[], kind: "" | SnipKind, query: string, hidden: boolean): Snippet[] {
  const text = query.trim().toLowerCase();
  return snippets
    .filter((snippet) => {
      if (snippet.hidden !== hidden) return false;
      if (kind && snippet.kind !== kind) return false;
      if (!text) return true;
      return snippet.body.toLowerCase().includes(text);
    })
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
