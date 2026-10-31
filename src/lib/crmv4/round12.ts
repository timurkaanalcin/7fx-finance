/** Pure helpers for CRM v4 round 12. */

export type SortKey = "name" | "balance" | "equity" | "score" | "created";

export function neighborId(ids: string[], current: string, step: number): string {
  const index = ids.indexOf(current);
  if (index < 0) return "";
  return ids[index + step] || "";
}

export function encodeView(data: Record<string, string>): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const byte of Array.from(bytes)) bin += String.fromCharCode(byte);
  return btoa(bin);
}

export function decodeView(raw: string): Record<string, string> | null {
  try {
    const bin = atob(raw);
    const bytes = Uint8Array.from(bin, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") out[key] = value;
    }
    return out;
  } catch {
    return null;
  }
}

export function countActive(values: Record<string, string>): number {
  let count = 0;
  for (const value of Object.values(values)) if (value.trim()) count += 1;
  return count;
}

export function inNumberRange(value: number, min: string, max: string): boolean {
  const low = min.trim() === "" ? null : Number(min);
  const high = max.trim() === "" ? null : Number(max);
  if (low != null && Number.isFinite(low) && value < low) return false;
  if (high != null && Number.isFinite(high) && value > high) return false;
  return true;
}

export function inDateRange(iso: string | null | undefined, from: string, to: string): boolean {
  const day = String(iso || "").slice(0, 10);
  if (!day) return !from && !to;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function multiSort<T>(rows: T[], keys: string[], valueOf: (row: T, key: string) => string | number): T[] {
  const active = keys.filter(Boolean);
  if (!active.length) return rows;
  return [...rows].sort((a, b) => {
    for (const key of active) {
      const left = valueOf(a, key);
      const right = valueOf(b, key);
      if (typeof left === "number" && typeof right === "number") {
        if (left !== right) return right - left;
      } else {
        const cmp = String(left).localeCompare(String(right));
        if (cmp) return cmp;
      }
    }
    return 0;
  });
}

export function marginLevel(equity?: number | null, margin?: number | null): number | null {
  const used = Number(margin);
  if (!(used > 0)) return null;
  const mark = Number(equity);
  if (!Number.isFinite(mark)) return null;
  return Math.round((mark / used) * 100);
}

export function displayPnl(side: string, open: number, quote: number, volume: number): number | null {
  if (!(open > 0) || !(quote > 0) || !(volume > 0)) return null;
  const dir = String(side || "").toUpperCase() === "SELL" ? -1 : 1;
  return Math.round((quote - open) * volume * dir * 100) / 100;
}

export function monthKey(iso?: string | null): string {
  return String(iso || "").slice(0, 7);
}

export function channelCounts(rows: { type?: string | null }[]): { type: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const type = String(row.type || "NOTE");
    map.set(type, (map.get(type) || 0) + 1);
  }
  return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
}

export function lastChannel(rows: { type?: string | null; createdAt?: string | null }[]): string {
  const sorted = [...rows].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return String(sorted[0]?.type || "");
}

export function headerHit(row: { name?: string | null; email?: string | null; country?: string | null; desk?: string | null; saleStatus?: string | null; retentionStatus?: string | null; balance?: number | null; active?: boolean }, filters: Record<string, string>): boolean {
  const checks: [string, string][] = [
    ["customer", `${row.name || ""} ${row.email || ""}`],
    ["country", String(row.country || "")],
    ["desk", String(row.desk || "")],
    ["sale", String(row.saleStatus || "")],
    ["retention", String(row.retentionStatus || "")],
    ["balance", String(row.balance ?? "")],
    ["status", row.active === false ? "frozen" : "active"],
  ];
  for (const [key, hay] of checks) {
    const needle = (filters[key] || "").trim().toLowerCase();
    if (needle && !hay.toLowerCase().includes(needle)) return false;
  }
  return true;
}
