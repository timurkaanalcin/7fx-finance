import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { attachSessionCookie, permissionsOf, signSessionToken, verifyPassword } from "@/lib/auth";
import { hostnameFromRequest } from "@/lib/crm-host";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { isAccountLoginId } from "@/lib/account-login-id";
import { currentRequestMeta, markClientSignIn, recordLoginEvent } from "@/lib/presence";
import {
  LOGIN_DISABLED_CODE,
  loginDisabledFallbackMessage,
} from "@/lib/account-perms";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIpFromHeaders, deviceFingerprint } from "@/lib/security/fingerprint";

const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;

function authSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "deskflow-trade-demo-secret");
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export async function sign2faChallenge(userId: string): Promise<string> {
  return new SignJWT({ purpose: "2fa", userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(authSecret());
}

export async function POST(req: Request) {
  try {
    await ensureDemoSeed();
    const ip = clientIpFromHeaders({ get: (n) => req.headers.get(n) });
    const rl = rateLimit(`login:ip:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later.", code: "RATE_LIMIT" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const raw = String(
      body.email || body.identifier || body.accountLoginId || body.username || ""
    ).trim();
    const password = String(body.password || "");
    if (!raw || !password) {
      return NextResponse.json(
        { error: "Email, username or account ID and password are required" },
        { status: 400 }
      );
    }

    const idRl = rateLimit(`login:id:${raw.toLowerCase()}`, 12, 60_000);
    if (!idRl.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later.", code: "RATE_LIMIT" },
        { status: 429, headers: { "Retry-After": String(idRl.retryAfterSec) } }
      );
    }

    let user =
      isAccountLoginId(raw)
        ? await prisma.user.findUnique({ where: { accountLoginId: raw } })
        : null;
    if (!user && raw.includes("@")) {
      user = await prisma.user.findUnique({ where: { email: raw.toLowerCase() } });
    }
    if (!user) {
      const key = raw.toLowerCase();
      user = await prisma.user.findFirst({
        where: { OR: [{ username: key }, { email: key }] },
      });
    }

    const meta = currentRequestMeta();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const lockedUntil = (user as { lockedUntil?: Date | null }).lockedUntil;
    if (lockedUntil && lockedUntil.getTime() > Date.now()) {
      await recordLoginEvent({
        userId: user.id,
        success: false,
        method: "password",
        reason: "locked",
        meta,
      });
      return NextResponse.json(
        {
          error: "Account temporarily locked after failed logins",
          code: "LOCKED",
          lockedUntil: lockedUntil.toISOString(),
        },
        { status: 423 }
      );
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      const fails = ((user as { failedLoginCount?: number }).failedLoginCount || 0) + 1;
      const patch: { failedLoginCount: number; lockedUntil?: Date } = {
        failedLoginCount: fails,
      };
      if (fails >= LOCK_AFTER) {
        patch.lockedUntil = new Date(Date.now() + LOCK_MS);
        patch.failedLoginCount = 0;
      }
      await prisma.user.update({ where: { id: user.id }, data: patch });
      await recordLoginEvent({
        userId: user.id,
        success: false,
        method: "password",
        reason: "bad_password",
        meta,
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if ((user as { active?: boolean }).active === false) {
      await recordLoginEvent({
        userId: user.id,
        success: false,
        method: "password",
        reason: "frozen",
        meta,
      });
      return NextResponse.json({ error: "Account frozen" }, { status: 403 });
    }
    if ((user as { loginEnabled?: boolean }).loginEnabled === false) {
      await recordLoginEvent({
        userId: user.id,
        success: false,
        method: "password",
        reason: "login_disabled",
        meta,
      });
      const message =
        ((user as { loginBlockedMessage?: string | null }).loginBlockedMessage &&
          String((user as { loginBlockedMessage?: string | null }).loginBlockedMessage).trim()) ||
        loginDisabledFallbackMessage((user as { language?: string }).language);
      return NextResponse.json(
        {
          error: loginDisabledFallbackMessage((user as { language?: string }).language),
          code: LOGIN_DISABLED_CODE,
          message,
        },
        { status: 403 }
      );
    }

    // Reset lockout counters on good password
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const role = user.role || "TRADER";
    const totpEnabled = (user as { totpEnabled?: boolean }).totpEnabled === true;

    // ADMIN with 2FA: issue short challenge, no session yet
    if (role === "ADMIN" && totpEnabled) {
      const challengeToken = await sign2faChallenge(user.id);
      await recordLoginEvent({
        userId: user.id,
        success: false,
        method: "password",
        reason: "awaiting_2fa",
        meta,
      });
      return NextResponse.json({
        ok: true,
        requires2fa: true,
        challengeToken,
        user: { id: user.id, email: user.email, name: user.name, role },
      });
    }

    await recordLoginEvent({ userId: user.id, success: true, method: "password", meta });
    await markClientSignIn(user, meta);

    const ua = req.headers.get("user-agent") || "";
    const fp = deviceFingerprint(ip, ua);
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role,
      ...(role === "ADMIN" ? { ipHash: fp.ipHash, uaHash: fp.uaHash } : {}),
    });
    const permissions = permissionsOf(user);
    const host = hostnameFromRequest({ headers: { get: (n: string) => req.headers.get(n) } });
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        accountLoginId: user.accountLoginId ?? null,
        crmReadOnly: permissions.crmReadOnly === true,
        totpEnabled,
      },
      permissions,
    });
    attachSessionCookie(res, token, host);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sign-in error" }, { status: 500 });
  }
}
