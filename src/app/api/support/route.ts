import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { serializeChatPresence } from "@/lib/chat-presence";
import { crmPageWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

const SUPPORT_LEGACY = 200;

/** GET — customer's own live-support thread (Communication type=CHAT, workerName=null means client). */
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Customers only see the last 24 hours of live-support messages.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { searchParams } = new URL(req.url);
  const paged = searchParams.has("take") || searchParams.has("skip");
  const page = paged ? crmPageWindow(searchParams.get("take"), searchParams.get("skip")) : { take: SUPPORT_LEGACY, skip: 0 };
  const found = await prisma.communication.findMany({
    where: { userId: user.id, type: "CHAT", createdAt: { gte: since } },
    orderBy: paged ? { createdAt: "desc" } : { createdAt: "asc" },
    skip: page.skip,
    take: paged ? page.take + 1 : page.take,
    select: {
      id: true,
      title: true,
      description: true,
      workerName: true,
      createdAt: true,
    },
  });
  const hasMore = paged && found.length > page.take;
  const messages = hasMore ? found.slice(0, page.take) : found;
  if (paged) messages.reverse();

  const [state, u] = await Promise.all([
    prisma.chatThreadState.findUnique({ where: { userId: user.id } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { lastSeenAt: true } }),
  ]);

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      title: m.title,
      body: m.description,
      from: m.workerName ? "support" : "customer",
      createdAt: m.createdAt.toISOString(),
    })),
    hasMore,
    nextSkip: page.skip + messages.length,
    presence: serializeChatPresence(state, u?.lastSeenAt ?? null),
  });
}

/** POST — send a live-support message (creates CRM-visible CHAT Communication). */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = rateLimit(`support:${user.id}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });
  if (message.length > 4000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const row = await prisma.communication.create({
    data: {
      userId: user.id,
      type: "CHAT",
      title: "Live support",
      description: message,
      workerName: null,
      workerId: null,
    },
  });

  const { upsertChatPresence } = await import("@/lib/chat-presence");
  await upsertChatPresence(user.id, {
    customerTyping: false,
    customerInChat: true,
    markCustomerRead: true,
  });

  // ——— AI auto-reply / human handoff ———
  let reply: { id: string; body: string; from: "support"; createdAt: string } | null = null;
  try {
    const { aiReply, wantsHuman, HANDOFF_TEXT, AI_WORKER_ID, AI_WORKER_NAME } = await import("@/lib/support-ai");
    const { notifyAgents } = await import("@/lib/notify");
    const st = await prisma.chatThreadState.findUnique({ where: { userId: user.id }, select: { supportMode: true } });
    const mode = st?.supportMode || "AI";
    const href = `/izcrm/chat?user=${encodeURIComponent(user.id)}`;
    const who = user.name || user.email || "Müşteri";
    let replyText: string | null = null;

    if (mode !== "HUMAN" && wantsHuman(message)) {
      await prisma.chatThreadState.upsert({
        where: { userId: user.id },
        create: { userId: user.id, supportMode: "HUMAN", handoffAt: new Date() },
        update: { supportMode: "HUMAN", handoffAt: new Date() },
      });
      replyText = HANDOFF_TEXT;
      await notifyAgents({ kind: "handoff", title: `Canlı temsilci bekleniyor: ${who}`, body: message, href });
    } else if (mode === "HUMAN") {
      await notifyAgents({ kind: "chat", title: `Yeni mesaj: ${who}`, body: message, href });
    } else {
      const hist = await prisma.communication.findMany({
        where: { userId: user.id, type: "CHAT", id: { not: row.id } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { description: true, workerName: true },
      });
      replyText = await aiReply(
        message,
        hist.reverse().map((h) => ({ from: h.workerName ? ("support" as const) : ("customer" as const), body: h.description }))
      );
      await notifyAgents({ kind: "chat", title: `Yeni mesaj (AI yanıtladı): ${who}`, body: message, href });
    }

    if (replyText) {
      const r = await prisma.communication.create({
        data: { userId: user.id, type: "CHAT", title: "Live support", description: replyText, workerName: AI_WORKER_NAME, workerId: AI_WORKER_ID },
      });
      reply = { id: r.id, body: r.description, from: "support", createdAt: r.createdAt.toISOString() };
    }
  } catch (e) {
    console.error("[support] auto-reply", e);
  }

  return NextResponse.json({
    ok: true,
    message: {
      id: row.id,
      body: row.description,
      from: "customer",
      createdAt: row.createdAt.toISOString(),
    },
    reply,
  });
}
