import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import {
  applyMapping,
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

  const mapping = (body.mapping || {}) as ColumnMapping;
  const defaults = (body.defaults || {}) as ImportDefaults;
  const duplicateMode: DuplicateMode = body.duplicateMode === "update" ? "update" : "skip";

  const table: ParsedTable = {
    columns,
    rows: rows.slice(0, 2000),
    format: String(body.format || "unknown"),
    fileName: String(body.fileName || "upload"),
  };

  const mapped = applyMapping(table, mapping, defaults);
  const validations = await validateMappedRows(mapped, { duplicateMode });

  const summary = {
    total: validations.length,
    ok: validations.filter((v) => v.ok).length,
    errors: validations.filter((v) => !v.ok).length,
    duplicatesDb: validations.filter((v) => v.duplicateInDb).length,
    duplicatesFile: validations.filter((v) => v.duplicateInFile).length,
    placeholders: validations.filter((v) => v.mapped.emailPlaceholder).length,
  };

  return NextResponse.json({
    ok: true,
    summary,
    validations: validations.map((v) => ({
      rowIndex: v.rowIndex,
      ok: v.ok,
      errors: v.errors,
      warnings: v.warnings,
      duplicateInFile: v.duplicateInFile,
      duplicateInDb: v.duplicateInDb,
      existingUserId: v.existingUserId,
      mapped: {
        ...v.mapped,
        password: v.mapped.password ? "••••••" : null,
      },
    })),
  });
}
