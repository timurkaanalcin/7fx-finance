/** Lead pipeline and local desk quiet prefs. Stage changes wait for confirm. */

export const WATCH_KEY = "crmv3-lead-watch";
export const MUTE_KEY = "crmv3-alert-mute";
export const FOCUS_FLAG = "crmv3-focus-flag";
export const QUIET_KEY = "crmv3-quiet-hours";

export const ALERT_KINDS = ["info", "chat", "handoff", "ticket", "payout"] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export type LeadRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  saleStatus?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
  campaign?: string | null;
  currency?: string | null;
};

export function affiliateOf(row: LeadRow): string {
  return String(row.affiliateA || row.affiliateB || row.affiliateC || row.campaign || "").trim();
}

export function stageOf(row: { saleStatus?: string | null }): string {
  return String(row.saleStatus || "").trim();
}

export function currencyOf(row: { currency?: string | null }): string {
  return String(row.currency || "").trim().toUpperCase();
}

export function stagesOn(rows: readonly LeadRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const stage = stageOf(row);
    if (stage && !out.includes(stage)) out.push(stage);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function filterLeads(rows: readonly LeadRow[], stage: string, query: string): LeadRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (stage === "none" && stageOf(row)) return false;
    if (stage && stage !== "none" && stageOf(row) !== stage) return false;
    if (!text) return true;
    return `${row.name || ""} ${row.email || ""} ${affiliateOf(row)} ${stageOf(row)}`.toLowerCase().includes(text);
  });
}

export function sortLeads<T extends { id: string; name?: string | null }>(rows: readonly T[], watch: readonly string[]): T[] {
  return rows.slice().sort((a, b) => {
    const aw = watch.includes(a.id);
    const bw = watch.includes(b.id);
    if (aw !== bw) return aw ? -1 : 1;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function toggleId(ids: readonly string[], id: string): string[] {
  if (!id) return ids.slice();
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function readIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 200);
}

/** Existing customer call. A blank stage is not sent. */
export function stageBody(stage: string): { saleStatus: string } | null {
  const next = stage.trim();
  if (!next) return null;
  return { saleStatus: next };
}

export function readMute(raw: unknown): string[] {
  return readIds(raw).filter((id) => (ALERT_KINDS as readonly string[]).includes(id));
}

export function toggleMute(muted: readonly string[], kind: string): string[] {
  if (!(ALERT_KINDS as readonly string[]).includes(kind)) return muted.slice();
  return toggleId(muted, kind);
}

export function readFocusFlag(raw: unknown): boolean {
  return raw === true || raw === "1";
}

export function readQuiet(raw: unknown): { start: string; end: string } {
  if (!raw || typeof raw !== "object") return { start: "", end: "" };
  const row = raw as { start?: unknown; end?: unknown };
  return { start: clock(row.start), end: clock(row.end) };
}

export function clock(raw: unknown): string {
  const text = String(raw || "").trim();
  return minutes(text) == null ? "" : text;
}

export function minutes(hhmm: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function nowMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Same start and end means the window is off. A later start crosses midnight. */
export function inQuiet(nowMin: number, start: string, end: string): boolean {
  const from = minutes(start);
  const to = minutes(end);
  if (from == null || to == null || from === to) return false;
  if (from < to) return nowMin >= from && nowMin < to;
  return nowMin >= from || nowMin < to;
}

export function shouldAlert(input: { kind: string; muted: readonly string[]; focus: boolean; start: string; end: string; nowMin: number }): boolean {
  if (input.focus) return false;
  if (input.muted.includes(input.kind)) return false;
  if (inQuiet(input.nowMin, input.start, input.end)) return false;
  return true;
}
