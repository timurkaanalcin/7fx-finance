/** Local http and https bookmarks, and ticket counts grouped by the priority already on each row. */

export const LINK_KEY = "crmv4-quick-links";
export const PRIORITY_KEY = "crmv4-priority-hide";

export type Link = {
  id: string;
  name: string;
  url: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type PriorityRow = { priority?: unknown; label?: string | null };

export type PriorityLine = { priority: string; count: number };

export function linkName(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Only an http or https URL with a host is kept. */
export function httpUrl(raw: string | null | undefined): string {
  const text = String(raw || "").trim();
  if (!text || /\s/.test(text)) return "";
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  if (!url.hostname) return "";
  return url.toString();
}

export function readLinks(raw: unknown): Link[] {
  if (!Array.isArray(raw)) return [];
  const out: Link[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Link>;
    const id = String(row.id || "").trim();
    const name = linkName(row.name);
    const url = httpUrl(row.url);
    if (!id || !name || !url || out.some((link) => link.id === id || link.url === url)) continue;
    out.push({ id, name, url, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addLink(links: readonly Link[], link: { id: string; name: string; url: string; at: string }): Link[] {
  const id = String(link.id || "").trim();
  const name = linkName(link.name);
  const url = httpUrl(link.url);
  if (!id || !name || !url || links.some((item) => item.id === id || item.url === url)) return links.slice();
  return [{ id, name, url, pinned: false, hidden: false, at: link.at }, ...links].slice(0, 40);
}

export function toggleLinkPin(links: readonly Link[], id: string): Link[] {
  return links.map((link) => (link.id === id ? { ...link, pinned: !link.pinned } : link));
}

export function setLinkHidden(links: readonly Link[], id: string, hidden: boolean): Link[] {
  return links.map((link) => (link.id === id ? { ...link, hidden } : link));
}

export function visibleLinks(links: readonly Link[], query: string, hidden: boolean): Link[] {
  const text = query.trim().toLowerCase();
  return links
    .filter((link) => link.hidden === hidden && (!text || `${link.name} ${link.url}`.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** The priority already on the row. A missing priority stays blank. */
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

export function visibleTickets<T extends PriorityRow>(rows: readonly T[], priority: string, blank: boolean, query: string): T[] {
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
