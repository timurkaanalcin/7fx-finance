import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const body = await req.json();
  const id = String(body.id || "");
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id, status: "PENDING" },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  await prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ok: true });
}
