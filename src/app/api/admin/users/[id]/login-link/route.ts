import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAdmin, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

const ALLOWED_MINUTES = [15, 30, 60, 120, 360, 720, 1440, 4320, 10080]; // up to 7d

type Ctx = { params: { id: string } };

/** POST — create time-limited auto-login link for trader (admin only). */
export async function POST(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const userId = String(params.id || "").trim();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === "ADMIN") {
    return NextResponse.json({ error: "Trader not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  let expiresInMinutes = Number(body.expiresInMinutes ?? 60);
  if (!Number.isFinite(expiresInMinutes) || expiresInMinutes <= 0) {
    expiresInMinutes = 60;
  }
  // Snap to nearest allowed or clamp
  if (!ALLOWED_MINUTES.includes(expiresInMinutes)) {
    expiresInMinutes =
      ALLOWED_MINUTES.find((m) => m >= expiresInMinutes) ?? ALLOWED_MINUTES[ALLOWED_MINUTES.length - 1];
  }
  // Links are reusable until expiry (no use limit).
  const maxUses = 0;
  const note = body.note != null ? String(body.note).slice(0, 255) : null;

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000);

  const link = await prisma.autoLoginLink.create({
    data: {
      token,
      userId,
      createdById: admin.id,
      expiresAt,
      maxUses,
      note,
    },
  });

  const path = `/api/auth/auto-login?token=${encodeURIComponent(token)}`;
  // Prefer browser Origin / Referer so copied links always match the public site,
  // even when Railway internals omit x-forwarded-host.
  const browserOrigin = (() => {
    const o = req.headers.get("origin");
    if (o) {
      try {
        const u = new URL(o);
        if (!u.hostname.startsWith("0.0.0.0") && u.hostname !== "localhost") return u.origin;
      } catch {
        /* ignore */
      }
    }
    const ref = req.headers.get("referer");
    if (ref) {
      try {
        const u = new URL(ref);
        if (!u.hostname.startsWith("0.0.0.0") && u.hostname !== "localhost") return u.origin;
      } catch {
        /* ignore */
      }
    }
    return null;
  })();
  const origin = browserOrigin || publicRequestOrigin(req);
  const url = `${origin}${path}`;

  await writeAudit({
    adminId: admin.id,
    action: "CREATE_AUTO_LOGIN_LINK",
    targetId: userId,
    meta: { linkId: link.id, expiresAt: expiresAt.toISOString(), maxUses },
  });

  return NextResponse.json({
    ok: true,
    id: link.id,
    url,
    path,
    token,
    expiresAt: expiresAt.toISOString(),
    expiresInMinutes,
    maxUses,
  });
}

/** GET — list recent links for this trader. */
export async function GET(_req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const userId = String(params.id || "").trim();
  const links = await prisma.autoLoginLink.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      expiresAt: true,
      usedAt: true,
      lastUsedAt: true,
      revokedAt: true,
      useCount: true,
      maxUses: true,
      note: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ links });
}

/** DELETE ?linkId= — revoke (expire now) a link for this trader. */
export async function DELETE(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const userId = String(params.id || "").trim();
  const linkId = String(new URL(req.url).searchParams.get("linkId") || "").trim();
  if (!linkId) return NextResponse.json({ error: "linkId required" }, { status: 400 });

  const link = await prisma.autoLoginLink.findFirst({ where: { id: linkId, userId } });
  if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  const now = new Date();
  await prisma.autoLoginLink.update({
    where: { id: link.id },
    data: { revokedAt: link.revokedAt ?? now, expiresAt: link.expiresAt < now ? link.expiresAt : now },
  });
  await writeAudit({
    adminId: admin.id,
    action: "REVOKE_AUTO_LOGIN_LINK",
    targetId: userId,
    meta: { linkId: link.id, useCount: link.useCount },
  });
  return NextResponse.json({ ok: true });
}
