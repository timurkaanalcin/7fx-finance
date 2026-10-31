/** Pure helpers for CRM v4 round 42. Bulk picks and chat stay on loaded rows. */

import { SALE_STATUSES } from "@/lib/membership";

export const PICK_KEY = "crmv4-list-picks";

export type PickMap = Record<string, string[]>;

export type Outcome = { id: string; name: string; ok: boolean; error: string };

export function toggleOne(selected: readonly string[], id: string): string[] {
  if (!id) return selected.slice();
  return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
}

export function pageAllOn(pageIds: readonly string[], selected: readonly string[]): boolean {
  if (!pageIds.length) return false;
  for (const id of pageIds) {
    if (!selected.includes(id)) return false;
  }
  return true;
}

export function togglePage(pageIds: readonly string[], selected: readonly string[]): string[] {
  if (pageAllOn(pageIds, selected)) return selected.filter((id) => !pageIds.includes(id));
  const next = selected.slice();
  for (const id of pageIds) {
    if (id && !next.includes(id)) next.push(id);
  }
  return next;
}

export function assignBody(staffId: string): { assigneeId: string } | null {
  const id = staffId.trim();
  if (!id) return null;
  return { assigneeId: id };
}

export function stageBody(status: string): { saleStatus: string } | null {
  if (!(SALE_STATUSES as readonly string[]).includes(status)) return null;
  return { saleStatus: status };
}

export function listTarget(pickedId: string, newName: string): string {
  const name = newName.trim();
  if (name) return name.slice(0, 40);
  return pickedId.trim();
}

export function readPicks(raw: unknown): PickMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: PickMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || !Array.isArray(value)) continue;
    const ids: string[] = [];
    for (const item of value) {
      const id = String(item || "");
      if (id && !ids.includes(id)) ids.push(id);
    }
    if (ids.length) out[key] = ids;
  }
  return out;
}

export function addPicks(map: PickMap, listId: string, ids: readonly string[]): PickMap {
  if (!listId) return map;
  const current = map[listId] ? map[listId].slice() : [];
  for (const id of ids) {
    if (id && !current.includes(id)) current.push(id);
  }
  return { ...map, [listId]: current };
}

export function tally(rows: readonly { ok: boolean }[]): { ok: number; failed: number } {
  let ok = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.ok) ok += 1;
    else failed += 1;
  }
  return { ok, failed };
}

export type CsvPerson = {
  name?: string | null;
  email?: string | null;
  country?: string | null;
  saleStatus?: string | null;
  balance?: number | null;
  currency?: string | null;
};

/** One row, its own currency. Balances are not added together. */
export function csvLine(row: CsvPerson): string[] {
  const balance = row.balance == null || Number.isNaN(Number(row.balance)) ? "" : String(row.balance);
  return [
    String(row.name || ""),
    String(row.email || ""),
    String(row.country || ""),
    String(row.saleStatus || ""),
    balance,
    String(row.currency || ""),
  ];
}

export function sideOf(message: { workerId?: string | null; automatic?: boolean | null }): "auto" | "staff" | "customer" {
  if (message.automatic) return "auto";
  if (message.workerId) return "staff";
  return "customer";
}

export function matchMessages<T extends { body?: string | null }>(rows: readonly T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  const out: T[] = [];
  for (const row of rows) {
    if (!needle || String(row.body || "").toLowerCase().includes(needle)) out.push(row);
  }
  return out;
}

export function canSend(draft: string): boolean {
  return draft.trim().length > 0;
}
