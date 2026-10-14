import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessUser } from "@/lib/crm-scope";
import { commentRoleOf, visibleTeams, writableTeams, type CommentTeam } from "@/lib/comment-teams";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

async function payload(staff: { role?: string | null; jobTitle?: string | null }, userId: string) {
  const teams = visibleTeams(staff);
  const notes = await prisma.userNote.findMany({
    where: { userId, team: { in: teams } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, team: true, body: true, authorName: true, createdAt: true },
  });
  return { notes, visibleTeams: teams, writableTeams: writableTeams(staff), role: commentRoleOf(staff) };
}

/** GET Sale / Retention comments of a customer (filtered by the viewer's role). */
export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!(await canAccessUser(admin, ctx.params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await payload(admin, ctx.params.id));
}

/** POST { team: "SALE" | "RET", body } — time is stamped by the DB (now). */
export async function POST(req: Request, ctx: Ctx) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const userId = ctx.params.id;
  if (!(await canAccessUser(admin, userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const team = String(b.team || "").trim().toUpperCase() as CommentTeam;
  const body = String(b.body || "").trim().slice(0, 5000);
  if (!["SALE", "RET"].includes(team)) return NextResponse.json({ error: "Invalid team" }, { status: 400 });
  if (!(writableTeams(admin) as string[]).includes(team)) {
    return NextResponse.json({ error: "Bu alana yorum yazma yetkiniz yok" }, { status: 403 });
  }
  if (!body) return NextResponse.json({ error: "Yorum boş olamaz" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.userNote.create({ data: { userId, authorId: admin.id, authorName: admin.name, body, team } });
  await writeAudit({ adminId: admin.id, action: "TEAM_COMMENT_ADD", targetId: userId, note: `${team}: ${body.slice(0, 120)}` });
  return NextResponse.json({ ok: true, ...(await payload(admin, userId)) });
}
