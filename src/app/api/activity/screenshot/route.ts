import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Best-effort screenshot / capture signal from the client.
 * Browsers cannot reliably detect OS-level screenshots; this records heuristics only.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { path?: string; reason?: string; meta?: Record<string, unknown> } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }

  const path = String(body.path || "").slice(0, 512) || null;
  const reason = String(body.reason || "unknown").slice(0, 64);
  const ua = (req.headers.get("user-agent") || "").slice(0, 1000) || null;
  const meta = JSON.stringify({
    reason,
    ...(body.meta && typeof body.meta === "object" ? body.meta : {}),
    // honesty flag for CRM UI
    reliable: false,
    note: "Best-effort browser heuristic; OS screenshots are often undetectable.",
  });

  // Throttle: skip if same user reported within 8s
  const recent = await prisma.clientActivityEvent.findFirst({
    where: {
      userId: user.id,
      kind: "SCREENSHOT_SUSPECTED",
      createdAt: { gte: new Date(Date.now() - 8000) },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  const row = await prisma.clientActivityEvent.create({
    data: {
      userId: user.id,
      kind: "SCREENSHOT_SUSPECTED",
      path,
      userAgent: ua,
      meta,
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
