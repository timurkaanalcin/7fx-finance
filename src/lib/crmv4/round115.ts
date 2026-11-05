/** Local quick-dial labels, and ticket counts grouped by the assignee already on each row. */

export const DIAL_KEY = "crmv4-quick-dial";
export const ASSIGN_HIDE_KEY = "crmv4-ticket-assign-hide";

export type Dial = {
  id: string;
  label: string;
  phone: string;
  pinned: boolean;
  hidden: boolean;
};

export type AssignValue = { assigneeName?: unknown; assignee?: unknown; owner?: unknown } | string | null | undefined;

export type AssignRow = { assignee?: AssignValue; label?: string | null };

export type AssignLine = { assignee: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** A blank label is left out. The saved label stays short. */
export function dialLabel(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank phone or extension stays blank. It is not filled in. */
export function phoneText(raw: unknown): string {
  return clip(raw, 40);
}

export function readDials(raw: unknown): Dial[] {
  if (!Array.isArray(raw)) return [];
  const out: Dial[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Dial>;
    const id = String(row.id || "").trim();
    const label = dialLabel(row.label);
    if (!id || !label || out.some((dial) => dial.id === id)) continue;
    out.push({ id, label, phone: phoneText(row.phone), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addDial(dials: readonly Dial[], dial: { id: string; label: string; phone?: string }): Dial[] {
  const current = readDials(dials);
  const id = String(dial.id || "").trim();
  const label = dialLabel(dial.label);
  const phone = phoneText(dial.phone);
  if (!id || !label || current.some((item) => item.id === id || (item.label === label && item.phone === phone))) return current;
  return [{ id, label, phone, pinned: false, hidden: false }, ...current].slice(0, 40);
}

export function toggleDialPin(dials: readonly Dial[], id: string): Dial[] {
  return readDials(dials).map((dial) => (dial.id === id ? { ...dial, pinned: !dial.pinned } : dial));
}

export function setDialHidden(dials: readonly Dial[], id: string, hidden: boolean): Dial[] {
  return readDials(dials).map((dial) => (dial.id === id ? { ...dial, hidden } : dial));
}

export function resetDials(): Dial[] {
  return [];
}

export function visibleDials(dials: readonly Dial[], hidden: boolean, query: string): Dial[] {
  const text = query.trim().toLowerCase();
  return readDials(dials)
    .filter((dial) => dial.hidden === hidden && (!text || `${dial.label} ${dial.phone}`.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
}

/** Assignee name, then assignee, then owner. A customer name is not an assignee. */
export function assigneeText(value: AssignValue): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  const named = plain(value.assigneeName);
  if (named) return named;
  for (const person of [value.assignee, value.owner]) {
    if (typeof person === "string") {
      const text = plain(person);
      if (text) return text;
    } else if (person && typeof person === "object") {
      const record = person as { name?: unknown; email?: unknown };
      const text = plain(record.name) || plain(record.email);
      if (text) return text;
    }
  }
  return "";
}

export function assignLines(rows: readonly AssignRow[]): AssignLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const assignee = assigneeText(row.assignee);
    map.set(assignee, (map.get(assignee) || 0) + 1);
  }
  const out: AssignLine[] = [];
  map.forEach((count, assignee) => out.push({ assignee, count }));
  return out.sort((a, b) => {
    if (!a.assignee) return -1;
    if (!b.assignee) return 1;
    return a.assignee.localeCompare(b.assignee);
  });
}

export function namedAssignees(rows: readonly AssignRow[]): string[] {
  return assignLines(rows).map((line) => line.assignee).filter(Boolean);
}

export function readHiddenAssignees(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => assigneeText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const assignee = assigneeText(String(item || ""));
    if (!assignee || !allow.has(assignee) || out.includes(assignee)) continue;
    out.push(assignee);
  }
  return out;
}

export function toggleAssignee(hidden: readonly string[], assignee: string, present: readonly string[]): string[] {
  const current = readHiddenAssignees(hidden, present);
  const next = assigneeText(assignee);
  if (!next || !present.map((item) => assigneeText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleAssignees(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenAssignees(hidden, present));
  return namedAssignees(present.map((assignee) => ({ assignee }))).filter((assignee) => (showHidden ? gone.has(assignee) : !gone.has(assignee)));
}

export function activeAssignee(selected: string, visible: readonly string[]): string {
  const assignee = assigneeText(selected);
  if (!assignee) return "";
  return visible.some((item) => assigneeText(item) === assignee) ? assignee : "";
}

export function visibleTickets<T extends AssignRow>(rows: readonly T[], assignee: string, blank: boolean, query: string): T[] {
  const want = assigneeText(assignee);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = assigneeText(row.assignee);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
