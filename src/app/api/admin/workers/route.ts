import { NextResponse } from "next/server";
import { ADMIN_PERMISSIONS, hashPassword, writeAudit, type AdminPermission, requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { allocateUniqueAccountLoginId } from "@/lib/account-login-id";

export const dynamic = "force-dynamic";

/**
 * CRM workers (role=ADMIN users) — "Çalışanlar".
 *   GET                                   → workers + last successful login (IP / location) + desks
 *   POST   { name, email, password, deskId?, active?, <perm flags> }
 *   PATCH  { id, name?, email?, deskId?, active?, password?, <perm flags> }
 *   DELETE { id, force? }
 * Safety: the main ADMIN_EMAIL account and the acting admin can never be deleted or
 * deactivated; the main account's email/permissions are locked and only it can change
 * its own password; an admin can only grant permissions they hold themselves.
 * Deleting a worker with audit history needs force=true (the history is archived into
 * the WORKER_DELETE audit entry before the row is removed).
 */

const PERM_KEYS: AdminPermission[] = ADMIN_PERMISSIONS.map((p) => p.key);
type Body = Record<string, unknown>;

class BadRequest extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(msg: string, status = 400, extra?: Record<string, unknown>) {
    super(msg);
    this.status = status;
    this.extra = extra;
  }
}

function mainEmail() {
  return String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}
function isMain(email: string) {
  const m = mainEmail();
  return Boolean(m) && email.toLowerCase() === m;
}
function has(b: Body, k: string) {
  return Object.prototype.hasOwnProperty.call(b, k) && b[k] !== undefined;
}
function normEmail(v: unknown) {
  const e = String(v ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 191) throw new BadRequest("Valid email required");
  return e;
}
function password(v: unknown) {
  const p = String(v ?? "");
  if (p.length < 8) throw new BadRequest("Password must be at least 8 characters");
  if (p.length > 200) throw new BadRequest("Password too long");
  return p;
}
function bool(v: unknown) {
  return v === true || v === "true" || v === "1" || v === 1;
}

async function deskFields(deskId: unknown) {
  const id = String(deskId ?? "").trim();
  if (!id) return { desk: null, deskId: null };
  const d = await prisma.desk.findFirst({ where: { OR: [{ id }, { code: id }] } });
  if (!d) throw new BadRequest("Unknown desk");
  return { desk: d.name, deskId: d.id };
}

/** Permission flags from body; refuses granting a flag the actor does not hold. */
function permFields(body: Body, actor: Record<string, unknown>) {
  const out: Partial<Record<AdminPermission, boolean>> = {};
  for (const k of PERM_KEYS) {
    if (!has(body, k)) continue;
    const v = bool(body[k]);
    if (v && actor[k] === false) throw new BadRequest(`You cannot grant a permission you do not have (${k})`, 403);
    out[k] = v;
  }
  return out;
}

