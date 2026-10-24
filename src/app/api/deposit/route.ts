import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { stripStaff } from "@/lib/customer-sanitize";
import { impersonationReadonlyResponse } from "@/lib/impersonation-guard";
import { crmPageWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

/** List current user's deposit requests */
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const search = new URL(req.url).searchParams;
  const page = crmPageWindow(search.get("take"), search.get("skip"));
  const found = await prisma.depositRequest.findMany({
    where: { userId: user.id },
    include: { method: true },
    orderBy: { createdAt: "desc" },
    skip: page.skip,
    take: page.take + 1,
  });
  const hasMore = found.length > page.take;
  const requests = hasMore ? found.slice(0, page.take) : found;
  return NextResponse.json({
    requests: stripStaff(requests),
    hasMore,
    nextSkip: page.skip + requests.length,
  });
}

/** Submit a deposit notification / request (does NOT credit balance until admin approves) */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const readOnly = await impersonationReadonlyResponse();
  if (readOnly) return readOnly;
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
