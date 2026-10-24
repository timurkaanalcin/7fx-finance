import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { allocateUniqueAccountLoginId } from "@/lib/account-login-id";
import { siteForIngestToken } from "@/lib/sites";

/**
 * Site customer ingest — lets other brand sites (MFX, …) push their customers into this CRM.
 *
 *   POST /api/ingest/customers
 *   Authorization: Bearer <per-site token from SITE_INGEST_TOKENS>
 *   { "customers": [ { "externalId": "123", "email": "a@b.com", "firstName": "A", "lastName": "B",
 *                       "phone": "+90…", "country": "TR", "language": "tr", "campaign": "…",
 *                       "registeredAt": "2026-10-01T10:00:00Z" } ] }
 *
 * The site key comes from the token only (a site can never write another site's customers).
 * Idempotent: matches by (site, externalId) then email. Existing rows of the same site get
 * contact fields refreshed (never balances/passwords/statuses). Emails owned by another site
 * are reported as "conflict" and left untouched. Max 200 per call.
 * Optional "passwordHash" (bcrypt only) is used on CREATE so the customer keeps their source-site
 * password; it is never applied to existing rows. Anything else → random unusable password.
 */

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BATCH = 200;
/** bcrypt ($2a/$2b/$2y, cost 10–14) — same algorithm bcryptjs verifies in lib/auth. */
const BCRYPT_RE = /^\$2[aby]\$(1[0-4])\$[./A-Za-z0-9]{53}$/;

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}

function str(v: unknown, max: number): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

export async function GET(req: Request) {
  const site = siteForIngestToken(bearer(req));
  if (!site) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const count = await prisma.user.count({ where: { site, role: "TRADER" } });
  return NextResponse.json({ ok: true, site, customers: count });
}

type Result = {
  index: number;
  status: "created" | "updated" | "conflict" | "error";
  email: string | null;
  externalId: string | null;
  id?: string;
  message?: string;
};

export async function POST(req: Request) {
  const site = siteForIngestToken(bearer(req));
  if (!site) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const list: unknown[] = Array.isArray(body?.customers)
    ? body.customers
    : body && typeof body === "object" && body.email
      ? [body]
      : [];
  if (!list.length) return NextResponse.json({ error: "customers[] required" }, { status: 400 });
  if (list.length > MAX_BATCH) {
    return NextResponse.json({ error: `Max ${MAX_BATCH} customers per request` }, { status: 413 });
  }

  const results: Result[] = [];
  for (let i = 0; i < list.length; i++) {
    const c = (list[i] || {}) as Record<string, unknown>;
    const email = str(c.email, 190)?.toLowerCase() ?? null;
    const externalId = str(c.externalId ?? c.id, 128);
    try {
      if (!email || !EMAIL_RE.test(email)) {
        results.push({ index: i, status: "error", email, externalId, message: "valid email required" });
        continue;
      }
      const firstName = str(c.firstName, 80);
      const lastName = str(c.lastName, 80);
      const name =
        str(c.name, 120) || [firstName, lastName].filter(Boolean).join(" ").slice(0, 120) || email.split("@")[0];
      const phone = str(c.phone, 40);
      const country = str(c.country, 80);
      const language = str(c.language, 16);
      const campaign = str(c.campaign ?? c.source, 120);
      const regRaw = str(c.registeredAt ?? c.createdAt, 40);
      const registrationDate = regRaw && !Number.isNaN(new Date(regRaw).getTime()) ? new Date(regRaw) : new Date();

      let existing: { id: string; site: string; email: string } | null = externalId
        ? await prisma.user.findFirst({ where: { site, siteExternalId: externalId }, select: { id: true, site: true, email: true } })
        : null;
      if (!existing) {
        existing = await prisma.user.findUnique({ where: { email }, select: { id: true, site: true, email: true } });
      }

      if (existing) {
        if ((existing.site || "7fx") !== site) {
          results.push({ index: i, status: "conflict", email, externalId, message: "email belongs to another site" });
          continue;
        }
        const data: Record<string, unknown> = {};
        if (firstName) data.firstName = firstName;
        if (lastName) data.lastName = lastName;
        if (firstName || lastName || c.name) data.name = name;
        if (phone) data.phone = phone;
        if (country) data.country = country;
        if (language) data.language = language;
        if (campaign) data.campaign = campaign;
        if (externalId) data.siteExternalId = externalId;
        if (Object.keys(data).length) await prisma.user.update({ where: { id: existing.id }, data });
        results.push({ index: i, status: "updated", email, externalId, id: existing.id });
        continue;
      }

      // New customer: carry a compatible bcrypt hash from the source site, else an unusable
      // random password (admin can set one in CRM). Empty account.
      const srcHash = typeof c.passwordHash === "string" ? c.passwordHash.trim() : "";
      const carriedHash = BCRYPT_RE.test(srcHash);
      const passwordHash = carriedHash
        ? srcHash
        : await hashPassword(randomBytes(24).toString("base64url"));
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
          country,
          registrationCountry: country,
          ...(language ? { language } : {}),
          campaign,
          role: "TRADER",
          active: true,
          registrationDate,
          saleStatus: "NEW",
          referralCodeUsed: `ingest:${site}`.slice(0, 64),
          site,
          siteExternalId: externalId,
          account: {
            create: { balance: 0, equity: 0, margin: 0, freeMargin: 0, leverage: 100, currency: "USD" },
          },
        },
        select: { id: true },
      });
      results.push({
        index: i,
        status: "created",
        email,
        externalId,
        id: user.id,
        message: carriedHash ? "password carried (bcrypt)" : "password reset needed",
      });
    } catch (e) {
      console.error("[ingest]", site, i, e);
      results.push({ index: i, status: "error", email, externalId, message: "server error" });
    }
  }

  const summary = results.reduce<Record<string, number>>((a, r) => {
    a[r.status] = (a[r.status] || 0) + 1;
    return a;
  }, {});
  console.info("[ingest] site=%s %j", site, summary);
  return NextResponse.json({ ok: true, site, summary, results });
}
