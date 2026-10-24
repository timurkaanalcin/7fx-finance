import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { modifyPositionSlTp } from "@/lib/trading";
import { tradingDisabledMessage, mustChangePasswordMessage } from "@/lib/account-perms";
import { publicErrorText } from "@/lib/security/public-error";

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
  try {
    const body = await req.json();
    const id = String(body.id ?? "");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const levels: { stopLoss?: number | null; takeProfit?: number | null } = {};

    if ("stopLoss" in body) {
      if (body.stopLoss == null || body.stopLoss === "") {
        levels.stopLoss = null;
      } else {
        const n = Number(body.stopLoss);
        if (!Number.isFinite(n)) {
          return NextResponse.json({ error: "Invalid stop loss" }, { status: 400 });
        }
        levels.stopLoss = n;
      }
    }

    if ("takeProfit" in body) {
      if (body.takeProfit == null || body.takeProfit === "") {
        levels.takeProfit = null;
      } else {
        const n = Number(body.takeProfit);
        if (!Number.isFinite(n)) {
          return NextResponse.json({ error: "Invalid take profit" }, { status: 400 });
        }
        levels.takeProfit = n;
      }
    }

    const position = await modifyPositionSlTp(user.id, id, levels);
    return NextResponse.json({ ok: true, position });
  } catch (e) {
    return NextResponse.json({ error: publicErrorText(e, "Modify error") }, { status: 400 });
  }
}
