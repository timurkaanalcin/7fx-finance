import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Lightweight customer type-ahead for "Evrak Ekle": TRADER accounts only, matched on
 * name / first / last / email / 16-digit account ID / phone / username. Max 20 results.
 */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 100);
  if (q.length < 1) return NextResponse.json({ users: [] });
  const digits = q.replace(/\D/g, "");
  const or: Record<string, unknown>[] = [
    { name: { contains: q } },
    { firstName: { contains: q } },
    { lastName: { contains: q } },
    { email: { contains: q } },
    { username: { contains: q } },
    { accountLoginId: { contains: q } },
    { phone: { contains: q } },
    { id: q },
  ];
  if (digits.length >= 3 && digits !== q) or.push({ phone: { contains: digits } }, { accountLoginId: { contains: digits } });
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" }, OR: or },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, name: true, firstName: true, lastName: true, email: true, accountLoginId: true, phone: true },
  });
  return NextResponse.json({ users });
}