function fail(e: unknown) {
  if (e instanceof BadRequest) return NextResponse.json({ error: e.message, ...(e.extra || {}) }, { status: e.status });
  const code = (e as { code?: string })?.code;
  if (code === "P2002") return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  if (code === "P2025") return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  console.error("[admin/workers]", e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

async function readBody(req: Request): Promise<Body> {
  const url = new URL(req.url);
  let body: Body = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object") body = parsed as Body;
  } catch {
    body = {};
  }
  if (body.id === undefined && url.searchParams.get("id")) body.id = url.searchParams.get("id");
  return body;
}

const SELECT = {
  id: true,
  name: true,
  email: true,
  active: true,
  desk: true,
  deskId: true,
  lastLoginAt: true,
  lastSeenAt: true,
  lastIp: true,
  lastCity: true,
  lastRegion: true,
  lastCountry: true,
  lastCountryName: true,
  createdAt: true,
  canManageUsers: true,
  canApproveDeposits: true,
  canEditRates: true,
  canManageMethods: true,
  canAdjustBalance: true,
} as const;

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const workers = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: SELECT,
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  const ids = workers.map((w) => w.id);
  const events = ids.length
    ? await prisma.loginEvent.findMany({
        where: { userId: { in: ids }, success: true },
        orderBy: { at: "desc" },
        take: 2000,
        select: {
          userId: true,
          at: true,
          ip: true,
          city: true,
          region: true,
          country: true,
          countryName: true,
          device: true,
          browser: true,
          os: true,
          method: true,
        },
      })
    : [];
  const lastEvent = new Map<string, (typeof events)[number]>();
  for (const ev of events) if (!lastEvent.has(ev.userId)) lastEvent.set(ev.userId, ev);
  const desks = await prisma.desk.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, code: true, active: true },
    take: 300,
  });

  return NextResponse.json({
    workers: workers.map((w) => ({
      ...w,
      isMain: isMain(w.email),
      isSelf: w.id === admin.id,
      lastLogin: lastEvent.get(w.id) ?? null,
    })),
    desks,
    permissionDefs: ADMIN_PERMISSIONS,
    me: {
      id: admin.id,
      perms: Object.fromEntries(PERM_KEYS.map((k) => [k, (admin as Record<string, unknown>)[k] !== false])),
    },
  });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const body = await readBody(req);
    const email = normEmail(body.email);
    const pw = password(body.password);
    const name = String(body.name ?? "").trim().slice(0, 191) || email.split("@")[0];
    if (await prisma.user.findUnique({ where: { email } })) throw new BadRequest("Email already registered", 409);
    const desk = await deskFields(body.deskId);
    // Default: no permissions unless ticked.
    const perms: Record<AdminPermission, boolean> = {
      canManageUsers: false,
      canApproveDeposits: false,
      canEditRates: false,
      canManageMethods: false,
      canAdjustBalance: false,
      ...permFields(body, admin as unknown as Record<string, unknown>),
    };
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(pw),
        role: "ADMIN",
        active: has(body, "active") ? bool(body.active) : true,
        accountLoginId: await allocateUniqueAccountLoginId(),
        registrationDate: new Date(),
        ...desk,
        ...perms,
        account: { create: { balance: 0, equity: 0, freeMargin: 0, currency: "USD" } },
      },
      select: SELECT,
    });
    await writeAudit({
      adminId: admin.id,
      action: "WORKER_CREATE",
      targetId: user.id,
      meta: { email, name, desk, perms, active: user.active },
    });
    return NextResponse.json({ ok: true, worker: user });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const body = await readBody(req);
    const id = String(body.id ?? "").trim();
    if (!id) throw new BadRequest("id required");
    const target = await prisma.user.findUnique({ where: { id }, select: { ...SELECT, role: true } });
    if (!target || target.role !== "ADMIN") throw new BadRequest("Worker not found", 404);
    const self = target.id === admin.id;
    const main = isMain(target.email);

    const data: Record<string, unknown> = {};
    if (has(body, "name")) {
      const n = String(body.name ?? "").trim().slice(0, 191);
      if (!n) throw new BadRequest("Name required");
      data.name = n;
    }
    if (has(body, "email")) {
      const e = normEmail(body.email);
      if (e !== target.email) {
        if (main) throw new BadRequest("The main ADMIN_EMAIL account's email cannot be changed", 403);
        const clash = await prisma.user.findUnique({ where: { email: e }, select: { id: true } });
        if (clash && clash.id !== id) throw new BadRequest("Email already registered", 409);
        data.email = e;
      }
    }
    if (has(body, "deskId")) Object.assign(data, await deskFields(body.deskId));
    if (has(body, "active")) {
      const a = bool(body.active);
      if (!a && self) throw new BadRequest("You cannot deactivate yourself", 403);
      if (!a && main) throw new BadRequest("The main ADMIN_EMAIL account cannot be deactivated", 403);
      data.active = a;
    }
    const perms = permFields(body, admin as unknown as Record<string, unknown>);
    for (const [k, v] of Object.entries(perms)) {
      if (v === false && main) throw new BadRequest("The main ADMIN_EMAIL account's permissions are locked", 403);
      if (v === false && self && k === "canManageUsers") {
        throw new BadRequest("You cannot remove your own user-management permission", 403);
      }
      data[k] = v;
    }
    let passwordChanged = false;
    if (has(body, "password") && String(body.password ?? "") !== "") {
      if (main && !self) throw new BadRequest("Only the main admin can change its own password", 403);
      data.passwordHash = await hashPassword(password(body.password));
      // Revoke the worker's existing sessions; skipped for self so the acting session survives.
      if (!self) data.passwordChangedAt = new Date();
      passwordChanged = true;
    }
    if (!Object.keys(data).length) return NextResponse.json({ ok: true, worker: target, unchanged: true });
    const updated = await prisma.user.update({ where: { id }, data, select: SELECT });
    const { passwordHash: _ph, passwordChangedAt: _pc, ...auditData } = data;
    void _ph;
    void _pc;
    await writeAudit({
      adminId: admin.id,
      action: "WORKER_UPDATE",
      targetId: id,
      meta: {
        changes: auditData,
        passwordChanged,
        before: {
          name: target.name,
          email: target.email,
          desk: target.desk,
          active: target.active,
          ...Object.fromEntries(PERM_KEYS.map((k) => [k, target[k]])),
        },
      },
    });
    return NextResponse.json({ ok: true, worker: updated, passwordChanged });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const body = await readBody(req);
    const id = String(body.id ?? "").trim();
    if (!id) throw new BadRequest("id required");
    const target = await prisma.user.findUnique({ where: { id }, select: { ...SELECT, role: true } });
    if (!target || target.role !== "ADMIN") throw new BadRequest("Worker not found", 404);
    if (target.id === admin.id) throw new BadRequest("You cannot delete yourself", 403);
    if (isMain(target.email)) throw new BadRequest("The main ADMIN_EMAIL account cannot be deleted", 403);

    // AuditLog rows cascade with their admin — never drop history silently.
    const auditCount = await prisma.auditLog.count({ where: { adminId: id } });
    const force = bool(body.force);
    if (auditCount > 0 && !force) {
      throw new BadRequest(
        `This worker has ${auditCount} audit log entr${auditCount === 1 ? "y" : "ies"}. Deactivate instead, or confirm deletion to archive them.`,
        409,
        { auditCount }
      );
    }
    let archived: unknown[] = [];
    if (auditCount > 0) {
      const logs = await prisma.auditLog.findMany({
        where: { adminId: id },
        orderBy: { createdAt: "desc" },
        take: 300,
        select: { action: true, targetId: true, note: true, createdAt: true },
      });
      archived = logs;
      // keep the archive under MySQL TEXT limits
      while (archived.length && JSON.stringify(archived).length > 55_000) archived = archived.slice(0, Math.floor(archived.length * 0.8));
    }
    await prisma.user.delete({ where: { id } });
    await writeAudit({
      adminId: admin.id,
      action: "WORKER_DELETE",
      targetId: id,
      note: `${target.name} <${target.email}>`,
      meta: {
        worker: {
          name: target.name,
          email: target.email,
          desk: target.desk,
          active: target.active,
          ...Object.fromEntries(PERM_KEYS.map((k) => [k, target[k]])),
        },
        auditCount,
        archivedAudit: archived,
      },
    });
    return NextResponse.json({ ok: true, auditCount });
  } catch (e) {
    return fail(e);
  }
}
