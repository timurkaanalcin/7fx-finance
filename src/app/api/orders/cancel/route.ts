import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tradingDisabledMessage, mustChangePasswordMessage } from "@/lib/account-perms";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  if ((user as { mustChangePassword?: boolean }).mustChangePassword === true) {
    return NextResponse.json(
      { error: mustChangePasswordMessage((user as { language?: string }).language) },
      { status: 403 }
    );
  }
  if ((user as { tradingEnabled?: boolean }).tradingEnabled === false) {
    return NextResponse.json(
      { error: tradingDisabledMessage((user as { language?: string }).language) },
      { status: 403 }
    );
  }
  const body = await req.json();
  const id = String(body.id || "");
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id, status: "PENDING" },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  await prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ok: true });
}
