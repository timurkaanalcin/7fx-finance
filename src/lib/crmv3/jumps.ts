/** Local recent section visits, and ticket counts grouped by the channel already on each row. */

import { CRM_V3_SECTIONS } from "@/lib/crmv3/sections";

export const JUMP_KEY = "crmv3-recent-jumps";
export const CHANNEL_KEY = "crmv3-ticket-channel-hide";

export type Visit = { section: string; at: string };

export type ChannelRow = { channel?: unknown; label?: string | null };

export type ChannelLine = { channel: string; count: number };

export function sectionId(raw: string | null | undefined): string {
  const id = String(raw || "").trim();
  return CRM_V3_SECTIONS.some((section) => section.id === id) ? id : "";
}

export function sectionPath(id: string): string {
  return CRM_V3_SECTIONS.find((section) => section.id === id)?.path ?? "";
}

export function readVisits(raw: unknown): Visit[] {
  if (!Array.isArray(raw)) return [];
  const out: Visit[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Visit>;
    const section = sectionId(row.section);
    if (!section || out.some((visit) => visit.section === section)) continue;
    out.push({ section, at: String(row.at || "") });
  }
  return out.slice(0, 16);
}

export function pushVisit(visits: readonly Visit[], section: string, at: string): Visit[] {
  const id = sectionId(section);
  if (!id) return visits.slice();
  return [{ section: id, at: String(at || "") }, ...visits.filter((visit) => visit.section !== id)].slice(0, 16);
}

export function clearVisits(): Visit[] {
  return [];
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** The channel or method already on the row. The ticket kind is not a channel. */
export function channelText(value: unknown): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  const channel = plain(row.channel);
  if (channel) return channel;
  const method = row.method;
  if (typeof method === "string") return plain(method);
  if (method && typeof method === "object") {
    const record = method as Record<string, unknown>;
    return plain(record.label) || plain(record.type);
  }
  return "";
}

export function channelLines(rows: readonly ChannelRow[]): ChannelLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const channel = channelText(row.channel);
    map.set(channel, (map.get(channel) || 0) + 1);
  }
  const out: ChannelLine[] = [];
  map.forEach((count, channel) => out.push({ channel, count }));
  return out.sort((a, b) => {
    if (!a.channel) return -1;
    if (!b.channel) return 1;
    return a.channel.localeCompare(b.channel);
  });
}

export function namedChannels(rows: readonly ChannelRow[]): string[] {
  return channelLines(rows).map((line) => line.channel).filter(Boolean);
}

export function readHiddenChannels(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => channelText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const channel = channelText(String(item || ""));
    if (!channel || !allow.has(channel) || out.includes(channel)) continue;
    out.push(channel);
  }
  return out;
}

export function toggleChannel(hidden: readonly string[], channel: string, present: readonly string[]): string[] {
  const current = readHiddenChannels(hidden, present);
  const next = channelText(channel);
  if (!next || !present.map((item) => channelText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleChannels(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenChannels(hidden, present));
  return namedChannels(present.map((channel) => ({ channel }))).filter((channel) => (showHidden ? gone.has(channel) : !gone.has(channel)));
}

export function activeChannel(selected: string, visible: readonly string[]): string {
  const channel = channelText(selected);
  if (!channel) return "";
  return visible.some((item) => channelText(item) === channel) ? channel : "";
}

export function visibleTickets<T extends ChannelRow>(rows: readonly T[], channel: string, blank: boolean, query: string): T[] {
  const want = channelText(channel);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = channelText(row.channel);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
