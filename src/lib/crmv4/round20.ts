/** Pure helpers for CRM v4 round 20. Browser keys only. Nothing is posted. */

export type LocalPack = { kind: "crmv4-local"; exportedAt: string; keys: Record<string, string> };

const PREFIX = "crmv4-";

export function packKeys(entries: [string, string][], exportedAt: string): LocalPack {
  const keys: Record<string, string> = {};
  for (const [key, raw] of entries) {
    if (key.startsWith(PREFIX)) keys[key] = raw;
  }
  return { kind: "crmv4-local", exportedAt, keys };
}

export function importableKeys(payload: unknown): Record<string, string> | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { kind?: unknown; keys?: unknown };
  if (record.kind !== "crmv4-local" || !record.keys || typeof record.keys !== "object" || Array.isArray(record.keys)) return null;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record.keys as Record<string, unknown>)) {
    if (key.startsWith(PREFIX) && typeof value === "string") out[key] = value;
  }
  return out;
}

export function keyCount(entries: string[]): number {
  return entries.filter((key) => key.startsWith(PREFIX)).length;
}

export function groupedNav(ids: readonly string[]): { work: string[]; records: string[]; desk: string[] } {
  const work = ids.filter((id) => id === "positions" || id === "marketing" || id === "goals" || id === "kyc" || id === "withdraw");
  const records = ids.filter((id) => id === "logs" || id === "control" || id === "reports");
  const desk = ids.filter((id) => id === "settings" || id === "me");
  return { work, records, desk };
}
