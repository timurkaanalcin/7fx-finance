/** Local reminder chips, and lead counts grouped by the source already on each row. */

export const REMIND_KEY = "crmv3-reminders";
export const SOURCE_KEY = "crmv3-lead-source-hide";

export const SOURCE_FIELDS = ["source", "leadSource", "campaign", "affiliateA", "affiliateB", "affiliateC", "referralCodeUsed"] as const;

export type Reminder = {
  id: string;
  text: string;
  time: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type SourceRow = { source?: unknown; label?: string | null };

export type SourceLine = { source: string; count: number };

export function reminderText(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Blank is allowed. A filled value must be UTC hours and minutes. */
export function utcClock(raw: string | null | undefined): string | null {
  const text = String(raw || "").trim();
  if (!text) return "";
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text.replace(/Z$/i, ""));
  if (!match) return null;
  return `${match[1]}:${match[2]}Z`;
}

export function readReminders(raw: unknown): Reminder[] {
  if (!Array.isArray(raw)) return [];
  const out: Reminder[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Reminder>;
    const id = String(row.id || "").trim();
    const text = reminderText(row.text);
    const time = utcClock(row.time);
    if (!id || !text || time === null || out.some((reminder) => reminder.id === id || (reminder.text === text && reminder.time === time))) continue;
    out.push({ id, text, time, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addReminder(reminders: readonly Reminder[], reminder: { id: string; text: string; time: string; at: string }): Reminder[] {
  const id = String(reminder.id || "").trim();
  const text = reminderText(reminder.text);
  const time = utcClock(reminder.time);
  if (!id || !text || time === null || reminders.some((item) => item.id === id || (item.text === text && item.time === time))) return reminders.slice();
  return [{ id, text, time, pinned: false, hidden: false, at: reminder.at }, ...reminders].slice(0, 40);
}

export function toggleReminderPin(reminders: readonly Reminder[], id: string): Reminder[] {
  return reminders.map((reminder) => (reminder.id === id ? { ...reminder, pinned: !reminder.pinned } : reminder));
}

export function setReminderHidden(reminders: readonly Reminder[], id: string, hidden: boolean): Reminder[] {
  return reminders.map((reminder) => (reminder.id === id ? { ...reminder, hidden } : reminder));
}

export function visibleReminders(reminders: readonly Reminder[], query: string, hidden: boolean): Reminder[] {
  const text = query.trim().toLowerCase();
  return reminders
    .filter((reminder) => reminder.hidden === hidden && (!text || `${reminder.text} ${reminder.time}`.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** The first source text already on the row. A row with none stays blank. */
export function sourceText(value: unknown): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  for (const field of SOURCE_FIELDS) {
    const text = String(row[field] || "").replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

export function sourceLines(rows: readonly SourceRow[]): SourceLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const source = sourceText(row.source);
    map.set(source, (map.get(source) || 0) + 1);
  }
  const out: SourceLine[] = [];
  map.forEach((count, source) => out.push({ source, count }));
  return out.sort((a, b) => {
    if (!a.source) return -1;
    if (!b.source) return 1;
    return a.source.localeCompare(b.source);
  });
}

export function namedSources(rows: readonly SourceRow[]): string[] {
  return sourceLines(rows).map((line) => line.source).filter(Boolean);
}

export function readHiddenSources(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => sourceText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const source = sourceText(String(item || ""));
    if (!source || !allow.has(source) || out.includes(source)) continue;
    out.push(source);
  }
  return out;
}

export function toggleSource(hidden: readonly string[], source: string, present: readonly string[]): string[] {
  const current = readHiddenSources(hidden, present);
  const next = sourceText(source);
  if (!next || !present.map((item) => sourceText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleSources(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSources(hidden, present));
  return namedSources(present.map((source) => ({ source }))).filter((source) => (showHidden ? gone.has(source) : !gone.has(source)));
}

export function activeSource(selected: string, visible: readonly string[]): string {
  const source = sourceText(selected);
  if (!source) return "";
  return visible.some((item) => sourceText(item) === source) ? source : "";
}

export function visibleLeads<T extends SourceRow>(rows: readonly T[], source: string, blank: boolean, query: string): T[] {
  const want = sourceText(source);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = sourceText(row.source);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
