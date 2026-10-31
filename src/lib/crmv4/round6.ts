/** Pure helpers for CRM v4 round 6. Display math only. */

export function riskScore(row: { active?: boolean; documentsStatus?: string | null; balance?: number; equity?: number | null; ftd?: boolean }): number {
  let score = 15;
  if (row.active === false) score += 30;
  const docs = String(row.documentsStatus || "NONE").toUpperCase();
  if (docs !== "APPROVED") score += 20;
  const balance = Number(row.balance) || 0;
  const equity = row.equity == null ? balance : Number(row.equity) || 0;
  if (balance > 0 && equity / balance < 0.9) score += 25;
  if (!row.ftd && balance >= 1000) score += 10;
  return Math.max(0, Math.min(100, score));
}

export function equityCurve(rows: { amount?: number; balanceAfter?: number | null; createdAt?: string | null }[]): number[] {
  const sorted = [...rows].sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  const points: number[] = [];
  let running = 0;
  for (const row of sorted) {
    if (row.balanceAfter != null && Number.isFinite(Number(row.balanceAfter))) running = Number(row.balanceAfter);
    else running += Number(row.amount) || 0;
    points.push(Math.round(running * 100) / 100);
  }
  return points;
}

export function depositStreak(dates: (string | null | undefined)[], now = new Date()): number {
  const days = new Set(dates.filter(Boolean).map((value) => String(value).slice(0, 10)));
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let streak = 0;
  while (streak < 60) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function redepositDue<T extends { id: string; ftd?: boolean; lastDepositAt?: string | null }>(rows: T[], now = Date.now(), quietDays = 14): T[] {
  return rows.filter((row) => {
    if (!row.ftd || !row.lastDepositAt) return false;
    const at = new Date(row.lastDepositAt).getTime();
    return Number.isFinite(at) && now - at > quietDays * 86400000;
  });
}

export function slaHeat(opened: (string | null | undefined)[], now = new Date()): number[] {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (const value of opened) {
    if (!value) continue;
    const at = new Date(value).getTime();
    if (!Number.isFinite(at)) continue;
    const day = Math.floor((start - Date.UTC(new Date(value).getUTCFullYear(), new Date(value).getUTCMonth(), new Date(value).getUTCDate())) / 86400000);
    if (day >= 0 && day < 7) buckets[6 - day] += 1;
  }
  return buckets;
}

export function categorize(text: string, rules: { word: string; label: string }[]): string {
  const blob = text.toLowerCase();
  const hit = rules.find((rule) => rule.word && blob.includes(rule.word.toLowerCase()));
  return hit ? hit.label : "";
}

export function flagEmoji(country?: string | null): string {
  const code = String(country || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1));
}

export function formatPhone(phone?: string | null, country?: string | null): string {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  if (String(country || "").toUpperCase() === "TR" && digits.length >= 10) {
    const local = digits.slice(-10);
    return `+90 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  const body = digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  return raw.startsWith("+") ? `+${body}` : body;
}

export function domainGroups(rows: { email?: string | null }[]): { domain: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const domain = String(row.email || "").split("@")[1]?.toLowerCase();
    if (!domain) continue;
    map.set(domain, (map.get(domain) || 0) + 1);
  }
  return Array.from(map.entries()).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count);
}

export type Aging = "fresh" | "week" | "month" | "old";

export function agingBucket(createdAt?: string | null, now = Date.now()): Aging {
  const at = createdAt ? new Date(createdAt).getTime() : 0;
  if (!at) return "old";
  const days = (now - at) / 86400000;
  if (days <= 7) return "fresh";
  if (days <= 30) return "week";
  if (days <= 90) return "month";
  return "old";
}

export function conversionDays(signup?: string | null, ftdAt?: string | null): number | null {
  if (!signup || !ftdAt) return null;
  const start = new Date(signup).getTime();
  const end = new Date(ftdAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.round((end - start) / 86400000);
}

export function topDepositors<T extends { id: string; balance?: number }>(rows: T[], limit = 5): T[] {
  return [...rows].sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0)).slice(0, limit);
}

export function columnTotal(values: (number | null | undefined)[]): number {
  const total = values.reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
  return Math.round(total * 100) / 100;
}

export function formatAmount(value: number, decimals: number): string {
  const places = decimals === 0 ? 0 : 2;
  return value.toFixed(places);
}

export function shareQuery(params: Record<string, string>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function expirySoon(expiresAt?: string | null, now = Date.now(), withinDays = 30): "expired" | "soon" | "" {
  if (!expiresAt) return "";
  const at = new Date(expiresAt).getTime();
  if (!Number.isFinite(at)) return "";
  if (at < now) return "expired";
  if (at - now < withinDays * 86400000) return "soon";
  return "";
}
