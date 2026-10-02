import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const [desks, users, deposits, ledgers] = await Promise.all([
    prisma.desk.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "TRADER" },
      select: { id: true, desk: true, deskId: true, ftd: true, active: true },
    }),
    prisma.depositRequest.findMany({
      where: { status: "APPROVED" },
      select: { amount: true, userId: true, user: { select: { desk: true, deskId: true } } },
    }),
    prisma.balanceLedger.findMany({
      where: { type: { in: ["DEPOSIT", "WITHDRAWAL", "MARGIN_ADD"] } },
      select: { type: true, amount: true, userId: true, user: { select: { desk: true, deskId: true } } },
      take: 5000,
    }),
  ]);

  type Agg = {
    object: string;
    traders: number;
    active: number;
    ftdCount: number;
    depositCount: number;
    depositAmount: number;
    withdrawalCount: number;
    withdrawalAmount: number;
    netDeposit: number;
  };

  const map = new Map<string, Agg>();
  function bucket(key: string): Agg {
    let a = map.get(key);
    if (!a) {
      a = {
        object: key,
        traders: 0,
        active: 0,
        ftdCount: 0,
        depositCount: 0,
        depositAmount: 0,
        withdrawalCount: 0,
        withdrawalAmount: 0,
        netDeposit: 0,
      };
      map.set(key, a);
    }
    return a;
  }

  // Seed desk names
  for (const d of desks) bucket(d.name);
  bucket("— Unassigned");

  for (const u of users) {
    const key = u.desk || desks.find((d) => d.id === u.deskId || d.code === u.deskId)?.name || "— Unassigned";
    const a = bucket(key);
    a.traders += 1;
    if (u.active) a.active += 1;
    if (u.ftd) a.ftdCount += 1;
  }

  for (const d of deposits) {
    const key = d.user.desk || "— Unassigned";
    const a = bucket(key);
    a.depositCount += 1;
    a.depositAmount += d.amount;
  }

  for (const l of ledgers) {
    const key = l.user.desk || "— Unassigned";
    const a = bucket(key);
    if (l.type === "WITHDRAWAL") {
      a.withdrawalCount += 1;
      a.withdrawalAmount += Math.abs(l.amount);
    } else if (l.type === "DEPOSIT" || l.type === "MARGIN_ADD") {
      // deposits already counted via DepositRequest; only add ledger if no deposits
    }
  }

  const rows = Array.from(map.values()).map((r) => ({
    ...r,
    depositAverage: r.depositCount ? r.depositAmount / r.depositCount : 0,
    netDeposit: r.depositAmount - r.withdrawalAmount,
  }));

  return NextResponse.json({ rows });
}
