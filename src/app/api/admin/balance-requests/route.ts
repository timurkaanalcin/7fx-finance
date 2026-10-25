import { NextResponse } from "next/server";
import { requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyBalanceAdd, applyBalanceReset } from "@/lib/trading";
import { recordLedger } from "@/lib/ledger";
import { readApprovalPayload } from "@/lib/ticket-scenario";
import { DEFAULT_RESET_BALANCE, MARGIN_CALL_LEVEL, MARGIN_CALL_RULE_EN } from "@/lib/margin-call";
import { FxError, appendFxNote, convertAmountToUsd } from "@/lib/fx-usd";
import { publicErrorText } from "@/lib/security/public-error";
import { CRM_MONEY_LIST_LEGACY, pagedOrLegacy } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status ? { status: status.toUpperCase() } : {};
  const paged = searchParams.has("take") || searchParams.has("skip");
  const page = pagedOrLegacy(searchParams.get("take"), searchParams.get("skip"), paged, CRM_MONEY_LIST_LEGACY);
  const found = await prisma.balanceRequest.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: page.skip,
    take: page.paged ? page.take + 1 : page.take,
  });
  const hasMore = page.paged && found.length > page.take;
  const requests = hasMore ? found.slice(0, page.take) : found;
  return NextResponse.json({
    requests,
    hasMore,
    nextSkip: page.skip + requests.length,
    config: {
      defaultResetBalance: DEFAULT_RESET_BALANCE,
      marginCallLevel: MARGIN_CALL_LEVEL,
      ruleTr: MARGIN_CALL_RULE_EN,
    },
  });
}

/** Approve or reject a balance request */
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

  const request = await prisma.balanceRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
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

  let ledgerComment = adminNote || `Margin-call ${request.type} approved`;
  if (request.type === "RESET") {
    await applyBalanceReset(request.userId);
  } else if (request.type === "ADD") {
    const amt = request.amount;
    if (amt == null || !Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: "Invalid request amount" }, { status: 400 });
    }
    let usd = amt;
    try {
      const conv = await convertAmountToUsd(amt, beforeAcc?.currency || "USD");
      usd = conv.usdAmount;
      ledgerComment = appendFxNote(ledgerComment, conv);
    } catch (e) {
      if (e instanceof FxError) return NextResponse.json({ error: publicErrorText(e, "Rate unavailable") }, { status: 503 });
      throw e;
    }
    await applyBalanceAdd(request.userId, usd);
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
    currency: "USD",
    comment: ledgerComment,
    createdById: admin.id,
    createdByName: admin.name,
    refType: "BalanceRequest",
    refId: id,
  });

  const updated = await prisma.balanceRequest.update({
    where: { id },
    data: { status: "APPROVED", adminNote, approvalReason: approval.approvalReason, eventScenario: approval.eventScenario, reviewedAt: new Date() },
  });
  return NextResponse.json({ ok: true, request: updated });
}
