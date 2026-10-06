import { NextResponse } from "next/server";
import { requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  await ensureDemoSeed();
  const methods = await prisma.depositMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ methods });
}

export async function POST(req: Request) {
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "").toUpperCase();
  if (type !== "IBAN" && type !== "CRYPTO") {
    return NextResponse.json({ error: "type must be IBAN or CRYPTO" }, { status: 400 });
  }
  const label = String(body.label || "").trim();
  if (!label) return NextResponse.json({ error: "label gerekli" }, { status: 400 });

  const method = await prisma.depositMethod.create({
    data: {
      type,
      label,
      active: body.active !== false,
      bankName: body.bankName ? String(body.bankName) : null,
      accountHolder: body.accountHolder ? String(body.accountHolder) : null,
      iban: body.iban ? String(body.iban) : null,
      asset: body.asset ? String(body.asset) : null,
      network: body.network ? String(body.network) : null,
      address: body.address ? String(body.address) : null,
      instructions: body.instructions ? String(body.instructions) : null,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    },
  });
  return NextResponse.json({ ok: true, method });
}

export async function PATCH(req: Request) {
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const key of [
    "label", "type", "bankName", "accountHolder", "iban",
    "asset", "network", "address", "instructions",
  ]) {
    if (body[key] !== undefined) data[key] = body[key] == null ? null : String(body[key]);
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;

  const method = await prisma.depositMethod.update({ where: { id }, data });
  return NextResponse.json({ ok: true, method });
}

export async function DELETE(req: Request) {
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  await prisma.depositMethod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
