/** Local reminder chips, and customer counts grouped by the risk or tier already on each row. */

export const REMIND_POLISH_KEY = "crmv4-remind-polish";
export const RISK_KEY = "crmv4-customer-risk-hide";

export type DeskReminder = {
  id: string;
  text: string;
  due: string;
  done: boolean;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type RiskValue = { risk?: unknown; tier?: unknown; accountType?: unknown } | string | null | undefined;

export type RiskRow = { risk?: RiskValue; label?: string | null };

export type RiskLine = { risk: string; count: number };

function clip(raw: string | null | undefined, max: number): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A line break becomes a space. A blank reminder is left out. */
export function reminderText(raw: string | null | undefined): string {
  return clip(raw, 80);
}

/** The due label is optional. A blank label is kept. It is not a timer. */
export function dueLabel(raw: string | null | undefined): string {
  return clip(raw, 40);
}

export function readReminders(raw: unknown): DeskReminder[] {
  if (!Array.isArray(raw)) return [];
  const out: DeskReminder[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DeskReminder>;
    const id = String(row.id || "").trim();
    const text = reminderText(row.text);
    const due = dueLabel(row.due);
    if (!id || !text || out.some((entry) => entry.id === id || (entry.text === text && entry.due === due))) continue;
    out.push({
      id,
      text,
      due,
      done: row.done === true,
      pinned: row.pinned === true,
      hidden: row.hidden === true,
      at: String(row.at || ""),
    });
  }
  return out.slice(0, 40);
}

export function addReminder(items: readonly DeskReminder[], item: { id: string; text: string; due: string; at: string }): DeskReminder[] {
  const id = String(item.id || "").trim();
  const text = reminderText(item.text);
  const due = dueLabel(item.due);
  if (!id || !text || items.some((entry) => entry.id === id || (entry.text === text && entry.due === due))) return items.slice();
  return [{ id, text, due, done: false, pinned: false, hidden: false, at: item.at }, ...items].slice(0, 40);
}

export function setReminderDone(items: readonly DeskReminder[], id: string, done: boolean): DeskReminder[] {
  return items.map((item) => (item.id === id ? { ...item, done } : item));
}

export function toggleReminderPin(items: readonly DeskReminder[], id: string): DeskReminder[] {
  return items.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
}

export function setReminderHidden(items: readonly DeskReminder[], id: string, hidden: boolean): DeskReminder[] {
  return items.map((item) => (item.id === id ? { ...item, hidden } : item));
}

export function visibleReminders(items: readonly DeskReminder[], query: string, mode: "open" | "done" | "hidden"): DeskReminder[] {
  const text = query.trim().toLowerCase();
  return items
    .filter((item) => {
      if (mode === "hidden") {
        if (!item.hidden) return false;
      } else if (item.hidden || item.done !== (mode === "done")) return false;
      if (!text) return true;
      return `${item.text} ${item.due}`.toLowerCase().includes(text);
    })
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** Risk, then tier, then account type. A blank value is not filled in. */
export function riskText(value: RiskValue): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  return plain(value.risk) || plain(value.tier) || plain(value.accountType);
}

export function riskLines(rows: readonly RiskRow[]): RiskLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const risk = riskText(row.risk);
    map.set(risk, (map.get(risk) || 0) + 1);
  }
  const out: RiskLine[] = [];
  map.forEach((count, risk) => out.push({ risk, count }));
  return out.sort((a, b) => {
    if (!a.risk) return -1;
    if (!b.risk) return 1;
    return a.risk.localeCompare(b.risk);
  });
}

export function namedRisks(rows: readonly RiskRow[]): string[] {
  return riskLines(rows).map((line) => line.risk).filter(Boolean);
}

export function readHiddenRisks(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => riskText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const risk = riskText(String(item || ""));
    if (!risk || !allow.has(risk) || out.includes(risk)) continue;
    out.push(risk);
  }
  return out;
}

export function toggleRisk(hidden: readonly string[], risk: string, present: readonly string[]): string[] {
  const current = readHiddenRisks(hidden, present);
  const next = riskText(risk);
  if (!next || !present.map((item) => riskText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleRisks(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenRisks(hidden, present));
  return namedRisks(present.map((risk) => ({ risk }))).filter((risk) => (showHidden ? gone.has(risk) : !gone.has(risk)));
}

export function activeRisk(selected: string, visible: readonly string[]): string {
  const risk = riskText(selected);
  if (!risk) return "";
  return visible.some((item) => riskText(item) === risk) ? risk : "";
}

export function visibleCustomers<T extends RiskRow>(rows: readonly T[], risk: string, blank: boolean, query: string): T[] {
  const want = riskText(risk);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = riskText(row.risk);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
