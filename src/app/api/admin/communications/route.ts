import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "").trim();
  const where = type ? { type } : undefined;

  const rows = await prisma.communication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { id: true, name: true, email: true, desk: true } } },
  });

  return NextResponse.json({
    communications: rows.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      description: c.description,
      workerName: c.workerName,
      workerId: c.workerId,
      traderId: c.userId,
      trader: c.user.name,
      traderEmail: c.user.email,
      desk: c.user.desk,
      createdAt: c.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "").trim();
  const type = String(body.type || "NOTE").toUpperCase();
  const title = body.title != null ? String(body.title).trim() : null;
  const description = String(body.description || "").trim();
  if (!userId || !description) {
    return NextResponse.json({ error: "userId ve description zorunlu" }, { status: 400 });
  }
  if (!["CHAT", "CALL", "NOTE"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Trader not found" }, { status: 404 });

  const row = await prisma.communication.create({
    data: {
      userId,
      type,
      title,
      description,
      workerName: admin.name,
      workerId: admin.id,
    },
  });
  return NextResponse.json({ ok: true, id: row.id });
}
