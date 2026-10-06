import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/system-settings";
import {
  CALLBACK_SALE_STATUS,
  classifySaleStatus,
  isPotentialLead,
} from "@/lib/lead-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const settings = await getSystemSettings();
  const mapping = settings.leadStatusMapping;

  const users = await prisma.user.findMany({
    where: { role: "TRADER" },
    select: {
      id: true,
      saleStatus: true,
      potentialStatus: true,
      ftd: true,
      affiliateA: true,
      affiliateB: true,
      affiliateC: true,
      account: { select: { balance: true, currency: true } },
      deposits: {
        where: { status: "APPROVED" },
        select: { amount: true },
      },
    },
  });

  let valid = 0;
  let invalid = 0;
  let callback = 0;
  let potential = 0;

  type AffAgg = {
    name: string;
    total: number;
    valid: number;
    invalid: number;
    callback: number;
    deposited: number;
    notDeposited: number;
    depositAmount: number;
  };
  const aff = new Map<string, AffAgg>();

  function affKey(u: (typeof users)[0]) {
    const n = (u.affiliateA || u.affiliateB || u.affiliateC || "").trim();
    return n || "—";
  }

  for (const u of users) {
    const kind = classifySaleStatus(u.saleStatus, mapping);
    if (kind === "valid") valid += 1;
    else if (kind === "invalid") invalid += 1;
    else if (kind === "callback") callback += 1;
    if (isPotentialLead(u.potentialStatus, mapping)) potential += 1;

    const key = affKey(u);
    let a = aff.get(key);
    if (!a) {
      a = {
        name: key,
        total: 0,
        valid: 0,
        invalid: 0,
        callback: 0,
        deposited: 0,
        notDeposited: 0,
        depositAmount: 0,
      };
      aff.set(key, a);
    }
    a.total += 1;
    if (kind === "valid") a.valid += 1;
    if (kind === "invalid") a.invalid += 1;
    if (kind === "callback") a.callback += 1;

    const depSum = u.deposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const isDep =
      u.ftd === true ||
      String(u.saleStatus || "").toUpperCase() === "DEPOSITED" ||
      depSum > 0;
    if (kind === "valid") {
      if (isDep) {
        a.deposited += 1;
        a.depositAmount += depSum > 0 ? depSum : Number(u.account?.balance) || 0;
      } else {
        a.notDeposited += 1;
      }
    }
  }

  const affiliates = Array.from(aff.values()).sort((x, y) => y.total - x.total);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    mapping,
    callbackStatus: CALLBACK_SALE_STATUS,
    kpis: {
      total: users.length,
      valid,
      invalid,
      callback,
      potential,
    },
    affiliates,
  });
}
