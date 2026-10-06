import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let groups = await prisma.tradingGroup.findMany({ orderBy: { name: "asc" } });
  if (!groups.length) {
    // Derive from user tradingGroup field
    const distinct = await prisma.user.findMany({
      where: { tradingGroup: { not: null } },
      select: { tradingGroup: true },
      distinct: ["tradingGroup"],
      take: 50,
    });
    groups = await Promise.all(
      distinct
        .filter((d) => d.tradingGroup)
        .map(async (d) => {
          const name = d.tradingGroup as string;
          const count = await prisma.user.count({ where: { tradingGroup: name } });
          return {
            id: name,
            name,
            description: null,
            customersCount: count,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        })
    );
  } else {
    groups = await Promise.all(
      groups.map(async (g) => {
        const count = await prisma.user.count({ where: { tradingGroup: g.name } });
        return { ...g, customersCount: count };
      })
    );
  }
  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name gerekli" }, { status: 400 });
  const group = await prisma.tradingGroup.create({
    data: {
      name,
      description: body.description ? String(body.description).slice(0, 500) : null,
    },
  });
  return NextResponse.json({ ok: true, group });
}
