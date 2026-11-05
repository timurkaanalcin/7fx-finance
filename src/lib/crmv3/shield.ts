/** Quiet shield for desk noise, and local notes on a loaded customer. Boards are not filtered. */

import { inQuiet, nowMinutes } from "@/lib/crmv3/leads";

export const PAUSE_KEY = "crmv3-quiet-pause";
export const NOTE_KEY = "crmv3-sticky-notes";

export type QuietWindow = { start: string; end: string };

export type Sticky = {
  id: string;
  customerId: string;
  body: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function tomorrowUtc(now = new Date()): string {
  const at = Date.parse(`${utcDay(now)}T00:00:00Z`);
  return new Date(at + 86400000).toISOString().slice(0, 10);
}

export function readPause(raw: unknown): string {
  const value = raw && typeof raw === "object" && "until" in raw ? (raw as { until?: unknown }).until : raw;
  const day = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

/** Pause covers the rest of today UTC and ends when that day starts. */
export function pauseOn(raw: unknown, now = new Date()): boolean {
  const until = readPause(raw);
  return Boolean(until) && utcDay(now) < until;
}

/** Toast and banner noise only. A board list is not part of this. */
export function shieldOn(quiet: QuietWindow, pause: unknown, now = new Date()): boolean {
  if (pauseOn(pause, now)) return true;
  return inQuiet(nowMinutes(now), quiet.start, quiet.end);
}

export function cleanBody(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 180);
}

export function readStickies(raw: unknown): Sticky[] {
  if (!Array.isArray(raw)) return [];
  const out: Sticky[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Sticky>;
    const id = String(row.id || "").trim();
    const customerId = String(row.customerId || "").trim();
    const body = cleanBody(String(row.body || ""));
    if (!id || !customerId || !body || out.some((note) => note.id === id)) continue;
    out.push({ id, customerId, body, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 80);
}

export function addSticky(notes: readonly Sticky[], note: { id: string; customerId: string; body: string; at: string }): Sticky[] {
  const id = String(note.id || "").trim();
  const customerId = String(note.customerId || "").trim();
  const body = cleanBody(note.body);
  if (!id || !customerId || !body || notes.some((item) => item.id === id)) return notes.slice();
  return [{ id, customerId, body, pinned: false, hidden: false, at: note.at }, ...notes].slice(0, 80);
}

export function toggleStickyPin(notes: readonly Sticky[], id: string): Sticky[] {
  return notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
}

export function setStickyHidden(notes: readonly Sticky[], id: string, hidden: boolean): Sticky[] {
  return notes.map((note) => (note.id === id ? { ...note, hidden } : note));
}

/** Search matches the note text. A customer name alone does not match. */
export function visibleStickies(notes: readonly Sticky[], query: string, hidden: boolean): Sticky[] {
  const text = query.trim().toLowerCase();
  return notes
    .filter((note) => note.hidden === hidden && (!text || note.body.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
