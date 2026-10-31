/** Pure helpers for CRM v3 deposit review and the support inbox. Checklist and canned replies stay in the browser. */

import { approvalBody } from "@/lib/crmv2/payload";

export const DEP_CHECKS = ["amount", "method", "kyc", "receipt"] as const;
export type DepCheck = (typeof DEP_CHECKS)[number];
export type DepChecks = Record<DepCheck, boolean>;

export type PendingDeposit = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  method?: unknown;
  note?: string | null;
  createdAt?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

export type InboxMessage = {
  id: string;
  body?: string | null;
  workerId?: string | null;
  automatic?: boolean | null;
  createdAt?: string | null;
};

export type CannedReply = { id: string; title: string; body: string };

const EMPTY: DepChecks = { amount: false, method: false, kyc: false, receipt: false };

export function emptyDepChecks(): DepChecks {
  return { ...EMPTY };
}

export function readDepChecks(raw: unknown): Record<string, DepChecks> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, DepChecks> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Record<string, unknown>;
    out[id] = {
      amount: row.amount === true,
      method: row.method === true,
      kyc: row.kyc === true,
      receipt: row.receipt === true,
    };
  }
  return out;
}

export function setDepCheck(map: Record<string, DepChecks>, id: string, item: DepCheck, on: boolean): Record<string, DepChecks> {
  const current = map[id] || emptyDepChecks();
  return { ...map, [id]: { ...current, [item]: on } };
}

export function depDone(checks: DepChecks | undefined): number {
  if (!checks) return 0;
  return DEP_CHECKS.filter((item) => checks[item]).length;
}

export function pendingDeposits(rows: PendingDeposit[]): PendingDeposit[] {
  return rows.filter((row) => String(row.status || "").toUpperCase() === "PENDING");
}

export function matchDeposits(rows: PendingDeposit[], query: string): PendingDeposit[] {
  const text = query.trim().toLowerCase();
  if (!text) return rows;
  return rows.filter((row) => `${row.user?.name || ""} ${row.user?.email || ""} ${row.currency || ""} ${row.amount ?? ""} ${row.note || ""}`.toLowerCase().includes(text));
}

export function depositReviewBody(id: string, action: "approve" | "reject", reason: string, source: string): Record<string, string> {
  const body = approvalBody(id, action, reason);
  const trimmed = source.trim();
  if (trimmed) body.sourceUserId = trimmed;
  return body;
}

export function threadMark(messages: InboxMessage[], readAt?: string | null): "waiting" | "unread" | "answered" {
  const last = messages[messages.length - 1];
  if (last && !last.workerId && !last.automatic) return "waiting";
  if (!readAt) return "unread";
  return "answered";
}

export function readCanned(raw: unknown): CannedReply[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; title?: unknown; body?: unknown };
    const body = String(row.body || "").trim();
    if (!body) return [];
    return [{ id: String(row.id || body), title: String(row.title || body).slice(0, 40), body }];
  });
}

export function addCanned(list: CannedReply[], title: string, body: string): CannedReply[] {
  const text = body.trim();
  if (!text) return list;
  return [...list, { id: `${list.length}-${text.slice(0, 12)}`, title: title.trim() || text.slice(0, 40), body: text }];
}
