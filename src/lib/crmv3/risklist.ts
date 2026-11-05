/** A local risk shortlist, and mail/notice list density. The chrome pad is not part of the density. */

export const RISK_KEY = "crmv3-risk-watch";
export const MAIL_KEY = "crmv3-mail-density";

export const MAIL_DENSITIES = ["compact", "desk", "roomy"] as const;
export type MailDensity = (typeof MAIL_DENSITIES)[number];

export type Watch = {
  id: string;
  reason: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export function readDensity(raw: unknown): MailDensity {
  const value = String(raw || "");
  return value === "compact" || value === "roomy" ? value : "desk";
}

export function cleanReason(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function readWatch(raw: unknown, known: readonly string[]): Watch[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(known.filter(Boolean));
  const out: Watch[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Watch>;
    const id = String(row.id || "").trim();
    if (!id || !allow.has(id) || out.some((watch) => watch.id === id)) continue;
    out.push({
      id,
      reason: cleanReason(String(row.reason || "")),
      pinned: row.pinned === true,
      hidden: row.hidden === true,
      at: String(row.at || ""),
    });
  }
  return out.slice(0, 40);
}

export function addWatch(items: readonly Watch[], watch: { id: string; reason: string; at: string }, known: readonly string[]): Watch[] {
  const id = String(watch.id || "").trim();
  if (!id || !known.includes(id) || items.some((item) => item.id === id)) return items.slice();
  return [{ id, reason: cleanReason(watch.reason), pinned: false, hidden: false, at: watch.at }, ...items].slice(0, 40);
}

export function toggleWatchPin(items: readonly Watch[], id: string): Watch[] {
  return items.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
}

export function setWatchHidden(items: readonly Watch[], id: string, hidden: boolean): Watch[] {
  return items.map((item) => (item.id === id ? { ...item, hidden } : item));
}

export function visibleWatch(items: readonly Watch[], query: string, hidden: boolean): Watch[] {
  const text = query.trim().toLowerCase();
  return items
    .filter((item) => item.hidden === hidden && (!text || item.reason.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
