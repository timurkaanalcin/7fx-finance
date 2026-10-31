/** Pure helpers for CRM v4 round 23. Alerts stay in this browser. Nothing is sent. */

export type AlertRule = "large" | "sla" | "follow" | "watch" | "quiet";

export type AlertHit = {
  id: string;
  rule: AlertRule;
  name: string;
  detail: string;
  userId: string;
};

export type AlertSettings = {
  large: boolean;
  sla: boolean;
  follow: boolean;
  watch: boolean;
  quiet: boolean;
  largeAt: number;
  slaHours: number;
  muted: string[];
};

export const ALERT_DEFAULTS: AlertSettings = {
  large: true,
  sla: true,
  follow: true,
  watch: true,
  quiet: true,
  largeAt: 1000,
  slaHours: 24,
  muted: [],
};

export function largeAlerts(
  rows: { id: string; amount?: number | null; userId?: string | null; user?: { id?: string | null; name?: string | null } | null }[],
  threshold: number,
): AlertHit[] {
  return rows
    .filter((row) => Math.abs(Number(row.amount) || 0) >= threshold)
    .map((row) => ({
      id: `large:${row.id}`,
      rule: "large" as const,
      name: String(row.user?.name || row.userId || row.id),
      detail: String(Math.abs(Number(row.amount) || 0)),
      userId: String(row.user?.id || row.userId || ""),
    }));
}

export function slaAlerts(
  rows: { id: string; customer?: string | null; openedAt?: string | null; status?: string | null }[],
  hours: number,
  now = Date.now(),
): AlertHit[] {
  return rows
    .filter((row) => {
      if (String(row.status || "PENDING").toUpperCase() !== "PENDING") return false;
      const time = new Date(String(row.openedAt || "")).getTime();
      if (!Number.isFinite(time)) return false;
      return (now - time) / 36e5 > hours;
    })
    .map((row) => ({
      id: `sla:${row.id}`,
      rule: "sla" as const,
      name: String(row.customer || row.id),
      detail: String(hours),
      userId: "",
    }));
}

export function followAlerts(
  rows: { id: string; name?: string | null; follow?: string | null }[],
  today: string,
): AlertHit[] {
  return rows
    .filter((row) => String(row.follow || "").slice(0, 10) && String(row.follow).slice(0, 10) < today)
    .map((row) => ({
      id: `follow:${row.id}`,
      rule: "follow" as const,
      name: String(row.name || row.id),
      detail: String(row.follow).slice(0, 10),
      userId: row.id,
    }));
}

export function quietAlerts(
  rows: { id: string; name?: string | null; createdAt?: string | null }[],
  deposits: { createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null; amount?: number | null }[],
  now = Date.now(),
): AlertHit[] {
  const day = 86400000;
  const recent = new Set<string>();
  for (const row of deposits) {
    const id = String(row.user?.id || row.userId || "");
    const time = new Date(String(row.createdAt || "")).getTime();
    if (id && Number.isFinite(time) && now - time <= 7 * day) recent.add(id);
  }
  return rows
    .filter((row) => {
      const created = new Date(String(row.createdAt || "")).getTime();
      return recent.has(row.id) && Number.isFinite(created) && now - created >= 30 * day;
    })
    .map((row) => ({
      id: `quiet:${row.id}`,
      rule: "quiet" as const,
      name: String(row.name || row.id),
      detail: "30",
      userId: row.id,
    }));
}

export function visibleAlerts(hits: AlertHit[], settings: AlertSettings): AlertHit[] {
  const on: Record<AlertRule, boolean> = settings;
  return hits.filter((hit) => on[hit.rule] && !settings.muted.includes(hit.id));
}

export function lastStamp(values: (string | null | undefined)[]): string {
  return values.map((value) => String(value || "")).filter(Boolean).sort().reverse()[0] || "";
}

export function sameCurrencyHigher(rows: { id: string; currency?: string | null; balance?: number | null }[]): string {
  const currency = String(rows[0]?.currency || "");
  if (!currency || rows.some((row) => String(row.currency || "") !== currency)) return "";
  let best = "";
  let max = -1;
  for (const row of rows) {
    const amount = Number(row.balance) || 0;
    if (amount > max) { max = amount; best = row.id; }
  }
  return best;
}
