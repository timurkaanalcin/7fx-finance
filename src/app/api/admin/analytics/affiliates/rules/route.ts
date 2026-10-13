import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isScopedStaff } from "@/lib/crm-scope";
import { getLeadRules, parseLeadRules } from "@/lib/lead-invalid";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return NextResponse.json({ rules: await getLeadRules() });
}

/** Save lead auto-classification rules to SystemSettings.leadRulesJson. */
export async function POST(req: Request) {
  const admin = await requireAdminWrite("canManageUsers");
  if (!admin || isScopedStaff(admin)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const rules = parseLeadRules(JSON.stringify(body.rules || {}));
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: rules.tz });
  } catch {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }
  const leadRulesJson = JSON.stringify(rules);
  await prisma.systemSettings.upsert({ where: { id: "default" }, update: { leadRulesJson }, create: { id: "default", leadRulesJson } });
  try {
    await writeAudit({ adminId: admin.id, action: "LEAD_RULES_UPDATE", meta: rules });
  } catch {}
  return NextResponse.json({ ok: true, rules });
}
