import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadAffiliateReport } from "@/lib/affiliate-load";
import { newAffiliateToken, parsePartnerWrite } from "@/lib/affiliate-partner";

export const dynamic = "force-dynamic";

function stat(name: string, rows: { name: string; leads: number; valid: number; invalid: number; deposits: number; ftd: number; mismatch: number; tracked: number }[]) {
  return rows.find((r) => r.name === name);
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const period = new URL(req.url).searchParams.get("period") || "month";
  const [partners, report] = await Promise.all([
    prisma.affiliatePartner.findMany({ orderBy: { name: "asc" } }),
    loadAffiliateReport(admin, { period }),
  ]);
  const used = new Set<string>();
  type AccountRow = {
    id: string | null;
    sourceKey: string;
    name: string;
    surname: string | null;
    email: string | null;
    token: string | null;
    active: boolean | null;
    checkOnFraud: boolean | null;
    registered: boolean;
    leads: number;
    valid: number;
    invalid: number;
    deposits: number;
    ftd: number;
    mismatch: number;
    tracked: number;
  };
  const rows: AccountRow[] = partners.map((p) => {
    used.add(p.sourceKey);
    const s = stat(p.sourceKey, report.rows);
    return {
      id: p.id,
      sourceKey: p.sourceKey,
      name: p.name,
      surname: p.surname,
      email: p.email,
      token: p.token,
      active: p.active,
      checkOnFraud: p.checkOnFraud,
      registered: true,
      leads: s?.leads ?? 0,
      valid: s?.valid ?? 0,
      invalid: s?.invalid ?? 0,
      deposits: s?.deposits ?? 0,
      ftd: s?.ftd ?? 0,
      mismatch: s?.mismatch ?? 0,
      tracked: s?.tracked ?? 0,
    };
  });
  for (const s of report.rows) {
    if (s.name === "—" || used.has(s.name)) continue;
    rows.push({
      id: null,
      sourceKey: s.name,
      name: s.name,
      surname: null,
      email: null,
      token: null,
      active: null,
      checkOnFraud: null,
      registered: false,
      leads: s.leads,
      valid: s.valid,
      invalid: s.invalid,
      deposits: s.deposits,
      ftd: s.ftd,
      mismatch: s.mismatch,
      tracked: s.tracked,
    });
  }
  rows.sort((a, b) => b.leads - a.leads || a.name.localeCompare(b.name));
  return NextResponse.json({ period, rows, unlinked: report.unlinked });
}

export async function POST(req: Request) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parsePartnerWrite(body, "create");
  const sourceKey = parsed.data?.sourceKey;
  const name = parsed.data?.name;
  if (!parsed.data || !sourceKey || !name) {
    return NextResponse.json({ error: parsed.error || "Source name is required" }, { status: 400 });
  }
  const data = parsed.data;
  try {
    const row = await prisma.affiliatePartner.create({
      data: {
        sourceKey,
        name,
        surname: data.surname ?? null,
        email: data.email ?? null,
        token: newAffiliateToken(),
        active: data.active !== false,
        checkOnFraud: data.checkOnFraud === true,
        allowDuplicatePhones: data.allowDuplicatePhones === true,
        allowedIps: data.allowedIps ?? null,
        allowedSources: data.allowedSources ?? null,
        note: data.note ?? null,
        callbackUrl: data.callbackUrl ?? null,
      },
    });
    await writeAudit({ adminId: admin.id, action: "AFFILIATE_CREATE", targetId: row.id, note: row.sourceKey });
    return NextResponse.json({ ok: true, id: row.id, token: row.token });
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "P2002") return NextResponse.json({ error: "An account with this source name already exists" }, { status: 409 });
    console.error("[affiliate] create", e);
    return NextResponse.json({ error: "Could not create the account" }, { status: 500 });
  }
}
