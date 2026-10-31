/** Pure helpers for CRM v4 round 18. Targets stay in the browser. Counts use loaded rows. */

export type PerfMetric = "assigned" | "funded" | "calls" | "tickets";

export type AgentStat = {
  id: string;
  name: string;
  assigned: number;
  funded: number;
  calls: number;
  tickets: number;
};

export type PerfTarget = { assigned: number; funded: number; calls: number; tickets: number };

const EMPTY_TARGET: PerfTarget = { assigned: 0, funded: 0, calls: 0, tickets: 0 };

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim().length > 0;
}

function statFor(id: string, name: string, customers: { id: string; ftd?: boolean | null }[], calls: Record<string, number>, ticketNames: string[]): AgentStat {
  return {
    id,
    name,
    assigned: customers.length,
    funded: customers.filter((row) => row.ftd).length,
    calls: customers.reduce((sum, row) => sum + (calls[row.id] || 0), 0),
    tickets: ticketNames.filter((item) => sameName(item, name)).length,
  };
}

export function buildBoard(input: {
  workers: { id: string; name?: string | null; email?: string | null }[];
  customers: { id: string; assigneeName?: string | null; ftd?: boolean | null }[];
  calls: Record<string, number>;
  ticketNames: string[];
}): AgentStat[] {
  const staff = input.workers.map((worker) => {
    const name = String(worker.name || worker.email || worker.id);
    const mine = input.customers.filter((row) => sameName(String(row.assigneeName || ""), name));
    return statFor(worker.id, name, mine, input.calls, input.ticketNames);
  });
  const known = new Set(staff.map((row) => row.name.trim().toLowerCase()));
  const extras = new Map<string, { name: string; rows: { id: string; ftd?: boolean | null }[] }>();
  for (const row of input.customers) {
    const name = String(row.assigneeName || "").trim();
    const key = name.toLowerCase();
    if (!name || known.has(key)) continue;
    const bucket = extras.get(key) || { name, rows: [] };
    bucket.rows.push(row);
    extras.set(key, bucket);
  }
  const more = Array.from(extras.entries()).map(([key, bucket]) => statFor(`name:${key}`, bucket.name, bucket.rows, input.calls, input.ticketNames));
  return [...staff, ...more];
}

export function metricValue(row: AgentStat, metric: PerfMetric): number {
  return row[metric];
}

export function rankBoard(rows: AgentStat[], metric: PerfMetric, highFirst: boolean): AgentStat[] {
  const copy = [...rows];
  copy.sort((a, b) => metricValue(a, metric) - metricValue(b, metric) || a.name.localeCompare(b.name));
  return highFirst ? copy.reverse() : copy;
}

export function searchBoard(rows: AgentStat[], query: string): AgentStat[] {
  const text = query.trim().toLowerCase();
  if (!text) return rows;
  return rows.filter((row) => row.name.toLowerCase().includes(text));
}

export function hideIdle(rows: AgentStat[], on: boolean): AgentStat[] {
  if (!on) return rows;
  return rows.filter((row) => row.assigned + row.funded + row.calls + row.tickets > 0);
}

export function behindTarget(rows: AgentStat[], targets: Record<string, PerfTarget>, metric: PerfMetric, on: boolean): AgentStat[] {
  if (!on) return rows;
  return rows.filter((row) => {
    const target = (targets[row.id] || EMPTY_TARGET)[metric];
    return target > 0 && metricValue(row, metric) < target;
  });
}

export function progressTo(value: number, target: number): number | null {
  if (target <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

export function gapTo(value: number, target: number): number | null {
  if (target <= 0) return null;
  return Math.max(0, target - value);
}

export function callPace(row: AgentStat): number | null {
  if (row.assigned <= 0) return null;
  return Math.round((row.calls / row.assigned) * 10) / 10;
}

export function fundedShare(row: AgentStat): number | null {
  if (row.assigned <= 0) return null;
  return Math.round((row.funded / row.assigned) * 100);
}

export function callCounts(logs: Record<string, { length?: number } | unknown[]>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, rows] of Object.entries(logs)) out[id] = Array.isArray(rows) ? rows.length : 0;
  return out;
}
