/** Local staff names for this desk, and withdrawal counts grouped by the method already on each row. */

export const STAFF_KEY = "crmv3-staff-polish";
export const METHOD_HIDE_KEY = "crmv3-wd-method-hide";

export type Staff = {
  id: string;
  name: string;
  role: string;
  pinned: boolean;
  hidden: boolean;
};

export type MethodValue = { label?: unknown; type?: unknown; channel?: unknown } | string | null | undefined;

export type MethodRow = { method?: MethodValue; label?: string | null };

export type MethodLine = { method: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank name is left out. The saved name stays short. */
export function staffName(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank role label stays blank. It is not filled in. */
export function roleLabel(raw: unknown): string {
  return clip(raw, 40);
}

export function readStaff(raw: unknown): Staff[] {
  if (!Array.isArray(raw)) return [];
  const out: Staff[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Staff>;
    const id = String(row.id || "").trim();
    const name = staffName(row.name);
    if (!id || !name || out.some((person) => person.id === id)) continue;
    out.push({ id, name, role: roleLabel(row.role), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addStaff(staff: readonly Staff[], person: { id: string; name: string; role?: string }): Staff[] {
  const current = readStaff(staff);
  const id = String(person.id || "").trim();
  const name = staffName(person.name);
  const role = roleLabel(person.role);
  if (!id || !name || current.some((item) => item.id === id || (item.name === name && item.role === role))) return current;
  return [{ id, name, role, pinned: false, hidden: false }, ...current].slice(0, 40);
}

export function toggleStaffPin(staff: readonly Staff[], id: string): Staff[] {
  return readStaff(staff).map((person) => (person.id === id ? { ...person, pinned: !person.pinned } : person));
}

export function setStaffHidden(staff: readonly Staff[], id: string, hidden: boolean): Staff[] {
  return readStaff(staff).map((person) => (person.id === id ? { ...person, hidden } : person));
}

export function resetStaff(): Staff[] {
  return [];
}

export function visibleStaff(staff: readonly Staff[], hidden: boolean, query: string): Staff[] {
  const text = query.trim().toLowerCase();
  return readStaff(staff)
    .filter((person) => person.hidden === hidden && (!text || `${person.name} ${person.role}`.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** Method label, then type, then channel. A missing method stays blank. */
export function methodText(method: MethodValue): string {
  if (typeof method === "string") return plain(method);
  if (!method || typeof method !== "object") return "";
  return plain(method.label) || plain(method.type) || plain(method.channel);
}

export function methodLines(rows: readonly MethodRow[]): MethodLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const method = methodText(row.method);
    map.set(method, (map.get(method) || 0) + 1);
  }
  const out: MethodLine[] = [];
  map.forEach((count, method) => out.push({ method, count }));
  return out.sort((a, b) => {
    if (!a.method) return -1;
    if (!b.method) return 1;
    return a.method.localeCompare(b.method);
  });
}

export function namedMethods(rows: readonly MethodRow[]): string[] {
  return methodLines(rows).map((line) => line.method).filter(Boolean);
}

export function readHiddenMethods(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => methodText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const method = methodText(String(item || ""));
    if (!method || !allow.has(method) || out.includes(method)) continue;
    out.push(method);
  }
  return out;
}

export function toggleMethod(hidden: readonly string[], method: string, present: readonly string[]): string[] {
  const current = readHiddenMethods(hidden, present);
  const next = methodText(method);
  if (!next || !present.map((item) => methodText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleMethods(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenMethods(hidden, present));
  return namedMethods(present.map((method) => ({ method }))).filter((method) => (showHidden ? gone.has(method) : !gone.has(method)));
}

export function activeMethod(selected: string, visible: readonly string[]): string {
  const method = methodText(selected);
  if (!method) return "";
  return visible.some((item) => methodText(item) === method) ? method : "";
}

export function visibleWithdrawals<T extends MethodRow>(rows: readonly T[], method: string, blank: boolean, query: string): T[] {
  const want = methodText(method);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = methodText(row.method);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
