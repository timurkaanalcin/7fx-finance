import { PrismaClient } from "@prisma/client";

/**
 * Resolve DATABASE_URL for Prisma.
 * - cPanel / local MySQL: set DATABASE_URL explicitly (mysql://...).
 * - Netlify only: when process.env.NETLIFY is set and DATABASE_URL is unset,
 *   use @netlify/database getConnectionString() (or NETLIFY_DB_URL fallbacks).
 */
function ensureDatabaseUrl(): void {
  if (process.env.DATABASE_URL) return;

  if (process.env.NETLIFY) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Netlify's database helper is CommonJS
      const { getConnectionString } = require("@netlify/database") as {
        getConnectionString: () => string;
      };
      process.env.DATABASE_URL = getConnectionString();
      return;
    } catch {
      // Package unavailable / env not provisioned yet
    }

    const fallback =
      process.env.NETLIFY_DB_URL ||
      process.env.NETLIFY_DATABASE_URL ||
      process.env.NETLIFY_DATABASE_URL_UNPOOLED;
    if (fallback) {
      process.env.DATABASE_URL = fallback;
    }
  }
}

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ---- Scoped-staff data isolation (Sales/Retention Manager) ----
const USER_OWNED = new Set([
  "Account", "UserNote", "Order", "Position", "DepositRequest", "BalanceRequest", "WithdrawalRequest",
  "BalanceLedger", "Communication", "ClientActivityEvent", "DocumentRecord", "Reminder", "AutoLoginLink",
  "LoginEvent", "ChatThreadState", "ChatAttachment", "Notification", "PushSubscription", "CustomerDocument",
  "AiMembership",
]);
const WHERE_OPS = new Set([
  "findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy",
  "update", "updateMany", "delete", "deleteMany", "upsert",
]);
const READ_OPS = new Set(["findFirst", "findMany", "count", "aggregate", "groupBy"]);
const TEST_REL = new Set(["Account", "UserNote", "Order", "Position", "DepositRequest", "BalanceRequest", "WithdrawalRequest", "BalanceLedger", "Communication", "ClientActivityEvent", "DocumentRecord", "LoginEvent", "ChatThreadState"]);
const g2 = globalThis as unknown as { __7fxScopeMw?: boolean };
if (!g2.__7fxScopeMw) {
  g2.__7fxScopeMw = true;
  prisma.$use(async (params, next) => {
    const model = params.model;
    if (!model || (model !== "User" && model !== "AuditLog" && !USER_OWNED.has(model))) return next(params);
    const { resolveScope } = await import("./scope-context");
    const scope = await resolveScope();
    if (!scope) return next(params);
    if ("excludeTest" in scope) {
      // Real-business stats/reports: ignore TEST/demo customers.
      const rel = model === "User" ? { isTest: false } : TEST_REL.has(model) ? { user: { isTest: false } } : null;
      if (rel && READ_OPS.has(params.action)) {
        const a = (params.args ||= {});
        a.where = a.where ? { AND: [a.where, rel] } : rel;
      }
      return next(params);
    }
    const ids = scope.allowedUserIds;
    const field = model === "User" ? "id" : model === "AuditLog" ? "adminId" : "userId";
    const filter = model === "AuditLog" ? { adminId: scope.selfId } : { [field]: { in: ids } };
    const args = (params.args ||= {});
    if (WHERE_OPS.has(params.action)) {
      args.where = args.where ? { ...args.where, AND: [...(Array.isArray(args.where.AND) ? args.where.AND : args.where.AND ? [args.where.AND] : []), filter] } : filter;
    }
    if (params.action === "create" || params.action === "createMany" || params.action === "upsert") {
      const rows = params.action === "createMany" ? [].concat(args.data || []) : [params.action === "upsert" ? args.create : args.data];
      for (const d of rows as Record<string, unknown>[]) {
        if (!d) continue;
        if (model === "User") throw new Error("Scoped staff cannot create users");
        const dd = d as { adminId?: string; userId?: string; admin?: { connect?: { id?: string } }; user?: { connect?: { id?: string } } };
        const owner = model === "AuditLog" ? dd.adminId ?? dd.admin?.connect?.id : dd.userId ?? dd.user?.connect?.id;
        if (owner && !ids.includes(owner)) throw new Error("Scoped staff: forbidden owner");
      }
    }
    return next(params);
  });
}

// ---- Auto lead classification after any customer insert (register, CRM create, import) ----
const g3 = globalThis as unknown as { __7fxLeadMw?: boolean };
if (!g3.__7fxLeadMw) {
  g3.__7fxLeadMw = true;
  prisma.$use(async (params, next) => {
    const res = await next(params);
    if (params.model === "User" && (params.action === "create" || params.action === "createMany" || params.action === "upsert")) {
      import("./lead-invalid").then((m) => m.scheduleLeadClassify()).catch(() => {});
    }
    return res;
  });
}
