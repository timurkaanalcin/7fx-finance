/** Local UTC date marks, and deposit counts grouped by the method already on each row. */

export const MARK_KEY = "crmv3-utc-marks";
export const CHANNEL_KEY = "crmv3-channel-hide";

export type Mark = {
  id: string;
  day: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type Method = { label?: string | null; type?: string | null } | string | null | undefined;

export type ChannelRow = { method?: Method; label?: string | null };

export type ChannelLine = { channel: string; count: number };

export function utcDay(raw: string | null | undefined): string {
  const text = String(raw || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const ms = Date.parse(`${text}T00:00:00Z`);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toISOString().slice(0, 10) === text ? text : "";
}

export function todayUtc(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function readMarks(raw: unknown): Mark[] {
  if (!Array.isArray(raw)) return [];
  const out: Mark[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Mark>;
    const id = String(row.id || "").trim();
    const day = utcDay(row.day);
    if (!id || !day || out.some((mark) => mark.id === id || mark.day === day)) continue;
    out.push({ id, day, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 60);
}

/** A blank or impossible date is left out. A day already marked is left as it is. */
export function addMark(marks: readonly Mark[], mark: { id: string; day: string; at: string }): Mark[] {
  const id = String(mark.id || "").trim();
  const day = utcDay(mark.day);
  if (!id || !day || marks.some((item) => item.id === id || item.day === day)) return marks.slice();
  return [{ id, day, pinned: false, hidden: false, at: mark.at }, ...marks].slice(0, 60);
}

export function toggleMarkPin(marks: readonly Mark[], id: string): Mark[] {
  return marks.map((mark) => (mark.id === id ? { ...mark, pinned: !mark.pinned } : mark));
}

export function setMarkHidden(marks: readonly Mark[], id: string, hidden: boolean): Mark[] {
  return marks.map((mark) => (mark.id === id ? { ...mark, hidden } : mark));
}

export function visibleMarks(marks: readonly Mark[], query: string, hidden: boolean): Mark[] {
  const text = query.trim();
  return marks
    .filter((mark) => mark.hidden === hidden && (!text || mark.day.includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.day.localeCompare(a.day);
    });
}

/** The method label, or the method type when the label is blank. A missing method stays blank. */
export function channelText(method: Method): string {
  if (typeof method === "string") return method.replace(/\s+/g, " ").trim();
  if (!method || typeof method !== "object") return "";
  const label = String(method.label || "").replace(/\s+/g, " ").trim();
  if (label) return label;
  return String(method.type || "").replace(/\s+/g, " ").trim();
}

export function channelLines(rows: readonly ChannelRow[]): ChannelLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const channel = channelText(row.method);
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
  return namedChannels(present.map((channel) => ({ method: channel }))).filter((channel) => (showHidden ? gone.has(channel) : !gone.has(channel)));
}

export function activeChannel(selected: string, visible: readonly string[]): string {
  const channel = channelText(selected);
  if (!channel) return "";
  return visible.some((item) => channelText(item) === channel) ? channel : "";
}

export function visibleDeposits<T extends ChannelRow>(rows: readonly T[], channel: string, blank: boolean, query: string): T[] {
  const want = channelText(channel);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = channelText(row.method);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
