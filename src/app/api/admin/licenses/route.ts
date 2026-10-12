import { NextResponse } from "next/server";
import { requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validLogo } from "@/lib/sponsors";

export const dynamic = "force-dynamic";

const all = () => prisma.license.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });

function httpsUrl(u: unknown): string | null {
  try {
    const p = new URL(String(u ?? "").trim());
    return p.protocol === "https:" ? p.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}
const str = (v: unknown, n = 200) => String(v ?? "").trim().slice(0, n);

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return NextResponse.json({ licenses: await all() });
}

export async function POST(req: Request) {
  if (!(await requireAdminPerm())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const regulator = str(b.regulator), number = str(b.number, 100), entity = str(b.entity);
  const registerUrl = httpsUrl(b.registerUrl);
  if (!regulator || !number || !entity) return NextResponse.json({ error: "Kurum, lisans no ve şirket adı gerekli" }, { status: 400 });
  if (!registerUrl) return NextResponse.json({ error: "Resmi kayıt URL'si https:// ile başlamalı" }, { status: 400 });
  if (b.logo && !validLogo(b.logo)) return NextResponse.json({ error: "Logo PNG/JPG/WEBP/GIF, ≤500 KB" }, { status: 400 });
  const max = await prisma.license.aggregate({ _max: { sortOrder: true } });
  const license = await prisma.license.create({
    data: { regulator, number, entity, registerUrl, logo: b.logo || null, active: b.active !== false, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  return NextResponse.json({ ok: true, license });
}

export async function PATCH(req: Request) {
  if (!(await requireAdminPerm())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (Array.isArray(b.order)) {
    const ids: string[] = b.order.map(String);
    await prisma.$transaction(ids.map((id, i) => prisma.license.update({ where: { id }, data: { sortOrder: i } })));
    return NextResponse.json({ ok: true, licenses: await all() });
  }
  const id = str(b.id);
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const data: Record<string, unknown> = {};
  for (const [k, n] of [["regulator", 200], ["number", 100], ["entity", 200]] as const) {
    if (b[k] !== undefined) {
      const v = str(b[k], n);
      if (!v) return NextResponse.json({ error: `${k} boş olamaz` }, { status: 400 });
      data[k] = v;
    }
  }
  if (b.registerUrl !== undefined) {
    const u = httpsUrl(b.registerUrl);
    if (!u) return NextResponse.json({ error: "URL https:// olmalı" }, { status: 400 });
    data.registerUrl = u;
  }
  if (b.active !== undefined) data.active = Boolean(b.active);
  if (b.logo !== undefined) {
    if (b.logo && !validLogo(b.logo)) return NextResponse.json({ error: "Geçersiz logo" }, { status: 400 });
    data.logo = b.logo || null;
  }
  const license = await prisma.license.update({ where: { id }, data });
  return NextResponse.json({ ok: true, license });
}

export async function DELETE(req: Request) {
  if (!(await requireAdminPerm())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  await prisma.license.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
