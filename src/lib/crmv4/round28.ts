/** Pure helpers for CRM v4 round 28. The checklist and recent searches stay in the browser. */

export const WD_CHECKS = ["kyc", "balance", "deposits", "positions"] as const;
export type WdCheck = (typeof WD_CHECKS)[number];
export type WdChecks = Record<WdCheck, boolean>;

export type PendingWithdrawal = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  method?: unknown;
  createdAt?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

export type SearchGroup = "customer" | "ticket" | "finance" | "page";

export type SearchHit = { group: SearchGroup; id: string; label: string; detail: string; href: string };

const EMPTY: WdChecks = { kyc: false, balance: false, deposits: false, positions: false };

export function emptyWdChecks(): WdChecks {
  return { ...EMPTY };
}

export function readWdChecks(raw: unknown): Record<string, WdChecks> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, WdChecks> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Record<string, unknown>;
    out[id] = {
      kyc: row.kyc === true,
      balance: row.balance === true,
      deposits: row.deposits === true,
      positions: row.positions === true,
    };
  }
  return out;
}

export function setWdCheck(map: Record<string, WdChecks>, id: string, item: WdCheck, on: boolean): Record<string, WdChecks> {
  const current = map[id] || emptyWdChecks();
  return { ...map, [id]: { ...current, [item]: on } };
}

export function wdDone(checks: WdChecks | undefined): number {
  if (!checks) return 0;
  return WD_CHECKS.filter((item) => checks[item]).length;
}

export function pendingOnly(rows: PendingWithdrawal[]): PendingWithdrawal[] {
  return rows.filter((row) => String(row.status || "").toUpperCase() === "PENDING");
}

export function matchWithdrawals(rows: PendingWithdrawal[], query: string): PendingWithdrawal[] {
  const text = query.trim().toLowerCase();
  if (!text) return rows;
  return rows.filter((row) => `${row.user?.name || ""} ${row.user?.email || ""} ${row.currency || ""} ${row.amount ?? ""}`.toLowerCase().includes(text));
}

export function sameCurrency(left?: string | null, right?: string | null): boolean {
  const a = String(left || "").toUpperCase();
  const b = String(right || "").toUpperCase();
  return Boolean(a) && a === b;
}

export function pushRecent(list: string[], query: string, limit = 8): string[] {
  const text = query.trim();
  if (text.length < 2) return list;
  return [text, ...list.filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(0, limit);
}

export function moveIndex(index: number, dir: -1 | 1, count: number): number {
  if (count <= 0) return 0;
  return (index + dir + count) % count;
}

export function groupHits(hits: SearchHit[]): { group: SearchGroup; items: SearchHit[] }[] {
  const order: SearchGroup[] = ["customer", "ticket", "finance", "page"];
  return order
    .map((group) => ({ group, items: hits.filter((hit) => hit.group === group) }))
    .filter((row) => row.items.length);
}

export function pageHits(query: string, pages: { id: string; label: string; href: string }[]): SearchHit[] {
  const text = query.trim().toLowerCase();
  return pages
    .filter((page) => !text || page.label.toLowerCase().includes(text) || page.id.toLowerCase().includes(text))
    .map((page) => ({ group: "page" as const, id: page.id, label: page.label, detail: "", href: page.href }));
}
