/** Pure helpers for CRM v4 round 34. Columns and tasks stay in this browser. */

export const COL_KEY = "crmv4-columns";
export const TASK_KEY = "crmv4-tasks";

export const LIST_COLS = ["customer", "country", "desk", "sale", "retention", "balance", "status"] as const;
export type ListCol = (typeof LIST_COLS)[number];

export type ColPref = { columns: ListCol[]; dense: boolean };
export type Task = { id: string; text: string; done: boolean };

const DEFAULT: ColPref = { columns: ["customer", "country", "desk", "balance", "status"], dense: true };

function isCol(value: string): value is ListCol {
  return (LIST_COLS as readonly string[]).includes(value);
}

export function readCols(raw: unknown): ColPref {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { columns: [...DEFAULT.columns], dense: DEFAULT.dense };
  const row = raw as { columns?: unknown; dense?: unknown };
  const columns = Array.isArray(row.columns) ? row.columns.map(String).filter(isCol) : [];
  return { columns: columns.length ? columns : [...DEFAULT.columns], dense: row.dense === true };
}

export function toggleCol(pref: ColPref, col: ListCol): ColPref {
  const has = pref.columns.includes(col);
  const columns = has ? pref.columns.filter((item) => item !== col) : [...pref.columns, col];
  return { ...pref, columns: columns.length ? columns : [col] };
}

export function setDense(pref: ColPref, dense: boolean): ColPref {
  return { ...pref, dense };
}

export function readTasks(raw: unknown): Record<string, Task[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, Task[]> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || !Array.isArray(value)) continue;
    const tasks = value.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { id?: unknown; text?: unknown; done?: unknown };
      const text = String(row.text || "").trim();
      if (!text) return [];
      return [{ id: String(row.id || text), text, done: row.done === true }];
    });
    if (tasks.length) out[id] = tasks;
  }
  return out;
}

export function addTask(map: Record<string, Task[]>, customerId: string, text: string): Record<string, Task[]> {
  const label = text.trim();
  if (!customerId || !label) return map;
  const current = map[customerId] || [];
  return { ...map, [customerId]: [...current, { id: `${current.length}-${label.slice(0, 8)}`, text: label, done: false }] };
}

export function toggleTask(map: Record<string, Task[]>, customerId: string, taskId: string): Record<string, Task[]> {
  const current = map[customerId] || [];
  return { ...map, [customerId]: current.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) };
}

export function deleteTask(map: Record<string, Task[]>, customerId: string, taskId: string): Record<string, Task[]> {
  const current = (map[customerId] || []).filter((task) => task.id !== taskId);
  const next = { ...map };
  if (current.length) next[customerId] = current;
  else delete next[customerId];
  return next;
}

export function mentionQuery(draft: string): string {
  const match = draft.match(/(?:^|\s)@([^\s@]*)$/);
  return match ? match[1] : "";
}

export function mentionOpen(draft: string): boolean {
  return /(?:^|\s)@[^\s@]*$/.test(draft);
}

export function insertMention(draft: string, name: string): string {
  return draft.replace(/(?:^|\s)@[^\s@]*$/, (token) => `${token.startsWith(" ") || token.startsWith("\n") ? token[0] : ""}@${name} `);
}

export function paintMentions(body: string, names: string[]): { text: string; mention: boolean }[] {
  const known = names.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!known.length || !body.includes("@")) return [{ text: body, mention: false }];
  const pattern = new RegExp(`@(${known.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const out: { text: string; mention: boolean }[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null = pattern.exec(body);
  while (match) {
    const index = match.index || 0;
    if (index > cursor) out.push({ text: body.slice(cursor, index), mention: false });
    out.push({ text: match[0], mention: true });
    cursor = index + match[0].length;
    match = pattern.exec(body);
  }
  if (cursor < body.length) out.push({ text: body.slice(cursor), mention: false });
  return out.length ? out : [{ text: body, mention: false }];
}
