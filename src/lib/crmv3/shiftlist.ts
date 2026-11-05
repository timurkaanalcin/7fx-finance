/** A local shift checklist, and pending versus settled counts from loaded lists. Currencies are not added. */

export const LIST_KEY = "crmv3-shift-check";
export const HIDE_KEY = "crmv3-glance-hide";

export const GLANCE_KINDS = ["deposits", "withdrawals", "trades"] as const;
export type GlanceKind = (typeof GLANCE_KINDS)[number];

/** The same list calls the boards already use. This is not a new endpoint. */
export const GLANCE_LISTS: Record<GlanceKind, string> = {
  deposits: "/api/admin/deposits?take=40",
  withdrawals: "/api/admin/withdrawals?take=40",
  trades: "/api/admin/positions?tab=orders&take=40",
};

export const GLANCE_BOARDS: Record<GlanceKind, string> = {
  deposits: "depboard",
  withdrawals: "payboard",
  trades: "blotter",
};

export type Step = { id: string; label: string; done: boolean };

export type ShiftList = { day: string; steps: Step[] };

export type QueueRow = { id?: string | null; status?: string | null };

export type Split = { pending: number; settled: number };

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function cleanLabel(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function readSteps(raw: unknown): Step[] {
  if (!Array.isArray(raw)) return [];
  const out: Step[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Step>;
    const id = String(row.id || "").trim();
    const label = cleanLabel(String(row.label || ""));
    if (!id || !label || out.some((step) => step.id === id)) continue;
    out.push({ id, label, done: row.done === true });
  }
  return out.slice(0, 24);
}

/** A list saved on another UTC day is empty. */
export function readShift(raw: unknown, today: string): ShiftList {
  const row = raw && typeof raw === "object" ? (raw as { day?: unknown; steps?: unknown }) : {};
  const day = String(row.day || "");
  if (day !== today) return { day: today, steps: [] };
  return { day: today, steps: readSteps(row.steps) };
}

export function addStep(list: ShiftList, step: { id: string; label: string }): ShiftList {
  const id = String(step.id || "").trim();
  const label = cleanLabel(step.label);
  if (!id || !label || list.steps.some((item) => item.id === id) || list.steps.length >= 24) return list;
  return { day: list.day, steps: [...list.steps, { id, label, done: false }] };
}

export function toggleStep(list: ShiftList, id: string): ShiftList {
  return { day: list.day, steps: list.steps.map((step) => (step.id === id ? { ...step, done: !step.done } : step)) };
}

export function visibleSteps(steps: readonly Step[], query: string): Step[] {
  const text = query.trim().toLowerCase();
  if (!text) return steps.slice();
  return steps.filter((step) => step.label.toLowerCase().includes(text));
}

export function isGlanceKind(value: string): value is GlanceKind {
  return (GLANCE_KINDS as readonly string[]).includes(value);
}

/** Pending and settled stay separate. A missing status is not counted. No amount is used. */
export function splitCounts(rows: readonly QueueRow[], kind: GlanceKind): Split {
  const settledStatus = kind === "trades" ? "FILLED" : "APPROVED";
  let pending = 0;
  let settled = 0;
  for (const row of rows) {
    if (!String(row.id || "").trim()) continue;
    const status = String(row.status || "").trim().toUpperCase();
    if (status === "PENDING") pending += 1;
    else if (status === settledStatus) settled += 1;
  }
  return { pending, settled };
}

export function readKinds(raw: unknown): GlanceKind[] {
  if (!Array.isArray(raw)) return [];
  const out: GlanceKind[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (isGlanceKind(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleKind(kinds: readonly string[], kind: string): GlanceKind[] {
  const current = readKinds(kinds);
  if (!isGlanceKind(kind)) return current;
  return current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind];
}

export function visibleKinds(hidden: readonly string[], showHidden: boolean): GlanceKind[] {
  const gone = readKinds(hidden);
  return GLANCE_KINDS.filter((kind) => (showHidden ? gone.includes(kind) : !gone.includes(kind)));
}
