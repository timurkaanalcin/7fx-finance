import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { serializeChatPresence } from "@/lib/chat-presence";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = (searchParams.get("userId") || "").trim();

  const where = userId ? { type: "CHAT", userId } : { type: "CHAT" };
  const rows = await prisma.communication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 400,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          desk: true,
          active: true,
          firstName: true,
          lastName: true,
          phone: true,
          language: true,
          timezone: true,
          country: true,
          accountType: true,
          registrationDate: true,
          registrationCountry: true,
          tradingServer: true,
          ftd: true,
          brokerName: true,
          assigneeName: true,
          affiliateA: true,
          lastLoginAt: true,
          lastSeenAt: true,
          createdAt: true,
          account: { select: { currency: true, balance: true } },
          chatThreadState: true,
        },
      },
    },
  });

  // Group into threads by trader
  const threadsMap = new Map<
    string,
    {
      traderId: string;
      trader: string;
      traderEmail: string;
      desk: string | null;
      active: boolean;
      lastAt: string;
      presence: ReturnType<typeof serializeChatPresence>;
      profile: Record<string, unknown>;
      messages: {
        id: string;
        title: string | null;
        body: string;
        workerName: string | null;
        createdAt: string;
      }[];
    }
  >();

  for (const c of rows) {
    let t = threadsMap.get(c.userId);
    if (!t) {
      t = {
        traderId: c.userId,
        trader: c.user.name,
        traderEmail: c.user.email,
        desk: c.user.desk,
        active: c.user.active,
        lastAt: c.createdAt.toISOString(),
        presence: serializeChatPresence(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c.user as any).chatThreadState ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c.user as any).lastSeenAt ?? null
        ),
        profile: {
          id: c.user.id,
          name: c.user.name,
          email: c.user.email,
          firstName: c.user.firstName,
          lastName: c.user.lastName,
          phone: c.user.phone,
          language: c.user.language,
          timezone: c.user.timezone,
          country: c.user.country,
          accountType: c.user.accountType,
          currency: c.user.account?.currency || "USD",
          balance: c.user.account?.balance ?? 0,
          registrationDate: c.user.registrationDate?.toISOString() || c.user.createdAt.toISOString(),
          registrationCountry: c.user.registrationCountry,
          tradingServer: c.user.tradingServer || "Web Trading Server",
          ftd: c.user.ftd,
          brokerName: c.user.brokerName,
          assigneeName: c.user.assigneeName,
          affiliateA: c.user.affiliateA,
          lastLoginAt: c.user.lastLoginAt?.toISOString() || null,
          createdAt: c.user.createdAt.toISOString(),
          desk: c.user.desk,
          active: c.user.active,
          isActiveTrading: c.user.active,
          isActiveDeposit: true,
          isActiveWithdrawal: true,
        },
        messages: [],
      };
      threadsMap.set(c.userId, t);
    }
    t.messages.push({
      id: c.id,
      title: c.title,
      body: c.description,
      workerName: c.workerName,
      createdAt: c.createdAt.toISOString(),
    });
  }

  const threads = Array.from(threadsMap.values()).map((t) => ({
    ...t,
    messages: t.messages.reverse(),
  }));

  const traders = await prisma.user.findMany({
    where: { role: "TRADER" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  return NextResponse.json({ threads, traders });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "").trim();
  const message = String(body.message || body.description || "").trim();
  const title = body.title != null ? String(body.title).trim() : "Chat";
  if (!userId || !message) {
    return NextResponse.json({ error: "userId ve message zorunlu" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Trader not found" }, { status: 404 });

  const row = await prisma.communication.create({
    data: {
      userId,
      type: "CHAT",
      title,
      description: message,
      workerName: admin.name,
      workerId: admin.id,
    },
  });
  const { upsertChatPresence } = await import("@/lib/chat-presence");
  await upsertChatPresence(userId, {
    adminTyping: false,
    adminInChat: true,
    markAdminRead: true,
  });
  return NextResponse.json({ ok: true, id: row.id });
}

export async function PATCH(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminWrite();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || body.messageId || "").trim();
  const message = String(body.message || body.description || "").trim();
  if (!id || !message) {
    return NextResponse.json({ error: "id ve message zorunlu" }, { status: 400 });
  }

  const existing = await prisma.communication.findUnique({ where: { id } });
  if (!existing || existing.type !== "CHAT") {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Admins may edit any agent (worker) chat bubble; customer-origin notes stay read-only.
  if (!existing.workerId && !existing.workerName) {
    return NextResponse.json(
      { error: "Only admin/agent messages can be edited" },
      { status: 403 }
    );
  }

  const row = await prisma.communication.update({
    where: { id },
    data: {
      description: message,
      workerName: admin.name,
      workerId: admin.id,
    },
  });

  try {
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "CHAT_MESSAGE_EDIT",
        targetId: existing.userId,
        note: `Edited chat message ${id}`,
        meta: JSON.stringify({
          messageId: id,
          before: existing.description.slice(0, 2000),
          after: message.slice(0, 2000),
        }),
      },
    });
  } catch (e) {
    console.error("[chat edit audit]", e);
  }

  return NextResponse.json({
    ok: true,
    id: row.id,
    body: row.description,
    workerName: row.workerName,
    createdAt: row.createdAt.toISOString(),
  });
}
