/** A local customer shortlist, and document counts from loaded dates. No date is invented. */

import { loadedDate, readWindow, type DocRow } from "@/lib/crmv4/round62";

export const LANE_KEY = "crmv4-priority-lane";
export const HIDE_KEY = "crmv4-docpulse-hide";

export const PULSE_KINDS = ["expired", "soon"] as const;
export type PulseKind = (typeof PULSE_KINDS)[number];

/** The same document list the watch already uses. */
export const DOC_LIST = "/api/admin/documents?take=40";
export const DOC_BOARD = "expiry";

export type LaneItem = { id: string; pinned: boolean; hidden: boolean };

export type PulseCounts = { expired: number; soon: number };

const DAY = 86400000;

export function readLane(raw: unknown, known: readonly string[]): LaneItem[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(known.filter(Boolean));
  const out: LaneItem[] = [];
  for (const item of raw) {
    const id = String(typeof item === "string" ? item : (item as { id?: unknown })?.id || "").trim();
    if (!id || !allow.has(id) || out.some((row) => row.id === id)) continue;
    const row = typeof item === "object" && item ? (item as Partial<LaneItem>) : {};
    out.push({ id, pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addLane(items: readonly LaneItem[], id: string, known: readonly string[]): LaneItem[] {
  const next = String(id || "").trim();
  if (!next || !known.includes(next) || items.some((item) => item.id === next)) return items.slice();
  return [...items, { id: next, pinned: false, hidden: false }].slice(0, 40);
}

export function toggleLanePin(items: readonly LaneItem[], id: string): LaneItem[] {
  return items.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
}

export function setLaneHidden(items: readonly LaneItem[], id: string, hidden: boolean): LaneItem[] {
  return items.map((item) => (item.id === id ? { ...item, hidden } : item));
}

export function visibleLane(items: readonly LaneItem[], hidden: boolean): LaneItem[] {
  const rows = items.filter((item) => item.hidden === hidden);
  return [...rows.filter((item) => item.pinned), ...rows.filter((item) => !item.pinned)];
}

function groupOf(items: readonly LaneItem[], pinned: boolean): LaneItem[] {
  return items.filter((item) => item.pinned === pinned);
}

/** Move inside the pinned group or the unpinned group. Hidden rows stay put. */
export function moveLane(items: readonly LaneItem[], id: string, dir: -1 | 1): LaneItem[] {
  const current = items.find((item) => item.id === id);
  if (!current || current.hidden) return items.slice();
  const group = groupOf(items, current.pinned);
  const index = group.findIndex((item) => item.id === id);
  const nextIndex = index + dir;
  if (index < 0 || nextIndex < 0 || nextIndex >= group.length) return items.slice();
  const swapped = group.slice();
  const [row] = swapped.splice(index, 1);
  swapped.splice(nextIndex, 0, row);
  const hidden = items.filter((item) => item.hidden);
  const pinned = current.pinned ? swapped : groupOf(items, true);
  const open = current.pinned ? groupOf(items, false) : swapped;
  return [...pinned.filter((item) => !item.hidden), ...open.filter((item) => !item.hidden), ...hidden];
}

/** Expired is a loaded date already past. Soon is a loaded date still ahead, inside the saved window. */
export function pulseCounts(rows: readonly Pick<DocRow, "id" | "createdAt" | "reviewedAt">[], now = Date.now(), windowDays = 30): PulseCounts {
  const span = windowDays === 90 ? 90 : 30;
  const limit = now + span * DAY;
  let expired = 0;
  let soon = 0;
  for (const row of rows) {
    if (!row.id) continue;
    const at = loadedDate(row);
    if (!at) continue;
    const time = Date.parse(at);
    if (!Number.isFinite(time)) continue;
    if (time <= now) expired += 1;
    else if (time <= limit) soon += 1;
  }
  return { expired, soon };
}

export function windowDays(raw: unknown): 30 | 90 {
  return readWindow(raw);
}

export function readKinds(raw: unknown): PulseKind[] {
  if (!Array.isArray(raw)) return [];
  const out: PulseKind[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if ((PULSE_KINDS as readonly string[]).includes(id) && !out.includes(id as PulseKind)) out.push(id as PulseKind);
  }
  return out;
}

export function toggleKind(kinds: readonly string[], kind: string): PulseKind[] {
  const current = readKinds(kinds);
  if (!(PULSE_KINDS as readonly string[]).includes(kind)) return current;
  const id = kind as PulseKind;
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

export function visibleKinds(hidden: readonly string[], showHidden: boolean): PulseKind[] {
  const gone = readKinds(hidden);
  return PULSE_KINDS.filter((kind) => (showHidden ? gone.includes(kind) : !gone.includes(kind)));
}
