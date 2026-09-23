import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAccountMetrics, processPendingOrders, checkSlTp } from "@/lib/trading";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Oturum yok" }, { status: 401 });
  await processPendingOrders(user.id);
  await checkSlTp(user.id);
  await refreshAccountMetrics(user.id);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "OPEN";
  const positions = await prisma.position.findMany({
    where: { userId: user.id, status },
    orderBy: status === "OPEN" ? { openedAt: "desc" } : { closedAt: "desc" },
    take: 200,
  });
  return NextResponse.json(positions);
}
