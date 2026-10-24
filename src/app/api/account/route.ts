import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { refreshAccountMetrics } from "@/lib/trading";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const metrics = await refreshAccountMetrics(user.id);
  return NextResponse.json(metrics);
}
