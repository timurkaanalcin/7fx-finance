/** Pure helpers for CRM v4 round 3. Read-only on money and positions. */

const ZONES: Record<string, string> = {
  TR: "Europe/Istanbul",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  RU: "Europe/Moscow",
  AE: "Asia/Dubai",
  US: "America/New_York",
  CA: "America/Toronto",
};

export function zoneFor(country?: string | null, timezone?: string | null): string {
  if (timezone && timezone.includes("/")) return timezone;
  const code = String(country || "").trim().toUpperCase();
  return ZONES[code] || "UTC";
}

export function localClock(country?: string | null, timezone?: string | null, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: zoneFor(country, timezone), hour: "2-digit", minute: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(11, 16);
  }
}

export type Presence = "online" | "away" | "offline";

export function presenceOf(lastSeen?: string | null, lastLogin?: string | null, now = Date.now()): Presence {
  const seen = lastSeen ? new Date(lastSeen).getTime() : 0;
  const login = lastLogin ? new Date(lastLogin).getTime() : 0;
  const latest = Math.max(seen, login);
  if (!latest) return "offline";
  const age = now - latest;
  if (age < 5 * 60 * 1000) return "online";
  if (age < 60 * 60 * 1000) return "away";
  return "offline";
}

export type BookRow = { symbol?: string; side?: string; volume?: number; profit?: number; status?: string };

export function bookTotals(rows: BookRow[]): { exposure: number; pnl: number; open: number } {
  let exposure = 0;
  let pnl = 0;
  let open = 0;
  for (const row of rows) {
    if (String(row.status || "OPEN").toUpperCase() !== "OPEN" && row.status) continue;
    exposure += Math.abs(Number(row.volume) || 0);
    pnl += Number(row.profit) || 0;
    open += 1;
  }
  return { exposure, pnl, open };
}

export function exposureBySymbol(rows: BookRow[]): { symbol: string; exposure: number; pnl: number }[] {
  const map = new Map<string, { exposure: number; pnl: number }>();
  for (const row of rows) {
    if (row.status && String(row.status).toUpperCase() !== "OPEN") continue;
    const symbol = row.symbol || "—";
    const cell = map.get(symbol) || { exposure: 0, pnl: 0 };
    cell.exposure += Math.abs(Number(row.volume) || 0);
    cell.pnl += Number(row.profit) || 0;
    map.set(symbol, cell);
  }
  return Array.from(map.entries()).map(([symbol, cell]) => ({ symbol, ...cell })).sort((a, b) => b.exposure - a.exposure);
}

export function marginWatch<T extends { id: string; name?: string | null; balance?: number; equity?: number }>(rows: T[]): T[] {
  return rows.filter((row) => {
    const balance = Number(row.balance || 0);
    const equity = Number(row.equity != null ? row.equity : row.balance || 0);
    if (balance <= 0) return false;
    return equity / balance < 0.9;
  });
}

export function parseOperators(input: string): { text: string; ops: Record<string, string> } {
  const ops: Record<string, string> = {};
  const text = input.replace(/(^|\s)([a-zA-Z]+):([^\s]+)/g, (_all, _sp, key: string, value: string) => {
    ops[key.toLowerCase()] = value;
    return " ";
  }).trim();
  return { text, ops };
}

export function matchOperators(row: Record<string, unknown>, ops: Record<string, string>): boolean {
  return Object.entries(ops).every(([key, value]) => String(row[key] ?? "").toLowerCase().includes(value.toLowerCase()));
}

export function groupBy<T>(rows: T[], key: (row: T) => string): { key: string; rows: T[] }[] {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const name = key(row) || "—";
    map.set(name, [...(map.get(name) || []), row]);
  }
  return Array.from(map.entries()).map(([group, items]) => ({ key: group, rows: items }));
}

export const SALES_COLUMNS = ["customer", "country", "sale", "status"] as const;
export const RETENTION_COLUMNS = ["customer", "desk", "retention", "balance", "status"] as const;
