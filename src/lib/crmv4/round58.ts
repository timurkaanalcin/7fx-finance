/** Deposit review board and the local checklist pad. Currencies are never added together. */

export const SOP_KEY = "crmv4-sop-lists";

export const DEP_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export type DepRow = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  note?: string | null;
  createdAt?: string | null;
  method?: { label?: string | null } | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

export type CurrencyTotal = { currency: string; count: number; amount: number };

export type SopStep = { id: string; label?: string; done: boolean };

export type SopList = {
  id: string;
  kind: "onboarding" | "kyc" | "custom";
  title?: string;
  pinned: boolean;
  steps: SopStep[];
};

const STARTER_STEPS = {
  onboarding: ["ob-name", "ob-contact", "ob-desk"],
  kyc: ["kyc-doc", "kyc-match", "kyc-note"],
} as const;

export function depStatus(row: { status?: string | null }): string {
  return String(row.status || "").trim().toUpperCase();
}

export function filterDeposits(rows: readonly DepRow[], status: string, query: string): DepRow[] {
  const want = status.trim().toUpperCase();
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (want && depStatus(row) !== want) return false;
    if (!text) return true;
    return `${row.user?.name || ""} ${row.user?.email || ""} ${row.method?.label || ""} ${row.currency || ""} ${row.note || ""}`.toLowerCase().includes(text);
  });
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** One total per currency. A missing currency stays on its own line. */
export function currencyTotals(rows: readonly DepRow[]): CurrencyTotal[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    const prev = map.get(currency) || { count: 0, amount: 0 };
    prev.count += 1;
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) prev.amount = round2(prev.amount + amount);
    map.set(currency, prev);
  }
  const out: CurrencyTotal[] = [];
  map.forEach((value, currency) => out.push({ currency, count: value.count, amount: value.amount }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

export function cleanLine(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function starterLists(): SopList[] {
  return [
    { id: "onboarding", kind: "onboarding", pinned: true, steps: STARTER_STEPS.onboarding.map((id) => ({ id, done: false })) },
    { id: "kyc", kind: "kyc", pinned: false, steps: STARTER_STEPS.kyc.map((id) => ({ id, done: false })) },
  ];
}

export function readLists(raw: unknown): SopList[] {
  if (!Array.isArray(raw)) return [];
  const out: SopList[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SopList>;
    const id = String(row.id || "").trim();
    if (!id || out.some((list) => list.id === id)) continue;
    const kind = row.kind === "onboarding" || row.kind === "kyc" ? row.kind : "custom";
    const title = cleanLine(String(row.title || ""));
    const steps: SopStep[] = [];
    if (Array.isArray(row.steps)) {
      for (const step of row.steps) {
        if (!step || typeof step !== "object") continue;
        const one = step as Partial<SopStep>;
        const stepId = String(one.id || "").trim();
        if (!stepId || steps.some((item) => item.id === stepId)) continue;
        const label = cleanLine(String(one.label || ""));
        steps.push({ id: stepId, ...(label ? { label } : {}), done: one.done === true });
      }
    }
    out.push({ id, kind, ...(title ? { title } : {}), pinned: row.pinned === true, steps: steps.slice(0, 24) });
  }
  return out.slice(0, 40);
}

/** A missing store seeds the two desk lists. A saved empty list stays empty. */
export function listsFromStorage(raw: string | null): { lists: SopList[]; seeded: boolean } {
  if (!raw) return { lists: starterLists(), seeded: true };
  try {
    return { lists: readLists(JSON.parse(raw)), seeded: false };
  } catch {
    return { lists: [], seeded: false };
  }
}

export function addList(lists: readonly SopList[], id: string, title: string): SopList[] {
  const text = cleanLine(title);
  const nextId = cleanLine(id).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!text || !nextId || lists.some((list) => list.id === nextId)) return lists.slice();
  const created: SopList = { id: nextId, kind: "custom", title: text, pinned: false, steps: [] };
  return [created, ...lists].slice(0, 40);
}

export function addStep(lists: readonly SopList[], listId: string, stepId: string, label: string): SopList[] {
  const text = cleanLine(label);
  const id = String(stepId || "").trim();
  if (!text || !id) return lists.slice();
  return lists.map((list) => {
    if (list.id !== listId || list.steps.some((step) => step.id === id) || list.steps.length >= 24) return list;
    return { ...list, steps: [...list.steps, { id, label: text, done: false }] };
  });
}

export function toggleStep(lists: readonly SopList[], listId: string, stepId: string): SopList[] {
  return lists.map((list) => {
    if (list.id !== listId) return list;
    return { ...list, steps: list.steps.map((step) => (step.id === stepId ? { ...step, done: !step.done } : step)) };
  });
}

export function clearTicks(lists: readonly SopList[], listId: string): SopList[] {
  return lists.map((list) => (list.id === listId ? { ...list, steps: list.steps.map((step) => ({ ...step, done: false })) } : list));
}

export function togglePin(lists: readonly SopList[], listId: string): SopList[] {
  return lists.map((list) => (list.id === listId ? { ...list, pinned: !list.pinned } : list));
}

export function sortLists(lists: readonly SopList[]): SopList[] {
  return lists.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

export function searchLists(lists: readonly SopList[], query: string, labels: Record<string, string> = {}): SopList[] {
  const text = query.trim().toLowerCase();
  const rows = text
    ? lists.filter((list) => `${labels[list.id] || ""} ${list.title || ""} ${list.id} ${list.kind} ${list.steps.map((step) => `${labels[step.id] || ""} ${step.label || ""}`).join(" ")}`.toLowerCase().includes(text))
    : lists.slice();
  return sortLists(rows);
}

export function progress(list: SopList): { done: number; total: number } {
  const done = list.steps.filter((step) => step.done).length;
  return { done, total: list.steps.length };
}
