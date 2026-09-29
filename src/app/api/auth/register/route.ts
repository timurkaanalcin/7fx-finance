import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import {
  ensureSystemSettings,
  getReferralCode,
  isReferralRequired,
} from "@/lib/system-settings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERR_REFERRAL =
  "Geçerli bir referans kodu girin. / Enter a valid referral code.";
const ERR_REFERRAL_MISSING =
  "Referans kodu zorunludur. / Referral code is required.";

export async function POST(req: Request) {
  try {
    await ensureDemoSeed();
    await ensureSystemSettings();
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const phoneRaw = body.phone != null ? String(body.phone).trim() : "";
    const phone = phoneRaw || null;
    const referralCode = String(body.referralCode || "").trim();

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Ad ve soyad gerekli" }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta girin" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Şifre en az 8 karakter olmalı" }, { status: 400 });
    }

    const required = await isReferralRequired();
    if (required) {
      if (!referralCode) {
        return NextResponse.json({ error: ERR_REFERRAL_MISSING }, { status: 400 });
      }
      const expected = await getReferralCode();
      if (referralCode !== expected) {
        return NextResponse.json({ error: ERR_REFERRAL }, { status: 400 });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const name = `${firstName} ${lastName}`.trim();
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        firstName,
        lastName,
        phone,
        role: "TRADER",
        active: true,
        registrationDate: now,
        referralCodeUsed: referralCode || null,
        account: {
          create: {
            balance: 10000,
            equity: 10000,
            margin: 0,
            freeMargin: 10000,
            leverage: 100,
            currency: "USD",
          },
        },
      },
    });

    const role = user.role || "TRADER";
    await createSession({ userId: user.id, email: user.email, name: user.name, role });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kayıt hatası" }, { status: 500 });
  }
}
