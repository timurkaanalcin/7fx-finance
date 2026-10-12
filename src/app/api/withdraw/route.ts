import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withdrawalsDisabledMessage, mustChangePasswordMessage } from "@/lib/account-perms";
import { stripStaff } from "@/lib/customer-sanitize";

export const dynamic = "force-dynamic";

/** List current user's withdrawal requests */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const requests = await prisma.withdrawalRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ requests: stripStaff(requests) });
}

/**
 * Submit a withdrawal request.
 * Does NOT debit balance until admin approves (mirrors deposit flow).
 */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  if ((user as { mustChangePassword?: boolean }).mustChangePassword === true) {
    return NextResponse.json(
      { error: mustChangePasswordMessage((user as { language?: string }).language) },
      { status: 403 }
    );
  }
  if ((user as { withdrawalsEnabled?: boolean }).withdrawalsEnabled === false) {
    return NextResponse.json(
      { error: withdrawalsDisabledMessage((user as { language?: string }).language) },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  const method = String(body.method || "BANK").toUpperCase();
  const details = body.details != null ? String(body.details).trim().slice(0, 500) : null;
  const note = body.note != null ? String(body.note).trim().slice(0, 500) : null;

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (method !== "BANK" && method !== "CRYPTO") {
    return NextResponse.json({ error: "Invalid method (BANK or CRYPTO)" }, { status: 400 });
  }
  if (!details) {
    return NextResponse.json(
      { error: method === "BANK" ? "IBAN / hesap bilgisi gerekli" : "Wallet address required" },
      { status: 400 }
    );
  }

  const account = await prisma.account.findUnique({ where: { userId: user.id } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const available = Math.min(account.balance, account.freeMargin);
  if (amount > available + 1e-9) {
    return NextResponse.json(
      {
        error: `Insufficient balance. Withdrawable: ${available.toFixed(2)} ${account.currency}`,
      },
      { status: 400 }
    );
  }

  const pending = await prisma.withdrawalRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (pending) {
    return NextResponse.json(
      { error: "You already have a pending withdrawal request" },
      { status: 400 }
    );
  }

  const request = await prisma.withdrawalRequest.create({
    data: {
      userId: user.id,
      amount,
      currency: account.currency || "USD",
      method,
      details,
      note,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, request: stripStaff(request) });
}
