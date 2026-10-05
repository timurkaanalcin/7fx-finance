import { NextResponse } from "next/server";
import { attachSessionCookie, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentRequestMeta, markClientSignIn, recordLoginEvent } from "@/lib/presence";

export const dynamic = "force-dynamic";

/** GET ?token= — redeem auto-login link, set session, redirect to /trade */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = String(searchParams.get("token") || "").trim();
  const fail = (msg: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url));

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
  if (link.expiresAt.getTime() < Date.now()) return failFor("Login link expired", "link_expired");
  if (link.maxUses > 0 && link.useCount >= link.maxUses) return failFor("Login link already used", "link_used");
  if (!link.user || link.user.active === false) return failFor("Account unavailable", "frozen");

  await prisma.autoLoginLink.update({
    where: { id: link.id },
    data: {
      useCount: { increment: 1 },
      usedAt: link.usedAt ?? new Date(),
    },
  });

  await prisma.user.update({
    where: { id: link.userId },
    data: { lastLoginAt: new Date() },
  });
  await recordLoginEvent({ userId: link.userId, success: true, method: "auto-login", meta });
  await markClientSignIn(link.user, meta);

  const sessionToken = await signSessionToken({
    userId: link.user.id,
    email: link.user.email,
    name: link.user.name,
    role: link.user.role || "TRADER",
  });

  const res = NextResponse.redirect(new URL("/trade", req.url));
  attachSessionCookie(res, sessionToken);
  return res;
}
