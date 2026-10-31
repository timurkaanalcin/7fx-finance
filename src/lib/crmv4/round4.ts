/** Pure helpers for CRM v4 round 4. Display math only. */

export type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  balance?: number;
  createdAt?: string | null;
  lastSeenAt?: string | null;
  lastLoginAt?: string | null;
  documentsStatus?: string | null;
  ftd?: boolean;
  saleStatus?: string | null;
  retentionStatus?: string | null;
  retentionFollowUpAt?: string | null;
  assigneeName?: string | null;
  kycAt?: string | null;
};

export type MoneyLine = { amount?: number; type?: string; createdAt?: string | null; method?: string | null };

const DAY = 24 * 60 * 60 * 1000;

export function lifetimeValue(rows: MoneyLine[]): { net: number; points: number[] } {
  const sorted = [...rows].sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  const points: number[] = [];
  let net = 0;
  for (const row of sorted) {
    const amount = Number(row.amount) || 0;
    const type = String(row.type || "").toUpperCase();
    if (type.includes("WITHDRAW")) net -= Math.abs(amount);
    else if (type.includes("DEPOSIT")) net += Math.abs(amount);
    else net += amount;
    points.push(Math.round(net * 100) / 100);
  }
  return { net: Math.round(net * 100) / 100, points };
}

export function sparkPath(points: number[], width = 120, height = 32): string {
  if (!points.length) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points.map((value, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 4) - 2;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

export function countryHeat(rows: { country?: string | null }[]): { country: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const country = String(row.country || "—").trim() || "—";
    map.set(country, (map.get(country) || 0) + 1);
  }
  return Array.from(map.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count);
}

export function hourHeat(stamps: (string | null | undefined)[]): number[] {
  const buckets = Array.from({ length: 24 }, () => 0);
  for (const stamp of stamps) {
    if (!stamp) continue;
    const date = new Date(stamp);
    if (Number.isNaN(date.getTime())) continue;
    buckets[date.getUTCHours()] += 1;
  }
  return buckets;
}

export function workloadOf(rows: { assigneeName?: string | null }[]): { name: string; count: number; share: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = row.assigneeName || "—";
    map.set(name, (map.get(name) || 0) + 1);
  }
  const total = rows.length || 1;
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count, share: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

function stampOf(row: Person): number {
  const raw = row.lastSeenAt || row.lastLoginAt || "";
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

export function smartSplit(rows: Person[], now = Date.now()): { inactive: Person[]; richIdle: Person[]; kycStale: Person[] } {
  const inactive: Person[] = [];
  const richIdle: Person[] = [];
  const kycStale: Person[] = [];
  for (const row of rows) {
    const seen = stampOf(row);
    if (!seen || now - seen > 30 * DAY) inactive.push(row);
    const balance = Number(row.balance) || 0;
    if (balance >= 1000 && !row.ftd) richIdle.push(row);
    const created = row.createdAt ? new Date(row.createdAt).getTime() : 0;
    const pending = ["PENDING", "REVIEW", "MISSING"].includes(String(row.documentsStatus || "").toUpperCase());
    if (pending && created && now - created > 3 * DAY) kycStale.push(row);
  }
  return { inactive, richIdle, kycStale };
}

export type NextKind = "call" | "kyc" | "retain" | "wait";

export function nextAction(row: Person, now = Date.now()): NextKind {
  const docs = String(row.documentsStatus || "").toUpperCase();
  if (["PENDING", "REVIEW", "MISSING"].includes(docs)) return "kyc";
  const follow = row.retentionFollowUpAt ? new Date(row.retentionFollowUpAt).getTime() : 0;
  if (follow && follow <= now) return "call";
  const sale = String(row.saleStatus || "").toUpperCase();
  if (sale === "NEW" || sale === "NO_ANSWER" || sale === "CALLBACK") return "call";
  if (String(row.retentionStatus || "").toUpperCase() === "AT_RISK") return "retain";
  return "wait";
}

export function mergeSuggestions(rows: Person[]): { key: string; ids: string[] }[] {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const key = String(row.name || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (key.length < 3) continue;
    map.set(key, [...(map.get(key) || []), row.id]);
  }
  return Array.from(map.entries()).filter(([, ids]) => ids.length > 1).map(([key, ids]) => ({ key, ids }));
}

export function methodMix(rows: MoneyLine[]): { method: string; count: number; amount: number }[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const method = String(row.method || "—") || "—";
    const cell = map.get(method) || { count: 0, amount: 0 };
    cell.count += 1;
    cell.amount += Math.abs(Number(row.amount) || 0);
    map.set(method, cell);
  }
  return Array.from(map.entries()).map(([method, cell]) => ({ method, ...cell })).sort((a, b) => b.amount - a.amount);
}

export function withdrawalFlags(row: { createdAt?: string | null; kycAt?: string | null }, now = Date.now()): ("new" | "kyc")[] {
  const flags: ("new" | "kyc")[] = [];
  const created = row.createdAt ? new Date(row.createdAt).getTime() : 0;
  if (created && now - created < 7 * DAY) flags.push("new");
  const kyc = row.kycAt ? new Date(row.kycAt).getTime() : 0;
  if (kyc && now - kyc < 3 * DAY) flags.push("kyc");
  return flags;
}

export function rowStep(index: number, length: number, key: "j" | "k"): number {
  if (length <= 0) return 0;
  if (key === "j") return Math.min(length - 1, index + 1);
  return Math.max(0, index - 1);
}

export const ACCENTS = ["champagne", "ivory", "graphite"] as const;
export type Accent = (typeof ACCENTS)[number];

export function accentOf(value: string | null | undefined): Accent {
  if (value === "ivory" || value === "graphite" || value === "champagne") return value;
  return "champagne";
}
