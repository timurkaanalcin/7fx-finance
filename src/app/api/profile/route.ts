import { NextResponse } from "next/server";
import { getSession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { impersonationReadonlyResponse } from "@/lib/impersonation-guard";
import { prisma } from "@/lib/prisma";
import { parseMembershipUpdate, serializeUserMembership } from "@/lib/membership";

export const dynamic = "force-dynamic";

/** Trader self-view of membership details (non-sensitive + limited edit) */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const session = await getSession();

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    include: { account: true },
  });
  if (!full) return NextResponse.json({ error: "User yok" }, { status: 404 });

  const m = serializeUserMembership(full as unknown as Record<string, unknown>);

  // Hide admin-only CRM statuses from being presented as editable; still show read-only identity/account
  return NextResponse.json({
    profile: {
      id: m.id,
      email: m.email,
      accountLoginId: m.accountLoginId ?? null,
      name: m.name,
      role: m.role,
      active: m.active,
      tradingEnabled: m.tradingEnabled !== false,
      withdrawalsEnabled: m.withdrawalsEnabled !== false,
      loginEnabled: m.loginEnabled !== false,
      mustChangePassword: (full as { mustChangePassword?: boolean }).mustChangePassword === true,
      impersonatedBy: session?.impersonatedBy ?? null,
      firstName: m.firstName,
      lastName: m.lastName,
      phone: m.phone,
      birthDate: m.birthDate,
      language: m.language,
      timezone: m.timezone,
      country: m.country,
      address: m.address,
      accountType: m.accountType,
      registrationDate: m.registrationDate,
      registrationCountry: m.registrationCountry,
      isResident: m.isResident,
      lastLoginAt: m.lastLoginAt,
      tradingServer: m.tradingServer,
      documentsStatus: m.documentsStatus,
      balance: m.balance,
      equity: m.equity,
      credit: m.credit,
      bonus: m.bonus,
      currency: m.currency,
      margin: m.margin,
      freeMargin: m.freeMargin,
      leverage: m.leverage,
      // CRM statuses visible read-only but not for edit
      ftd: m.ftd,
    },
    editable: session?.impersonatedBy ? [] : ["phone", "language", "timezone", "address"],
  });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
  const readOnly = await impersonationReadonlyResponse();
  if (readOnly) return readOnly;

  const body = await req.json().catch(() => ({}));

  // Password change (current + new + confirm)
  if (body.changePassword === true || body.currentPassword != null || body.newPassword != null) {
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Current password, new password and confirmation are required" },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password cannot be the same as the current password" },
        { status: 400 }
      );
    }

    const full = await prisma.user.findUnique({ where: { id: user.id } });
    if (!full) return NextResponse.json({ error: "User yok" }, { status: 404 });

    const ok = await verifyPassword(currentPassword, full.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true, passwordChanged: true });
  }

  const data = parseMembershipUpdate(body, { traderSelf: true });
  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    include: { account: true },
  });

  const m = serializeUserMembership(updated as unknown as Record<string, unknown>);
  return NextResponse.json({
    ok: true,
    profile: {
      id: m.id,
      email: m.email,
      name: m.name,
      phone: m.phone,
      language: m.language,
      timezone: m.timezone,
      address: m.address,
      country: m.country,
      firstName: m.firstName,
      lastName: m.lastName,
    },
  });
}
