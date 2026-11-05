/** Local named color tags, and ticket counts grouped by the assignee already on each row. */

export const PALETTE_KEY = "crmv3-tag-palette";
export const ASSIGN_KEY = "crmv3-assignee-hide";

export const PALETTE = ["ivory", "graphite", "champagne", "ink", "paper", "moss", "clay", "slate"] as const;

export type PaletteColor = (typeof PALETTE)[number];

export const SWATCH: Record<PaletteColor, string> = {
  ivory: "#f7f4ee",
  graphite: "#161412",
  champagne: "#7a5e30",
  ink: "#1c1a17",
  paper: "#fffdf8",
  moss: "#3f5c4b",
  clay: "#8c4a3a",
  slate: "#4d5c6b",
};

export type DeskTag = {
  id: string;
  name: string;
  color: PaletteColor;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type AssignRow = { assignee?: unknown; label?: string | null };

export type AssignLine = { assignee: string; count: number };

export function tagName(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function paletteColor(raw: string | null | undefined): PaletteColor | "" {
  const color = String(raw || "").trim().toLowerCase();
  return (PALETTE as readonly string[]).includes(color) ? (color as PaletteColor) : "";
}

export function readTags(raw: unknown): DeskTag[] {
  if (!Array.isArray(raw)) return [];
  const out: DeskTag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DeskTag>;
    const id = String(row.id || "").trim();
    const name = tagName(row.name);
    const color = paletteColor(row.color);
    if (!id || !name || !color || out.some((tag) => tag.id === id || tag.name === name)) continue;
    out.push({ id, name, color, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addTag(tags: readonly DeskTag[], tag: { id: string; name: string; color: string; at: string }): DeskTag[] {
  const id = String(tag.id || "").trim();
  const name = tagName(tag.name);
  const color = paletteColor(tag.color);
  if (!id || !name || !color || tags.some((item) => item.id === id || item.name === name)) return tags.slice();
  return [{ id, name, color, pinned: false, hidden: false, at: tag.at }, ...tags].slice(0, 40);
}

export function toggleTagPin(tags: readonly DeskTag[], id: string): DeskTag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, pinned: !tag.pinned } : tag));
}

export function setTagHidden(tags: readonly DeskTag[], id: string, hidden: boolean): DeskTag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, hidden } : tag));
}

export function visibleTags(tags: readonly DeskTag[], query: string, hidden: boolean): DeskTag[] {
  const text = query.trim().toLowerCase();
  return tags
    .filter((tag) => tag.hidden === hidden && (!text || tag.name.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** The assignee already on the row. A customer name is not an assignee. */
export function assigneeText(value: unknown): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  const named = plain(row.assigneeName);
  if (named) return named;
  for (const key of ["assignee", "owner"]) {
    const person = row[key];
    if (typeof person === "string") {
      const text = plain(person);
      if (text) return text;
    } else if (person && typeof person === "object") {
      const record = person as Record<string, unknown>;
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
