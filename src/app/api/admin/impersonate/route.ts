import { NextResponse } from "next/server";
import {
  attachImpersonationCookie,
  attachSessionCookie,
  clearAdminBackupCookie,
  clearImpersonationCookie,
  clearSessionCookie,
  IMPERSONATION_TTL_SEC,
  readAdminBackupToken,
  readImpersonationToken,
  requireAdmin,
  signSessionToken,
  writeAudit,
} from "@/lib/auth";
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

function safeAdminReturn(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const path = raw.trim();
  if (!path.startsWith("/izcrm")) return fallback;
  if (path.startsWith("//") || path.includes("\\") || path.includes("://")) return fallback;
  return path.slice(0, 240);
}

/**
 * POST { userId, returnTo? } — same JSON the existing CRM "Open terminal" button
 * already consumes: { ok, redirect: "/trade", trader } or { error }.
 * The trader view is a separate 7fx_impersonation cookie. 7fx_session stays the admin.
 * DELETE { ok, redirect } ends that view. Sessions created by the previous build,
 * which replaced 7fx_session and stored 7fx_admin_backup, still restore on DELETE.
 */
export async function POST(req: Request) {
  const host = hostnameFromRequest({ headers: { get: (n: string) => req.headers.get(n) } });
  const admin = await requireAdmin();
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
  if (!target) {
    return NextResponse.json({ error: "Trader not found" }, { status: 404 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Bu hesap personel (ADMIN) rolünde; otomatik giriş/terminal sadece müşteri (TRADER) hesaplarında çalışır. Profil → Rol alanını Trader yapın.",
        code: "TARGET_IS_STAFF",
      },
      { status: 409 }
    );
  }
  if (target.active === false) {
    return NextResponse.json({ error: "Trader is frozen" }, { status: 400 });
  }

  const returnTo = safeAdminReturn(body.returnTo, `/izcrm/traders/${target.id}`);
  const traderToken = await signSessionToken(
    {
      userId: target.id,
      email: target.email,
      name: target.name,
      role: target.role || "TRADER",
      impersonatedBy: admin.id,
      returnTo,
    },
    `${IMPERSONATION_TTL_SEC}s`
  );

  const res = NextResponse.json({
    ok: true,
    redirect: "/trade",
    trader: { id: target.id, name: target.name, email: target.email },
  });
  attachImpersonationCookie(res, traderToken, host);

  await recordLoginEvent({
    userId: target.id,
    success: true,
    method: "impersonation",
    actorId: admin.id,
  });

  const at = new Date().toISOString();
  await writeAudit({
    adminId: admin.id,
    action: "IMPERSONATE_START",
    targetId: target.id,
    note: `Viewing as ${target.email}`,
    meta: { traderEmail: target.email, adminId: admin.id, userId: target.id, at },
  });

  return res;
}

/** DELETE — end the view-as session and return to the admin page. Admin cookie stays. */
export async function DELETE(req: Request) {
  const host = hostnameFromRequest({ headers: { get: (n: string) => req.headers.get(n) } });
  const imp = readImpersonationToken();
  if (imp) {
    let adminId = "";
    let userId = "";
    let redirect = "/izcrm";
    try {
      const { payload } = await jwtVerify(imp, getAuthSecret());
      adminId = typeof payload.impersonatedBy === "string" ? payload.impersonatedBy : "";
      userId = typeof payload.userId === "string" ? payload.userId : "";
      redirect = safeAdminReturn(payload.returnTo, userId ? `/izcrm/traders/${userId}` : "/izcrm");
    } catch {
      redirect = "/izcrm";
    }
    const res = NextResponse.json({ ok: true, redirect });
    clearImpersonationCookie(res, host);
    if (adminId) {
      await writeAudit({
        adminId,
        action: "IMPERSONATE_END",
        targetId: userId || null,
        meta: { adminId, userId: userId || null, at: new Date().toISOString() },
      });
    }
    return res;
  }

  // Legacy path: older builds replaced 7fx_session and kept an admin backup cookie.
  const backup = readAdminBackupToken();
  if (!backup) {
    return NextResponse.json({ error: "No admin backup session" }, { status: 400 });
  }
  try {
    const { payload } = await jwtVerify(backup, getAuthSecret());
    if ((payload.role as string) !== "ADMIN") {
      return NextResponse.json({ error: "Invalid backup" }, { status: 400 });
    }
    const res = NextResponse.json({ ok: true, redirect: "/izcrm" });
    attachSessionCookie(res, backup, host);
    clearAdminBackupCookie(res, host);
    await writeAudit({
      adminId: String(payload.userId),
      action: "IMPERSONATE_END",
      meta: { at: new Date().toISOString(), legacy: true },
    });
    return res;
  } catch {
    const res = NextResponse.json({ error: "Backup expired" }, { status: 400 });
    // Raw Set-Cookie lines cover the backup, the swapped session, and the view-as cookie.
    // Do not cookies.set on this response; that rewrite drops the appended lines.
    clearSessionCookie(res, host);
    return res;
  }
}
