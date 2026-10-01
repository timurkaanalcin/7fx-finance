import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attachSessionCookie, signSessionToken, verifyPassword } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { isAccountLoginId } from "@/lib/account-login-id";

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
        { error: "E-posta veya hesap kimliği ve şifre gerekli" },
        { status: 400 }
      );
    }

    const user = isAccountLoginId(raw)
      ? await prisma.user.findUnique({ where: { accountLoginId: raw } })
      : await prisma.user.findUnique({ where: { email: raw.toLowerCase() } });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Geçersiz kimlik bilgileri" }, { status: 401 });
    }
    if ((user as { active?: boolean }).active === false) {
      return NextResponse.json({ error: "Hesap dondurulmuş" }, { status: 403 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
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
    return NextResponse.json({ error: "Giriş hatası" }, { status: 500 });
  }
}
