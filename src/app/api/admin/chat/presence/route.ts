import { canAccessUser, scopeUserWhere, assignedWhere, isScopedStaff } from "@/lib/crm-scope";
import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  serializeChatPresence,
  upsertChatPresence,
} from "@/lib/chat-presence";

export const dynamic = "force-dynamic";

/** GET ?userId= — admin reads presence for one trader thread. */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const userId = new URL(req.url).searchParams.get("userId")?.trim() || "";
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const [state, u] = await Promise.all([
    prisma.chatThreadState.findUnique({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeenAt: true },
    }),
  ]);
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    presence: serializeChatPresence(state, u.lastSeenAt),
  });
}

/** POST — admin typing / in-chat / mark-read for a trader thread. */
export async function POST(req: Request) {
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "").trim();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (!(await canAccessUser(admin, userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, lastSeenAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const typing = body.typing;
  const inChat = body.inChat;
  const markRead = body.markRead === true || body.read === true;

  await upsertChatPresence(userId, {
    ...(typeof typing === "boolean" ? { adminTyping: typing } : {}),
    ...(typeof inChat === "boolean" ? { adminInChat: inChat } : {}),
    ...(markRead ? { markAdminRead: true } : {}),
  });

  const state = await prisma.chatThreadState.findUnique({ where: { userId } });
  return NextResponse.json({
    ok: true,
    presence: serializeChatPresence(state, user.lastSeenAt),
  });
}
