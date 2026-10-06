import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const templates = await prisma.mailTemplate.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "create");

  if (action === "delete") {
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
    await prisma.mailTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (body.name != null) data.name = String(body.name).trim();
    if (body.subject != null) data.subject = String(body.subject).trim();
    if (body.body != null) data.body = String(body.body);
    if (body.deskName != null) data.deskName = String(body.deskName) || null;
    if (body.active != null) data.active = Boolean(body.active);
    await prisma.mailTemplate.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name || "").trim();
  const subject = String(body.subject || "").trim();
  const mailBody = String(body.body || "").trim();
  if (!name || !subject || !mailBody) {
    return NextResponse.json({ error: "name, subject, body zorunlu" }, { status: 400 });
  }
  const row = await prisma.mailTemplate.create({
    data: {
      name,
      subject,
      body: mailBody,
      deskName: body.deskName ? String(body.deskName) : null,
      active: body.active !== false,
    },
  });
  return NextResponse.json({ ok: true, id: row.id });
}
