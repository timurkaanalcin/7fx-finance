import { NextResponse } from "next/server";
import { requireAdmin, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PATTERNS = [
  /^audit/i,
  /^test[+.]/i,
  /@test\./i,
  /@example\./i,
  /@mailinator\./i,
  /^e2e[+.]/i,
  /audit-user/i,
];

const EXACT = new Set([
  "trader@deskflow.local",
  "mehmet.yilmaz@demo.7fx",
  "elena.petrova@demo.7fx",
  "ahmed.hassan@demo.7fx",
  "frozen.user@demo.7fx",
]);

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  const targets = users.filter((u) => {
    if (u.role === "ADMIN") return false;
    if (EXACT.has(u.email)) return true;
    return PATTERNS.some((re) => re.test(u.email));
  });

  const deleted: string[] = [];
  for (const u of targets) {
    await prisma.order.deleteMany({ where: { userId: u.id } });
    await prisma.position.deleteMany({ where: { userId: u.id } });
    try {
      await prisma.account.deleteMany({ where: { userId: u.id } });
    } catch {
      /* ignore */
    }
    await prisma.user.delete({ where: { id: u.id } });
    deleted.push(u.email);
  }

  await writeAudit({
    adminId: admin.id,
    action: "CLEANUP_AUDIT_USERS",
    note: `Deleted ${deleted.length} users`,
    meta: { count: deleted.length },
  });

  return NextResponse.json({ ok: true, deletedCount: deleted.length, deleted });
}
