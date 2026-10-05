import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Lightweight client picker search for CRM forms (tickets / ledger).
 * GET ?q=…&id=…&role=TRADER|ALL  → [{ id, name, email, accountLoginId, currency }]
 */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 120);
  const id = (searchParams.get("id") || "").trim();
  const role = (searchParams.get("role") || "TRADER").toUpperCase();

  const where: Record<string, unknown> = {};
  if (id) where.id = id;
  else {
    if (role !== "ALL") where.role = role === "ADMIN" ? "ADMIN" : "TRADER";
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { accountLoginId: { contains: q } },
        { phone: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ];
    }
  }
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      accountLoginId: true,
      role: true,
      account: { select: { currency: true, balance: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    clients: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      accountLoginId: u.accountLoginId,
      role: u.role,
      currency: u.account?.currency ?? null,
      balance: u.account?.balance ?? null,
    })),
  });
}
