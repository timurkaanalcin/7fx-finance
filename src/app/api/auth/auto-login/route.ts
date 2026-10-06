import { NextResponse } from "next/server";
import { attachSessionCookie, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentRequestMeta, markClientSignIn, recordLoginEvent } from "@/lib/presence";
import { publicAbsoluteUrl } from "@/lib/request-origin";
import {
  LOGIN_DISABLED_CODE,
  loginDisabledFallbackMessage,
} from "@/lib/account-perms";

export const dynamic = "force-dynamic";

const BLOCK_COOKIE = "7fx_login_block_msg";

/**
 * GET ?token= — public timed auto-login, reusable until expiry (no admin session required).
 * Sets a normal trader session (not impersonation) and redirects to /trade.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = String(searchParams.get("token") || "").trim();
  const fail = (msg: string) =>
    NextResponse.redirect(new URL(publicAbsoluteUrl(req, `/login?error=${encodeURIComponent(msg)}`)));

  if (!token) return fail("Missing login link");

  const link = await prisma.autoLoginLink.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!link) return fail("Invalid login link");
  const meta = currentRequestMeta();
  const failFor = async (msg: string, reason: string) => {
    await recordLoginEvent({ userId: link.userId, success: false, method: "auto-login", reason, meta });
    return fail(msg);
  };
  if (link.revokedAt) return failFor("Login link revoked", "link_revoked");
  if (link.expiresAt.getTime() < Date.now()) return failFor("Login link expired", "link_expired");
  if (!link.user || link.user.active === false) return failFor("Account unavailable", "frozen");

  if (link.user.loginEnabled === false) {
    await recordLoginEvent({
      userId: link.userId,
      success: false,
      method: "auto-login",
      reason: "login_disabled",
      meta,
    });
    const message =
      (link.user.loginBlockedMessage && String(link.user.loginBlockedMessage).trim()) ||
      loginDisabledFallbackMessage(link.user.language);
    const res = NextResponse.redirect(
      new URL(
        publicAbsoluteUrl(
          req,
          `/login?loginBlocked=1&code=${encodeURIComponent(LOGIN_DISABLED_CODE)}`
        )
      )
    );
    // Short-lived cookie (base64url) so the login page can show the admin message verbatim.
    // Avoid encodeURIComponent here — the cookie serializer would double-encode and break newlines.
    const encodedMsg = Buffer.from(message, "utf8").toString("base64url");
    res.cookies.set(BLOCK_COOKIE, encodedMsg, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  }

  const changedAt = (link.user as { passwordChangedAt?: Date | null }).passwordChangedAt;
  if (changedAt && changedAt.getTime() > link.createdAt.getTime()) {
    return failFor("Login link invalid after password change", "password_changed");
  }

  const now = new Date();
  await prisma.autoLoginLink.update({
    where: { id: link.id },
    data: {
      useCount: { increment: 1 },
      usedAt: link.usedAt ?? now,
      lastUsedAt: now,
    },
  });

  await prisma.user.update({
    where: { id: link.userId },
    data: { lastLoginAt: now },
  });
  await recordLoginEvent({ userId: link.userId, success: true, method: "auto-login", meta });
  await markClientSignIn(link.user, meta);

  if (link.forcePasswordReset) {
    await prisma.user.update({
      where: { id: link.userId },
      data: { mustChangePassword: true },
    });
  }

  const sessionToken = await signSessionToken({
    userId: link.user.id,
    email: link.user.email,
    name: link.user.name,
    role: link.user.role || "TRADER",
  });

  const res = NextResponse.redirect(new URL(publicAbsoluteUrl(req, "/trade")));
  attachSessionCookie(res, sessionToken);
  return res;
}
