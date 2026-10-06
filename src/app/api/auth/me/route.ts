import { NextResponse } from "next/server";
import {
  requireUser,
  permissionsOf,
  getSession,
  clearSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAccountMetrics, processPendingOrders, checkSlTp } from "@/lib/trading";
import {
  LOGIN_DISABLED_CODE,
  flagsFromUser,
  loginDisabledFallbackMessage,
} from "@/lib/account-perms";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No session" }, { status: 401 });

  // Detect login-disabled before requireUser so we can return the admin message + clear cookie.
  if (!session.impersonatedBy) {
    const raw = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        loginEnabled: true,
        loginBlockedMessage: true,
        language: true,
        active: true,
      },
    });
    if (raw && raw.loginEnabled === false) {
      const message =
        (raw.loginBlockedMessage && String(raw.loginBlockedMessage).trim()) ||
        loginDisabledFallbackMessage(raw.language);
      const res = NextResponse.json(
        {
          error: loginDisabledFallbackMessage(raw.language),
          code: LOGIN_DISABLED_CODE,
          message,
        },
        { status: 403 }
      );
      clearSessionCookie(res);
      return res;
    }
  }

  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  await processPendingOrders(user.id);
  await checkSlTp(user.id);
  const metrics = await refreshAccountMetrics(user.id);
  const flags = flagsFromUser(user as Parameters<typeof flagsFromUser>[0]);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "TRADER",
      active: (user as { active?: boolean }).active !== false,
      accountLoginId: (user as { accountLoginId?: string | null }).accountLoginId ?? null,
      impersonatedBy: session?.impersonatedBy ?? null,
      tradingEnabled: flags.tradingEnabled,
      withdrawalsEnabled: flags.withdrawalsEnabled,
      loginEnabled: flags.loginEnabled,
      mustChangePassword: (user as { mustChangePassword?: boolean }).mustChangePassword === true,
    },
    account: metrics,
    permissions: permissionsOf(user),
  });
}
