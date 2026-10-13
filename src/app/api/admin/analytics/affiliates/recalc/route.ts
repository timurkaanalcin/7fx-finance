import { NextResponse } from "next/server";
import { requireAdminWrite, writeAudit } from "@/lib/auth";
import { isScopedStaff } from "@/lib/crm-scope";
import { classifyLeads } from "@/lib/lead-invalid";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Re-run automatic invalid classification (never overwrites manual reasons). */
export async function POST() {
  const admin = await requireAdminWrite("canManageUsers");
  if (!admin || isScopedStaff(admin)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const r = await classifyLeads();
  try {
    await writeAudit({ adminId: admin.id, action: "LEADS_AUTO_CLASSIFY", meta: r });
  } catch {}
  return NextResponse.json({ ok: true, ...r });
}
