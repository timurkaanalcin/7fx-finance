/** Desk columns from the loaded page, and the local end-of-day list. Currencies are never added together. */

export const HIDE_KEY = "crmv4-desk-hide";
export const EOD_KEY = "crmv4-eod-steps";

export const STARTER_IDS = ["close-support", "clear-pins", "export-digest"] as const;

export type Person = {
  id: string;
  name?: string | null;
  desk?: string | null;
};

export type Cash = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  userId?: string | null;
  user?: { id?: string | null } | null;
};

export type MoneyLine = { currency: string; count: number; amount: number };

export type DeskColumn = {
  desk: string;
  count: number;
  lines: MoneyLine[];
};

export type EodStep = { id: string; label?: string; done: boolean; pinned: boolean };

export function deskOf(person: { desk?: string | null } | undefined): string {
  return String(person?.desk || "").trim();
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function linesOf(rows: readonly Cash[]): MoneyLine[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    const prev = map.get(currency) || { count: 0, amount: 0 };
    prev.count += 1;
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) prev.amount = round2(prev.amount + amount);
    map.set(currency, prev);
  }
  const out: MoneyLine[] = [];
  map.forEach((value, currency) => out.push({ currency, count: value.count, amount: value.amount }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

/** One column per loaded desk. Deposit lines follow only the customers still on the page. */
export function compareDesks(people: readonly Person[], deposits: readonly Cash[], query: string, hidden: readonly string[], showHidden: boolean): DeskColumn[] {
  const text = query.trim().toLowerCase();
  const shown = people.filter((person) => {
    if (!person.id) return false;
    if (!text) return true;
    return `${person.name || ""} ${person.desk || ""}`.toLowerCase().includes(text);
  });
  const byDesk = new Map<string, Person[]>();
  for (const person of shown) {
    const desk = deskOf(person);
    const list = byDesk.get(desk) || [];
    list.push(person);
    byDesk.set(desk, list);
  }
  const columns: DeskColumn[] = [];
  byDesk.forEach((list, desk) => {
    const ids = new Set(list.map((person) => person.id));
    const cash = deposits.filter((row) => ids.has(String(row.user?.id || row.userId || "")));
    columns.push({ desk, count: list.length, lines: linesOf(cash) });
  });
  return columns
    .filter((column) => (showHidden ? hidden.includes(column.desk) : !hidden.includes(column.desk)))
    .sort((a, b) => b.count - a.count || a.desk.localeCompare(b.desk));
}

export function readHidden(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const desk = String(item ?? "");
    if (!out.includes(desk)) out.push(desk);
  }
  return out.slice(0, 40);
}

export function toggleHidden(hidden: readonly string[], desk: string): string[] {
  return hidden.includes(desk) ? hidden.filter((item) => item !== desk) : [...hidden, desk];
}

export function cleanLine(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function starterSteps(): EodStep[] {
  return STARTER_IDS.map((id) => ({ id, done: false, pinned: id === "close-support" }));
}

export function readSteps(raw: unknown): EodStep[] {
  if (!Array.isArray(raw)) return [];
  const out: EodStep[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<EodStep>;
    const id = String(row.id || "").trim();
    if (!id || out.some((step) => step.id === id)) continue;
    const label = cleanLine(String(row.label || ""));
    out.push({ id, ...(label ? { label } : {}), done: row.done === true, pinned: row.pinned === true });
  }
  return out.slice(0, 24);
}

export function stepsFromStorage(raw: string | null): { steps: EodStep[]; seeded: boolean } {
  if (!raw) return { steps: starterSteps(), seeded: true };
  try {
    return { steps: readSteps(JSON.parse(raw)), seeded: false };
  } catch {
    return { steps: [], seeded: false };
  }
}

export function addStep(steps: readonly EodStep[], id: string, label: string): EodStep[] {
  const text = cleanLine(label);
  const nextId = String(id || "").trim();
  if (!text || !nextId || steps.some((step) => step.id === nextId) || steps.length >= 24) return steps.slice();
  return [...steps, { id: nextId, label: text, done: false, pinned: false }];
}

export function toggleStep(steps: readonly EodStep[], id: string): EodStep[] {
  return steps.map((step) => (step.id === id ? { ...step, done: !step.done } : step));
}

export function togglePin(steps: readonly EodStep[], id: string): EodStep[] {
  return steps.map((step) => (step.id === id ? { ...step, pinned: !step.pinned } : step));
}

export function clearTicks(steps: readonly EodStep[]): EodStep[] {
  return steps.map((step) => ({ ...step, done: false }));
}

export function visibleSteps(steps: readonly EodStep[], query: string): EodStep[] {
  const text = query.trim().toLowerCase();
  return steps
    .filter((step) => !text || `${step.label || ""} ${step.id}`.toLowerCase().includes(text))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.id.localeCompare(b.id);
    });
}

export function progress(steps: readonly EodStep[]): { done: number; total: number } {
  return { done: steps.filter((step) => step.done).length, total: steps.length };
}
