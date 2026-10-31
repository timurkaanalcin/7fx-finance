/** Pure helpers for CRM v4 round 16. Stages and follow-ups stay in the browser. */

export const LEAD_STAGES = ["inbox", "contacted", "qualified", "proposal", "won", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

const SALE_STAGE: Record<string, LeadStage> = {
  NEW: "inbox",
  NO_ANSWER: "inbox",
  CALLBACK: "contacted",
  CONTACTED: "contacted",
  INTERESTED: "qualified",
  DEPOSITED: "proposal",
  RETENTION: "proposal",
  CONVERTED: "won",
  LOST: "lost",
  NOT_INTERESTED: "lost",
  DO_NOT_CALL: "lost",
};

export type LeadCard = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  saleStatus?: string | null;
  balance?: number | null;
  currency?: string | null;
};

export function stageFor(row: LeadCard, saved: Record<string, string>): LeadStage {
  const picked = saved[row.id];
  if (picked && (LEAD_STAGES as readonly string[]).includes(picked)) return picked as LeadStage;
  return SALE_STAGE[String(row.saleStatus || "").toUpperCase()] || "inbox";
}

export function stageCounts(rows: LeadCard[], saved: Record<string, string>): Record<LeadStage, number> {
  const out = { inbox: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 };
  for (const row of rows) out[stageFor(row, saved)] += 1;
  return out;
}

export function inStage(rows: LeadCard[], saved: Record<string, string>, stage: LeadStage): LeadCard[] {
  return rows.filter((row) => stageFor(row, saved) === stage);
}

export function daysInStage(iso: string | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round((now - time) / 86400000));
}

export function followTone(date: string | undefined, today: string): "" | "today" | "late" {
  if (!date) return "";
  if (date === today) return "today";
  if (date < today) return "late";
  return "";
}

export function followCounts(dates: Record<string, string>, ids: string[], today: string): { today: number; late: number } {
  let due = 0;
  let late = 0;
  for (const id of ids) {
    const tone = followTone(dates[id], today);
    if (tone === "today") due += 1;
    if (tone === "late") late += 1;
  }
  return { today: due, late };
}

export function winShare(rows: LeadCard[], saved: Record<string, string>): number | null {
  let won = 0;
  let lost = 0;
  for (const row of rows) {
    const stage = stageFor(row, saved);
    if (stage === "won") won += 1;
    if (stage === "lost") lost += 1;
  }
  if (won + lost === 0) return null;
  return Math.round((won / (won + lost)) * 100);
}

export function valueByCurrency(rows: LeadCard[]): { currency: string; total: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const currency = String(row.currency || "USD");
    map.set(currency, (map.get(currency) || 0) + (Number(row.balance) || 0));
  }
  return Array.from(map.entries()).map(([currency, total]) => ({ currency, total: Math.round(total) }));
}

export function stuckIds(rows: LeadCard[], saved: Record<string, string>, movedAt: Record<string, string>, now = Date.now()): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    const stage = stageFor(row, saved);
    if (stage !== "contacted" && stage !== "qualified") continue;
    const days = daysInStage(movedAt[row.id], now);
    if (days != null && days >= 7) ids.push(row.id);
  }
  return ids;
}

export function boardQuery(rows: LeadCard[], query: string): LeadCard[] {
  const text = query.trim().toLowerCase();
  if (!text) return rows;
  return rows.filter((row) => `${row.name || ""} ${row.email || ""} ${row.country || ""}`.toLowerCase().includes(text));
}

export function countryMix(rows: { country?: string | null }[]): { country: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const country = String(row.country || "—");
    map.set(country, (map.get(country) || 0) + 1);
  }
  return Array.from(map.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count);
}

export function invertIds(all: string[], selected: string[]): string[] {
  const on = new Set(selected);
  return all.filter((id) => !on.has(id));
}

export function idsInStage(rows: LeadCard[], saved: Record<string, string>, stage: LeadStage): string[] {
  return inStage(rows, saved, stage).map((row) => row.id);
}
