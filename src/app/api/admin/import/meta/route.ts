import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { ACCOUNT_CURRENCIES, SALE_STATUSES } from "@/lib/membership";
import { IMPORT_TARGET_FIELDS } from "@/lib/crm-import";
import { crmPageWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const paged = searchParams.has("take") || searchParams.has("skip");
  const page = paged ? crmPageWindow(searchParams.get("take"), searchParams.get("skip")) : { take: 200, skip: 0 };
  const found = await prisma.desk.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
    skip: page.skip,
    take: paged ? page.take + 1 : page.take,
  });
  const hasMore = paged && found.length > page.take;
  const desks = hasMore ? found.slice(0, page.take) : found;

  return NextResponse.json({
    fields: IMPORT_TARGET_FIELDS,
    saleStatuses: SALE_STATUSES,
    currencies: ACCOUNT_CURRENCIES,
    desks: desks.map((d) => ({ id: d.id, name: d.name, code: d.code })),
    hasMore,
    nextSkip: page.skip + desks.length,
    maxBytes: 10 * 1024 * 1024,
    formats: ["csv", "tsv", "xlsx", "xls", "ods", "json", "txt", "docx", "pdf"],
    notes: {
      emailRequired:
        "Schema requires a unique email. Rows with only a phone get a generated placeholder email (@noemail.7fx.local) so the account can be created; login still works with account ID + password.",
      balanceDefault: "Starting balance is 0 unless a balance column is mapped.",
      referral: "Admin import bypasses referral code; source is stored on affiliateA/campaign/referralCodeUsed.",
      scannedPdf:
        "Scanned (image-only) PDFs yield no text — upload Excel/CSV instead. OCR is not enabled.",
    },
  });
}
