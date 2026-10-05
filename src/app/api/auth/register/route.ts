import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attachSessionCookie, hashPassword, signSessionToken } from "@/lib/auth";
import { markClientSignIn, recordLoginEvent } from "@/lib/presence";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import {
  ensureSystemSettings,
  getReferralCode,
  isReferralRequired,
} from "@/lib/system-settings";
import { allocateUniqueAccountLoginId } from "@/lib/account-login-id";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERR_REFERRAL =
  "Enter a valid referral code.";
const ERR_REFERRAL_MISSING =
  "Referral code zorunludur. / Referral code is required.";

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
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
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
      return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const name = `${firstName} ${lastName}`.trim();
    const now = new Date();
    const accountLoginId = await allocateUniqueAccountLoginId();

    const user = await prisma.user.create({
      data: {
        email,
        accountLoginId,
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
            balance: 0,
            equity: 0,
            margin: 0,
            freeMargin: 0,
            leverage: 100,
            currency: "USD",
          },
        },
      },
    });

    await recordLoginEvent({ userId: user.id, success: true, method: "register" });
    await markClientSignIn(user);

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
        accountLoginId: user.accountLoginId,
      },
    });
    attachSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration error" }, { status: 500 });
  }
}
