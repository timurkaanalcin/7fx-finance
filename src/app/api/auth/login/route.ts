import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attachSessionCookie, signSessionToken, verifyPassword } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export async function POST(req: Request) {
  try {
    await ensureDemoSeed();
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
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
      user: { id: user.id, email: user.email, name: user.name, role },
    });
    attachSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Giriş hatası" }, { status: 500 });
  }
}
