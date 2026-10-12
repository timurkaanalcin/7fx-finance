import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { ensureDemoSeed } from "./ensure-seed";
import { touchPresenceInBackground } from "./presence";

const COOKIE_NAME = "7fx_session";
const LEGACY_COOKIE_NAME = "deskflow_session";

function sessionCookieOptions(maxAge: number, _host?: string | null) {
  void _host;
  const opts: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
    domain?: string;
  } = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
  // Optional explicit domain only (e.g. COOKIE_DOMAIN=.customer.org.tr). Not set by default —
  // auto cross-subdomain cookies widen session theft surface for static CRM-on-Natro.
  const envDomain = (process.env.COOKIE_DOMAIN || "").trim();
  if (envDomain) opts.domain = envDomain;
  return opts;
}

/** ADMIN with crmReadOnly may use the customer trading terminal + profile APIs. */
export function isCrmReadOnlyAdmin(user: {
  role?: string | null;
  crmReadOnly?: boolean | null;
}): boolean {
  return user.role === "ADMIN" && user.crmReadOnly === true;
}

/** Post-login home: RO admins → /trade; full admins → /izcrm; traders → /trade. */
export function postLoginPath(user: {
  role?: string | null;
  crmReadOnly?: boolean | null;
}): "/trade" | "/izcrm" {
  if (user.role === "ADMIN" && !isCrmReadOnlyAdmin(user)) return "/izcrm";
  return "/trade";
}

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production"
      ? undefined
      : "deskflow-trade-demo-secret");

  if (!secret) {
    throw new Error(
      "Missing AUTH_SECRET (or JWT_SECRET). Set it in your environment for production."
    );
  }

  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
  /** Set when an admin is viewing the terminal as this trader */
  impersonatedBy?: string;
  /** Auto-login link that created this session (for force-password tracking) */
  autoLoginLinkId?: string;
  /** JWT issued-at (seconds) — used to reject sessions older than a password change */
  iat?: number;
  /** CRM session bind (ADMIN): hashed IP / UA at issue time */
  ipHash?: string;
  uaHash?: string;
};

/** For ADMIN sessions issued with bind hashes: reject (null) when IP/UA changed → force re-login. */
export async function adminSessionBindOk(session: SessionPayload | null): Promise<boolean> {
  if (!session || session.role !== "ADMIN") return true;
  if (!session.ipHash && !session.uaHash) return true; // legacy sessions
  try {
    const h = headers();
    const { clientIpFromHeaders, deviceFingerprint } = await import("@/lib/security/fingerprint");
    const ip = clientIpFromHeaders({ get: (n) => h.get(n) });
    const ua = h.get("user-agent") || "";
    const fp = deviceFingerprint(ip, ua);
    // IP binding disabled as a hard check: behind Railway's edge the forwarded client IP is not
    // stable per request, which 403'd every admin API call (empty traders list / chats).
    // UA binding stays enforced; IP drift is only logged.
    if (session.ipHash && session.ipHash !== fp.ipHash) {
      console.warn("[auth] admin session ip drift", { userId: (session as { userId?: string }).userId });
    }
    if (session.uaHash && session.uaHash !== fp.uaHash) return false;
    return true;
  } catch {
    return true;
  }
}


export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
}

/** Attach session cookies onto a NextResponse (preferred in Route Handlers). */
export function attachSessionCookie(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  token: string,
  host?: string | null
) {
  const opts = sessionCookieOptions(60 * 60 * 24 * 7, host);
  res.cookies.set(COOKIE_NAME, token, opts);
  res.cookies.set(LEGACY_COOKIE_NAME, "", { ...opts, maxAge: 0 });
}

export function clearSessionCookie(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  host?: string | null
) {
  const opts = sessionCookieOptions(0, host);
  res.cookies.set(COOKIE_NAME, "", opts);
  res.cookies.set(LEGACY_COOKIE_NAME, "", opts);
}

/** Legacy helper for Server Components / Server Actions. */
export async function createSession(payload: SessionPayload) {
  const token = await signSessionToken(payload);
  const opts = sessionCookieOptions(60 * 60 * 24 * 7);
  cookies().set(COOKIE_NAME, token, opts);
  cookies().set(LEGACY_COOKIE_NAME, "", { ...opts, maxAge: 0 });
  return token;
}

