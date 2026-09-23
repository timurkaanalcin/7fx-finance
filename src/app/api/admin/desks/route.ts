import { NextResponse } from "next/server";
import { requireAdminPerm, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const desks = await prisma.desk.findMany({ orderBy: { name: "asc" }, take: 200 });
  const enriched = await Promise.all(
    desks.map(async (d) => {
      const or = [
        { deskId: d.id },
        { desk: d.name },
        ...(d.code ? [{ deskId: d.code }] : []),
      ];
      const tradersCount = await prisma.user.count({
        where: { OR: or, role: "TRADER" },
      });
      const workersCount = await prisma.user.count({
        where: { OR: or, role: "ADMIN" },
      });
      return { ...d, tradersCount, workersCount };
    })
  );
  return NextResponse.json({ desks: enriched });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "İsim gerekli" }, { status: 400 });

  const desk = await prisma.desk.create({
    data: {
      name,
      code: body.code ? String(body.code).slice(0, 40) : null,
      active: body.active !== false,
      chatStatus: body.chatStatus !== false,
      minimalDeposit: Number.isFinite(Number(body.minimalDeposit)) ? Number(body.minimalDeposit) : 0,
      maximumDeposit: Number.isFinite(Number(body.maximumDeposit))
        ? Number(body.maximumDeposit)
        : 100000,
      tradePlatformLink: body.tradePlatformLink ? String(body.tradePlatformLink).slice(0, 300) : null,
      defaultEmail: body.defaultEmail ? String(body.defaultEmail).slice(0, 120) : null,
      office: body.office ? String(body.office).slice(0, 80) : null,
    },
  });
  await writeAudit({ adminId: admin.id, action: "CREATE_DESK", targetId: desk.id, meta: { name } });
  return NextResponse.json({ ok: true, desk });
}
