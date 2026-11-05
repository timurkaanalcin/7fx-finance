/** Pure helpers for CRM v4 round 30. The rail fold is stored in the browser. */

export const RAIL_KEY = "crmv4-rail-fold";

export const NAV_SECTIONS = [
  { id: "work", ids: ["overview", "customers", "dense", "positions", "support", "inbox", "thread", "marketing", "agenda"] },
  { id: "money", ids: ["finance", "deposit", "withdraw", "payout", "funding", "goals"] },
  { id: "compliance", ids: ["kyc", "gallery", "risk", "logs", "history"] },
  { id: "insights", ids: ["insights", "reports", "affiliates"] },
  { id: "desk", ids: ["settings", "me", "day", "control", "prefs", "roster", "access"] },
] as const;

export type NavSectionId = (typeof NAV_SECTIONS)[number]["id"];

export function sectionPath(id: string): string {
  return id === "overview" ? "" : id;
}

export function activeGroup(view: string): NavSectionId | "" {
  const found = NAV_SECTIONS.find((group) => (group.ids as readonly string[]).includes(view));
  return found ? found.id : "";
}

export function filterSection(ids: readonly string[], names: Record<string, string>, query: string): string[] {
  const text = query.trim().toLowerCase();
  if (!text) return [...ids];
  return ids.filter((id) => `${names[id] || ""} ${id}`.toLowerCase().includes(text));
}

export function readFold(raw: string | null): boolean {
  return raw === "1";
}

export function matchedCount(names: Record<string, string>, query: string): number {
  return NAV_SECTIONS.reduce((sum, group) => sum + filterSection(group.ids, names, query).length, 0);
}