export async function destroySession() {
  const opts = sessionCookieOptions(0);
  cookies().set(COOKIE_NAME, "", opts);
  cookies().set(LEGACY_COOKIE_NAME, "", opts);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token =
    cookies().get(COOKIE_NAME)?.value ||
    cookies().get(LEGACY_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const impersonatedBy =
      typeof payload.impersonatedBy === "string" && payload.impersonatedBy
        ? payload.impersonatedBy
        : undefined;
    const autoLoginLinkId =
      typeof payload.autoLoginLinkId === "string" && payload.autoLoginLinkId
        ? payload.autoLoginLinkId
        : undefined;
    const ipHash =
      typeof payload.ipHash === "string" && payload.ipHash ? payload.ipHash : undefined;
    const uaHash =
      typeof payload.uaHash === "string" && payload.uaHash ? payload.uaHash : undefined;
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: (payload.role as string) || "TRADER",
      ...(impersonatedBy ? { impersonatedBy } : {}),
      ...(autoLoginLinkId ? { autoLoginLinkId } : {}),
      ...(typeof payload.iat === "number" ? { iat: payload.iat } : {}),
      ...(ipHash ? { ipHash } : {}),
      ...(uaHash ? { uaHash } : {}),
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) return null;
  await ensureDemoSeed();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { account: true },
  });
  if (!user) return null;
  if ((user as { active?: boolean }).active === false) return null;
  // loginEnabled=false kills non-impersonation sessions (separate from freeze).
  // Admin impersonation from CRM still works so support can inspect the account.
  if (
    (user as { loginEnabled?: boolean }).loginEnabled === false &&
    !session.impersonatedBy
  ) {
    return null;
  }
  // Sessions issued before an admin password change are invalid (stateless JWT revocation).
  const changedAt = (user as { passwordChangedAt?: Date | null }).passwordChangedAt;
  if (changedAt && session.iat && session.iat * 1000 + 1000 <= changedAt.getTime()) return null;
  // Presence: any authenticated request by the client themselves counts as activity.
  // Admin impersonation must never make the client look online.
  if (!session.impersonatedBy) touchPresenceInBackground(user);
  return user;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  if (!(await adminSessionBindOk(session))) {
    // Suspicious bind change — drop usability until re-auth
    return null;
  }
  const user = await requireUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export type AdminPermission =
  | "canManageUsers"
  | "canApproveDeposits"
  | "canEditRates"
  | "canManageMethods"
  | "canAdjustBalance";

export const ADMIN_PERMISSIONS: { key: AdminPermission; label: string; desc: string }[] = [
  { key: "canManageUsers", label: "User management", desc: "Role, dondurma, arama" },
  { key: "canApproveDeposits", label: "Deposit approvals", desc: "Deposit and margin requests" },
  { key: "canEditRates", label: "Trading rates", desc: "Spread, commission, volume, symbol" },
  { key: "canManageMethods", label: "Deposit methods", desc: "IBAN / crypto methods" },
  { key: "canAdjustBalance", label: "Balance adjustment", desc: "Direct balance add/remove + log" },
];

/** True when this admin is CRM view-only (no mutations). */
export function isCrmReadOnly(user: { crmReadOnly?: boolean | null }): boolean {
  return user.crmReadOnly === true;
}

/**
 * Mutating admin actions. Rejects crmReadOnly admins.
 * Optional `perm` still requires that can* flag (unchanged for full admins).
 */
export async function requireAdminWrite(perm?: AdminPermission) {
  const user = await requireAdmin();
  if (!user) return null;
  if (isCrmReadOnly(user as { crmReadOnly?: boolean })) return null;
  if (perm && (user as Record<string, unknown>)[perm] === false) return null;
  return user;
}

/** @deprecated Prefer requireAdmin for GET / requireAdminWrite for mutations.
 * Kept as an alias of requireAdminWrite so existing POST/PATCH/DELETE stay write-gated.
 */
export async function requireAdminPerm(perm?: AdminPermission) {
  return requireAdminWrite(perm);
}

export function permissionsOf(user: {
  role: string;
  canManageUsers?: boolean;
  canApproveDeposits?: boolean;
  canEditRates?: boolean;
  canManageMethods?: boolean;
  canAdjustBalance?: boolean;
  crmReadOnly?: boolean;
}) {
  const isAdmin = user.role === "ADMIN";
  const readOnly = isAdmin && user.crmReadOnly === true;
  // Read-only CRM admins: view-all, no can* write flags.
  if (readOnly) {
    return {
      isAdmin: true,
      crmReadOnly: true,
      canManageUsers: false,
      canApproveDeposits: false,
      canEditRates: false,
      canManageMethods: false,
      canAdjustBalance: false,
    };
  }
  return {
    isAdmin,
    crmReadOnly: false,
    canManageUsers: isAdmin && user.canManageUsers !== false,
    canApproveDeposits: isAdmin && user.canApproveDeposits !== false,
    canEditRates: isAdmin && user.canEditRates !== false,
    canManageMethods: isAdmin && user.canManageMethods !== false,
    canAdjustBalance: isAdmin && user.canAdjustBalance !== false,
  };
}


const ADMIN_BACKUP_COOKIE = "7fx_admin_backup";

/** Stash current admin session so impersonation can be reversed. */
export function attachAdminBackupCookie(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  token: string,
  host?: string | null
) {
  const opts = sessionCookieOptions(60 * 60 * 8, host); // 8h backup
  res.cookies.set(ADMIN_BACKUP_COOKIE, token, opts);
}

export function clearAdminBackupCookie(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  host?: string | null
) {
  const opts = sessionCookieOptions(0, host);
  res.cookies.set(ADMIN_BACKUP_COOKIE, "", opts);
}

export function readAdminBackupToken(): string | undefined {
  return cookies().get(ADMIN_BACKUP_COOKIE)?.value;
}

export async function writeAudit(opts: {
  adminId: string;
  action: string;
  targetId?: string | null;
  note?: string | null;
  meta?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: opts.adminId,
        action: opts.action,
        targetId: opts.targetId || null,
        note: opts.note || null,
        meta: opts.meta != null ? JSON.stringify(opts.meta) : null,
      },
    });
  } catch (e) {
    console.error("[audit]", e);
  }
}