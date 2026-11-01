import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadAffiliateReport } from "@/lib/affiliate-load";
import { breakdownOf } from "@/lib/affiliate-report";
import { parsePartnerWrite } from "@/lib/affiliate-partner";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const partner = await prisma.affiliatePartner.findUnique({
    where: { id: params.id },
    include: { streams: { orderBy: { createdAt: "desc" } } },
  });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const period = new URL(req.url).searchParams.get("period") || "month";
  const report = await loadAffiliateReport(admin, { period, capture: partner.sourceKey });
  const s = report.rows.find((r) => r.name === partner.sourceKey);
  return NextResponse.json({
    period,
    partner: {
      id: partner.id,
      sourceKey: partner.sourceKey,
      name: partner.name,
      surname: partner.surname,
      email: partner.email,
      token: partner.token,
      active: partner.active,
      checkOnFraud: partner.checkOnFraud,
      allowDuplicatePhones: partner.allowDuplicatePhones,
      allowedIps: partner.allowedIps,
      allowedSources: partner.allowedSources,
      note: partner.note,
      callbackUrl: partner.callbackUrl,
      createdAt: partner.createdAt,
    },
    stats: {
      leads: s?.leads ?? 0,
      valid: s?.valid ?? 0,
      invalid: s?.invalid ?? 0,
      deposits: s?.deposits ?? 0,
      ftd: s?.ftd ?? 0,
      mismatch: s?.mismatch ?? 0,
      tracked: s?.tracked ?? 0,
      reasons: s?.reasons ?? {},
    },
    breakdown: breakdownOf(report.captured),
    leads: report.captured,
    leadsTruncated: report.capturedTruncated,
    streams: partner.streams,
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const existing = await prisma.affiliatePartner.findUnique({ where: { id: params.id }, select: { id: true, sourceKey: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parsePartnerWrite(body, "patch");
  if (parsed.error || !parsed.data || !Object.keys(parsed.data).length) {
    return NextResponse.json({ error: parsed.error || "Nothing to save" }, { status: 400 });
  }
  const data = { ...parsed.data };
  if (data.sourceKey && data.sourceKey !== existing.sourceKey) {
    const clash = await prisma.affiliatePartner.findUnique({ where: { sourceKey: data.sourceKey }, select: { id: true } });
    if (clash && clash.id !== existing.id) return NextResponse.json({ error: "An account with this source name already exists" }, { status: 409 });
  }
  try {
    const row = await prisma.affiliatePartner.update({ where: { id: existing.id }, data });
    await writeAudit({ adminId: admin.id, action: "AFFILIATE_UPDATE", targetId: row.id, note: row.sourceKey });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("[affiliate] update", e);
    return NextResponse.json({ error: "Could not save the account" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const existing = await prisma.affiliatePartner.findUnique({ where: { id: params.id }, select: { id: true, sourceKey: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.affiliatePartner.delete({ where: { id: existing.id } });
  await writeAudit({ adminId: admin.id, action: "AFFILIATE_DELETE", targetId: existing.id, note: existing.sourceKey });
  return NextResponse.json({ ok: true });
}
