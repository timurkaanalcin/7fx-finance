/** Client-safe presence helpers (thresholds shared by CRM views and APIs). */

/** lastSeen younger than this → "Online" (green) */
export const ONLINE_MS = 2 * 60 * 1000;
/** lastSeen younger than this → "Recently" (amber) */
export const RECENT_MS = 15 * 60 * 1000;

export type PresenceState = "online" | "recent" | "offline" | "never";

export function presenceState(lastSeenAt: string | Date | null | undefined, now = Date.now()): PresenceState {
  if (!lastSeenAt) return "never";
  const t = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(t)) return "never";
  const age = now - t;
  if (age < ONLINE_MS) return "online";
  if (age < RECENT_MS) return "recent";
  return "offline";
}

/** ISO alpha-2 → regional-indicator emoji flag */
export function countryFlag(code: string | null | undefined): string {
  const c = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...Array.from(c).map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

export type PresenceInfo = {
  lastSeenAt: string | null;
  lastIp: string | null;
  lastDevice: string | null;
  lastBrowser: string | null;
  lastOs: string | null;
  lastCountry: string | null;
  lastCountryName: string | null;
  lastRegion: string | null;
  lastCity: string | null;
};

/** Pick presence columns from a User row (admin-only payloads). */
export function serializePresence(u: Record<string, unknown>): PresenceInfo {
  const s = (k: string) => (u[k] == null ? null : String(u[k]));
  const seen = u.lastSeenAt as Date | string | null | undefined;
  return {
    lastSeenAt: seen ? new Date(seen).toISOString() : null,
    lastIp: s("lastIp"),
    lastDevice: s("lastDevice"),
    lastBrowser: s("lastBrowser"),
    lastOs: s("lastOs"),
    lastCountry: s("lastCountry"),
    lastCountryName: s("lastCountryName"),
    lastRegion: s("lastRegion"),
    lastCity: s("lastCity"),
  };
}
