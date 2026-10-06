import { NextResponse } from "next/server";
import {
  attachSessionCookie,
  clearSessionCookie,
  getSession,
  hashPassword,
  signSessionToken,
  writeAudit,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentRequestMeta, recordLoginEvent } from "@/lib/presence";

export const dynamic = "force-dynamic";

/**
 * POST { password, passwordConfirm } — set a new password while mustChangePassword=true.
 * Re-issues the session cookie after passwordChangedAt so the current session stays valid.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No session" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    const res = NextResponse.json({ error: "No session" }, { status: 401 });
    clearSessionCookie(res);
    return res;
  }
  if (!user.mustChangePassword) {
    return NextResponse.json({ error: "Password change not required" }, { status: 400 });
  }
  // Impersonating admin should not set the trader password through this path.
  if (session.impersonatedBy) {
    return NextResponse.json(
      { error: "Cannot change password during impersonation" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  const passwordConfirm = String(body.passwordConfirm || body.confirm || "");
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (password !== passwordConfirm) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordChangedAt: now,
      mustChangePassword: false,
    },
  });

  const meta = currentRequestMeta();
  await recordLoginEvent({
    userId: user.id,
    success: true,
    method: "password",
    reason: "password_set",
    meta,
  });
  // Self-service forced reset — audit as system note on the user (no admin actor).
  try {
    await writeAudit({
      adminId: user.id,
      action: "FORCE_PASSWORD_SET",
      targetId: user.id,
      note: "Client set new password after forced-reset auto-login",
      meta: { via: "change-password" },
    });
  } catch {
    /* ignore */
  }

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "TRADER",
  });
  const res = NextResponse.json({ ok: true });
  attachSessionCookie(res, token);
  return res;
}
