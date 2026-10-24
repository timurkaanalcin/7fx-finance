import { canAccessUser, scopeUserWhere, assignedWhere, isScopedStaff } from "@/lib/crm-scope";
import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { touchLastContact } from "@/lib/last-contact";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { serializeChatPresence } from "@/lib/chat-presence";
import type { Prisma } from "@prisma/client";
import { chatMessageWindow, chatThreadWindow } from "@/lib/trader-list";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = (searchParams.get("userId") || "").trim();
  const paged = searchParams.has("take") || searchParams.has("skip");

  if (paged && !userId) {
    return NextResponse.json(await pagedThreads(admin, searchParams));
  }

  if (paged && userId) {
    return NextResponse.json(await pagedThreadMessages(admin, userId, searchParams));
  }

  const baseWhere: Prisma.CommunicationWhereInput = userId ? { type: "CHAT", userId } : { type: "CHAT" };
  const where = isScopedStaff(admin) ? { ...baseWhere, user: assignedWhere(admin) } : baseWhere;
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

  const traders = userId
    ? []
    : await prisma.user.findMany({
        where: scopeUserWhere(admin, { role: "TRADER" }),
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
        take: 200,
      });

  return NextResponse.json({ threads, traders });
}

const CHAT_USER_SELECT = {
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
} satisfies Prisma.UserSelect;

const CHAT_MSGS = 40;

async function pagedThreadMessages(
  admin: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>,
  userId: string,
  searchParams: URLSearchParams
) {
  const { take, skip } = chatMessageWindow(searchParams.get("take"), searchParams.get("skip"));
  const where: Prisma.CommunicationWhereInput = { ...chatWhere(admin, ""), userId };
  const [total, user, found] = await Promise.all([
    prisma.communication.count({ where }),
    prisma.user.findFirst({
      where: scopeUserWhere(admin, { id: userId }),
      select: CHAT_USER_SELECT,
    }),
    prisma.communication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: take + 1,
      select: {
        id: true,
        title: true,
        description: true,
        workerName: true,
        createdAt: true,
      },
    }),
  ]);
  if (!user) return { threads: [], hasMore: false, nextSkip: skip, messageCount: 0 };
  const hasMore = found.length > take;
  const page = hasMore ? found.slice(0, take) : found;
  const thread = threadFromMessages(
    page.map((m) => ({
      id: m.id,
      userId,
      title: m.title,
      description: m.description,
      workerName: m.workerName,
      createdAt: m.createdAt,
      user,
    })),
    total
  );
  return {
    threads: thread ? [thread] : [],
    hasMore,
    nextSkip: skip + page.length,
    messageCount: total,
  };
}

async function pagedThreads(
  admin: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>,
  searchParams: URLSearchParams
) {
  const q = (searchParams.get("q") || "").trim();
  const { take, skip } = chatThreadWindow(searchParams.get("take"), searchParams.get("skip"));
  const pins = (searchParams.get("pins") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  const where = chatWhere(admin, q);
  const heads = await prisma.communication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    distinct: ["userId"],
    skip,
    take: take + 1,
    select: { userId: true },
  });
  const hasMore = heads.length > take;
  const pageIds = (hasMore ? heads.slice(0, take) : heads).map((h) => h.userId);
  const extraPins = pins.filter((id) => !pageIds.includes(id));
  const ids = pageIds.concat(extraPins);
  const [groups, messageGroups, traders] = await Promise.all([
    ids.length
      ? prisma.communication.groupBy({
          by: ["userId"],
          where: { type: "CHAT", userId: { in: ids } },
          _count: true,
        })
      : Promise.resolve([]),
    Promise.all(
      ids.map((id) =>
        prisma.communication.findMany({
          where: { ...chatWhere(admin, ""), userId: id, type: "CHAT" },
          orderBy: { createdAt: "desc" },
          take: CHAT_MSGS,
          select: {
            id: true,
            userId: true,
            title: true,
            description: true,
            workerName: true,
            createdAt: true,
            user: { select: CHAT_USER_SELECT },
          },
        })
      )
    ),
    searchParams.get("picker") === "1"
      ? prisma.user.findMany({
          where: scopeUserWhere(admin, { role: "TRADER" }),
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
          skip: pickerSkip(searchParams),
          take: pickerQueryTake(searchParams),
        })
      : Promise.resolve(undefined),
  ]);
  const counts = new Map(groups.map((g) => [g.userId, g._count]));
  const threads = messageGroups
    .map((msgs) => threadFromMessages(msgs, counts.get(msgs[0]?.userId || "") ?? msgs.length))
    .filter((t): t is NonNullable<typeof t> => t != null);
  const rank = new Map(pageIds.map((id, i) => [id, i]));
  threads.sort((a, b) => (rank.get(a.traderId) ?? 1000) - (rank.get(b.traderId) ?? 1000));
  const picker = pageTraders(traders, searchParams);
  return {
    threads,
    hasMore,
    nextSkip: skip + pageIds.length,
    ...(picker ? picker : {}),
  };
}

