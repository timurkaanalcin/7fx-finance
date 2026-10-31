/** Pure helpers for CRM v4 round 1. No schema and no ledger changes. */

export type Health = "healthy" | "watch" | "risk" | "review";

export type HealthInput = {
  active?: boolean;
  ftd?: boolean;
  balance?: number;
  account?: { balance?: number } | null;
  documentsStatus?: string | null;
  validationStatus?: string | null;
};

export function healthOf(row: HealthInput): Health {
  if (row.active === false) return "risk";
  const docs = String(row.documentsStatus || "").toUpperCase();
  const validation = String(row.validationStatus || "").toUpperCase();
  if (docs === "PENDING" || validation === "PENDING") return "review";
  const balance = Number(row.balance ?? row.account?.balance ?? 0);
  if (!row.ftd && !(balance > 0)) return "watch";
  return "healthy";
}

export type RuleOp = "contains" | "eq" | "gt" | "lt";

export type FilterRule = {
  id: string;
  field: "name" | "email" | "country" | "desk" | "balance" | "sale" | "tag" | "health";
  op: RuleOp;
  value: string;
};

export function applyRules<T extends HealthInput & {
  name?: string | null;
  email?: string | null;
  country?: string | null;
  desk?: string | null;
  saleStatus?: string | null;
  id: string;
}>(rows: T[], rules: FilterRule[], tags: Record<string, string[]>): T[] {
  const live = rules.filter((rule) => rule.value.trim());
  if (!live.length) return rows;
  return rows.filter((row) => live.every((rule) => matchRule(row, rule, tags[row.id] || [])));
}

function matchRule(row: HealthInput & {
  name?: string | null;
  email?: string | null;
  country?: string | null;
  desk?: string | null;
  saleStatus?: string | null;
  id: string;
}, rule: FilterRule, tags: string[]): boolean {
  const needle = rule.value.trim().toLowerCase();
  const raw = fieldValue(row, rule.field, tags);
  if (rule.op === "gt" || rule.op === "lt") {
    const left = Number(raw);
    const right = Number(rule.value);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
    return rule.op === "gt" ? left > right : left < right;
  }
  const text = String(raw).toLowerCase();
  if (rule.op === "eq") return text === needle;
  return text.includes(needle);
}

function fieldValue(row: HealthInput & {
  name?: string | null;
  email?: string | null;
  country?: string | null;
  desk?: string | null;
  saleStatus?: string | null;
}, field: FilterRule["field"], tags: string[]): string {
  if (field === "name") return String(row.name || "");
  if (field === "email") return String(row.email || "");
  if (field === "country") return String(row.country || "");
  if (field === "desk") return String(row.desk || "");
  if (field === "sale") return String(row.saleStatus || "");
  if (field === "tag") return tags.join(" ");
  if (field === "health") return healthOf(row);
  return String(row.balance ?? row.account?.balance ?? "");
}

export function duplicateEmails(rows: { email?: string | null }[]): Set<string> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const email = String(row.email || "").trim().toLowerCase();
    if (!email) continue;
    counts.set(email, (counts.get(email) || 0) + 1);
  }
  return new Set(Array.from(counts.entries()).filter((entry) => entry[1] > 1).map((entry) => entry[0]));
}

export function moveItem<T>(list: T[], item: T, dir: -1 | 1): T[] {
  const index = list.indexOf(item);
  const next = index + dir;
  if (index < 0 || next < 0 || next >= list.length) return list;
  const copy = list.slice();
  const [picked] = copy.splice(index, 1);
  copy.splice(next, 0, picked);
  return copy;
}

export function slaHours(openedAt?: string | null): number {
  if (!openedAt) return 0;
  const time = new Date(openedAt).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, (Date.now() - time) / 36e5);
}

export function formatAge(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function relativeFrom(value: string | null | undefined, now = Date.now()): string {
  if (!value) return "—";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "—";
  const delta = Math.round((now - time) / 1000);
  const abs = Math.abs(delta);
  const sign = delta >= 0 ? "" : "-";
  if (abs < 60) return `${sign}${abs}s`;
  if (abs < 3600) return `${sign}${Math.round(abs / 60)}m`;
  if (abs < 86400) return `${sign}${Math.round(abs / 3600)}h`;
  return `${sign}${Math.round(abs / 86400)}d`;
}

export function conversionRate(ftd: number, traders: number): string {
  if (!traders) return "—";
  return `${Math.round((ftd / traders) * 100)}%`;
}
