import { NextResponse } from "next/server";
import { requireAdminPerm, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseMembershipUpdate, serializeUserMembership } from "@/lib/membership";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const id = ctx.params.id;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      account: true,
      notes: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
  if (!user) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });

  const [positions, orders, deposits, balanceRequests, ledger, communications, documents, reminders] =
    await Promise.all([
      prisma.position.findMany({
        where: { userId: id },
        orderBy: { openedAt: "desc" },
        take: 100,
      }),
      prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.depositRequest.findMany({
        where: { userId: id },
        include: { method: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.balanceRequest.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.balanceLedger.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.communication.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.documentRecord.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.reminder.findMany({
        where: { userId: id },
        orderBy: { remindAt: "asc" },
        take: 100,
      }),
    ]);

  const membership = serializeUserMembership(user as unknown as Record<string, unknown>);

  return NextResponse.json({
    user: membership,
    tradingAccountId: membership.tradingAccountId,
    notes: user.notes,
    positions,
    orders,
    deposits,
    balanceRequests,
    ledger,
    communications,
    documents,
    reminders,
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const id = ctx.params.id;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // Add note
  if (body.addNote) {
    const noteBody = String(body.addNote).trim().slice(0, 2000);
    if (!noteBody) {
      return NextResponse.json({ error: "Not boş olamaz" }, { status: 400 });
    }
    const note = await prisma.userNote.create({
      data: {
        userId: id,
        authorId: admin.id,
        authorName: admin.name,
        body: noteBody,
      },
    });
    await writeAudit({
      adminId: admin.id,
      action: "ADD_NOTE",
      targetId: id,
      note: noteBody.slice(0, 200),
    });
    return NextResponse.json({ ok: true, note });
  }

  const data = parseMembershipUpdate(body);
  if (body.active !== undefined && typeof body.active === "boolean") {
    if (target.id === admin.id && !body.active) {
      return NextResponse.json({ error: "Kendinizi donduramazsınız" }, { status: 400 });
    }
    const envAdmin = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!body.active && envAdmin && target.email === envAdmin) {
      return NextResponse.json(
        { error: "Prod ADMIN_EMAIL hesabı dondurulamaz" },
        { status: 400 }
      );
    }
    data.active = body.active;
  }
  if (body.role !== undefined) {
    const role = String(body.role).toUpperCase();
    if (role === "ADMIN" || role === "TRADER") {
      if (target.id === admin.id && role !== "ADMIN") {
        return NextResponse.json({ error: "Kendi admin rolünüzü kaldıramazsınız" }, { status: 400 });
      }
      data.role = role;
    }
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  // Sync name from first/last if needed
  if ((data.firstName !== undefined || data.lastName !== undefined) && data.name === undefined) {
    const fn = data.firstName !== undefined ? data.firstName : target.firstName;
    const ln = data.lastName !== undefined ? data.lastName : target.lastName;
    const composed = [fn, ln].filter(Boolean).join(" ").trim();
    if (composed) data.name = composed;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { account: true },
  });

  await writeAudit({
    adminId: admin.id,
    action: "UPDATE_MEMBERSHIP",
    targetId: id,
    meta: data,
  });

  return NextResponse.json({
    ok: true,
    user: serializeUserMembership(user as unknown as Record<string, unknown>),
  });
}
