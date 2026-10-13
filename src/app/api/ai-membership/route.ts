import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AI_PLANS, isUnlimited, membershipState, planById } from "@/lib/ai-membership";

export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: H });
  const state = await membershipState(user);
  return NextResponse.json({ state, plans: AI_PLANS, accountLoginId: user.accountLoginId, aiConfigured: !!process.env.OPENAI_API_KEY }, { headers: H });
}

/** Purchase request: no payment gateway — creates a PENDING request for admins to activate. */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: H });
  if (isUnlimited(user)) return NextResponse.json({ ok: true, unlimited: true }, { headers: H });
  if (!user.accountLoginId) return NextResponse.json({ error: "no_account_id" }, { status: 400, headers: H });
  const body = (await req.json().catch(() => ({}))) as { plan?: string };
  const plan = planById(body.plan);
  if (!plan) return NextResponse.json({ error: "bad_plan" }, { status: 400, headers: H });
  const existing = await prisma.aiMembership.findFirst({ where: { userId: user.id, status: "PENDING" } });
  if (existing) {
    await prisma.aiMembership.update({ where: { id: existing.id }, data: { plan: plan.id, priceUsd: plan.priceUsd } });
  } else {
    await prisma.aiMembership.create({ data: { userId: user.id, plan: plan.id, priceUsd: plan.priceUsd, status: "PENDING" } });
  }
  return NextResponse.json({ ok: true, pending: true }, { headers: H });
}
