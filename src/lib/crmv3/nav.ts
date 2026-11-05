/** CRM v3 section groups. The rail fold is stored in the browser. */

export const RAIL_KEY = "crmv3-rail-fold";

export const NAV_SECTIONS = [
  { id: "work", ids: ["overview", "customers", "dense", "notices", "tags", "blotter", "pad", "cases", "shortcuts", "leads", "triage", "positions", "support", "agenda", "day", "inbox", "thread", "marketing", "health", "rejects", "heatmap", "compare", "stale", "dupes", "referrals", "vip", "week", "lane", "riskwatch", "snooze", "sideglance"] },
  { id: "money", ids: ["finance", "deposit", "funding", "withdraw", "payout", "payboard", "depboard", "ibpay", "goals", "pulse", "glance", "curchips"] },
  { id: "compliance", ids: ["kyc", "gallery", "history", "risk", "logs", "alerts", "expiry", "docpulse", "kycglance"] },
  { id: "insights", ids: ["reports", "insights", "affiliates"] },
  { id: "desk", ids: ["settings", "me", "prefs", "roster", "access", "control", "handoff", "quiet", "accents", "sop", "folders", "scratch", "jumps", "density", "vault", "cheats", "digest", "glass", "eod", "scripts", "prep", "winloss", "packet", "clocks", "snippets", "swatches", "scale", "shield", "stickies", "shiftlist", "edge", "outcomes", "maildense", "callpack", "markbar"] },
] as const;

export type NavSectionId = (typeof NAV_SECTIONS)[number]["id"];

export function sectionPath(id: string): string {
  return id === "overview" ? "" : id;
}

export function activeGroup(view: string): NavSectionId | "" {
  const found = NAV_SECTIONS.find((group) => (group.ids as readonly string[]).includes(view));
  return found ? found.id : "";
}

export function listedIds(ids: readonly string[], allow: readonly string[]): string[] {
  const ok = new Set(allow);
  return ids.filter((id) => ok.has(id));
}

export function filterSection(ids: readonly string[], names: Record<string, string>, query: string): string[] {
  const text = query.trim().toLowerCase();
  if (!text) return [...ids];
  return ids.filter((id) => `${names[id] || ""} ${id}`.toLowerCase().includes(text));
}

export function readFold(raw: string | null): boolean {
  return raw === "1";
}

export function matchedCount(names: Record<string, string>, query: string, allow?: readonly string[]): number {
  return NAV_SECTIONS.reduce((sum, group) => {
    const ids = allow ? listedIds(group.ids, allow) : group.ids;
    return sum + filterSection(ids, names, query).length;
  }, 0);
}
