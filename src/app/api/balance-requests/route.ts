import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAccountMetrics, processPendingOrders, checkSlTp } from "@/lib/trading";
import { isMarginCall } from "@/lib/margin-call";
import { stripStaff } from "@/lib/customer-sanitize";

export const dynamic = "force-dynamic";

/** List current user's balance / margin-call requests */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const requests = await prisma.balanceRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ requests: stripStaff(requests) });
}

/**
 * Create a pending ADD balance request after margin call (trader side).
 * Balance reset (RESET) is admin/CRM-only and is rejected here.
 * Requires the trader's risk acknowledgment. Does NOT change balance until admin approves.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = String(body?.type || "ADD").toUpperCase();
  const amount = body?.amount != null ? Number(body.amount) : null;

  if (type === "RESET") {
    return NextResponse.json(
      { error: "Balance reset is not available. Please request to add balance.", code: "RESET_DISABLED" },
      { status: 400 }
    );
  }
  if (type !== "ADD") {
    return NextResponse.json({ error: "type must be ADD" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount == null || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json({ error: "Invalid amount", code: "INVALID_AMOUNT" }, { status: 400 });
  }
  if (body?.riskAcknowledged !== true) {
    return NextResponse.json(
      { error: "Risk acknowledgment is required", code: "RISK_ACK_REQUIRED" },
      { status: 400 }
    );
  }

  await processPendingOrders(user.id);
  await checkSlTp(user.id);
  const metrics = await refreshAccountMetrics(user.id);
  if (!metrics) return NextResponse.json({ error: "Account yok" }, { status: 404 });

  const inCall = isMarginCall({
    equity: metrics.equity,
    freeMargin: metrics.freeMargin,
    margin: metrics.margin,
    marginLevel: metrics.marginLevel,
  });
  if (!inCall) {
    return NextResponse.json(
      { error: "Margin-call condition not met; cannot create request" },
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
      type: "ADD",
      amount,
      status: "PENDING",
      riskAcknowledged: true,
      riskAcknowledgedAt: new Date(),
      reason: "MARGIN_CALL",
      equityAt: metrics.equity,
      marginLvl: metrics.marginLevel,
    },
  });

  return NextResponse.json({ ok: true, request: stripStaff(request) });
}
