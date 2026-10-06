import { NextResponse } from "next/server";
import { requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAccountMetrics } from "@/lib/trading";
import { recordLedger } from "@/lib/ledger";
import { readApprovalPayload } from "@/lib/ticket-scenario";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status ? { status: status.toUpperCase() } : {};
  const requests = await prisma.withdrawalRequest.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ requests });
}

/** Approve or reject a withdrawal request */
export async function POST(req: Request) {
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const action = String(body.action || "").toLowerCase();
  const approval = readApprovalPayload(body && typeof body === "object" ? body : {});
  const adminNote = action === "approve" ? approval.adminNote : body.adminNote != null ? String(body.adminNote).slice(0, 500) : null;

  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "id ve action (approve|reject) gerekli" }, { status: 400 });
  }

  const request = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  if (action === "reject") {
    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: "REJECTED", adminNote, reviewedAt: new Date() },
    });
    return NextResponse.json({ ok: true, request: updated });
  }

  const account = await prisma.account.findUnique({ where: { userId: request.userId } });
  if (!account) return NextResponse.json({ error: "User has no account" }, { status: 404 });

  if (request.amount > account.balance + 1e-9) {
    return NextResponse.json({ error: "Account bakiyesi yetersiz" }, { status: 400 });
  }

  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore - request.amount;

  await prisma.$transaction([
    prisma.account.update({
      where: { userId: request.userId },
      data: { balance: balanceAfter },
    }),
    prisma.withdrawalRequest.update({
      where: { id },
      data: { status: "APPROVED", adminNote, approvalReason: approval.approvalReason, eventScenario: approval.eventScenario, reviewedAt: new Date() },
    }),
  ]);

  await recordLedger({
    userId: request.userId,
    type: "WITHDRAWAL",
    amount: -request.amount,
    balanceBefore,
    balanceAfter,
    currency: request.currency,
    comment: adminNote || `Withdrawal via ${request.method}`,
    createdById: admin.id,
    createdByName: admin.name,
    refType: "WithdrawalRequest",
    refId: id,
  });

  await refreshAccountMetrics(request.userId);
  const updated = await prisma.withdrawalRequest.findUnique({ where: { id } });
  return NextResponse.json({ ok: true, request: updated });
}
