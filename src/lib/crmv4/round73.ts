/** A UTC week of loaded follow-ups, and the panel text scale. The chrome pad is not part of the scale. */

import { dayItems, dayKey, dayWindow, type DayItem } from "@/lib/crmv4/round51";

export const SCALE_KEY = "crmv4-panel-scale";
export const SCALES = ["small", "desk", "large"] as const;
export type PanelScale = (typeof SCALES)[number];

export type Dated = { id: string; name?: string | null; at?: string | null };

export type WeekDay = { day: string; items: DayItem[] };

export function isScale(value: string): value is PanelScale {
  return (SCALES as readonly string[]).includes(value);
}

export function readScale(raw: unknown): PanelScale {
  const value = String(raw || "");
  return value === "small" || value === "large" ? value : "desk";
}

/** Monday of the UTC week that contains the loaded day. */
export function weekStart(day: string): string {
  const key = dayKey(day);
  if (!key) return "";
  const at = Date.parse(`${key}T00:00:00Z`);
  const weekday = new Date(at).getUTCDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  return new Date(at + delta * 86400000).toISOString().slice(0, 10);
}

export function weekDays(day: string): string[] {
  const start = weekStart(day);
  return start ? dayWindow(start, 7) : [];
}

/** Seven UTC days. A day with no loaded item stays empty. */
export function weekBoard(follows: readonly Dated[], tasks: readonly Dated[], cursor: string, query: string): WeekDay[] {
  const text = query.trim().toLowerCase();
  const items = dayItems(follows, tasks).filter((item) => !text || item.name.toLowerCase().includes(text));
  return weekDays(cursor).map((day) => ({ day, items: items.filter((item) => item.day === day) }));
}
