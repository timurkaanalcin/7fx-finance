/** Pending counts from loaded lists, and local color tags for CRM routes. No money is added. */

import { CRM_V4_SECTIONS } from "@/lib/crmv4/sections";

export const HIDE_KEY = "crmv4-pulse-hide";
export const SWATCH_KEY = "crmv4-route-swatches";

export const PULSE_KINDS = ["deposits", "withdrawals", "documents"] as const;
export type PulseKind = (typeof PULSE_KINDS)[number];

/** The same list calls the boards already use. This is not a new endpoint. */
export const PULSE_LISTS: Record<PulseKind, string> = {
  deposits: "/api/admin/deposits?take=40",
  withdrawals: "/api/admin/withdrawals?take=40",
  documents: "/api/admin/documents?take=40",
};

export const PULSE_BOARDS: Record<PulseKind, string> = {
  deposits: "depboard",
  withdrawals: "payboard",
  documents: "expiry",
};

export const SWATCHES = ["ivory", "champagne", "graphite", "ink", "paper"] as const;
export type Swatch = (typeof SWATCHES)[number];

export type QueueRow = { id?: string | null; status?: string | null };

export type RouteTag = {
  id: string;
  label: string;
  color: Swatch;
  route: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export function isPulseKind(value: string): value is PulseKind {
  return (PULSE_KINDS as readonly string[]).includes(value);
}

export function isSwatch(value: string): value is Swatch {
  return (SWATCHES as readonly string[]).includes(value);
}

/** Pending rows on the loaded list. The figure is a count. */
export function pendingCount(rows: readonly QueueRow[]): number {
  let count = 0;
  for (const row of rows) {
    const id = String(row.id || "").trim();
    if (!id) continue;
    if (String(row.status || "").trim().toUpperCase() === "PENDING") count += 1;
  }
  return count;
}

export function readKinds(raw: unknown): PulseKind[] {
  if (!Array.isArray(raw)) return [];
  const out: PulseKind[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (isPulseKind(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleKind(kinds: readonly string[], kind: string): PulseKind[] {
  const current = readKinds(kinds);
  if (!isPulseKind(kind)) return current;
  return current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind];
}

export function visibleKinds(hidden: readonly string[], showHidden: boolean): PulseKind[] {
  const gone = readKinds(hidden);
  return PULSE_KINDS.filter((kind) => (showHidden ? gone.includes(kind) : !gone.includes(kind)));
}

export function knownRoute(id: string): boolean {
  return CRM_V4_SECTIONS.some((item) => item.id === id);
}

export function routePath(id: string): string {
  return CRM_V4_SECTIONS.find((item) => item.id === id)?.path || "";
}

export function cleanLabel(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function readTags(raw: unknown): RouteTag[] {
  if (!Array.isArray(raw)) return [];
  const out: RouteTag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RouteTag>;
    const id = String(row.id || "").trim();
    const label = cleanLabel(String(row.label || ""));
    const color = String(row.color || "");
    const route = String(row.route || "").trim();
    if (!id || !label || !isSwatch(color) || !knownRoute(route) || out.some((tag) => tag.id === id)) continue;
    out.push({ id, label, color, route, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 80);
}

export function addTag(tags: readonly RouteTag[], tag: { id: string; label: string; color: string; route: string; at: string }): RouteTag[] {
  const id = String(tag.id || "").trim();
  const label = cleanLabel(tag.label);
  const color = String(tag.color || "");
  const route = String(tag.route || "").trim();
  if (!id || !label || !isSwatch(color) || !knownRoute(route) || tags.some((item) => item.id === id)) return tags.slice();
  return [{ id, label, color, route, pinned: false, hidden: false, at: tag.at }, ...tags].slice(0, 80);
}

export function toggleTagPin(tags: readonly RouteTag[], id: string): RouteTag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, pinned: !tag.pinned } : tag));
}

export function setTagHidden(tags: readonly RouteTag[], id: string, hidden: boolean): RouteTag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, hidden } : tag));
}

export function visibleTags(tags: readonly RouteTag[], query: string, hidden: boolean): RouteTag[] {
  const text = query.trim().toLowerCase();
  return tags
    .filter((tag) => tag.hidden === hidden && (!text || `${tag.label} ${tag.route}`.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
