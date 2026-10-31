/** Pure helpers for CRM v4 round 5. Display math and local lists. */

const DAY = 24 * 60 * 60 * 1000;

export type JourneyStep = { key: "signup" | "kyc" | "ftd" | "trades" | "cashout"; done: boolean };

export function journeyOf(row: { createdAt?: string | null; documentsStatus?: string | null; ftd?: boolean; trades?: number; withdrawals?: number }): JourneyStep[] {
  return [
    { key: "signup", done: Boolean(row.createdAt) },
    { key: "kyc", done: String(row.documentsStatus || "").toUpperCase() === "APPROVED" },
    { key: "ftd", done: Boolean(row.ftd) },
    { key: "trades", done: (Number(row.trades) || 0) > 0 },
    { key: "cashout", done: (Number(row.withdrawals) || 0) > 0 },
  ];
}

export function forecast(points: number[], ahead = 3): number[] {
  if (!points.length || ahead <= 0) return [];
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += i;
    sumY += points[i];
    sumXY += i * points[i];
    sumXX += i * i;
  }
  const den = n * sumXX - sumX * sumX || 1;
  const slope = (n * sumXY - sumX * sumY) / den;
  const intercept = (sumY - slope * sumX) / n;
  const next: number[] = [];
  for (let k = 0; k < ahead; k += 1) next.push(Math.round((intercept + slope * (n + k)) * 100) / 100);
  return next;
}

export type Segment = "vip" | "regular" | "dormant";

export function segmentOf(row: { balance?: number; lastSeenAt?: string | null; lastLoginAt?: string | null }, rules: { vipBalance: number; dormantDays: number }, now = Date.now()): Segment {
  if ((Number(row.balance) || 0) >= rules.vipBalance) return "vip";
  const seen = row.lastSeenAt || row.lastLoginAt;
  const at = seen ? new Date(seen).getTime() : 0;
  if (!at || now - at > rules.dormantDays * DAY) return "dormant";
  return "regular";
}

export function winLoss(rows: { profit?: number }[]): { wins: number; losses: number; ratio: number } {
  let wins = 0;
  let losses = 0;
  for (const row of rows) {
    const profit = Number(row.profit) || 0;
    if (profit > 0) wins += 1;
    else if (profit < 0) losses += 1;
  }
  const ratio = wins + losses ? Math.round((wins / (wins + losses)) * 100) : 0;
  return { wins, losses, ratio };
}

export function symbolPopularity(rows: { symbol?: string }[]): { symbol: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const symbol = row.symbol || "—";
    map.set(symbol, (map.get(symbol) || 0) + 1);
  }
  return Array.from(map.entries()).map(([symbol, count]) => ({ symbol, count })).sort((a, b) => b.count - a.count);
}

export function upcomingBirthdays(rows: { id: string; name?: string | null; birthDate?: string | null }[], now = new Date(), within = 7): { id: string; name: string; inDays: number }[] {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const found: { id: string; name: string; inDays: number }[] = [];
  for (const row of rows) {
    if (!row.birthDate) continue;
    const born = new Date(row.birthDate);
    if (Number.isNaN(born.getTime())) continue;
    let next = Date.UTC(now.getUTCFullYear(), born.getUTCMonth(), born.getUTCDate());
    if (next < start) next = Date.UTC(now.getUTCFullYear() + 1, born.getUTCMonth(), born.getUTCDate());
    const inDays = Math.round((next - start) / DAY);
    if (inDays <= within) found.push({ id: row.id, name: row.name || row.id, inDays });
  }
  return found.sort((a, b) => a.inDays - b.inDays);
}

export function mentionParts(body: string): { text: string; mention: boolean }[] {
  return body.split(/(@[A-Za-z0-9_.-]+)/g).filter(Boolean).map((text) => ({ text, mention: text.startsWith("@") }));
}

export function copyLine(fields: (string | number | null | undefined)[]): string {
  return fields.map((field) => String(field ?? "")).filter(Boolean).join(" · ");
}

export function goalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export function pushCapped<T>(list: T[], item: T, max = 8): T[] {
  return [item, ...list.filter((row) => row !== item)].slice(0, max);
}

export function moneyTone(value: number, high: number, low: number): "high" | "low" | "" {
  if (high > 0 && value >= high) return "high";
  if (value <= low) return "low";
  return "";
}
