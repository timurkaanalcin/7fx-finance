/** Pure helpers for CRM v4 round 37. Counts and filters stay on the loaded rows. */

export type DocLite = {
  id: string;
  status?: string | null;
  createdAt?: string | null;
  reviewedAt?: string | null;
};

export type TimelineStep = { key: "received" | "reviewed"; at: string };

/** Only dates that are on the row. A missing review date is not invented. */
export function docTimeline(row: DocLite): TimelineStep[] {
  const steps: TimelineStep[] = [];
  if (row.createdAt) steps.push({ key: "received", at: String(row.createdAt) });
  if (row.reviewedAt) steps.push({ key: "reviewed", at: String(row.reviewedAt) });
  return steps;
}

export type KycChecks = { name: boolean; photo: boolean; expiry: boolean };
export const EMPTY_CHECKS: KycChecks = { name: false, photo: false, expiry: false };

export function normalizeChecks(raw: unknown): KycChecks {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return { name: row.name === true, photo: row.photo === true, expiry: row.expiry === true };
}

export function checkDone(checks: KycChecks): number {
  return Number(checks.name) + Number(checks.photo) + Number(checks.expiry);
}

export function docTypes(rows: { docType?: string | null }[]): string[] {
  const list: string[] = [];
  for (const row of rows) {
    const name = String(row.docType || "").trim();
    if (name && !list.includes(name)) list.push(name);
  }
  return list;
}

export type AuditLite = {
  id: string;
  at?: string | null;
  action?: string | null;
  actor?: string | null;
  target?: string | null;
  level?: string | null;
};

export function auditDay(value: unknown): string {
  const at = Date.parse(String(value || ""));
  if (!Number.isFinite(at)) return "";
  return new Date(at).toISOString().slice(0, 10);
}

export function filterAudit(rows: AuditLite[], opts: { actor: string; action: string; entity: string }): AuditLite[] {
  const actor = opts.actor.trim().toLowerCase();
  const action = opts.action.trim().toLowerCase();
  const entity = opts.entity.trim().toLowerCase();
  return rows.filter((row) => {
    if (actor && !String(row.actor || "").toLowerCase().includes(actor)) return false;
    if (action && !String(row.action || "").toLowerCase().includes(action)) return false;
    if (entity && !String(row.target || "").toLowerCase().includes(entity)) return false;
    return true;
  });
}

export function groupAudit(rows: AuditLite[]): { day: string; rows: AuditLite[] }[] {
  const map = new Map<string, AuditLite[]>();
  const order: string[] = [];
  for (const row of rows) {
    const day = auditDay(row.at);
    const list = map.get(day);
    if (!list) {
      map.set(day, [row]);
      order.push(day);
    } else list.push(row);
  }
  return order.map((day) => ({ day, rows: map.get(day) || [] }));
}

export function auditLines(rows: AuditLite[]): string[][] {
  return rows.map((row) => [
    String(row.actor || ""),
    String(row.action || ""),
    String(row.target || ""),
    String(row.level || ""),
    String(row.at || ""),
  ]);
}
