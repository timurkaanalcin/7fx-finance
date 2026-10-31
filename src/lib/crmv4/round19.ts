/** Pure helpers for CRM v4 round 19. Flags and list views stay in the browser. Nothing is blocked. */

export type WatchKind = "kyc" | "large" | "rapid" | "withdrawals" | "dormant";

export type WatchHit = {
  id: string;
  userId: string;
  name: string;
  kind: WatchKind;
  detail: string;
  amount: number;
  at: string;
};

const KYC_GAP = new Set(["", "NONE", "PENDING", "REJECTED", "MISSING"]);
const DAY = 86400000;

function personId(row: { userId?: string | null; user?: { id?: string | null; name?: string | null; email?: string | null } | null }): { id: string; name: string } {
  const id = String(row.user?.id || row.userId || "");
  const name = String(row.user?.name || row.user?.email || id || "—");
  return { id, name };
}

export function missingKyc(rows: { id: string; name?: string | null; email?: string | null; documentsStatus?: string | null }[]): WatchHit[] {
  return rows
    .filter((row) => KYC_GAP.has(String(row.documentsStatus || "").toUpperCase()))
    .map((row) => ({
      id: `kyc:${row.id}`,
      userId: row.id,
      name: String(row.name || row.email || row.id),
      kind: "kyc" as const,
      detail: String(row.documentsStatus || "NONE"),
      amount: 0,
      at: "",
    }));
}

export function largeDeposits(
  rows: { id: string; amount?: number | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null; email?: string | null } | null }[],
  threshold: number,
): WatchHit[] {
  return rows
    .filter((row) => Math.abs(Number(row.amount) || 0) >= threshold)
    .map((row) => {
      const who = personId(row);
      return {
        id: `large:${row.id}`,
        userId: who.id,
        name: who.name,
        kind: "large" as const,
        detail: String(Math.abs(Number(row.amount) || 0)),
        amount: Math.abs(Number(row.amount) || 0),
        at: String(row.createdAt || ""),
      };
    });
}

export function rapidDeposits(
  rows: { id: string; amount?: number | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null; email?: string | null } | null }[],
  windowMs = 2 * DAY,
): WatchHit[] {
  const groups = new Map<string, { name: string; times: number[]; amount: number }>();
  for (const row of rows) {
    const who = personId(row);
    if (!who.id) continue;
    const time = new Date(String(row.createdAt || "")).getTime();
    if (!Number.isFinite(time)) continue;
    const current = groups.get(who.id) || { name: who.name, times: [], amount: 0 };
    current.times.push(time);
    current.amount += Math.abs(Number(row.amount) || 0);
    groups.set(who.id, current);
  }
  const hits: WatchHit[] = [];
  for (const [userId, group] of Array.from(groups.entries())) {
    const times = group.times.sort((a, b) => a - b);
    let close = false;
    for (let i = 1; i < times.length; i += 1) {
      if (times[i] - times[i - 1] <= windowMs) close = true;
    }
    if (times.length >= 2 && close) {
      hits.push({
        id: `rapid:${userId}`,
        userId,
        name: group.name,
        kind: "rapid",
        detail: String(times.length),
        amount: group.amount,
        at: new Date(times[times.length - 1]).toISOString(),
      });
    }
  }
  return hits;
}

export function manyWithdrawals(
  rows: { id: string; amount?: number | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null; email?: string | null } | null }[],
  minimum = 2,
): WatchHit[] {
  const groups = new Map<string, { name: string; count: number; amount: number; at: string }>();
  for (const row of rows) {
    const who = personId(row);
    if (!who.id) continue;
    const current = groups.get(who.id) || { name: who.name, count: 0, amount: 0, at: "" };
    current.count += 1;
    current.amount += Math.abs(Number(row.amount) || 0);
    if (String(row.createdAt || "") > current.at) current.at = String(row.createdAt || "");
    groups.set(who.id, current);
  }
  const hits: WatchHit[] = [];
  for (const [userId, group] of Array.from(groups.entries())) {
    if (group.count < minimum) continue;
    hits.push({
      id: `withdrawals:${userId}`,
      userId,
      name: group.name,
      kind: "withdrawals",
      detail: String(group.count),
      amount: group.amount,
      at: group.at,
    });
  }
  return hits;
}

export function dormantThenActive(
  users: { id: string; name?: string | null; email?: string | null; createdAt?: string | null }[],
  deposits: { createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null; amount?: number | null }[],
  now = Date.now(),
): WatchHit[] {
  const recent = new Map<string, { at: string; amount: number }>();
  for (const row of deposits) {
    const id = String(row.user?.id || row.userId || "");
    const time = new Date(String(row.createdAt || "")).getTime();
    if (!id || !Number.isFinite(time) || now - time > 7 * DAY) continue;
    const current = recent.get(id);
    if (!current || String(row.createdAt) > current.at) recent.set(id, { at: String(row.createdAt), amount: Math.abs(Number(row.amount) || 0) });
  }
  const hits: WatchHit[] = [];
  for (const user of users) {
    const created = new Date(String(user.createdAt || "")).getTime();
    const money = recent.get(user.id);
    if (!money || !Number.isFinite(created) || now - created < 30 * DAY) continue;
    hits.push({
      id: `dormant:${user.id}`,
      userId: user.id,
      name: String(user.name || user.email || user.id),
      kind: "dormant",
      detail: money.at.slice(0, 10),
      amount: money.amount,
      at: money.at,
    });
  }
  return hits;
}

export function visibleHits(hits: WatchHit[], hidden: string[], kind: "" | WatchKind, query: string): WatchHit[] {
  const text = query.trim().toLowerCase();
  return hits.filter((hit) => {
    if (hidden.includes(hit.id)) return false;
    if (kind && hit.kind !== kind) return false;
    if (!text) return true;
    return `${hit.name} ${hit.detail} ${hit.kind}`.toLowerCase().includes(text);
  });
}

export type ListView = { id: string; name: string; columns: string[]; dense: boolean };

export function toggleColumn(columns: string[], key: string, defaults: string[]): string[] {
  if (columns.includes(key)) {
    const next = columns.filter((item) => item !== key);
    return next.length ? next : defaults.slice(0, 1);
  }
  return [...columns, key];
}

export function applyView(view: ListView, defaults: string[]): { columns: string[]; dense: boolean } {
  const columns = view.columns.filter((item) => defaults.includes(item));
  return { columns: columns.length ? columns : defaults, dense: view.dense };
}
