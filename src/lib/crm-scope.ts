import { prisma } from "@/lib/prisma";

/**
 * Scoped CRM staff (Sales Manager / Retention Manager): ADMIN-role logins that may
 * only see and work on customers assigned to them. Enforced server-side.
 */
export const SCOPED_JOB_TITLES = ["sales_mgr", "retention_manager"] as const;

export function isScopedStaff(user: { role?: string | null; jobTitle?: string | null } | null | undefined): boolean {
  if (!user || user.role !== "ADMIN") return false;
  return (SCOPED_JOB_TITLES as readonly string[]).includes(String(user.jobTitle || ""));
}

/** Prisma where-fragment: TRADERs assigned to this staff member. */
export function assignedWhere(staff: { id: string; name?: string | null }) {
  const ors: Record<string, unknown>[] = [{ assigneeId: staff.id }];
  if (staff.name && staff.name.trim()) ors.push({ assigneeId: null, assigneeName: staff.name });
  return { role: "TRADER", OR: ors };
}

/** Adds the assignment scope to a where object when the staff is scoped. */
export function scopeUserWhere<T extends Record<string, unknown>>(
  staff: { id: string; name?: string | null; role?: string | null; jobTitle?: string | null },
  where: T | undefined
): Record<string, unknown> | undefined {
  if (!isScopedStaff(staff)) return where;
  const scope = assignedWhere(staff);
  return where && Object.keys(where).length ? { AND: [where, scope] } : scope;
}

/** True when staff may access this customer (admins: always). */
export async function canAccessUser(
  staff: { id: string; name?: string | null; role?: string | null; jobTitle?: string | null },
  userId: string | null | undefined
): Promise<boolean> {
  if (!isScopedStaff(staff)) return true;
  if (!userId) return false;
  const hit = await prisma.user.findFirst({ where: { AND: [{ id: userId }, assignedWhere(staff)] }, select: { id: true } });
  return !!hit;
}

type Rule = { methods: string[]; re: RegExp; idGroup?: number; idQuery?: string };
/** Deny-by-default allowlist of admin APIs a scoped staff member may call. */
const RULES: Rule[] = [
  { methods: ["GET"], re: /^\/api\/admin\/users\/?$/ },
  { methods: ["GET"], re: /^\/api\/admin\/users\/([^/]+)\/?$/, idGroup: 1 },
  { methods: ["GET"], re: /^\/api\/admin\/users\/([^/]+)\/presence\/?$/, idGroup: 1 },
  { methods: ["GET"], re: /^\/api\/admin\/clients\/?$/ },
  { methods: ["GET"], re: /^\/api\/admin\/chat\/?$/, idQuery: "userId" },
  { methods: ["POST", "PATCH"], re: /^\/api\/admin\/chat\/?$/ },
  { methods: ["POST"], re: /^\/api\/admin\/chat\/attachments\/?$/ },
  { methods: ["GET"], re: /^\/api\/admin\/chat\/attachments\/[^/]+\/?$/ },
  { methods: ["GET", "POST"], re: /^\/api\/admin\/chat\/presence\/?$/, idQuery: "userId" },
  { methods: ["GET"], re: /^\/api\/admin\/leads\/export\/?$/ },
  { methods: ["GET"], re: /^\/api\/admin\/analytics\/affiliates\/?$/ },
  { methods: ["GET", "POST", "PATCH"], re: /^\/api\/admin\/retention\/([^/]+)\/?$/, idGroup: 1 },
  { methods: ["GET", "POST"], re: /^\/api\/admin\/users\/([^/]+)\/team-notes\/?$/, idGroup: 1 },
];

/** Central gate for scoped staff. Unknown path → deny. */
export async function scopedRequestAllowed(
  staff: { id: string; name?: string | null; role?: string | null; jobTitle?: string | null },
  url: string | null,
  method: string | null
): Promise<boolean> {
  if (!url || !method) return false;
  const u = new URL(url, "http://x");
  const path = u.pathname;
  if (!path.startsWith("/api/admin")) return true; // non-admin APIs keep their own checks
  for (const r of RULES) {
    if (!r.methods.includes(method)) continue;
    const m = path.match(r.re);
    if (!m) continue;
    if (r.idGroup) return canAccessUser(staff, decodeURIComponent(m[r.idGroup]));
    if (r.idQuery) {
      const v = (u.searchParams.get(r.idQuery) || "").trim();
      if (v) return canAccessUser(staff, v);
    }
    return true;
  }
  // Read-only access to every other CRM section: data is isolated to assigned
  // customers by the Prisma scope middleware (lib/prisma.ts). Sensitive/system areas stay denied.
  if (method === "GET" && !SCOPED_DENY_GET.some((re) => re.test(path))) return true;
  return false;
}

const SCOPED_DENY_GET: RegExp[] = [
  /^\/api\/admin\/(2fa|impersonate|import|cleanup-audit|export-audit|licenses|mail|export)(\/|$)/,
];

export { scopedPageAllowed } from "./crm-scope-pages";
