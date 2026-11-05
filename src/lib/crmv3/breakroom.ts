/** Local break notes, and trader counts grouped by the channel already on each row. */

export const BREAK_KEY = "crmv3-break-notes";
export const AFF_CHANNEL_KEY = "crmv3-aff-channel-hide";

/** A loaded channel, then the campaign. An introducer code is not a channel. */
export const CHANNEL_FIELDS = ["channel", "campaign"] as const;

export type Note = {
  id: string;
  text: string;
  corner: string;
  pinned: boolean;
  hidden: boolean;
};

export type ChannelValue = { channel?: unknown; campaign?: unknown } | string | null | undefined;

export type ChannelRow = { channel?: ChannelValue; label?: string | null };

export type ChannelLine = { channel: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank table or corner label stays blank. It is not filled in. */
export function cornerLabel(raw: unknown): string {
  return clip(raw, 40);
}

export function readNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  const out: Note[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Note>;
    const id = String(row.id || "").trim();
    const text = noteText(row.text);
    if (!id || !text || out.some((note) => note.id === id)) continue;
    out.push({ id, text, corner: cornerLabel(row.corner), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; corner?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const corner = cornerLabel(note.corner);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, corner, pinned: false, hidden: false }, ...current].slice(0, 40);
}

export function toggleNotePin(notes: readonly Note[], id: string): Note[] {
  return readNotes(notes).map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
}

export function setNoteHidden(notes: readonly Note[], id: string, hidden: boolean): Note[] {
  return readNotes(notes).map((note) => (note.id === id ? { ...note, hidden } : note));
}

export function resetNotes(): Note[] {
  return [];
}

/** Search stays on the note text. The table or corner label is not part of the query. */
export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The channel string, or the campaign when the channel is blank. A number is not a channel. */
export function channelText(value: ChannelValue): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  for (const field of CHANNEL_FIELDS) {
    const text = plain(row[field]);
    if (text) return text;
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

export function visibleTraders<T extends ChannelRow>(rows: readonly T[], channel: string, blank: boolean, query: string): T[] {
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
