import { NextResponse } from "next/server";
import { requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiOrder, cleanUrl, validLogo, type SponsorRow } from "@/lib/sponsors";

export const dynamic = "force-dynamic";

async function all() {
  return prisma.sponsor.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return NextResponse.json({ sponsors: await all() });
}

export async function POST(req: Request) {
  const admin = await requireAdminPerm();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 120);
  if (!name) return NextResponse.json({ error: "İsim gerekli" }, { status: 400 });
  if (!validLogo(body.logo))
    return NextResponse.json({ error: "Logo PNG/JPG/WEBP/GIF olmalı, en fazla ~500 KB" }, { status: 400 });
  const max = await prisma.sponsor.aggregate({ _max: { sortOrder: true } });
  const sponsor = await prisma.sponsor.create({
    data: {
      name,
      url: cleanUrl(body.url),
      logo: body.logo,
      logoW: Math.max(0, Number(body.logoW) || 0),
      logoH: Math.max(0, Number(body.logoH) || 0),
      priority: Math.max(0, Math.min(10, Number(body.priority) || 0)),
      active: body.active !== false,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ ok: true, sponsor });
}

export async function PATCH(req: Request) {
  const admin = await requireAdminPerm();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  // Reorder: { order: [id...] } or { ai: true }
  if (Array.isArray(body.order) || body.ai === true) {
    let ids: string[] = Array.isArray(body.order) ? body.order.map(String) : [];
    if (body.ai === true) ids = aiOrder((await all()) as SponsorRow[]).map((s) => s.id);
    await prisma.$transaction(
      ids.map((id, i) => prisma.sponsor.update({ where: { id }, data: { sortOrder: i } }))
    );
    return NextResponse.json({ ok: true, sponsors: await all() });
  }

  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const n = String(body.name).trim().slice(0, 120);
    if (!n) return NextResponse.json({ error: "İsim boş olamaz" }, { status: 400 });
    data.name = n;
  }
  if (body.url !== undefined) data.url = cleanUrl(body.url);
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.priority !== undefined) data.priority = Math.max(0, Math.min(10, Number(body.priority) || 0));
  if (body.logo !== undefined) {
    if (!validLogo(body.logo)) return NextResponse.json({ error: "Geçersiz logo" }, { status: 400 });
    data.logo = body.logo;
    data.logoW = Math.max(0, Number(body.logoW) || 0);
    data.logoH = Math.max(0, Number(body.logoH) || 0);
  }
  const sponsor = await prisma.sponsor.update({ where: { id }, data });
  return NextResponse.json({ ok: true, sponsor });
}

export async function DELETE(req: Request) {
  const admin = await requireAdminPerm();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  await prisma.sponsor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
