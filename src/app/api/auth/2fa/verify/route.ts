import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { authenticator } from "otplib";
import { prisma } from "@/lib/prisma";
import { attachSessionCookie, permissionsOf, signSessionToken } from "@/lib/auth";
import { hostnameFromRequest } from "@/lib/crm-host";
import { currentRequestMeta, markClientSignIn, recordLoginEvent } from "@/lib/presence";
import { clientIpFromHeaders, deviceFingerprint } from "@/lib/security/fingerprint";
import { rateLimit } from "@/lib/security/rate-limit";

function authSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "deskflow-trade-demo-secret");
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export async function POST(req: Request) {
  const ip = clientIpFromHeaders({ get: (n) => req.headers.get(n) });
  const rl = rateLimit(`2fa:ip:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const challengeToken = String(body.challengeToken || "");
  const code = String(body.code || "").replace(/\s+/g, "");
  if (!challengeToken || !code) {
    return NextResponse.json({ error: "challengeToken and code required" }, { status: 400 });
  }

  let userId: string;
  try {
    const { payload } = await jwtVerify(challengeToken, authSecret());
    if (payload.purpose !== "2fa" || typeof payload.userId !== "string") {
      return NextResponse.json({ error: "Invalid challenge" }, { status: 401 });
    }
    userId = payload.userId;
  } catch {
    return NextResponse.json({ error: "Challenge expired" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN" || !(user as { totpEnabled?: boolean }).totpEnabled) {
    return NextResponse.json({ error: "Invalid challenge" }, { status: 401 });
  }
  const secret = (user as { totpSecret?: string | null }).totpSecret;
  if (!secret || !authenticator.check(code, secret)) {
    const meta = currentRequestMeta();
    await recordLoginEvent({
      userId: user.id,
      success: false,
      method: "password",
      reason: "bad_2fa",
      meta,
    });
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  const meta = currentRequestMeta();
  await recordLoginEvent({ userId: user.id, success: true, method: "password", meta });
  await markClientSignIn(user, meta);

  const ua = req.headers.get("user-agent") || "";
  const fp = deviceFingerprint(ip, ua);
  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    ipHash: fp.ipHash,
    uaHash: fp.uaHash,
  });
  const permissions = permissionsOf(user);
  const host = hostnameFromRequest({ headers: { get: (n) => req.headers.get(n) } });
  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      accountLoginId: user.accountLoginId ?? null,
      crmReadOnly: permissions.crmReadOnly === true,
      totpEnabled: true,
    },
    permissions,
  });
  attachSessionCookie(res, token, host);
  return res;
}
