import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessUser } from "@/lib/crm-scope";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const RETENTION_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "NO_ANSWER",
  "CALL_AGAIN",
  "DEPOSITED",
  "NOT_INTERESTED",
  "LOST",
] as const;

async function load(id: string) {
  return prisma.user.findFirst({
    where: { id, role: "TRADER" },
    select: {
      id: true,
      name: true,
      retentionStatus: true,
      retentionNote: true,
      retentionFollowUpAt: true,
      assigneeId: true,
      assigneeName: true,
      notes: { orderBy: { createdAt: "desc" }, take: 50 },
      reminders: { orderBy: { remindAt: "desc" }, take: 20 },
    },
  });
}

/** GET retention card for one customer (scoped staff: only assigned). */
export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!(await canAccessUser(admin, ctx.params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const u = await load(ctx.params.id);
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ retention: u, statuses: RETENTION_STATUSES });
}

/** PATCH { retentionStatus?, retentionNote?, retentionFollowUpAt?, addNote? } */
export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const id = ctx.params.id;
  if (!(await canAccessUser(admin, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const target = await prisma.user.findFirst({ where: { id, role: "TRADER" }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (body.retentionStatus !== undefined) {
    const s = String(body.retentionStatus || "").trim().toUpperCase();
    if (s && !(RETENTION_STATUSES as readonly string[]).includes(s)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.retentionStatus = s || null;
  }
  if (body.retentionNote !== undefined) data.retentionNote = String(body.retentionNote || "").slice(0, 4000) || null;
  let followUp: Date | null | undefined;
  if (body.retentionFollowUpAt !== undefined) {
    const raw = String(body.retentionFollowUpAt || "").trim();
    followUp = raw ? new Date(raw) : null;
    if (followUp && Number.isNaN(followUp.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    data.retentionFollowUpAt = followUp;
  }
  if (Object.keys(data).length) await prisma.user.update({ where: { id }, data: data as never });
  if (followUp) {
    await prisma.reminder.create({
      data: { userId: id, workerId: admin.id, workerName: admin.name, body: "Retention takip", remindAt: followUp },
    });
  }
  const addNote = String(body.addNote || "").trim().slice(0, 2000);
  if (addNote) {
    await prisma.userNote.create({ data: { userId: id, authorId: admin.id, authorName: admin.name, body: addNote } });
  }
  await writeAudit({ adminId: admin.id, action: "RETENTION_UPDATE", targetId: id, note: JSON.stringify({ ...data, addNote: addNote ? addNote.slice(0, 120) : undefined }).slice(0, 400) });
  return NextResponse.json({ ok: true, retention: await load(id) });
}

export const POST = PATCH;
