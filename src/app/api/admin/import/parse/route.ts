import { NextResponse } from "next/server";
import { requireAdminPerm } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import {
  IMPORT_MAX_BYTES,
  guessMapping,
  parseImportFile,
  tableSamples,
} from "@/lib/crm-import";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  const blob = file as File;
  if (blob.size > IMPORT_MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${IMPORT_MAX_BYTES / (1024 * 1024)} MB)` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  try {
    const table = await parseImportFile({
      buffer,
      fileName: blob.name || "upload",
      mime: blob.type,
    });
    if (!table.rows.length) {
      return NextResponse.json({
        ok: false,
        error: table.warning || "No rows found",
        warning: table.warning,
        format: table.format,
        fileName: table.fileName,
        columns: table.columns,
        rowCount: 0,
      }, { status: 422 });
    }
    const mapping = guessMapping(table.columns);
    return NextResponse.json({
      ok: true,
      format: table.format,
      fileName: table.fileName,
      columns: table.columns,
      rows: table.rows,
      rowCount: table.rows.length,
      samples: tableSamples(table),
      suggestedMapping: mapping,
      unstructured: Boolean(table.unstructured),
      warning: table.warning,
    });
  } catch (e) {
    console.error("[import/parse]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Parse failed" },
      { status: 500 }
    );
  }
}
