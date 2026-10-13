/** Lead invalid reasons + automatic classification (affiliate stats). */
import { prisma } from "./prisma";

import { INVALID_REASONS, INVALID_CODES, isInvalidCode } from "./lead-invalid-reasons";
export { INVALID_REASONS, INVALID_CODES, isInvalidCode };

export type LeadRules = { whStart: string; whEnd: string; whDays: number[]; tz: string; countries: string[]; minAge: number; maxAge: number };
export const DEFAULT_LEAD_RULES: LeadRules = { whStart: "09:00", whEnd: "19:00", whDays: [1, 2, 3, 4, 5], tz: "Europe/Istanbul", countries: ["TR"], minAge: 21, maxAge: 65 };
export function parseLeadRules(raw: string | null | undefined): LeadRules {
  try {
    const j = raw ? JSON.parse(raw) : {};
    const hm = (v: unknown, d: string) => (typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : d);
    return {
      whStart: hm(j.whStart, DEFAULT_LEAD_RULES.whStart),
      whEnd: hm(j.whEnd, DEFAULT_LEAD_RULES.whEnd),
      whDays: Array.isArray(j.whDays) ? j.whDays.map(Number).filter((n: number) => n >= 0 && n <= 6) : DEFAULT_LEAD_RULES.whDays,
      tz: typeof j.tz === "string" && j.tz ? j.tz : DEFAULT_LEAD_RULES.tz,
      countries: Array.isArray(j.countries) ? j.countries.map((c: unknown) => String(c).trim().toUpperCase()).filter(Boolean) : DEFAULT_LEAD_RULES.countries,
      minAge: Number.isFinite(+j.minAge) && j.minAge != null ? +j.minAge : 21,
      maxAge: Number.isFinite(+j.maxAge) && j.maxAge != null ? +j.maxAge : 65,
    };
  } catch {
    return { ...DEFAULT_LEAD_RULES };
  }
}
export async function getLeadRules(): Promise<LeadRules> {
  const row = await prisma.systemSettings.findUnique({ where: { id: "default" }, select: { leadRulesJson: true } }).catch(() => null);
  return parseLeadRules(row?.leadRulesJson);
}

const COUNTRY_ALIASES: Record<string, string> = { TURKEY: "TR", TURKIYE: "TR", "TÜRKIYE": "TR", "TÜRKİYE": "TR", TURKIYA: "TR", "ТУРЦИЯ": "TR" };
const normCountry = (c: string | null | undefined) => {
  const s = String(c || "").trim().toUpperCase();
  return COUNTRY_ALIASES[s] || s;
};
export const normPhone = (p: string | null | undefined) => {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("5")) d = "90" + d; // TR mobile without prefix
  if (d.length === 11 && d.startsWith("05")) d = "9" + d;
  return d;
};
/** Basic E.164-style check (libphonenumber not bundled). TR numbers: 90 + 10 digits. */
export function phoneLooksInvalid(p: string | null | undefined): boolean {
  if (!String(p || "").trim()) return false; // unknown → don't judge
  const d = normPhone(p);
  if (d.length < 8 || d.length > 15) return true;
  if (/^(\d)\1+$/.test(d)) return true;
  if (d.startsWith("90") && d.length !== 12) return true;
  return false;
}
function inWorkingHours(at: Date, r: LeadRules) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: r.tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const g = (t: string) => parts.find((x) => x.type === t)?.value || "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
  const hm = `${g("hour").padStart(2, "0")}:${g("minute").padStart(2, "0")}`;
  return r.whDays.includes(day) && hm >= r.whStart && hm < r.whEnd;
}

/** Re-run auto classification for all TRADER leads. Never touches MANUAL reasons. */
export async function classifyLeads(opts: { onlyIds?: string[] } = {}) {
  const rules = await getLeadRules();
  const users = await prisma.user.findMany({
    where: { role: "TRADER", isTest: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, phone: true, country: true, birthDate: true, createdAt: true, leadInvalid: true, leadInvalidReason: true, leadInvalidSource: true },
  });
  const seenP = new Set<string>();
  const seenE = new Set<string>();
  const only = opts.onlyIds ? new Set(opts.onlyIds) : null;
  const byReason = new Map<string | null, string[]>();
  const now = Date.now();
  for (const u of users) {
    const p = normPhone(u.phone);
    const e = String(u.email || "").trim().toLowerCase();
    const isPlaceholderEmail = !e || /@(import|lead|noemail|7fx)\.local$/.test(e);
    let reason: string | null = null;
    if ((p.length >= 8 && seenP.has(p)) || (!isPlaceholderEmail && seenE.has(e))) reason = "INV_DUPLICATE";
    if (p.length >= 8) seenP.add(p);
    if (!isPlaceholderEmail) seenE.add(e);
    if (!reason && phoneLooksInvalid(u.phone)) reason = "INV_WRONG_NUMBER";
    const c = normCountry(u.country);
    if (!reason && c && rules.countries.length && !rules.countries.includes(c)) reason = "INV_WRONG_GEO";
    if (!reason && u.birthDate) {
      const age = (now - u.birthDate.getTime()) / (365.2425 * 86400000);
      if (age > 1 && (age < rules.minAge || age >= rules.maxAge + 1)) reason = "INV_UNDERAGE";
    }
    if (!reason && !inWorkingHours(u.createdAt, rules)) reason = "INV_NOT_IN_WH";
    if (only && !only.has(u.id)) continue;
    if (u.leadInvalidSource === "MANUAL") continue;
    // Legacy manual flag without reason: keep as is
    if (u.leadInvalid && !u.leadInvalidReason && u.leadInvalidSource !== "AUTO") continue;
    if ((u.leadInvalidReason || null) === reason) continue;
    const arr = byReason.get(reason) || [];
    arr.push(u.id);
    byReason.set(reason, arr);
  }
  let changed = 0;
  for (const [reason, ids] of Array.from(byReason.entries())) {
    for (let i = 0; i < ids.length; i += 1000) {
      const chunk = ids.slice(i, i + 1000);
      await prisma.user.updateMany({
        where: { id: { in: chunk }, NOT: { leadInvalidSource: "MANUAL" } },
        data: reason
          ? { leadInvalid: true, leadInvalidReason: reason, leadInvalidSource: "AUTO", leadInvalidAt: new Date() }
          : { leadInvalid: false, leadInvalidReason: null, leadInvalidSource: null, leadInvalidAt: null },
      });
      changed += chunk.length;
    }
  }
  return { scanned: users.length, changed };
}

let timer: ReturnType<typeof setTimeout> | null = null;
/** Debounced background run after lead creation / import. */
export function scheduleLeadClassify() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    classifyLeads().catch((e) => console.error("[lead-classify]", e));
  }, 4000);
}

/** Data patch for a manual reason change (null = clear → valid). */
export function manualReasonData(reason: string | null) {
  return reason
    ? { leadInvalid: true, leadInvalidReason: reason, leadInvalidSource: "MANUAL", leadInvalidAt: new Date() }
    : { leadInvalid: false, leadInvalidReason: null, leadInvalidSource: "MANUAL", leadInvalidAt: null };
}
