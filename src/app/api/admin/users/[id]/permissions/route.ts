import { NextResponse } from "next/server";
import { writeAudit, requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { flagsFromUser, isMainAdminEmail } from "@/lib/account-perms";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/**
 * PATCH — toggle tradingEnabled / withdrawalsEnabled / loginEnabled for a trader.
 * Requires canManageUsers. Never applies to ADMIN_EMAIL. Audit-logged with admin name.
 */
export async function PATCH(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = ctx.params.id;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User yok" }, { status: 404 });

  if (isMainAdminEmail(target.email)) {
    return NextResponse.json(
      { error: "Production ADMIN_EMAIL account permissions cannot be changed" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  const changes: Record<string, unknown> = {};

  for (const key of ["tradingEnabled", "withdrawalsEnabled", "loginEnabled"] as const) {
    if (typeof body[key] === "boolean") {
      data[key] = body[key];
      changes[key] = body[key];
    }
  }

  // Optional CRM reason note (stored in audit only).
  const reasonNote =
    body.reasonNote != null ? String(body.reasonNote).trim().slice(0, 500) : "";

  // Client-facing message when disabling (or editing) login.
  if ("loginBlockedMessage" in body) {
    const msg =
      body.loginBlockedMessage == null
        ? null
        : String(body.loginBlockedMessage).trim().slice(0, 4000);
    data.loginBlockedMessage = msg || null;
    changes.loginBlockedMessage = msg || null;
  }

  if (typeof body.loginEnabled === "boolean") {
    if (body.loginEnabled === false) {
      const msg =
        body.loginBlockedMessage != null
          ? String(body.loginBlockedMessage).trim()
          : String(target.loginBlockedMessage || "").trim();
      if (!msg) {
        return NextResponse.json(
          { error: "loginBlockedMessage is required when disabling login" },
          { status: 400 }
        );
      }
      data.loginBlockedMessage = msg.slice(0, 4000);
      data.loginBlockedAt = new Date();
      changes.loginBlockedMessage = data.loginBlockedMessage;
      changes.loginBlockedAt = data.loginBlockedAt;
    } else {
      // Re-enabling login clears the block timestamp; keep message for re-edit unless cleared.
      data.loginBlockedAt = null;
      if (body.clearLoginMessage === true) {
        data.loginBlockedMessage = null;
        changes.loginBlockedMessage = null;
      }
    }
  } else if (
    "loginBlockedMessage" in body &&
    target.loginEnabled === false &&
    typeof body.loginBlockedMessage === "string"
  ) {
    // Editing the message while still disabled.
    const msg = String(body.loginBlockedMessage).trim();
    if (!msg) {
      return NextResponse.json(
        { error: "loginBlockedMessage cannot be empty while login is disabled" },
        { status: 400 }
      );
    }
    data.loginBlockedMessage = msg.slice(0, 4000);
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "No permission fields to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id }, data });
  await writeAudit({
    adminId: admin.id,
    action: "ACCOUNT_PERMISSIONS",
    targetId: id,
    note: reasonNote || `Permissions updated by ${admin.name}`,
    meta: {
      adminName: admin.name,
      adminEmail: admin.email,
      changes,
      reasonNote: reasonNote || null,
      before: flagsFromUser(target),
      after: flagsFromUser(updated),
    },
  });

  return NextResponse.json({
    ok: true,
    permissions: flagsFromUser(updated),
    isMainAdmin: isMainAdminEmail(updated.email),
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const user = await prisma.user.findUnique({ where: { id: ctx.params.id } });
  if (!user) return NextResponse.json({ error: "User yok" }, { status: 404 });
  return NextResponse.json({
    permissions: flagsFromUser(user),
    isMainAdmin: isMainAdminEmail(user.email),
  });
}
