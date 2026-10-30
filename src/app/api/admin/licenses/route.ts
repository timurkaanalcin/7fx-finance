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

const OPTIONAL_TEXT = [
  ["licenseType", 255],
  ["jurisdiction", 255],
  ["status", 255],
  ["scope", 4000],
  ["address", 1000],
] as const;

function optionalText(v: unknown, n: number): string | null {
  const s = str(v, n);
  return s || null;
}

/** Empty clears the date. Anything else must be a real YYYY-MM-DD calendar day. */
function optionalDate(v: unknown): Date | null | "bad" {
  if (v == null || String(v).trim() === "") return null;
  const s = String(v).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "bad";
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return "bad";
  return d;
}

function applyOptional(data: Record<string, unknown>, b: Record<string, unknown>, present: (key: string) => boolean): string | null {
  for (const [key, max] of OPTIONAL_TEXT) {
    if (!present(key)) continue;
    data[key] = optionalText(b[key], max);
  }
  for (const key of ["issuedOn", "expiresOn"] as const) {
    if (!present(key)) continue;
    const date = optionalDate(b[key]);
    if (date === "bad") return "Date must be YYYY-MM-DD or blank";
    data[key] = date;
  }
  return null;
}

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
  const extra: Record<string, unknown> = {};
  const dateError = applyOptional(extra, b, () => true);
  if (dateError) return NextResponse.json({ error: dateError }, { status: 400 });
  const max = await prisma.license.aggregate({ _max: { sortOrder: true } });
  const license = await prisma.license.create({
    data: {
      regulator,
      number,
      entity,
      registerUrl,
      logo: b.logo || null,
      active: b.active !== false,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
      licenseType: (extra.licenseType as string | null) ?? null,
      jurisdiction: (extra.jurisdiction as string | null) ?? null,
      status: (extra.status as string | null) ?? null,
      issuedOn: (extra.issuedOn as Date | null) ?? null,
      expiresOn: (extra.expiresOn as Date | null) ?? null,
      scope: (extra.scope as string | null) ?? null,
      address: (extra.address as string | null) ?? null,
    },
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
  const dateError = applyOptional(data, b, (key) => b[key] !== undefined);
  if (dateError) return NextResponse.json({ error: dateError }, { status: 400 });
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
