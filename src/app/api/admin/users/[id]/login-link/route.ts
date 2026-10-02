import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAdmin, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_MINUTES = [15, 30, 60, 120, 360, 720, 1440, 4320, 10080]; // up to 7d

type Ctx = { params: { id: string } };

/** POST — create time-limited auto-login link for trader. */
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
  const maxUses = body.maxUses == null ? 1 : Math.max(0, Math.min(100, Number(body.maxUses) || 1));
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

  const origin =
    req.headers.get("x-forwarded-host")
      ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host")}`
      : new URL(req.url).origin;
  const url = `${origin}/api/auth/auto-login?token=${encodeURIComponent(token)}`;

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
      token: true,
      expiresAt: true,
      usedAt: true,
      useCount: true,
      maxUses: true,
      note: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ links });
}
