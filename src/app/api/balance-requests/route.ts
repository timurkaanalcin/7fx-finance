import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAccountMetrics, processPendingOrders, checkSlTp } from "@/lib/trading";
import { isMarginCall } from "@/lib/margin-call";

export const dynamic = "force-dynamic";

/** List current user's balance / margin-call requests */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Oturum yok" }, { status: 401 });
  const requests = await prisma.balanceRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ requests });
}

/**
 * Create a pending balance request (RESET | ADD) after margin call.
 * Does NOT change balance until admin approves.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Oturum yok" }, { status: 401 });

  await processPendingOrders(user.id);
  await checkSlTp(user.id);
  const metrics = await refreshAccountMetrics(user.id);
  if (!metrics) return NextResponse.json({ error: "Hesap yok" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "").toUpperCase();
  const amount = body.amount != null ? Number(body.amount) : null;

  if (type !== "RESET" && type !== "ADD") {
    return NextResponse.json({ error: "type RESET veya ADD olmalı" }, { status: 400 });
  }
  if (type === "ADD") {
    if (!Number.isFinite(amount) || amount == null || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: "Geçersiz tutar" }, { status: 400 });
    }
  }

  const inCall = isMarginCall({
    equity: metrics.equity,
    freeMargin: metrics.freeMargin,
    margin: metrics.margin,
    marginLevel: metrics.marginLevel,
  });
  if (!inCall) {
    return NextResponse.json(
      { error: "Marjin çağrısı koşulu sağlanmıyor; talep oluşturulamıyor" },
      { status: 400 }
    );
  }

  const pending = await prisma.balanceRequest.findFirst({
    where: { userId: user.id, status: "PENDING", reason: "MARGIN_CALL" },
  });
  if (pending) {
    return NextResponse.json(
      { error: "Zaten bekleyen bir talep var", request: pending },
      { status: 409 }
    );
  }

  const request = await prisma.balanceRequest.create({
    data: {
      userId: user.id,
      type,
      amount: type === "ADD" ? amount : null,
      status: "PENDING",
      reason: "MARGIN_CALL",
      equityAt: metrics.equity,
      marginLvl: metrics.marginLevel,
    },
  });

  return NextResponse.json({ ok: true, request });
}
