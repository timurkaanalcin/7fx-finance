import { NextResponse } from "next/server";
import { requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isScopedStaff } from "@/lib/crm-scope";

export const dynamic = "force-dynamic";

/** Bulk mark leads invalid/valid by pasted list of emails / phones / ids. */
export async function POST(req: Request) {
  const admin = await requireAdminWrite("canManageUsers");
  if (!admin || isScopedStaff(admin)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const invalid = body.invalid !== false;
  const tokens = Array.from(
    new Set(
      String(body.list || "")
        .split(/[\s,;]+/)
        .map((t: string) => t.trim())
        .filter(Boolean)
    )
  ).slice(0, 20000) as string[];
  if (!tokens.length) return NextResponse.json({ error: "Liste boş" }, { status: 400 });
  const emails = tokens.filter((t) => t.includes("@")).map((t) => t.toLowerCase());
  const others = tokens.filter((t) => !t.includes("@"));
  const phones = others.map((t) => t.replace(/[^\d+]/g, "")).filter((t) => t.replace(/\D/g, "").length >= 6);
  const digits = phones.map((p) => p.replace(/\D/g, ""));
  const variants = Array.from(new Set([...phones, ...digits, ...digits.map((d) => "+" + d)]));
  const users = await prisma.user.findMany({
    where: { role: "TRADER", OR: [{ email: { in: emails } }, { phone: { in: variants } }, { id: { in: others } }] },
    select: { id: true, email: true, phone: true },
  });
  const ids = users.map((x) => x.id);
  if (ids.length)
    await prisma.user.updateMany({ where: { id: { in: ids } }, data: { leadInvalid: invalid, leadInvalidAt: invalid ? new Date() : null } });
  const foundE = new Set(users.map((x) => (x.email || "").toLowerCase()));
  const foundP = new Set(users.map((x) => (x.phone || "").replace(/\D/g, "")));
  const foundI = new Set(ids);
  const notFound = tokens.filter((t) =>
    t.includes("@") ? !foundE.has(t.toLowerCase()) : !(foundI.has(t) || foundP.has(t.replace(/\D/g, "")))
  );
  try {
    await writeAudit({ adminId: admin.id, action: invalid ? "LEADS_MARK_INVALID" : "LEADS_MARK_VALID", meta: { count: ids.length } });
  } catch {}
  return NextResponse.json({ ok: true, updated: ids.length, notFound: notFound.slice(0, 500), notFoundCount: notFound.length });
}
