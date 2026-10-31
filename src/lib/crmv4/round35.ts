/** Pure helpers for CRM v4 round 35. Counts stay inside the loaded rows. */

export type WorkFilter = "all" | "busy" | "clear";
export const LOAD_KEY = "crmv4-staff-load";

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

export function staffCards(
  workers: { id: string; name?: string | null; desk?: string | null }[],
  customers: { assigneeName?: string | null }[],
): StaffCard[] {
  return workers.map((worker) => {
    const name = String(worker.name || "").trim();
    const assigned = customers.filter((row) => name && String(row.assigneeName || "").trim().toLowerCase() === name.toLowerCase()).length;
    return { id: worker.id, name: name || worker.id, desk: String(worker.desk || "").trim(), assigned };
  });
}

export function unassignedCount(customers: { assigneeName?: string | null }[], workers: { name?: string | null }[]): number {
  const names = new Set(workers.map((row) => String(row.name || "").trim().toLowerCase()).filter(Boolean));
  return customers.filter((row) => !names.has(String(row.assigneeName || "").trim().toLowerCase())).length;
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
