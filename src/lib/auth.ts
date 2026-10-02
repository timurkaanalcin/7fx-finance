import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { ensureDemoSeed } from "./ensure-seed";

const COOKIE_NAME = "7fx_session";
const LEGACY_COOKIE_NAME = "deskflow_session";

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
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
};

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
export function attachSessionCookie(res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } }, token: string) {
  const opts = sessionCookieOptions(60 * 60 * 24 * 7);
  res.cookies.set(COOKIE_NAME, token, opts);
  res.cookies.set(LEGACY_COOKIE_NAME, "", { ...opts, maxAge: 0 });
}

export function clearSessionCookie(res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } }) {
  const opts = sessionCookieOptions(0);
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
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: (payload.role as string) || "TRADER",
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
  return user;
}

export async function requireAdmin() {
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

export async function requireAdminPerm(perm?: AdminPermission) {
  const user = await requireAdmin();
  if (!user) return null;
  if (perm && (user as Record<string, unknown>)[perm] === false) return null;
  return user;
}

export function permissionsOf(user: {
  role: string;
  canManageUsers?: boolean;
  canApproveDeposits?: boolean;
  canEditRates?: boolean;
  canManageMethods?: boolean;
  canAdjustBalance?: boolean;
}) {
  const isAdmin = user.role === "ADMIN";
  return {
    isAdmin,
    canManageUsers: isAdmin && user.canManageUsers !== false,
    canApproveDeposits: isAdmin && user.canApproveDeposits !== false,
    canEditRates: isAdmin && user.canEditRates !== false,
    canManageMethods: isAdmin && user.canManageMethods !== false,
    canAdjustBalance: isAdmin && user.canAdjustBalance !== false,
  };
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
