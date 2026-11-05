/** Loaded customer counts by country or desk, and local desk tips. No money is added. */

export const PIN_KEY = "crmv4-heat-pins";
export const MODE_KEY = "crmv4-heat-mode";
export const TIP_KEY = "crmv4-cheat-sheet";

export type HeatMode = "country" | "desk";

export type HeatPerson = {
  id: string;
  name?: string | null;
  country?: string | null;
  desk?: string | null;
};

export type HeatCell = {
  key: string;
  count: number;
  names: string[];
};

export type DeskTip = {
  id: string;
  keys: string;
  body: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export function readMode(raw: unknown): HeatMode {
  return raw === "desk" ? "desk" : "country";
}

export function groupKey(person: HeatPerson, mode: HeatMode): string {
  const raw = mode === "desk" ? person.desk : person.country;
  return String(raw || "").trim();
}

export function pinId(mode: HeatMode, key: string): string {
  return `${mode}:${key || "none"}`;
}

export function filterPeople(people: readonly HeatPerson[], query: string): HeatPerson[] {
  const text = query.trim().toLowerCase();
  return people.filter((person) => {
    if (!person.id) return false;
    if (!text) return true;
    return `${person.name || ""} ${person.country || ""} ${person.desk || ""}`.toLowerCase().includes(text);
  });
}

/** One cell per loaded country or desk. The number is a count. */
export function heatCells(people: readonly HeatPerson[], mode: HeatMode, query: string, pins: readonly string[]): HeatCell[] {
  const buckets = new Map<string, HeatPerson[]>();
  for (const person of filterPeople(people, query)) {
    const key = groupKey(person, mode);
    const list = buckets.get(key) || [];
    list.push(person);
    buckets.set(key, list);
  }
  const cells: HeatCell[] = [];
  buckets.forEach((list, key) => {
    cells.push({
      key,
      count: list.length,
      names: list.map((person) => String(person.name || person.id).trim()).filter(Boolean).slice(0, 6),
    });
  });
  return cells.sort((a, b) => {
    const ap = pins.includes(pinId(mode, a.key));
    const bp = pins.includes(pinId(mode, b.key));
    if (ap !== bp) return ap ? -1 : 1;
    if (a.count !== b.count) return b.count - a.count;
    return a.key.localeCompare(b.key);
  });
}

export function readIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 80);
}

export function toggleId(ids: readonly string[], id: string): string[] {
  if (!id) return ids.slice();
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function cleanLine(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function readTips(raw: unknown): DeskTip[] {
  if (!Array.isArray(raw)) return [];
  const out: DeskTip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DeskTip>;
    const id = String(row.id || "").trim();
    const body = cleanLine(String(row.body || ""));
    const keys = cleanLine(String(row.keys || ""));
    if (!id || !body || out.some((tip) => tip.id === id)) continue;
    out.push({ id, keys, body, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 60);
}

export function addTip(tips: readonly DeskTip[], tip: { id: string; keys: string; body: string; at: string }): DeskTip[] {
  const id = String(tip.id || "").trim();
  const body = cleanLine(tip.body);
  const keys = cleanLine(tip.keys);
  if (!id || !body || tips.some((item) => item.id === id)) return tips.slice();
  return [{ id, keys, body, pinned: false, hidden: false, at: tip.at }, ...tips].slice(0, 60);
}

export function toggleTipPin(tips: readonly DeskTip[], id: string): DeskTip[] {
  return tips.map((tip) => (tip.id === id ? { ...tip, pinned: !tip.pinned } : tip));
}

export function hideTip(tips: readonly DeskTip[], id: string, hidden: boolean): DeskTip[] {
  return tips.map((tip) => (tip.id === id ? { ...tip, hidden } : tip));
}

export function removeTip(tips: readonly DeskTip[], id: string): DeskTip[] {
  return tips.filter((tip) => tip.id !== id);
}

export function visibleTips(tips: readonly DeskTip[], query: string, hidden: boolean): DeskTip[] {
  const text = query.trim().toLowerCase();
  return tips
    .filter((tip) => tip.hidden === hidden && (!text || `${tip.keys} ${tip.body}`.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
