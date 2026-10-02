import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { refreshAccountMetrics, processPendingOrders, checkSlTp } from "@/lib/trading";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  await processPendingOrders(user.id);
  await checkSlTp(user.id);
  const metrics = await refreshAccountMetrics(user.id);
  return NextResponse.json(metrics);
}
