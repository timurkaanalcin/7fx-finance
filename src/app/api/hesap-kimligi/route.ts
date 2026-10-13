import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allocateUniqueAccountLoginId, isAccountLoginId } from "@/lib/account-login-id";

export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store" };

/** GET: does this user have a Hesap Kimliği? (never returns the ID itself before verification) */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: H });
  return NextResponse.json({ hasId: !!user.accountLoginId, exempt: user.role === "ADMIN" }, { headers: H });
}

/** POST {action:"verify", id} | {action:"create"} */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: H });
  const body = (await req.json().catch(() => ({}))) as { action?: string; id?: string };
  if (body.action === "create") {
    if (user.accountLoginId) return NextResponse.json({ error: "exists" }, { status: 409, headers: H });
    const id = await allocateUniqueAccountLoginId();
    await prisma.user.update({ where: { id: user.id }, data: { accountLoginId: id } });
    return NextResponse.json({ ok: true, id }, { headers: H });
  }
  const id = String(body.id || "").replace(/\s+/g, "");
  if (!isAccountLoginId(id) || id !== user.accountLoginId) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false, error: "mismatch" }, { status: 400, headers: H });
  }
  return NextResponse.json({ ok: true, id }, { headers: H });
}
