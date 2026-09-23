import { NextResponse } from "next/server";
import { requireUser, permissionsOf } from "@/lib/auth";
import { refreshAccountMetrics, processPendingOrders, checkSlTp } from "@/lib/trading";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Oturum yok" }, { status: 401 });
  await processPendingOrders(user.id);
  await checkSlTp(user.id);
  const metrics = await refreshAccountMetrics(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "TRADER",
      active: (user as { active?: boolean }).active !== false,
    },
    account: metrics,
    permissions: permissionsOf(user),
  });
}
