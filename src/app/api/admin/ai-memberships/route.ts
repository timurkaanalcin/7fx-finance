import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planById } from "@/lib/ai-membership";

export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: H });
  const status = new URL(req.url).searchParams.get("status") || undefined;
  // Auto-mark expired
  await prisma.aiMembership.updateMany({ where: { status: "ACTIVE", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } });
  const rows = await prisma.aiMembership.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 500 });
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(new Set(rows.map((r) => r.userId))) } },
    select: { id: true, name: true, email: true, accountLoginId: true },
  });
  const um = new Map(users.map((u) => [u.id, u]));
  return NextResponse.json({ memberships: rows.map((r) => ({ ...r, user: um.get(r.userId) ?? null })) }, { headers: H });
}

/** PATCH {id, action: activate|extend|cancel, days?} */
export async function PATCH(req: Request) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: H });
  const b = (await req.json().catch(() => ({}))) as { id?: string; action?: string; days?: number };
  const row = b.id ? await prisma.aiMembership.findUnique({ where: { id: b.id } }) : null;
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404, headers: H });
  const days = Math.max(1, Math.min(3650, Number(b.days) || planById(row.plan)?.days || 30));
  const now = new Date();
  let data: Record<string, unknown>;
  if (b.action === "activate" || b.action === "extend") {
    const base = row.status === "ACTIVE" && row.expiresAt && row.expiresAt > now ? row.expiresAt : now;
    data = { status: "ACTIVE", expiresAt: new Date(base.getTime() + days * 86400_000), activatedAt: row.activatedAt ?? now, activatedBy: admin.id };
  } else if (b.action === "cancel") {
    data = { status: "CANCELLED" };
  } else return NextResponse.json({ error: "bad_action" }, { status: 400, headers: H });
  const updated = await prisma.aiMembership.update({ where: { id: row.id }, data });
  await writeAudit({ adminId: admin.id, action: `ai_membership_${b.action}`, targetId: row.userId, meta: { id: row.id, days } });
  return NextResponse.json({ ok: true, membership: updated }, { headers: H });
}
