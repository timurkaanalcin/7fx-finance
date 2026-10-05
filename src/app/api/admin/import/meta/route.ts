import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { ACCOUNT_CURRENCIES, SALE_STATUSES } from "@/lib/membership";
import { IMPORT_TARGET_FIELDS } from "@/lib/crm-import";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const desks = await prisma.desk.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
    take: 200,
  });

  return NextResponse.json({
    fields: IMPORT_TARGET_FIELDS,
    saleStatuses: SALE_STATUSES,
    currencies: ACCOUNT_CURRENCIES,
    desks: desks.map((d) => ({ id: d.id, name: d.name, code: d.code })),
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
