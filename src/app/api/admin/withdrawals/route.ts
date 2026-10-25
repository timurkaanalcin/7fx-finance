import { NextResponse } from "next/server";
import { requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAccountMetrics } from "@/lib/trading";
import { recordLedger } from "@/lib/ledger";
import { approvalAuditComment, readApprovalPayload } from "@/lib/ticket-scenario";
import { FxError, appendFxNote, convertAmountToUsd } from "@/lib/fx-usd";
import { clientErrorMessage } from "@/lib/security/public-error";
import { CRM_MONEY_LIST_LEGACY, pagedOrLegacy } from "@/lib/trader-list";
import { moneyQueueOrderBy, moneyQueueStatus, moneyQueueTextWhere } from "@/lib/crm-money-queue";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const and: Record<string, unknown>[] = [];
  const status = moneyQueueStatus(searchParams.get("status"));
  const text = moneyQueueTextWhere("withdrawal", searchParams.get("q") || "");
  if (status) and.push({ status });
  if (text) and.push(text);
  const where = and.length ? { AND: and } : {};
  const paged = searchParams.has("take") || searchParams.has("skip");
  const page = pagedOrLegacy(searchParams.get("take"), searchParams.get("skip"), paged, CRM_MONEY_LIST_LEGACY);
  const orderBy = moneyQueueOrderBy(searchParams.get("sort") || "");
  const foundPromise = prisma.withdrawalRequest.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, name: true, accountLoginId: true } },
    },
    orderBy,
    skip: page.skip,
    take: page.paged ? page.take + 1 : page.take,
  });
  const totalPromise = paged ? prisma.withdrawalRequest.count({ where }) : Promise.resolve(null);
  const [found, total] = await Promise.all([foundPromise, totalPromise]);
  const hasMore = page.paged && found.length > page.take;
  const requests = hasMore ? found.slice(0, page.take) : found;
  return NextResponse.json({
    requests,
    hasMore,
    nextSkip: page.skip + requests.length,
    ...(typeof total === "number" ? { total } : {}),
  });
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

  let usdAmount = request.amount;
  let comment = approvalAuditComment(approval.adminNote, `Withdrawal via ${request.method}`);
  try {
    const conv = await convertAmountToUsd(request.amount, request.currency);
    usdAmount = conv.usdAmount;
    comment = appendFxNote(comment, conv);
  } catch (e) {
    if (e instanceof FxError) return NextResponse.json({ error: clientErrorMessage("[admin/withdrawals]", e, "Rate unavailable") }, { status: 503 });
    throw e;
  }

  if (usdAmount > account.balance + 1e-9) {
    return NextResponse.json({ error: "Account bakiyesi yetersiz" }, { status: 400 });
  }

  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore - usdAmount;

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
    amount: -usdAmount,
    balanceBefore,
    balanceAfter,
    currency: "USD",
    comment,
    createdById: admin.id,
    createdByName: admin.name,
    refType: "WithdrawalRequest",
    refId: id,
  });

  await refreshAccountMetrics(request.userId);
  const updated = await prisma.withdrawalRequest.findUnique({ where: { id } });
  return NextResponse.json({ ok: true, request: updated });
}
