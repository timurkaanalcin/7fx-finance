import { PrismaClient } from "@prisma/client";

/**
 * Per-request data scope for scoped CRM staff (Sales/Retention Manager).
 * Resolved from the request's session cookie (Next request storage), cached per request.
 * When present, the Prisma middleware in lib/prisma.ts restricts every query on
 * customer-owned data to `allowedUserIds` (assigned customers + the staff member).
 */
export type ScopeCtx = { selfId: string; allowedUserIds: string[] } | { excludeTest: true };
const STATS_PATH = /^\/api\/admin\/(analytics|summary|stats|leads\/stats)(\/|$|\?)/;

const g = globalThis as unknown as { __7fxScopeRaw?: PrismaClient };
function raw(): PrismaClient {
  return g.__7fxScopeRaw || (g.__7fxScopeRaw = new PrismaClient({ log: ["error"] }));
}

const cache = new WeakMap<object, Promise<ScopeCtx | null>>();

export async function resolveScope(): Promise<ScopeCtx | null> {
  let key: object;
  let url = "";
  try {
    const { headers } = await import("next/headers");
    key = headers() as unknown as object;
    url = (headers().get("x-7fx-url") || "");
  } catch {
    return null; // not inside a request (scripts, background jobs)
  }
  const hit = cache.get(key);
  if (hit) return hit;
  const p = (async (): Promise<ScopeCtx | null> => {
    const { getSession } = await import("./auth");
    const { isScopedStaff, assignedWhere } = await import("./crm-scope");
    let session;
    try {
      session = await getSession();
    } catch {
      return null;
    }
    if (!session) return null;
    if (session.role === "ADMIN" && STATS_PATH.test(url)) {
      const st = await raw().user.findUnique({ where: { id: session.userId }, select: { role: true, jobTitle: true } });
      if (st && !isScopedStaff(st)) return { excludeTest: true };
    }
    if (session.role !== "ADMIN" && !(session as { impersonatedBy?: string }).impersonatedBy) return null;
    const staffId = (session as { impersonatedBy?: string }).impersonatedBy || session.userId;
    const staff = await raw().user.findUnique({
      where: { id: staffId },
      select: { id: true, name: true, role: true, jobTitle: true },
    });
    if (!staff || !isScopedStaff(staff)) return STATS_PATH.test(url) ? { excludeTest: true } : null;
    const rows = await raw().user.findMany({ where: assignedWhere(staff), select: { id: true } });
    return { selfId: staff.id, allowedUserIds: [staff.id, ...rows.map((r) => r.id)] };
  })();
  cache.set(key, p);
  return p;
}
