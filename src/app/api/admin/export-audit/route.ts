import { NextResponse } from "next/server";
import { requireAdmin, writeAudit } from "@/lib/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIpFromHeaders } from "@/lib/security/fingerprint";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const ip = clientIpFromHeaders({ get: (n) => req.headers.get(n) });
  const rl = rateLimit(`export:${admin.id}:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Export rate limit" }, { status: 429 });
  }

  // RO admins: block export entirely
  if ((admin as { crmReadOnly?: boolean }).crmReadOnly) {
    return NextResponse.json({ error: "Exports disabled for read-only admins" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || "unknown").slice(0, 64);
  const path = String(body.path || "").slice(0, 512);
  const rows = typeof body.rows === "number" ? body.rows : null;
  const note = String(body.note || "").slice(0, 500);

  await writeAudit({
    adminId: admin.id,
    action: "EXPORT",
    note: note || `${kind} @ ${path}`,
    meta: { kind, path, rows, ip },
  });

  return NextResponse.json({ ok: true });
}
