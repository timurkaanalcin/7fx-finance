import { NextResponse } from "next/server";
import { attachAdminBackupCookie, attachSessionCookie, clearAdminBackupCookie, clearSessionCookie, readAdminBackupToken, signSessionToken, writeAudit, getSession, requireAdminWrite } from "@/lib/auth";
import { hostnameFromRequest } from "@/lib/crm-host";
import { prisma } from "@/lib/prisma";
import { isTerminalImpersonationEnabled } from "@/lib/system-settings";
import { jwtVerify } from "jose";
import { recordLoginEvent } from "@/lib/presence";

export const dynamic = "force-dynamic";

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production"
      ? undefined
      : "deskflow-trade-demo-secret");
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

/** POST { userId } — switch session to trader (admin impersonation). */
export async function POST(req: Request) {
  const host = hostnameFromRequest({ headers: { get: (n: string) => req.headers.get(n) } });
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const enabled = await isTerminalImpersonationEnabled();
  if (!enabled) {
    return NextResponse.json(
      { error: "Terminal impersonation is disabled in system settings" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "").trim();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role === "ADMIN") {
    return NextResponse.json({ error: "Trader not found" }, { status: 404 });
  }
  if (target.active === false) {
    return NextResponse.json({ error: "Trader is frozen" }, { status: 400 });
  }

  const session = await getSession();
  const adminToken = await signSessionToken({
    userId: admin.id,
    email: admin.email,
    name: admin.name,
    role: "ADMIN",
  });

  const traderToken = await signSessionToken({
    userId: target.id,
    email: target.email,
    name: target.name,
    role: target.role || "TRADER",
    impersonatedBy: admin.id,
  });

  const res = NextResponse.json({
    ok: true,
    redirect: "/trade",
    trader: { id: target.id, name: target.name, email: target.email },
  });
  // Keep admin backup from current cookie if already impersonating, else stash admin
  if (!session?.impersonatedBy) {
    attachAdminBackupCookie(res, adminToken, host);
  }
  attachSessionCookie(res, traderToken, host);

  // Audit row on the client's login history; deliberately does NOT touch client presence (lastSeenAt).
  await recordLoginEvent({ userId: target.id, success: true, method: "impersonation", actorId: admin.id });

  await writeAudit({
    adminId: admin.id,
    action: "IMPERSONATE_START",
    targetId: target.id,
    meta: { traderEmail: target.email },
  });

  return res;
}

/** DELETE — exit impersonation and restore admin session from backup cookie. */
export async function DELETE(req: Request) {
  const host = hostnameFromRequest({ headers: { get: (n: string) => req.headers.get(n) } });
  const backup = readAdminBackupToken();
  if (!backup) {
    const res = NextResponse.json({ error: "No admin backup session" }, { status: 400 });
    return res;
  }
  try {
    const { payload } = await jwtVerify(backup, getAuthSecret());
    if ((payload.role as string) !== "ADMIN") {
      return NextResponse.json({ error: "Invalid backup" }, { status: 400 });
    }
    const res = NextResponse.json({ ok: true, redirect: "/izcrm" });
    attachSessionCookie(res, backup, host);
    clearAdminBackupCookie(res);
    await writeAudit({
      adminId: String(payload.userId),
      action: "IMPERSONATE_END",
      meta: {},
    });
    return res;
  } catch {
    const res = NextResponse.json({ error: "Backup expired" }, { status: 400 });
    clearAdminBackupCookie(res);
    clearSessionCookie(res, host);
    return res;
  }
}
