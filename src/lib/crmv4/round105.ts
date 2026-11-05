/** Local checklist items, and support counts grouped by the priority already on each row. */

export const CHECK_KEY = "crmv4-check-polish";
export const PRIORITY_KEY = "crmv4-case-priority-hide";

export type CheckItem = {
  id: string;
  text: string;
  done: boolean;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type PriorityRow = { priority?: unknown; label?: string | null };

export type PriorityLine = { priority: string; count: number };

/** A line break becomes a space. A blank item is left out. */
export function itemText(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function readItems(raw: unknown): CheckItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CheckItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CheckItem>;
    const id = String(row.id || "").trim();
    const text = itemText(row.text);
    if (!id || !text || out.some((entry) => entry.id === id || entry.text === text)) continue;
    out.push({
      id,
      text,
      done: row.done === true,
      pinned: row.pinned === true,
      hidden: row.hidden === true,
      at: String(row.at || ""),
    });
  }
  return out.slice(0, 40);
}

export function addItem(items: readonly CheckItem[], item: { id: string; text: string; at: string }): CheckItem[] {
  const id = String(item.id || "").trim();
  const text = itemText(item.text);
  if (!id || !text || items.some((entry) => entry.id === id || entry.text === text)) return items.slice();
  return [{ id, text, done: false, pinned: false, hidden: false, at: item.at }, ...items].slice(0, 40);
}

export function setItemDone(items: readonly CheckItem[], id: string, done: boolean): CheckItem[] {
  return items.map((item) => (item.id === id ? { ...item, done } : item));
}

export function toggleItemPin(items: readonly CheckItem[], id: string): CheckItem[] {
  return items.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
}

export function setItemHidden(items: readonly CheckItem[], id: string, hidden: boolean): CheckItem[] {
  return items.map((item) => (item.id === id ? { ...item, hidden } : item));
}

export function visibleItems(items: readonly CheckItem[], query: string, hidden: boolean): CheckItem[] {
  const text = query.trim().toLowerCase();
  return items
    .filter((item) => item.hidden === hidden && (!text || item.text.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** The priority already on the row. Kind and status are not a priority. */
export function priorityText(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (value && typeof value === "object" && "priority" in value) return priorityText((value as { priority?: unknown }).priority);
  return "";
}

export function priorityLines(rows: readonly PriorityRow[]): PriorityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const priority = priorityText(row.priority);
    map.set(priority, (map.get(priority) || 0) + 1);
  }
  const out: PriorityLine[] = [];
  map.forEach((count, priority) => out.push({ priority, count }));
  return out.sort((a, b) => {
    if (!a.priority) return -1;
    if (!b.priority) return 1;
    return a.priority.localeCompare(b.priority);
  });
}

export function namedPriorities(rows: readonly PriorityRow[]): string[] {
  return priorityLines(rows).map((line) => line.priority).filter(Boolean);
}

export function readHiddenPriorities(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => priorityText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const priority = priorityText(String(item || ""));
    if (!priority || !allow.has(priority) || out.includes(priority)) continue;
    out.push(priority);
  }
  return out;
}

export function togglePriority(hidden: readonly string[], priority: string, present: readonly string[]): string[] {
  const current = readHiddenPriorities(hidden, present);
  const next = priorityText(priority);
  if (!next || !present.map((item) => priorityText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visiblePriorities(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenPriorities(hidden, present));
  return namedPriorities(present.map((priority) => ({ priority }))).filter((priority) => (showHidden ? gone.has(priority) : !gone.has(priority)));
}

export function activePriority(selected: string, visible: readonly string[]): string {
  const priority = priorityText(selected);
  if (!priority) return "";
  return visible.some((item) => priorityText(item) === priority) ? priority : "";
}

export function visibleCases<T extends PriorityRow>(rows: readonly T[], priority: string, blank: boolean, query: string): T[] {
  const want = priorityText(priority);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = priorityText(row.priority);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
