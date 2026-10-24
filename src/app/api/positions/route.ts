import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAccountMetrics, processPendingOrders, checkSlTp } from "@/lib/trading";
import { stripStaff } from "@/lib/customer-sanitize";
import {
  CLOSED_PAGE,
  OPEN_PAGE,
  closedRefreshTake,
  engineOnOpenPage,
  pageSkip,
} from "@/lib/position-pages";

function tzOffsetMinutes(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-14 * 60, Math.min(14 * 60, Math.trunc(n)));
}

/** Local midnight for YYYY-MM-DD, expressed in UTC. `tzOffsetMin` is Date.getTimezoneOffset(). */
function localDayBounds(day: string, tzOffsetMin: number): { start: Date; end: Date } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const startMs = Date.UTC(y, mo - 1, d) + tzOffsetMin * 60_000;
  return { start: new Date(startMs), end: new Date(startMs + 86_400_000) };
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "OPEN";

  // Pending fills and SL/TP also run from the engine cron. The first open page
  // still runs them so the visible terminal does not wait for the next cron.
  // Later pages are a read. Closed-history and other status reads still reprice
  // the account, but they must not close or fill.
  if (status === "OPEN") {
    const skip = pageSkip(searchParams.get("skip"));
    let metrics: Awaited<ReturnType<typeof refreshAccountMetrics>> = null;
    if (engineOnOpenPage(skip)) {
      await processPendingOrders(user.id);
      await checkSlTp(user.id);
      metrics = await refreshAccountMetrics(user.id);
    }
    const rows = await prisma.position.findMany({
      where: { userId: user.id, status: "OPEN" },
      orderBy: { openedAt: "desc" },
      skip,
      take: OPEN_PAGE + 1,
    });
    const hasMore = rows.length > OPEN_PAGE;
    const positions = hasMore ? rows.slice(0, OPEN_PAGE) : rows;
    return NextResponse.json({
      positions: stripStaff(positions),
      account: metrics,
      hasMore,
      nextSkip: skip + positions.length,
    });
  }

  await refreshAccountMetrics(user.id);

  if (status === "CLOSED") {
    const bounds = localDayBounds(searchParams.get("day") || "", tzOffsetMinutes(searchParams.get("tzOffset")));
    if (bounds) {
      const padMs = 2 * 3_600_000;
      const positions = await prisma.position.findMany({
        where: {
          userId: user.id,
          status: "CLOSED",
          OR: [
            { closedAt: { gte: new Date(bounds.start.getTime() - padMs), lt: new Date(bounds.end.getTime() + padMs) } },
            {
              closedAt: null,
              openedAt: { gte: new Date(bounds.start.getTime() - padMs), lt: new Date(bounds.end.getTime() + padMs) },
            },
          ],
        },
        orderBy: { closedAt: "desc" },
        take: 500,
      });
      return NextResponse.json({ positions: stripStaff(positions) });
    }

    const skip = pageSkip(searchParams.get("skip"));
    // calendar=0 is the 30s blotter refresh. Reload the rows already on screen
    // (capped) so a CRM edit in that window shows up without the full ledger.
    const take =
      skip === 0 && searchParams.get("calendar") === "0"
        ? closedRefreshTake(searchParams.get("loaded"))
        : CLOSED_PAGE;
    const rows = await prisma.position.findMany({
      where: { userId: user.id, status: "CLOSED" },
      orderBy: [{ closedAt: "desc" }, { id: "desc" }],
      skip,
      take: take + 1,
    });
    const hasMore = rows.length > take;
    const positions = hasMore ? rows.slice(0, take) : rows;
    let calendar: unknown[] | undefined;
    // The 30s blotter refresh passes calendar=0. The full ledger is for the
    // first load and when the terminal tab becomes visible again.
    if (skip === 0 && searchParams.get("calendar") !== "0") {
      calendar = await prisma.position.findMany({
        where: { userId: user.id, status: "CLOSED" },
        select: {
          id: true,
          symbol: true,
          chartSymbol: true,
          side: true,
          volume: true,
          openPrice: true,
          closePrice: true,
          profit: true,
          closeProfit: true,
          stopLoss: true,
          takeProfit: true,
          openedAt: true,
          closedAt: true,
        },
        orderBy: [{ closedAt: "desc" }, { id: "desc" }],
      });
    }
    return NextResponse.json({
      positions: stripStaff(positions),
      hasMore,
      nextSkip: skip + positions.length,
      calendar,
    });
  }

  const positions = await prisma.position.findMany({
    where: { userId: user.id, status },
    orderBy: { openedAt: "desc" },
    take: 200,
  });
  return NextResponse.json(stripStaff(positions));
}
