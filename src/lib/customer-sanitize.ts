/**
 * Customer-facing responses must never reveal staff / internal CRM info:
 * assigned broker / investment specialist / employee, desk, affiliates, internal notes,
 * admin-written reasons, staff names on chat / ledger / tickets.
 * Applied server-side to every customer API (admin APIs are unaffected).
 */
const STAFF_KEYS = new Set([
  "brokerName",
  "assigneeName",
  "assigneeId",
  "assignedTo",
  "assignedToId",
  "workerName",
  "workerId",
  "authorId",
  "authorName",
  "createdById",
  "createdByName",
  "approvedById",
  "approvedByName",
  "reviewedById",
  "reviewedByName",
  "processedById",
  "processedByName",
  "adminId",
  "adminName",
  "adminNote",
  "approvalReason",
  "rejectionReason",
  "internalNote",
  "notes",
  "desk",
  "deskId",
  "campaign",
  "affiliateA",
  "affiliateB",
  "affiliateC",
  "referralCodeUsed",
  "retentionStatus",
  "retentionNote",
  "retentionFollowUpAt",
  "saleStatus",
  "potentialStatus",
  "validationStatus",
  "tradingGroup",
  "uploadedById",
]);

export function stripStaff<T>(v: T): T {
  if (Array.isArray(v)) return v.map((x) => stripStaff(x)) as unknown as T;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (STAFF_KEYS.has(k)) continue;
      out[k] = stripStaff(val);
    }
    return out as T;
  }
  return v;
}
