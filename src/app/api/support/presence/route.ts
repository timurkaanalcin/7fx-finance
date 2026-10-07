import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  serializeChatPresence,
  upsertChatPresence,
} from "@/lib/chat-presence";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** POST — customer live-support presence heartbeat (typing / in-chat / read). */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = rateLimit(`support-presence:${user.id}`, 120, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const typing = body.typing;
  const inChat = body.inChat;
  const markRead = body.markRead === true || body.read === true;

  await upsertChatPresence(user.id, {
    ...(typeof typing === "boolean" ? { customerTyping: typing } : {}),
    ...(typeof inChat === "boolean" ? { customerInChat: inChat } : {}),
    ...(markRead ? { markCustomerRead: true } : {}),
  });

  const [state, u] = await Promise.all([
    prisma.chatThreadState.findUnique({ where: { userId: user.id } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { lastSeenAt: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    presence: serializeChatPresence(state, u?.lastSeenAt ?? null),
  });
}

/** GET — customer view of thread presence (admin typing / in chat / reads). */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [state, u] = await Promise.all([
    prisma.chatThreadState.findUnique({ where: { userId: user.id } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { lastSeenAt: true },
    }),
  ]);

  return NextResponse.json({
    presence: serializeChatPresence(state, u?.lastSeenAt ?? null),
  });
}
