import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { stripStaff } from "@/lib/customer-sanitize";

export const dynamic = "force-dynamic";

/** List current user's deposit requests */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const requests = await prisma.depositRequest.findMany({
    where: { userId: user.id },
    include: { method: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ requests: stripStaff(requests) });
}

/** Submit a deposit notification / request (does NOT credit balance until admin approves) */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  await ensureDemoSeed();

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  const methodId = String(body.methodId || "");
  const note = body.note != null ? String(body.note).slice(0, 500) : null;

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!methodId) {
    return NextResponse.json({ error: "No method selected" }, { status: 400 });
  }

  const method = await prisma.depositMethod.findFirst({
    where: { id: methodId, active: true },
  });
  if (!method) {
    return NextResponse.json({ error: "Method not found or inactive" }, { status: 400 });
  }

  const request = await prisma.depositRequest.create({
    data: {
      userId: user.id,
      methodId: method.id,
      amount,
      currency: "USD",
      note,
      status: "PENDING",
    },
    include: { method: true },
  });

  return NextResponse.json({ ok: true, request: stripStaff(request) });
}
