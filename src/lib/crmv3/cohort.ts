/** Pure helpers for CRM v3 onboarding and staff preferences. Display and browser storage only. */

export type OnboardKey = "registered" | "kyc" | "firstDeposit" | "firstTrade" | "secondDeposit";

export type OnboardStep = { key: OnboardKey; done: boolean; at: string };

export function onboardSteps(input: {
  createdAt?: string | null;
  documentsStatus?: string | null;
  deposits: { createdAt?: string | null }[];
  trades: { openedAt?: string | null }[];
}): OnboardStep[] {
  const deposits = [...input.deposits].map((row) => String(row.createdAt || "")).filter(Boolean).sort();
  const trades = [...input.trades].map((row) => String(row.openedAt || "")).filter(Boolean).sort();
  const kyc = String(input.documentsStatus || "").toUpperCase() === "APPROVED";
  return [
    { key: "registered", done: Boolean(input.createdAt), at: String(input.createdAt || "") },
    { key: "kyc", done: kyc, at: "" },
    { key: "firstDeposit", done: deposits.length > 0, at: deposits[0] || "" },
    { key: "firstTrade", done: trades.length > 0, at: trades[0] || "" },
    { key: "secondDeposit", done: deposits.length > 1, at: deposits[1] || "" },
  ];
}

export function gaps(steps: OnboardStep[]): { from: OnboardKey; to: OnboardKey; days: number | null }[] {
  const out: { from: OnboardKey; to: OnboardKey; days: number | null }[] = [];
  for (let i = 1; i < steps.length; i += 1) {
    const prev = steps[i - 1];
    const next = steps[i];
    const a = new Date(prev.at).getTime();
    const b = new Date(next.at).getTime();
    const days = Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, Math.round((b - a) / 86400000)) : null;
    out.push({ from: prev.key, to: next.key, days });
  }
  return out;
}

export function weekKey(value?: string | null): string {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "";
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export type CohortPerson = { week: string; kyc: boolean; ftd: boolean; traded: boolean; second: boolean };

export function cohortOf(rows: CohortPerson[]): { week: string; registered: number; kyc: number; ftd: number; traded: number; second: number }[] {
  const map = new Map<string, { week: string; registered: number; kyc: number; ftd: number; traded: number; second: number }>();
  for (const row of rows) {
    if (!row.week) continue;
    const current = map.get(row.week) || { week: row.week, registered: 0, kyc: 0, ftd: 0, traded: 0, second: 0 };
    current.registered += 1;
    if (row.kyc) current.kyc += 1;
    if (row.ftd) current.ftd += 1;
    if (row.traded) current.traded += 1;
    if (row.second) current.second += 1;
    map.set(row.week, current);
  }
  return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week));
}

export type StaffPrefs = { displayName: string; defaultTab: string; filters: string; start: string; end: string };

export function filterQuery(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const params = new URLSearchParams(text.trim().replace(/^\?/, ""));
  params.forEach((value, key) => {
    if (key && value) out[key] = value;
  });
  return out;
}
