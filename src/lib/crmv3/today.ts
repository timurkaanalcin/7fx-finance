/** Today's loaded counts and the staff roster. The filter stays in this browser. */

export type WorkFilter = "all" | "busy" | "clear";
export const LOAD_KEY = "crmv3-staff-load";

export function readLoad(raw: string | null): WorkFilter {
  return raw === "busy" || raw === "clear" ? raw : "all";
}

export function pendingCount(rows: { status?: string | null }[]): number {
  return rows.filter((row) => !row.status || String(row.status).toUpperCase() === "PENDING").length;
}

export function kycOpen(rows: { documentsStatus?: string | null }[]): number {
  return rows.filter((row) => String(row.documentsStatus || "NONE").toUpperCase() !== "APPROVED").length;
}

export function overdueFollows(rows: { retentionFollowUpAt?: string | null }[], today: string): number {
  return rows.filter((row) => {
    const at = Date.parse(String(row.retentionFollowUpAt || ""));
    if (!Number.isFinite(at)) return false;
    return new Date(at).toISOString().slice(0, 10) < today;
  }).length;
}

export function unreadThreads(rows: { messages?: { workerId?: string | null; automatic?: boolean | null }[]; presence?: { adminLastReadAt?: string | null } | null }[]): number {
  return rows.filter((row) => {
    const last = row.messages?.[row.messages.length - 1];
    if (last && !last.workerId && !last.automatic) return true;
    return !row.presence?.adminLastReadAt;
  }).length;
}

export type StaffCard = { id: string; name: string; desk: string; assigned: number };

export type MatchCustomer = { assigneeName?: string | null; assigneeId?: string | null };
export type MatchWorker = { id?: string | null; name?: string | null; desk?: string | null };

/** Trim, collapse inner spaces, and ignore case. */
export function normAssignee(value: unknown): string {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Prefer a loaded assignee id. Otherwise match the trimmed name. */
export function matchedWorkerId(customer: MatchCustomer, workers: MatchWorker[]): string {
  const id = String(customer.assigneeId || "").trim();
  if (id) {
    const hit = workers.find((worker) => String(worker.id || "").trim() === id);
    if (hit) return String(hit.id || "");
  }
  const name = normAssignee(customer.assigneeName);
  if (!name) return "";
  const byName = workers.find((worker) => normAssignee(worker.name) === name);
  if (!byName) return "";
  return String(byName.id || byName.name || "");
}

export function staffCards(workers: MatchWorker[], customers: MatchCustomer[]): StaffCard[] {
  return workers.map((worker) => {
    const name = String(worker.name || "").trim();
    const key = String(worker.id || "");
    const assigned = customers.filter((row) => {
      const match = matchedWorkerId(row, workers);
      if (!match) return false;
      return match === key || (!key && match === name);
    }).length;
    return { id: key || name, name: name || key, desk: String(worker.desk || "").trim(), assigned };
  });
}

export function unassignedCount(customers: MatchCustomer[], workers: MatchWorker[]): number {
  return customers.filter((row) => matchedWorkerId(row, workers) === "").length;
}

export function filterLoad(cards: StaffCard[], mode: WorkFilter): StaffCard[] {
  if (mode === "busy") return cards.filter((card) => card.assigned > 0);
  if (mode === "clear") return cards.filter((card) => card.assigned === 0);
  return cards;
}

export function groupByDesk(cards: StaffCard[]): { desk: string; cards: StaffCard[] }[] {
  const map = new Map<string, StaffCard[]>();
  for (const card of cards) {
    const desk = card.desk || "";
    const list = map.get(desk) || [];
    list.push(card);
    map.set(desk, list);
  }
  const desks: string[] = [];
  map.forEach((_value, desk) => desks.push(desk));
  return desks.sort((a, b) => a.localeCompare(b)).map((desk) => ({ desk, cards: map.get(desk) || [] }));
}
