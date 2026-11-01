import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allocateUniqueAccountLoginId } from "@/lib/account-login-id";
import { clientIpFromHeaders } from "@/lib/presence";
import { readOriginPayload, requestIpAllowed } from "@/lib/lead-origin";
import { composeOrigin, originCreateData, type PartnerFraud } from "@/lib/lead-origin-store";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomPassword(len = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

function clip(v: unknown, n: number): string {
  return String(v ?? "").trim().slice(0, n);
}

/**
 * Affiliate lead intake. Auth: Authorization: Bearer <partner token> or JSON `token`.
 * The partner token identifies who sent the lead. `source` is the network they claim
 * (google, taboola, …). Click ids, user agent, referrer, UTM and the visitor IP in
 * the body are stored and compared with that claim.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return NextResponse.json({ error: "JSON body required" }, { status: 400 });
    const header = req.headers.get("authorization") || "";
    const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
    const token = bearer || (typeof body.token === "string" ? body.token.trim() : "");
    if (!token) return NextResponse.json({ error: "Affiliate token required" }, { status: 401 });

    const partner = await prisma.affiliatePartner.findUnique({ where: { token } });
    if (!partner) return NextResponse.json({ error: "Unknown affiliate token" }, { status: 401 });
    if (!partner.active) return NextResponse.json({ error: "Affiliate is inactive" }, { status: 403 });

    const callerIp = clientIpFromHeaders(req.headers);
    if (!requestIpAllowed(callerIp, partner.allowedIps)) {
      return NextResponse.json({ error: "Caller IP is not allowed for this affiliate" }, { status: 403 });
    }

    const email = clip(body.email, 191).toLowerCase();
    const firstName = clip(body.firstName ?? body.first_name, 80);
    const lastName = clip(body.lastName ?? body.last_name, 80);
    const phone = clip(body.phone, 40) || null;
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    if (!firstName || !lastName) return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    if (!partner.allowDuplicatePhones && phone) {
      const digits = phone.replace(/\D/g, "");
      const dup = await prisma.user.findFirst({
        where: {
          role: "TRADER",
          OR: [{ phone }, ...(digits.length >= 7 ? [{ phone: { endsWith: digits.slice(-10) } }] : [])],
        },
        select: { id: true },
      });
      if (dup) return NextResponse.json({ error: "Duplicate phone" }, { status: 409 });
    }

    const payload = readOriginPayload(body, req.headers, { browser: false });
    let stream: { id: string; name: string; declaredSource: string; active: boolean } | null = null;
    if (payload.streamRef) {
      const streams = await prisma.affiliateStream.findMany({ where: { affiliateId: partner.id, active: true } });
      const ref = payload.streamRef.toLowerCase();
      const hit = streams.find((s) => s.id === payload.streamRef || s.name.toLowerCase() === ref);
      if (hit) stream = hit;
    }
    const fraudPartner: PartnerFraud = {
      id: partner.id,
      sourceKey: partner.sourceKey,
      checkOnFraud: partner.checkOnFraud,
      allowedSources: partner.allowedSources,
      active: partner.active,
    };
    const composed = await composeOrigin({
      signals: payload.signals,
      declaredSource: payload.declared,
      partner: fraudPartner,
      stream,
      leadIp: payload.leadIp,
      intakeIp: callerIp,
      intakeUserAgent: req.headers.get("user-agent"),
    });

    const supplied = typeof body.password === "string" ? body.password : "";
    const plainPassword = supplied.length >= 8 ? supplied : randomPassword(12);
    const passwordHash = await hashPassword(plainPassword);
    const accountLoginId = await allocateUniqueAccountLoginId();
    const name = `${firstName} ${lastName}`.trim();
    const language = clip(body.language, 8) || "en";
    const country = clip(body.country, 8) || composed.country;

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
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
          registrationDate: new Date(),
          language,
          country,
          registrationCountry: country,
          saleStatus: "NEW",
          affiliateA: partner.sourceKey.slice(0, 80),
          campaign: (composed.campaign || payload.declared || partner.sourceKey).slice(0, 191),
          referralCodeUsed: `aff:${partner.sourceKey}`.slice(0, 64),
          account: {
            create: { balance: 0, equity: 0, margin: 0, freeMargin: 0, leverage: 100, currency: "USD" },
          },
        },
        select: { id: true, accountLoginId: true },
      });
      await tx.leadOrigin.create({ data: originCreateData(created.id, composed) });
      return created;
    });

    return NextResponse.json(
      {
        ok: true,
        id: user.id,
        accountLoginId: user.accountLoginId,
        password: plainPassword,
      },
      { status: 201 }
    );
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "P2002") return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    console.error("[leads/intake]", e);
    return NextResponse.json({ error: "Could not accept the lead" }, { status: 500 });
  }
}
