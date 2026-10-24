import { NextResponse } from "next/server";
import { attachSessionCookie, signSessionToken } from "@/lib/auth";
import { autoLoginRedirectUrl, loginTokenCandidates } from "@/lib/auto-login";
import { hostnameFromRequest } from "@/lib/crm-host";
import { prisma } from "@/lib/prisma";
import { currentRequestMeta, markClientSignIn, recordLoginEvent } from "@/lib/presence";
import {
  LOGIN_DISABLED_CODE,
  loginDisabledFallbackMessage,
} from "@/lib/account-perms";

export const dynamic = "force-dynamic";

const BLOCK_COOKIE = "7fx_login_block_msg";

/**
 * GET ?token= — public timed auto-login, reusable until expiry unless maxUses is set.
 * No admin session required. Sets a normal trader session (not impersonation) and
 * redirects to /trade on the same host that stored the cookie.
 */
export async function GET(req: Request) {
  const fail = (msg: string) =>
    NextResponse.redirect(autoLoginRedirectUrl(req, `/login?error=${encodeURIComponent(msg)}`));

  try {
    const { searchParams } = new URL(req.url);
    const token = String(searchParams.get("token") || "").trim();
    if (!token) return fail("Missing login link");

    const candidates = loginTokenCandidates(token);
    let link: {
      id: string;
      userId: string;
      expiresAt: Date;
      createdAt: Date;
      revokedAt: Date | null;
      passwordSetAt: Date | null;
      maxUses: number;
      useCount: number;
      usedAt: Date | null;
      forcePasswordReset: boolean;
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        active: boolean;
        loginEnabled: boolean;
        loginBlockedMessage: string | null;
        language: string;
        passwordChangedAt: Date | null;
      } | null;
    } | null = null;
    for (const candidate of candidates) {
      link = await prisma.autoLoginLink.findUnique({
        where: { token: candidate },
        include: { user: true },
      });
      if (link) break;
    }
    if (!link) return fail("Invalid login link");

    const meta = currentRequestMeta();
    const failFor = async (msg: string, reason: string) => {
      await recordLoginEvent({ userId: link!.userId, success: false, method: "auto-login", reason, meta });
      return fail(msg);
    };
    if (link.revokedAt) return failFor("Login link revoked", "link_revoked");
    if (link.passwordSetAt) return failFor("Login link revoked", "link_password_set");
    if (link.expiresAt.getTime() < Date.now()) return failFor("Login link expired", "link_expired");
    if (link.maxUses > 0 && link.useCount >= link.maxUses) {
      return failFor("Login link already used", "link_used");
    }
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
        autoLoginRedirectUrl(req, `/login?loginBlocked=1&code=${encodeURIComponent(LOGIN_DISABLED_CODE)}`)
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

    const changedAt = link.user.passwordChangedAt;
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
      autoLoginLinkId: link.id,
    });

    const res = NextResponse.redirect(autoLoginRedirectUrl(req, "/trade"));
    attachSessionCookie(
      res,
      sessionToken,
      hostnameFromRequest({ headers: { get: (n: string) => req.headers.get(n) } })
    );
    return res;
  } catch (e) {
    console.error("[auto-login]", e);
    return fail("Sign-in error");
  }
}
