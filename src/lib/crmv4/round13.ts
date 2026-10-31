/** Pure helpers for CRM v4 round 13. Display only. No send. */

export type LeadRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  campaign?: string | null;
  country?: string | null;
  saleStatus?: string | null;
  ftd?: boolean;
  balance?: number | null;
  createdAt?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  referralCodeUsed?: string | null;
  retentionFollowUpAt?: string | null;
};

export type CampaignStat = { campaign: string; leads: number; ftd: number; balance: number };

export function campaignStats(rows: LeadRow[]): CampaignStat[] {
  const map = new Map<string, CampaignStat>();
  for (const row of rows) {
    const campaign = String(row.campaign || "—");
    const current = map.get(campaign) || { campaign, leads: 0, ftd: 0, balance: 0 };
    current.leads += 1;
    if (row.ftd) current.ftd += 1;
    current.balance += Number(row.balance) || 0;
    map.set(campaign, current);
  }
  return Array.from(map.values()).sort((a, b) => b.leads - a.leads);
}

export function sourceTrend(rows: LeadRow[]): { day: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const day = String(row.createdAt || "").slice(0, 10);
    if (day.length < 10) continue;
    map.set(day, (map.get(day) || 0) + 1);
  }
  return Array.from(map.entries()).map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day));
}

export function landingBreakdown(rows: LeadRow[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const label = String(row.affiliateA || row.affiliateB || row.referralCodeUsed || "").trim();
    if (!label) continue;
    map.set(label, (map.get(label) || 0) + 1);
  }
  return Array.from(map.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export function cpl(spend: number, leads: number): number | null {
  if (!(spend > 0) || !(leads > 0)) return null;
  return Math.round((spend / leads) * 100) / 100;
}

export function cpa(spend: number, ftd: number): number | null {
  if (!(spend > 0) || !(ftd > 0)) return null;
  return Math.round((spend / ftd) * 100) / 100;
}

export function pacing(spend: number, budget: number): number | null {
  if (!(budget > 0)) return null;
  return Math.round((spend / budget) * 100);
}

export function funnelOf(rows: LeadRow[], campaign: string): { status: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (campaign && String(row.campaign || "—") !== campaign) continue;
    const status = String(row.saleStatus || "—");
    map.set(status, (map.get(status) || 0) + 1);
  }
  return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
}

export function cohortOf(rows: LeadRow[], campaign: string): { month: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (String(row.campaign || "—") !== campaign) continue;
    const month = String(row.createdAt || "").slice(0, 7);
    if (month.length < 7) continue;
    map.set(month, (map.get(month) || 0) + 1);
  }
  return Array.from(map.entries()).map(([month, count]) => ({ month, count }));
}

export type SegmentRule = { name: string; field: "country" | "campaign" | "sale" | "ftd"; value: string };

export function segmentHit(row: LeadRow, rule: SegmentRule): boolean {
  const value = rule.value.trim().toLowerCase();
  if (!value) return false;
  if (rule.field === "ftd") return String(Boolean(row.ftd)) === value;
  const bag: Record<string, string> = {
    country: String(row.country || ""),
    campaign: String(row.campaign || ""),
    sale: String(row.saleStatus || ""),
  };
  return bag[rule.field].toLowerCase().includes(value);
}

export function heatDays(rows: LeadRow[]): number[] {
  const days = [0, 0, 0, 0, 0, 0, 0];
  for (const row of rows) {
    if (!row.retentionFollowUpAt) continue;
    const date = new Date(row.retentionFollowUpAt);
    if (Number.isNaN(date.getTime())) continue;
    days[date.getUTCDay()] += 1;
  }
  return days;
}

export function anniversaries(rows: LeadRow[], now = new Date()): LeadRow[] {
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  return rows.filter((row) => {
    if (!row.createdAt) return false;
    const created = new Date(row.createdAt);
    if (Number.isNaN(created.getTime())) return false;
    return created.getUTCMonth() === month && created.getUTCDate() === day;
  });
}

export function smsParts(text: string): { length: number; parts: number } {
  const length = text.length;
  const parts = length === 0 ? 0 : Math.ceil(length / 160);
  return { length, parts };
}

export function rankAffiliates<T extends { name?: string; leads?: number; deposits?: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (Number(b.deposits) || 0) - (Number(a.deposits) || 0) || (Number(b.leads) || 0) - (Number(a.leads) || 0));
}
