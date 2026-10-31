/** Pure helpers for CRM v4 round 2. No schema and no ledger changes. */

export type Dated = { createdAt?: string | null; ftd?: boolean; balance?: number; active?: boolean; assigneeName?: string | null; email?: string | null; phone?: string | null; id: string; name?: string | null; desk?: string | null };

export function presetRange(preset: "today" | "7" | "30" | "month", now = new Date()): { from: string; to: string } {
  const end = new Date(now);
  const start = new Date(now);
  if (preset === "today") start.setHours(0, 0, 0, 0);
  else if (preset === "7") start.setDate(start.getDate() - 6);
  else if (preset === "30") start.setDate(start.getDate() - 29);
  else start.setDate(1);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  return { from: iso(start), to: iso(end) };
}

export function inRange(value: string | null | undefined, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const day = value.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function sumAmounts<T extends { amount?: number; createdAt?: string | null }>(rows: T[], from: string, to: string): number {
  return rows.reduce((sum, row) => (inRange(row.createdAt, from, to) ? sum + Number(row.amount || 0) : sum), 0);
}

export type Funnel = { leads: number; ftd: number; redeposit: number };

export function funnelOf(rows: Dated[]): Funnel {
  const leads = rows.length;
  const ftd = rows.filter((row) => row.ftd).length;
  const redeposit = rows.filter((row) => row.ftd && Number(row.balance || 0) > 0).length;
  return { leads, ftd, redeposit };
}

export function cohortsOf(rows: Dated[]): { month: string; joined: number; active: number }[] {
  const map = new Map<string, { joined: number; active: number }>();
  for (const row of rows) {
    const month = (row.createdAt || "").slice(0, 7) || "—";
    const cell = map.get(month) || { joined: 0, active: 0 };
    cell.joined += 1;
    if (row.active !== false) cell.active += 1;
    map.set(month, cell);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, cell]) => ({ month, ...cell }));
}

export function leaderboardOf(rows: Dated[]): { name: string; traders: number; ftd: number }[] {
  const map = new Map<string, { traders: number; ftd: number }>();
  for (const row of rows) {
    const name = row.assigneeName || "—";
    const cell = map.get(name) || { traders: 0, ftd: 0 };
    cell.traders += 1;
    if (row.ftd) cell.ftd += 1;
    map.set(name, cell);
  }
  return Array.from(map.entries()).map(([name, cell]) => ({ name, ...cell })).sort((a, b) => b.ftd - a.ftd || b.traders - a.traders);
}

export function roundRobin(ids: string[], desks: string[]): { id: string; desk: string }[] {
  const clean = desks.map((desk) => desk.trim()).filter(Boolean);
  if (!clean.length) return [];
  return ids.map((id, index) => ({ id, desk: clean[index % clean.length] }));
}

export type DupGroup = { key: string; kind: "email" | "phone"; ids: string[] };

export function duplicateGroups(rows: Dated[]): DupGroup[] {
  const emails = new Map<string, string[]>();
  const phones = new Map<string, string[]>();
  for (const row of rows) {
    const email = String(row.email || "").trim().toLowerCase();
    const digits = String(row.phone || "").replace(/\D/g, "");
    const phone = digits.length >= 10 ? digits.slice(-10) : digits;
    if (email) emails.set(email, [...(emails.get(email) || []), row.id]);
    if (phone.length >= 6) phones.set(phone, [...(phones.get(phone) || []), row.id]);
  }
  const out: DupGroup[] = [];
  Array.from(emails.entries()).forEach(([key, ids]) => { if (ids.length > 1) out.push({ key, kind: "email", ids }); });
  Array.from(phones.entries()).forEach(([key, ids]) => { if (ids.length > 1) out.push({ key, kind: "phone", ids }); });
  return out;
}

export function detailPairs(detail: unknown): { key: string; value: string }[] {
  if (detail == null) return [];
  let value: unknown = detail;
  if (typeof detail === "string") {
    try { value = JSON.parse(detail); } catch { return [{ key: "text", value: detail }]; }
  }
  if (!value || typeof value !== "object") return [{ key: "value", value: String(value) }];
  return Object.entries(value as Record<string, unknown>).map(([key, item]) => ({
    key,
    value: item == null ? "" : typeof item === "object" ? JSON.stringify(item) : String(item),
  }));
}

export function fillTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function moveWidget(order: string[], id: string, dir: -1 | 1): string[] {
  const index = order.indexOf(id);
  const next = index + dir;
  if (index < 0 || next < 0 || next >= order.length) return order;
  const copy = order.slice();
  const [picked] = copy.splice(index, 1);
  copy.splice(next, 0, picked);
  return copy;
}
