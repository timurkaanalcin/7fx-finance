import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessUser } from "@/lib/crm-scope";
import { RETENTION_STATUSES } from "@/lib/membership";
import { noteVisibilityWhere, type StaffLike } from "@/lib/comment-teams";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const NOTES_PAGE = 50;
const REMINDERS_PAGE = 20;

function listSkip(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(10_000, Math.trunc(n));
}

async function load(id: string, staff: StaffLike, notesSkip = 0, remindersSkip = 0) {
  const user = await prisma.user.findFirst({
    where: { id, role: "TRADER" },
    select: {
      id: true,
      name: true,
      retentionStatus: true,
      retentionNote: true,
      retentionFollowUpAt: true,
      assigneeId: true,
      assigneeName: true,
    },
  });
  if (!user) return null;
  const visibility = noteVisibilityWhere(staff);
  const [noteRows, reminderRows] = await Promise.all([
    prisma.userNote.findMany({
      where: { userId: id, ...(visibility || {}) },
      orderBy: { createdAt: "desc" },
      skip: notesSkip,
      take: NOTES_PAGE + 1,
    }),
    prisma.reminder.findMany({
      where: { userId: id },
      orderBy: { remindAt: "desc" },
      skip: remindersSkip,
      take: REMINDERS_PAGE + 1,
    }),
  ]);
  const notesHasMore = noteRows.length > NOTES_PAGE;
  const notes = notesHasMore ? noteRows.slice(0, NOTES_PAGE) : noteRows;
  const remindersHasMore = reminderRows.length > REMINDERS_PAGE;
  const reminders = remindersHasMore ? reminderRows.slice(0, REMINDERS_PAGE) : reminderRows;
  return {
    retention: { ...user, notes, reminders },
    notesHasMore,
    remindersHasMore,
    notesNextSkip: notesSkip + notes.length,
    remindersNextSkip: remindersSkip + reminders.length,
    statuses: RETENTION_STATUSES,
  };
}

/** GET retention card for one customer (scoped staff: only assigned). */
export async function GET(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!(await canAccessUser(admin, ctx.params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const loaded = await load(ctx.params.id, admin, listSkip(searchParams.get("notesSkip")), listSkip(searchParams.get("remindersSkip")));
  if (!loaded) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(loaded);
}

/** PATCH { retentionStatus?, retentionNote?, retentionFollowUpAt?, addNote? } */
export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const id = ctx.params.id;
  if (!(await canAccessUser(admin, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const target = await prisma.user.findFirst({ where: { id, role: "TRADER" }, select: { id: true, retentionFollowUpAt: true } });
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
  // Only create a reminder when the follow-up date actually changes (avoid duplicates on every save).
  if (followUp && followUp.getTime() !== (target.retentionFollowUpAt?.getTime() ?? -1)) {
    await prisma.reminder.create({
      data: { userId: id, workerId: admin.id, workerName: admin.name, body: "Retention takip", remindAt: followUp },
    });
  }
  const addNote = String(body.addNote || "").trim().slice(0, 2000);
  if (addNote) {
    await prisma.userNote.create({ data: { userId: id, authorId: admin.id, authorName: admin.name, body: addNote } });
  }
  await writeAudit({ adminId: admin.id, action: "RETENTION_UPDATE", targetId: id, note: JSON.stringify({ ...data, addNote: addNote ? addNote.slice(0, 120) : undefined }).slice(0, 400) });
  const loaded = await load(id, admin);
  return NextResponse.json({ ok: true, ...loaded });
}

export const POST = PATCH;
