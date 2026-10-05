import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import {
  applyMapping,
  executeImport,
  resultsToCsv,
  validateMappedRows,
  type ColumnMapping,
  type DuplicateMode,
  type ImportDefaults,
  type ParsedTable,
} from "@/lib/crm-import";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const columns: string[] = Array.isArray(body.columns) ? body.columns.map(String) : [];
  const rows: string[][] = Array.isArray(body.rows)
    ? body.rows.map((r: unknown) => (Array.isArray(r) ? r.map((c) => String(c ?? "")) : []))
    : [];
  if (!columns.length || !rows.length) {
    return NextResponse.json({ error: "columns and rows required" }, { status: 400 });
  }
  if (rows.length > 2000) {
    return NextResponse.json({ error: "Max 2000 rows per import" }, { status: 400 });
  }

  const mapping = (body.mapping || {}) as ColumnMapping;
  const defaults = (body.defaults || {}) as ImportDefaults;
  const duplicateMode: DuplicateMode = body.duplicateMode === "update" ? "update" : "skip";
  const confirm = body.confirm === true;
  if (!confirm) {
    return NextResponse.json({ error: "confirm:true required" }, { status: 400 });
  }

  const table: ParsedTable = {
    columns,
    rows,
    format: String(body.format || "unknown"),
    fileName: String(body.fileName || "upload"),
  };

  const mapped = applyMapping(table, mapping, defaults);
  const validations = await validateMappedRows(mapped, { duplicateMode });
  const { results, summary } = await executeImport({
    validations,
    duplicateMode,
    adminId: admin.id,
    adminName: admin.name || "Admin",
  });

  const csv = resultsToCsv(results);

  return NextResponse.json({
    ok: true,
    summary,
    results,
    resultsCsv: csv,
  });
}
