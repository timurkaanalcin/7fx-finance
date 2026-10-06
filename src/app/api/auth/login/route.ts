import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attachSessionCookie, signSessionToken, verifyPassword } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { isAccountLoginId } from "@/lib/account-login-id";
import { currentRequestMeta, markClientSignIn, recordLoginEvent } from "@/lib/presence";
import {
  LOGIN_DISABLED_CODE,
  loginDisabledFallbackMessage,
} from "@/lib/account-perms";

export async function POST(req: Request) {
  try {
    await ensureDemoSeed();
    const body = await req.json();
    const raw = String(
      body.email || body.identifier || body.accountLoginId || ""
    ).trim();
    const password = String(body.password || "");
    if (!raw || !password) {
      return NextResponse.json(
        { error: "Email or account ID and password are required" },
        { status: 400 }
      );
    }

    const user = isAccountLoginId(raw)
      ? await prisma.user.findUnique({ where: { accountLoginId: raw } })
      : await prisma.user.findUnique({ where: { email: raw.toLowerCase() } });

    const meta = currentRequestMeta();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    // Wrong password first — never leak login-blocked message.
    if (!(await verifyPassword(password, user.passwordHash))) {
      await recordLoginEvent({ userId: user.id, success: false, method: "password", reason: "bad_password", meta });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    if ((user as { active?: boolean }).active === false) {
      await recordLoginEvent({ userId: user.id, success: false, method: "password", reason: "frozen", meta });
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
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await recordLoginEvent({ userId: user.id, success: true, method: "password", meta });
    await markClientSignIn(user, meta);
    const role = user.role || "TRADER";
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role,
    });
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        accountLoginId: user.accountLoginId ?? null,
      },
    });
    attachSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sign-in error" }, { status: 500 });
  }
}
