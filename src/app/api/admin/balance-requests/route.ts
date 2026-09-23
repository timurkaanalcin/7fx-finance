import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyBalanceAdd, applyBalanceReset } from "@/lib/trading";
import { recordLedger } from "@/lib/ledger";
import { DEFAULT_RESET_BALANCE, MARGIN_CALL_LEVEL, MARGIN_CALL_RULE_TR } from "@/lib/margin-call";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status ? { status: status.toUpperCase() } : {};
  const requests = await prisma.balanceRequest.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({
    requests,
    config: {
      defaultResetBalance: DEFAULT_RESET_BALANCE,
      marginCallLevel: MARGIN_CALL_LEVEL,
      ruleTr: MARGIN_CALL_RULE_TR,
    },
  });
}

/** Approve or reject a balance request */
export async function POST(req: Request) {
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const action = String(body.action || "").toLowerCase();
  const adminNote = body.adminNote != null ? String(body.adminNote).slice(0, 500) : null;

  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "id ve action (approve|reject) gerekli" }, { status: 400 });
  }

  const request = await prisma.balanceRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Talep zaten işlenmiş" }, { status: 400 });
  }

  if (action === "reject") {
    const updated = await prisma.balanceRequest.update({
      where: { id },
      data: { status: "REJECTED", adminNote, reviewedAt: new Date() },
    });
    return NextResponse.json({ ok: true, request: updated });
  }

  // Approve — credits the same 1:1 trading Account used by the terminal
  const beforeAcc = await prisma.account.findUnique({ where: { userId: request.userId } });
  const balanceBefore = beforeAcc?.balance ?? 0;

  if (request.type === "RESET") {
    await applyBalanceReset(request.userId);
  } else if (request.type === "ADD") {
    const amt = request.amount;
    if (amt == null || !Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: "Talep tutarı geçersiz" }, { status: 400 });
    }
    await applyBalanceAdd(request.userId, amt);
  } else {
    return NextResponse.json({ error: "Bilinmeyen talep tipi" }, { status: 400 });
  }

  const afterAcc = await prisma.account.findUnique({ where: { userId: request.userId } });
  const balanceAfter = afterAcc?.balance ?? balanceBefore;
  await recordLedger({
    userId: request.userId,
    type: request.type === "RESET" ? "RESET" : "MARGIN_ADD",
    amount: balanceAfter - balanceBefore,
    balanceBefore,
    balanceAfter,
    currency: afterAcc?.currency || "USD",
    comment: adminNote || `Margin-call ${request.type} approved`,
    createdById: admin.id,
    createdByName: admin.name,
    refType: "BalanceRequest",
    refId: id,
  });

  const updated = await prisma.balanceRequest.update({
    where: { id },
    data: { status: "APPROVED", adminNote, reviewedAt: new Date() },
  });
  return NextResponse.json({ ok: true, request: updated });
}
