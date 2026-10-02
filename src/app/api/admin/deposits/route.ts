import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAccountMetrics } from "@/lib/trading";
import { recordLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status ? { status: status.toUpperCase() } : {};
  const requests = await prisma.depositRequest.findMany({
    where,
    include: {
      method: true,
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ requests });
}

/** Approve or reject a deposit request */
export async function POST(req: Request) {
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const action = String(body.action || "").toLowerCase();
  const adminNote = body.adminNote != null ? String(body.adminNote).slice(0, 500) : null;

  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "id ve action (approve|reject) gerekli" }, { status: 400 });
  }

  const request = await prisma.depositRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  if (action === "reject") {
    const updated = await prisma.depositRequest.update({
      where: { id },
      data: { status: "REJECTED", adminNote, reviewedAt: new Date() },
    });
    return NextResponse.json({ ok: true, request: updated });
  }

  // Approve: credit balance
  const account = await prisma.account.findUnique({ where: { userId: request.userId } });
  if (!account) return NextResponse.json({ error: "User has no account" }, { status: 404 });

  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore + request.amount;

  await prisma.$transaction([
    prisma.account.update({
      where: { userId: request.userId },
      data: { balance: balanceAfter },
    }),
    prisma.depositRequest.update({
      where: { id },
      data: { status: "APPROVED", adminNote, reviewedAt: new Date() },
    }),
  ]);

  await recordLedger({
    userId: request.userId,
    type: "DEPOSIT",
    amount: request.amount,
    balanceBefore,
    balanceAfter,
    currency: request.currency,
    comment: adminNote || "CRM deposit approved",
    createdById: admin.id,
    createdByName: admin.name,
    refType: "DepositRequest",
    refId: id,
  });

  await refreshAccountMetrics(request.userId);
  const updated = await prisma.depositRequest.findUnique({ where: { id } });
  return NextResponse.json({ ok: true, request: updated });
}
