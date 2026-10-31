/** Pure helpers for CRM v4 round 8. */

export function fuzzyHit(query: string, value: string): boolean {
  const needle = query.trim().toLowerCase();
  const hay = value.toLowerCase();
  if (!needle) return true;
  if (hay.includes(needle)) return true;
  if (needle.length < 4) return false;
  return distance(needle, hay.slice(0, needle.length + 1)) <= 1 || hay.split(/\s+/).some((part) => distance(needle, part) <= 1);
}

function distance(a: string, b: string): number {
  const left = a.slice(0, 24);
  const right = b.slice(0, 24);
  const rows = Array.from({ length: left.length + 1 }, (_, i) => i);
  for (let j = 1; j <= right.length; j += 1) {
    let prev = j - 1;
    rows[0] = j;
    for (let i = 1; i <= left.length; i += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      const next = Math.min(rows[i] + 1, rows[i - 1] + 1, prev + cost);
      prev = rows[i];
      rows[i] = next;
    }
  }
  return rows[left.length];
}

export function watchDiffs(prev: Record<string, { balance: number; status: string }>, rows: { id: string; name?: string | null; balance?: number; saleStatus?: string | null }[]): { id: string; name: string; kind: "balance" | "status" }[] {
  const found: { id: string; name: string; kind: "balance" | "status" }[] = [];
  for (const row of rows) {
    const before = prev[row.id];
    if (!before) continue;
    const balance = Number(row.balance) || 0;
    if (before.balance !== balance) found.push({ id: row.id, name: row.name || row.id, kind: "balance" });
    else if (before.status !== (row.saleStatus || "")) found.push({ id: row.id, name: row.name || row.id, kind: "status" });
  }
  return found;
}

export function ageBuckets(opened: (string | null | undefined)[], now = Date.now()): { label: string; count: number }[] {
  const buckets = { "0-1d": 0, "2-7d": 0, "8-30d": 0, "30d+": 0 };
  for (const value of opened) {
    if (!value) continue;
    const at = new Date(value).getTime();
    if (!Number.isFinite(at)) continue;
    const days = (now - at) / 86400000;
    if (days <= 1) buckets["0-1d"] += 1;
    else if (days <= 7) buckets["2-7d"] += 1;
    else if (days <= 30) buckets["8-30d"] += 1;
    else buckets["30d+"] += 1;
  }
  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}

export function pnlMovers<T extends { profit?: number }>(rows: T[], limit = 5): T[] {
  return [...rows].sort((a, b) => Math.abs(Number(b.profit) || 0) - Math.abs(Number(a.profit) || 0)).slice(0, limit);
}

export function withdrawRatio(deposits: number, withdrawals: number): number | null {
  if (deposits <= 0) return null;
  return Math.round((withdrawals / deposits) * 100) / 100;
}

export function cohortLtv(rows: { createdAt?: string | null; balance?: number }[]): { month: string; traders: number; balance: number }[] {
  const map = new Map<string, { traders: number; balance: number }>();
  for (const row of rows) {
    const month = String(row.createdAt || "").slice(0, 7) || "—";
    const cell = map.get(month) || { traders: 0, balance: 0 };
    cell.traders += 1;
    cell.balance += Number(row.balance) || 0;
    map.set(month, cell);
  }
  return Array.from(map.entries()).map(([month, cell]) => ({ month, ...cell })).sort((a, b) => a.month.localeCompare(b.month));
}

export function deskTotals(rows: { desk?: string | null; balance?: number }[]): { desk: string; traders: number; balance: number }[] {
  const map = new Map<string, { traders: number; balance: number }>();
  for (const row of rows) {
    const desk = row.desk || "—";
    const cell = map.get(desk) || { traders: 0, balance: 0 };
    cell.traders += 1;
    cell.balance += Number(row.balance) || 0;
    map.set(desk, cell);
  }
  return Array.from(map.entries()).map(([desk, cell]) => ({ desk, ...cell })).sort((a, b) => b.balance - a.balance);
}

export function agentTotals(rows: { assigneeName?: string | null; balance?: number; ftd?: boolean }[]): { name: string; traders: number; ftd: number; balance: number }[] {
  const map = new Map<string, { traders: number; ftd: number; balance: number }>();
  for (const row of rows) {
    const name = row.assigneeName || "—";
    const cell = map.get(name) || { traders: 0, ftd: 0, balance: 0 };
    cell.traders += 1;
    if (row.ftd) cell.ftd += 1;
    cell.balance += Number(row.balance) || 0;
    map.set(name, cell);
  }
  return Array.from(map.entries()).map(([name, cell]) => ({ name, ...cell })).sort((a, b) => b.balance - a.balance);
}

export function holdersOf<T extends { symbol?: string }>(rows: T[], symbol: string): T[] {
  return rows.filter((row) => (row.symbol || "") === symbol);
}

export function trapFocus(node: HTMLElement) {
  const focusable = node.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])");
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  first?.focus();
  return (event: KeyboardEvent) => {
    if (event.key !== "Tab" || !first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
}

export function overThreshold(rows: { symbol: string; exposure: number }[], limit: number): { symbol: string; exposure: number }[] {
  if (limit <= 0) return [];
  return rows.filter((row) => row.exposure >= limit);
}
