/** Pure helpers for CRM v4 round 10. */

export function anomalyRows(rows: { actor?: string; ip?: string; at?: string }[]): { actor: string; ips: string[] }[] {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const actor = row.actor || "—";
    const ip = row.ip || "";
    if (!ip) continue;
    const set = map.get(actor) || new Set<string>();
    set.add(ip);
    map.set(actor, set);
  }
  return Array.from(map.entries())
    .map(([actor, ips]) => ({ actor, ips: Array.from(ips) }))
    .filter((row) => row.ips.length > 1);
}

export type ScoreRule = { field: "balance" | "ftd" | "country" | "sale"; op: "gte" | "eq"; value: string; points: number };

export function leadScore(row: { balance?: number; ftd?: boolean; country?: string | null; saleStatus?: string | null }, rules: ScoreRule[]): number {
  let score = 0;
  for (const rule of rules) {
    const points = Number(rule.points) || 0;
    if (rule.field === "balance" && rule.op === "gte" && (Number(row.balance) || 0) >= Number(rule.value || 0)) score += points;
    if (rule.field === "ftd" && String(row.ftd) === rule.value) score += points;
    if (rule.field === "country" && String(row.country || "") === rule.value) score += points;
    if (rule.field === "sale" && String(row.saleStatus || "") === rule.value) score += points;
  }
  return score;
}

export function bestCallHours(offsetHours: number): string {
  const open = (10 - offsetHours + 24) % 24;
  const close = (18 - offsetHours + 24) % 24;
  const fmt = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
  return `${fmt(open)}–${fmt(close)} UTC`;
}

export function offsetFor(zone: string, now = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    return hour - now.getUTCHours();
  } catch {
    return 0;
  }
}

export function roiOf(value: number, cost: number): number | null {
  if (cost <= 0) return null;
  return Math.round(((value - cost) / cost) * 100);
}

export function payoutOf(amount: number, ratePct: number): number {
  if (ratePct <= 0) return 0;
  return Math.round(amount * (ratePct / 100) * 100) / 100;
}

export function toIcs(rows: { id: string; body?: string; remindAt?: string }[]): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//7FX//CRM//EN"];
  for (const row of rows) {
    if (!row.remindAt) continue;
    const stamp = row.remindAt.replace(/[-:]/g, "").replace(/\.\d+/, "").replace("Z", "") ;
    const compact = stamp.length >= 15 ? stamp.slice(0, 15) + "Z" : stamp;
    lines.push("BEGIN:VEVENT", `UID:${row.id}@7fx`, `DTSTAMP:${compact}`, `DTSTART:${compact}`, `SUMMARY:${(row.body || "Reminder").replace(/\n/g, " ")}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function snoozeAt(from = new Date()): string {
  return new Date(from.getTime() + 60 * 60 * 1000).toISOString();
}
