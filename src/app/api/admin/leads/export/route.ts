import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Excel export: ALL traders + ALL fields + ALL comments (empty email rows included). */
export async function GET() {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: "TRADER" },
    include: {
      account: true,
      notes: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = users.map((u) => {
    const comments = u.notes
      .map(
        (n) =>
          `[${n.createdAt.toISOString()}] ${n.authorName || "—"}: ${n.body || ""}`
      )
      .join("\n---\n");
    return {
      id: u.id,
      accountLoginId: u.accountLoginId || "",
      email: u.email || "",
      username: u.username || "",
      name: u.name || "",
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      phone: u.phone || "",
      country: u.country || "",
      address: u.address || "",
      language: u.language || "",
      timezone: u.timezone || "",
      accountType: u.accountType || "",
      desk: u.desk || "",
      deskId: u.deskId || "",
      campaign: u.campaign || "",
      affiliateA: u.affiliateA || "",
      affiliateB: u.affiliateB || "",
      affiliateC: u.affiliateC || "",
      saleStatus: u.saleStatus || "",
      retentionStatus: u.retentionStatus || "",
      potentialStatus: u.potentialStatus || "",
      validationStatus: u.validationStatus || "",
      ftd: u.ftd ? "YES" : "NO",
      brokerName: u.brokerName || "",
      assigneeName: u.assigneeName || "",
      documentsStatus: u.documentsStatus || "",
      active: u.active ? "YES" : "NO",
      tradingEnabled: u.tradingEnabled ? "YES" : "NO",
      balance: u.account?.balance ?? 0,
      equity: u.account?.equity ?? 0,
      credit: u.account?.credit ?? 0,
      bonus: u.account?.bonus ?? 0,
      currency: u.account?.currency || "USD",
      leverage: u.account?.leverage ?? 100,
      registrationDate: u.registrationDate?.toISOString() || "",
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() || "",
      comments,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const body = new Uint8Array(buf);

  await writeAudit({
    adminId: admin.id,
    action: "LEADS_EXPORT_XLSX",
    meta: { count: rows.length },
  });

  const filename = `7fx-leads-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
