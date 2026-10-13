/**
 * CRM "recently viewed customers" — per browser (localStorage), staff-side only.
 * Stores only what Ctrl+K pins already store: CRM href, display name and account
 * login id. No e-mail / phone / balances. No server or schema change.
 */
export type RecentClient = { href: string; title: string; sub?: string; at: number };

export const RECENT_CLIENTS_KEY = "7fx.crm.recentClients.v1";
export const RECENT_CLIENTS_MAX = 8;
export const RECENT_CLIENTS_EVENT = "fx-crm-recent-clients";

export function loadRecentClients(): RecentClient[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_CLIENTS_KEY) || "[]");
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (x): x is RecentClient =>
          !!x &&
          typeof x.href === "string" &&
          x.href.startsWith("/izcrm/traders/") &&
          typeof x.title === "string",
      )
      .map((x) => ({
        href: x.href,
        title: x.title.slice(0, 80),
        ...(typeof x.sub === "string" ? { sub: x.sub.slice(0, 40) } : {}),
        at: Number.isFinite(Number(x.at)) ? Number(x.at) : 0,
      }))
      .slice(0, RECENT_CLIENTS_MAX);
  } catch {
    return [];
  }
}

function save(list: RecentClient[]) {
  try {
    localStorage.setItem(RECENT_CLIENTS_KEY, JSON.stringify(list.slice(0, RECENT_CLIENTS_MAX)));
    window.dispatchEvent(new Event(RECENT_CLIENTS_EVENT));
  } catch {
    /* ignore */
  }
}

export function pushRecentClient(c: { id: string; name?: string | null; accountLoginId?: string | null }) {
  if (!c.id) return;
  const href = `/izcrm/traders/${c.id}`;
  const entry: RecentClient = {
    href,
    title: (c.name || "—").trim().slice(0, 80) || "—",
    ...(c.accountLoginId ? { sub: `ID ${c.accountLoginId}` } : {}),
    at: Date.now(),
  };
  const prev = loadRecentClients();
  save([entry, ...prev.filter((p) => p.href !== href)]);
}

export function removeRecentClient(href: string) {
  save(loadRecentClients().filter((p) => p.href !== href));
}

export function clearRecentClients() {
  save([]);
}

/** Short relative time label: "şimdi", "5 dk", "3 sa", "2 g" (locale-neutral units via i18n keys). */
export function recentAgo(at: number, units: { now: string; min: string; hour: string; day: string }): string {
  if (!at) return "";
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return units.now;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} ${units.min}`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ${units.hour}`;
  return `${Math.round(h / 24)} ${units.day}`;
}
