/** Pure helpers for the CRM v2 control panel. No I/O and no schema changes. */

const SECRET_KEY = /password|passwd|secret|token|hash|authorization|cookie|apikey|api_key|private|database_url|smtp/i;

export type LogLevel = "info" | "warn" | "error";

export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return null;
  if (Array.isArray(value)) return value.slice(0, 40).map((item) => scrubValue(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEY.test(key) ? "[redacted]" : scrubValue(child, depth + 1);
    }
    return out;
  }
  if (typeof value === "string") {
    if (/^(postgres|postgresql|mysql|mongodb|redis|rediss):\/\//i.test(value)) return "[redacted]";
    if (/Bearer\s+[A-Za-z0-9\-._~+/]+=*/i.test(value)) return "[redacted]";
    return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  return value ?? null;
}

export function scrubMeta(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return scrubValue(JSON.parse(raw));
  } catch {
    return scrubValue(raw);
  }
}

export function auditLevel(action: string): LogLevel {
  const value = action.toUpperCase();
  if (/(FAIL|ERROR|DELETE|DENIED)/.test(value)) return "error";
  if (/(REJECT|FREEZE|LOCK|INVALID|WARN)/.test(value)) return "warn";
  return "info";
}

export function clampPage(takeRaw: string | null, skipRaw: string | null): { take: number; skip: number } {
  const takeNum = Number(takeRaw);
  const skipNum = Number(skipRaw);
  const take = Number.isFinite(takeNum) && takeNum > 0 ? Math.min(50, Math.trunc(takeNum)) : 30;
  const skip = Number.isFinite(skipNum) && skipNum > 0 ? Math.min(100_000, Math.trunc(skipNum)) : 0;
  return { take, skip };
}

export function parseRange(fromRaw: string | null, toRaw: string | null): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (fromRaw) {
    const from = new Date(fromRaw);
    if (!Number.isNaN(from.getTime())) range.gte = from;
  }
  if (toRaw) {
    const to = new Date(toRaw);
    if (!Number.isNaN(to.getTime())) range.lte = to;
  }
  return range;
}

/**
 * Design only. This statement is shown to admins and is never executed.
 * A key's plaintext would be returned once at creation; only prefix + hash would be stored.
 */
export const API_KEY_MIGRATION_SQL = `CREATE TABLE ApiKey (
  id VARCHAR(191) NOT NULL,
  name VARCHAR(120) NOT NULL,
  prefix VARCHAR(16) NOT NULL,
  hash VARCHAR(128) NOT NULL,
  scopes TEXT NULL,
  createdById VARCHAR(191) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  lastUsedAt DATETIME(3) NULL,
  revokedAt DATETIME(3) NULL,
  PRIMARY KEY (id),
  INDEX ApiKey_prefix_idx (prefix),
  INDEX ApiKey_createdById_idx (createdById)
);`;

export const API_KEY_DESIGN = {
  schemaSupported: false,
  storage: "hash",
  plaintextStored: false,
  create: "POST would mint a random key, return it once, and store prefix + hash.",
  list: "GET would return id, name, prefix, scopes, createdAt, lastUsedAt, revokedAt.",
  revoke: "POST revoke would set revokedAt. Rows would not be deleted.",
  sql: API_KEY_MIGRATION_SQL,
} as const;

export const BACKUP_STATE = {
  configured: false,
  canDump: false,
  canRestore: false,
  history: [] as [],
  reason: "no_backup_job",
} as const;