function pickerPaged(searchParams: URLSearchParams): boolean {
  return searchParams.get("picker") === "1" && (searchParams.has("pickerTake") || searchParams.has("pickerSkip"));
}

function pickerSkip(searchParams: URLSearchParams): number {
  if (!pickerPaged(searchParams)) return 0;
  const n = Number(searchParams.get("pickerSkip"));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100_000, Math.trunc(n));
}

function pickerQueryTake(searchParams: URLSearchParams): number {
  if (!pickerPaged(searchParams)) return 200;
  const n = Math.trunc(Number(searchParams.get("pickerTake")));
  const take = Number.isFinite(n) && n > 0 ? Math.min(100, n) : 50;
  return take + 1;
}

function pageTraders(
  traders: { id: string; name: string; email: string }[] | undefined,
  searchParams: URLSearchParams
): { traders: { id: string; name: string; email: string }[]; pickerHasMore: boolean; pickerNextSkip: number } | null {
  if (!traders) return null;
  if (!pickerPaged(searchParams)) return { traders, pickerHasMore: false, pickerNextSkip: traders.length };
  const take = pickerQueryTake(searchParams) - 1;
  const skip = pickerSkip(searchParams);
  const pickerHasMore = traders.length > take;
  const page = pickerHasMore ? traders.slice(0, take) : traders;
  return { traders: page, pickerHasMore, pickerNextSkip: skip + page.length };
}

function chatWhere(admin: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>, q: string): Prisma.CommunicationWhereInput {
  const where: Prisma.CommunicationWhereInput = { type: "CHAT" };
  if (isScopedStaff(admin)) where.user = assignedWhere(admin);
  if (q) {
    const text: Prisma.CommunicationWhereInput[] = [
      { description: { contains: q } },
      { user: { name: { contains: q } } },
      { user: { email: { contains: q } } },
    ];
    where.AND = [{ OR: text }];
  }
  return where;
}

function threadFromMessages(
  msgs: {
    id: string;
    userId: string;
    title: string | null;
    description: string;
    workerName: string | null;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
      desk: string | null;
      active: boolean;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      language: string | null;
      timezone: string | null;
      country: string | null;
      accountType: string | null;
      registrationDate: Date | null;
      registrationCountry: string | null;
      tradingServer: string | null;
      ftd: boolean;
      brokerName: string | null;
      assigneeName: string | null;
      affiliateA: string | null;
      lastLoginAt: Date | null;
      lastSeenAt: Date | null;
      createdAt: Date;
      account: { currency: string; balance: number } | null;
      chatThreadState: Parameters<typeof serializeChatPresence>[0];
    };
  }[],
  messageCount: number
) {
  const newest = msgs[0];
  if (!newest) return null;
  const user = newest.user;
  const chronological = [...msgs].reverse();
  return {
    traderId: user.id,
    trader: user.name,
    traderEmail: user.email,
    desk: user.desk,
    active: user.active,
    lastAt: newest.createdAt.toISOString(),
    messageCount,
    presence: serializeChatPresence(user.chatThreadState ?? null, user.lastSeenAt ?? null),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      language: user.language,
      timezone: user.timezone,
      country: user.country,
      accountType: user.accountType,
      currency: user.account?.currency || "USD",
      balance: user.account?.balance ?? 0,
      registrationDate: user.registrationDate?.toISOString() || user.createdAt.toISOString(),
      registrationCountry: user.registrationCountry,
      tradingServer: user.tradingServer || "Web Trading Server",
      ftd: user.ftd,
      brokerName: user.brokerName,
      assigneeName: user.assigneeName,
      affiliateA: user.affiliateA,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      desk: user.desk,
      active: user.active,
      isActiveTrading: user.active,
      isActiveDeposit: true,
      isActiveWithdrawal: true,
    },
    messages: chronological.map((m) => ({
      id: m.id,
      title: m.title,
      body: m.description,
      workerName: m.workerName,
      createdAt: m.createdAt.toISOString(),
    })),
  };
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
  if (!(await canAccessUser(admin, userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  await touchLastContact(userId, row.createdAt);
  const { upsertChatPresence } = await import("@/lib/chat-presence");
  await upsertChatPresence(userId, {
    adminTyping: false,
    adminInChat: true,
    markAdminRead: true,
  });
  // A human replied: AI stays off for this thread; notify the customer.
  await prisma.chatThreadState.update({ where: { userId }, data: { supportMode: "HUMAN" } }).catch(() => {});
  const { notifyUsers } = await import("@/lib/notify");
  await notifyUsers([userId], { kind: "chat", title: "Destek ekibinden yeni mesaj", body: message, href: "/profile#destek" });
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
  if (existing && !(await canAccessUser(admin, existing.userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
