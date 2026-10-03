import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { composeTicketScenario, type TicketKind } from "@/lib/ticket-scenario";

export const dynamic = "force-dynamic";

const KINDS = new Set(["DEPOSIT", "WITHDRAW", "MARGIN"]);

export async function POST(req: Request) {
  const admin = await requireAdminPerm("canApproveDeposits");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  const kind = String(body.kind || "DEPOSIT").toUpperCase();
  const reason = body.reason != null ? String(body.reason).slice(0, 4000) : "";

  if (!id || !KINDS.has(kind)) {
    return NextResponse.json({ error: "id ve kind (DEPOSIT|WITHDRAW|MARGIN) gerekli" }, { status: 400 });
  }

  const facts = await loadFacts(kind as TicketKind, id, reason);
  if (!facts) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

  return NextResponse.json({
    scenario: composeTicketScenario(facts),
    source: "fact-composer",
  });
}

async function loadFacts(kind: TicketKind, id: string, reason: string) {
  if (kind === "DEPOSIT") {
    const d = await prisma.depositRequest.findUnique({
      where: { id },
      include: {
        method: true,
        user: { select: { name: true, email: true, country: true, account: { select: { id: true } } } },
      },
    });
    if (!d) return null;
    return {
      id: d.id,
      kind,
      customer: d.user.name,
      customerEmail: d.user.email,
      tradingAccountId: d.user.account?.id ?? null,
      amount: d.amount,
      currency: d.currency,
      method: d.method.label,
      openedAt: d.createdAt,
      country: d.user.country,
      reason,
    };
  }

  if (kind === "WITHDRAW") {
    const w = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, country: true, account: { select: { id: true } } } },
      },
    });
    if (!w) return null;
    return {
      id: w.id,
      kind,
      customer: w.user.name,
      customerEmail: w.user.email,
      tradingAccountId: w.user.account?.id ?? null,
      amount: w.amount,
      currency: w.currency,
      method: w.method,
      openedAt: w.createdAt,
      country: w.user.country,
      reason,
    };
  }

  const b = await prisma.balanceRequest.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, country: true, account: { select: { id: true } } } },
    },
  });
  if (!b) return null;
  return {
    id: b.id,
    kind,
    customer: b.user.name,
    customerEmail: b.user.email,
    tradingAccountId: b.user.account?.id ?? null,
    amount: b.amount,
    currency: "USD",
    method: b.type,
    openedAt: b.createdAt,
    country: b.user.country,
    reason,
  };
}
