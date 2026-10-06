import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET — customer's own live-support thread (Communication type=CHAT, workerName=null means client). */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.communication.findMany({
    where: { userId: user.id, type: "CHAT" },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      title: true,
      description: true,
      workerName: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      title: m.title,
      body: m.description,
      from: m.workerName ? "support" : "customer",
      workerName: m.workerName,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

/** POST — send a live-support message (creates CRM-visible CHAT Communication). */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  return NextResponse.json({
    ok: true,
    message: {
      id: row.id,
      body: row.description,
      from: "customer",
      createdAt: row.createdAt.toISOString(),
    },
  });
}
