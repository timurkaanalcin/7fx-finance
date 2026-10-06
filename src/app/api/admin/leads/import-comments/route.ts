import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(row).find((x) => x.toLowerCase().replace(/\s+/g, "") === k.toLowerCase().replace(/\s+/g, ""));
    if (found != null && row[found] != null && String(row[found]).trim()) return String(row[found]).trim();
  }
  return "";
}

/** Import Excel: update/add comments for existing leads (empty email rows allowed — match login id). */
export async function POST(req: Request) {
  const admin = await requireAdminWrite("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  const buffer = Buffer.from(await (file as File).arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  let updated = 0;
  let notesAdded = 0;
  let skipped = 0;

  for (const row of json) {
    const email = cell(row, "email", "e-mail", "mail");
    const loginId = cell(row, "accountLoginId", "accountid", "loginid", "login");
    const comments = cell(row, "comments", "comment", "notes", "note", "yorumlar", "yorum");
    if (!comments) {
      skipped += 1;
      continue;
    }
    const user = await prisma.user.findFirst({
      where: {
        role: "TRADER",
        OR: [
          ...(email ? [{ email: { equals: email } }] : []),
          ...(loginId ? [{ accountLoginId: { equals: loginId } }] : []),
        ],
      },
      select: { id: true },
    });
    if (!user) {
      skipped += 1;
      continue;
    }
    // Split multi-comments if exported with --- separators; else one note
    const parts = comments.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);
    for (const body of parts.length ? parts : [comments]) {
      // Strip leading [iso] author: if re-importing export format
      const cleaned = body.replace(/^\[[^\]]+\]\s*[^:]+:\s*/, "").trim() || body;
      await prisma.userNote.create({
        data: {
          userId: user.id,
          authorId: admin.id,
          authorName: admin.name,
          body: cleaned.slice(0, 5000),
        },
      });
      notesAdded += 1;
    }
    updated += 1;
  }

  await writeAudit({
    adminId: admin.id,
    action: "LEADS_IMPORT_COMMENTS",
    meta: { updated, notesAdded, skipped, rows: json.length },
  });

  return NextResponse.json({ ok: true, updated, notesAdded, skipped, rows: json.length });
}
