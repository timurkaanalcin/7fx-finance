import { NextResponse } from "next/server";
import { writeAudit, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoSeed } from "@/lib/ensure-seed";
import { canSeeTeam, writableTeams, type StaffLike } from "@/lib/comment-teams";
import { recomputeLastContact, touchLastContact } from "@/lib/last-contact";
import { isSupportedAccountCurrency, normalizeAccountCurrency } from "@/lib/membership";
import {
  applyBalanceDelta,
  applyLedgerRowDelta,
  balanceRequestEffect,
  depositEffect,
  ledgerTarget,
  withdrawalEffect,
  type AdminRef,
} from "@/lib/crm-balance";

export const dynamic = "force-dynamic";

/**
 * Per-trader CRM record management (admin only).
 *   POST   { entity, ...fields, applyToBalance? }      → create
 *   PATCH  { entity, id, ...fields, applyToBalance? }  → update
 *   DELETE { entity, id, applyToBalance? }             → delete
 * entity ∈ note | communication | document | reminder | deposit | withdrawal | balanceRequest | ledger
 * Balance rule: see src/lib/crm-balance.ts — nothing moves the Account unless applyToBalance=true.
 *
 * PATCH extras for financial records (used by /admin/tickets and /admin/transactions):
 *   moveToUserId  → reassign the record to another client/trader. With applyToBalance the
 *                   old owner loses the record's effect and the new owner gains it.
 *   convertTo     → (deposit | withdrawal | balanceRequest only) change the ticket kind: the row
 *                   is re-created in the other table (same dates/notes) and the old row deleted.
 *                   With applyToBalance the balance moves by effect(new) − effect(old).
 */

type Ctx = { params: { id: string } };
type Body = Record<string, unknown>;

const ENTITIES = [
  "note",
  "communication",
  "document",
  "reminder",
  "deposit",
  "withdrawal",
  "balanceRequest",
  "ledger",
] as const;
type Entity = (typeof ENTITIES)[number];
const FINANCIAL: Entity[] = ["deposit", "withdrawal", "balanceRequest", "ledger"];

const REQ_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const DOC_TYPES = ["ID", "ADDRESS", "SELFIE", "OTHER"];
const COMM_TYPES = ["CHAT", "CALL", "NOTE", "EMAIL", "SMS", "MEETING"];
const LEDGER_TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "BONUS",
  "CREDIT",
  "ADJUSTMENT",
  "RESET",
  "MARGIN_ADD",
  "TRADE_PNL",
  "FINANCE_SET",
  "CURRENCY_CHANGE",
  "TRANSFER",
];

class BadRequest extends Error {}

function has(b: Body, k: string) {
  return Object.prototype.hasOwnProperty.call(b, k) && b[k] !== undefined;
}
function str(v: unknown, max = 500): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}
function reqStr(v: unknown, label: string, max = 500): string {
  const s = str(v, max);
  if (!s) throw new BadRequest(`${label} required`);
  return s;
}
function num(v: unknown, label: string, opts?: { min?: number; positive?: boolean }): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  if (v === "" || v == null || !Number.isFinite(n)) throw new BadRequest(`Invalid ${label}`);
  if (opts?.positive && n <= 0) throw new BadRequest(`${label} must be > 0`);
  if (opts?.min != null && n < opts.min) throw new BadRequest(`${label} must be ≥ ${opts.min}`);
  return n;
}
function numOrNull(v: unknown, label: string): number | null {
  if (v === "" || v == null) return null;
  return num(v, label);
}
function date(v: unknown, label: string): Date {
  const d = new Date(String(v ?? ""));
  if (v === "" || v == null || Number.isNaN(d.getTime())) throw new BadRequest(`Invalid ${label}`);
  return d;
}
function oneOf(v: unknown, list: string[], label: string): string {
  const s = String(v ?? "").trim().toUpperCase();
  if (!list.includes(s)) throw new BadRequest(`Invalid ${label}`);
  return s;
}
function currency(v: unknown): string {
  if (!isSupportedAccountCurrency(v)) throw new BadRequest("Invalid currency");
  return normalizeAccountCurrency(v);
}
/** Keep reviewedAt in sync with status unless explicitly provided. */
function reviewStamp(data: Body, body: Body, prevStatus: string | null) {
  const next = data.status as string | undefined;
  const statusChanged = !!next && next !== prevStatus;
  if (has(body, "reviewedAt") && body.reviewedAt !== "" && body.reviewedAt !== null) {
    data.reviewedAt = date(body.reviewedAt, "reviewedAt");
    return;
  }
  if (statusChanged) {
    data.reviewedAt = next === "PENDING" ? null : new Date();
    return;
  }
  if (has(body, "reviewedAt")) data.reviewedAt = null; // explicitly cleared
}

async function syncDocumentsStatus(userId: string) {
  const docs = await prisma.documentRecord.findMany({ where: { userId } });
  let userStatus = "NONE";
  if (docs.some((d) => d.status === "PENDING")) userStatus = "PENDING";
  else if (docs.some((d) => d.status === "REJECTED")) userStatus = "REJECTED";
  else if (docs.length && docs.every((d) => d.status === "APPROVED")) userStatus = "APPROVED";
  await prisma.user.update({ where: { id: userId }, data: { documentsStatus: userStatus } });
  return userStatus;
}

async function auth(entity: Entity, applyToBalance: boolean) {
  const admin = await requireAdminPerm("canManageUsers");
  if (!admin) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }) };
  if (FINANCIAL.includes(entity) && !(await requireAdminPerm("canApproveDeposits"))) {
    return { error: NextResponse.json({ error: "No permission for financial records" }, { status: 403 }) };
  }
  if (applyToBalance && !(await requireAdminPerm("canAdjustBalance"))) {
    return { error: NextResponse.json({ error: "No permission to adjust balance" }, { status: 403 }) };
  }
  return { admin: { id: admin.id, name: admin.name } as AdminRef, staff: admin as StaffLike };
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
  for (const k of ["entity", "id", "applyToBalance"]) {
    if (body[k] === undefined && url.searchParams.get(k) != null) body[k] = url.searchParams.get(k);
  }
  return body;
}

function parseEntity(body: Body): Entity {
  const e = String(body.entity || "");
  if (!(ENTITIES as readonly string[]).includes(e)) throw new BadRequest("Unknown entity");
  return e as Entity;
}

function wantsApply(body: Body) {
  return body.applyToBalance === true || body.applyToBalance === "true" || body.applyToBalance === "1";
}

/* ---------------------------- field parsers ---------------------------- */

function noteData(body: Body, create: boolean) {
  const d: Body = {};
  if (create || has(body, "body")) d.body = reqStr(body.body, "body", 5000);
  if (has(body, "authorName")) d.authorName = str(body.authorName, 120);
  if (has(body, "team")) {
    const t = String(body.team ?? "").trim().toUpperCase();
    d.team = t ? oneOf(t, ["SALE", "RET"], "team") : null;
  }
  if (has(body, "createdAt") && body.createdAt !== "") d.createdAt = date(body.createdAt, "createdAt");
  return d;
}
function commData(body: Body, create: boolean) {
  const d: Body = {};
  if (create || has(body, "type")) d.type = oneOf(body.type ?? "NOTE", COMM_TYPES, "type");
  if (has(body, "title")) d.title = str(body.title, 191);
  if (create || has(body, "description")) d.description = reqStr(body.description, "description", 5000);
  if (has(body, "workerName")) d.workerName = str(body.workerName, 120);
  // New contact logs are always stamped "now" by the DB default; only edits may correct the date.
  if (!create && has(body, "createdAt") && body.createdAt !== "") d.createdAt = date(body.createdAt, "createdAt");
  return d;
}
function docData(body: Body, create: boolean, prevStatus: string | null) {
  const d: Body = {};
  if (create || has(body, "name")) d.name = reqStr(body.name, "name", 191);
  if (create || has(body, "docType")) d.docType = oneOf(body.docType ?? "OTHER", DOC_TYPES, "docType");
  if (create || has(body, "status")) d.status = oneOf(body.status ?? "PENDING", REQ_STATUSES, "status");
  if (has(body, "note")) d.note = str(body.note, 5000);
  if (has(body, "createdAt") && body.createdAt !== "") d.createdAt = date(body.createdAt, "createdAt");
  reviewStamp(d, body, prevStatus);
  return d;
}
function reminderData(body: Body, create: boolean) {
  const d: Body = {};
  if (create || has(body, "body")) d.body = reqStr(body.body, "body", 5000);
  if (create || has(body, "remindAt")) d.remindAt = date(body.remindAt, "remindAt");
  if (has(body, "color")) {
    const c = String(body.color || "").trim();
    if (c && !/^#[0-9a-fA-F]{3,8}$/.test(c)) throw new BadRequest("Invalid color");
    d.color = c || "#3b82f6";
  }
  if (has(body, "workerName")) d.workerName = str(body.workerName, 120);
  return d;
}
async function depositData(body: Body, create: boolean, prevStatus: string | null) {
  const d: Body = {};
  if (create || has(body, "amount")) d.amount = num(body.amount, "amount", { positive: true });
  if (create || has(body, "currency")) d.currency = currency(body.currency ?? "USD");
  if (create || has(body, "methodId")) {
    let methodId = str(body.methodId, 191);
    if (!methodId && create) {
      const first = await prisma.depositMethod.findFirst({ orderBy: [{ active: "desc" }, { sortOrder: "asc" }] });
      methodId = first?.id ?? null;
    }
    if (!methodId) throw new BadRequest("methodId required");
    const m = await prisma.depositMethod.findUnique({ where: { id: methodId } });
    if (!m) throw new BadRequest("Unknown deposit method");
    d.methodId = methodId;
  }
  if (create || has(body, "status")) d.status = oneOf(body.status ?? "PENDING", REQ_STATUSES, "status");
  for (const k of ["note", "adminNote", "approvalReason", "eventScenario"]) {
    if (has(body, k)) d[k] = str(body[k], 10000);
  }
  if (has(body, "createdAt") && body.createdAt !== "") d.createdAt = date(body.createdAt, "createdAt");
  reviewStamp(d, body, prevStatus);
  return d;
}
function withdrawalData(body: Body, create: boolean, prevStatus: string | null) {
  const d: Body = {};
  if (create || has(body, "amount")) d.amount = num(body.amount, "amount", { positive: true });
  if (create || has(body, "currency")) d.currency = currency(body.currency ?? "USD");
  if (create || has(body, "method")) d.method = oneOf(body.method ?? "BANK", ["BANK", "CRYPTO"], "method");
  if (create || has(body, "status")) d.status = oneOf(body.status ?? "PENDING", REQ_STATUSES, "status");
  for (const k of ["details", "note", "adminNote", "approvalReason", "eventScenario"]) {
    if (has(body, k)) d[k] = str(body[k], 10000);
  }
  if (has(body, "createdAt") && body.createdAt !== "") d.createdAt = date(body.createdAt, "createdAt");
  reviewStamp(d, body, prevStatus);
  return d;
}
function balanceRequestData(body: Body, create: boolean, prevStatus: string | null) {
  const d: Body = {};
  if (create || has(body, "type")) d.type = oneOf(body.type ?? "ADD", ["ADD", "RESET"], "type");
  if (create || has(body, "amount")) d.amount = numOrNull(body.amount, "amount");
  if ((d.type === "ADD" || (!d.type && create)) && (d.amount == null || (d.amount as number) <= 0) && create) {
    throw new BadRequest("amount must be > 0 for ADD");
  }
  if (create || has(body, "status")) d.status = oneOf(body.status ?? "PENDING", REQ_STATUSES, "status");
  if (has(body, "reason")) d.reason = str(body.reason, 64) || "MARGIN_CALL";
  for (const k of ["adminNote", "approvalReason", "eventScenario"]) {
    if (has(body, k)) d[k] = str(body[k], 10000);
  }
  if (has(body, "equityAt")) d.equityAt = numOrNull(body.equityAt, "equityAt");
  if (has(body, "marginLvl")) d.marginLvl = numOrNull(body.marginLvl, "marginLvl");
  if (has(body, "createdAt") && body.createdAt !== "") d.createdAt = date(body.createdAt, "createdAt");
  reviewStamp(d, body, prevStatus);
  return d;
}
function ledgerData(body: Body, create: boolean) {
  const d: Body = {};
  if (create || has(body, "type")) d.type = oneOf(body.type ?? "ADJUSTMENT", LEDGER_TYPES, "type");
  if (create || has(body, "amount")) d.amount = num(body.amount, "amount");
  if (has(body, "balanceBefore") && body.balanceBefore !== "") d.balanceBefore = num(body.balanceBefore, "balanceBefore");
  if (has(body, "balanceAfter") && body.balanceAfter !== "") d.balanceAfter = num(body.balanceAfter, "balanceAfter");
  if (has(body, "currency")) d.currency = currency(body.currency);
  if (has(body, "comment")) d.comment = str(body.comment, 5000);
  if (has(body, "createdByName")) d.createdByName = str(body.createdByName, 120);
  if (has(body, "createdAt") && body.createdAt !== "") d.createdAt = date(body.createdAt, "createdAt");
  return d;
}


const TICKET_ENTITIES: Entity[] = ["deposit", "withdrawal", "balanceRequest"];

/** Validate an optional reassignment target; returns the owner id to use. */
async function resolveMoveTarget(body: Body, currentUserId: string): Promise<string> {
  const raw = str(body.moveToUserId, 64);
  if (!raw || raw === currentUserId) return currentUserId;
  const target = await prisma.user.findUnique({ where: { id: raw }, select: { id: true } });
  if (!target) throw new BadRequest("Target client not found");
  return target.id;
}

/** Fail before any write when a balance reflection would hit a user without an Account. */
async function requireAccounts(userIds: string[]) {
  for (const uid of Array.from(new Set(userIds))) {
    const acc = await prisma.account.findUnique({ where: { userId: uid }, select: { id: true } });
    if (!acc) throw new Error("ACCOUNT_NOT_FOUND");
  }
}

function parseConvert(body: Body, entity: Entity): Entity | null {
  const raw = str(body.convertTo, 32);
  if (!raw || raw === entity) return null;
  if (!TICKET_ENTITIES.includes(entity) || !TICKET_ENTITIES.includes(raw as Entity)) {
    throw new BadRequest("Invalid convertTo");
  }
  return raw as Entity;
}

function ticketEffect(entity: Entity, row: Body | null): number {
  if (!row) return 0;
  if (entity === "deposit") return depositEffect(row as never);
  if (entity === "withdrawal") return withdrawalEffect(row as never);
  if (entity === "balanceRequest") return balanceRequestEffect(row as never);
  return 0;
}

function iso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return v == null ? "" : String(v);
}

/** Re-create a ticket in another table (kind change), deleting the old row. */
async function convertTicket(opts: {
  from: Entity;
  to: Entity;
  prev: Body;
  body: Body;
  ownerId: string;
}) {
  const { from, to, prev, body, ownerId } = opts;
  const merged: Body = {
    amount: prev.amount,
    currency: prev.currency ?? "USD",
    status: prev.status,
    note: prev.note ?? null,
    adminNote: prev.adminNote ?? null,
    approvalReason: prev.approvalReason ?? null,
    eventScenario: prev.eventScenario ?? null,
    createdAt: iso(prev.createdAt),
    reviewedAt: iso(prev.reviewedAt),
  };
  for (const [k, v] of Object.entries(body)) {
    if (["entity", "id", "applyToBalance", "moveToUserId", "convertTo"].includes(k)) continue;
    if (v !== undefined) merged[k] = v;
  }
  const prevStatus = String(prev.status ?? "PENDING");
  let created: { id: string } & Body;
  if (to === "deposit") {
    const data = await depositData(merged, true, prevStatus);
    created = await prisma.depositRequest.create({ data: { userId: ownerId, ...data } as never });
  } else if (to === "withdrawal") {
    const data = withdrawalData(merged, true, prevStatus);
    created = await prisma.withdrawalRequest.create({ data: { userId: ownerId, ...data } as never });
  } else {
    if (merged.type == null) merged.type = "ADD";
    const data = balanceRequestData(merged, true, prevStatus);
    created = await prisma.balanceRequest.create({ data: { userId: ownerId, ...data } as never });
  }
  const id = String(prev.id);
  if (from === "deposit") await prisma.depositRequest.delete({ where: { id } });
  else if (from === "withdrawal") await prisma.withdrawalRequest.delete({ where: { id } });
  else await prisma.balanceRequest.delete({ where: { id } });
  return created;
}

/* ------------------------------ handlers ------------------------------ */

/** Default worker = acting admin unless a worker name was typed. */
function withWorker(userId: string, admin: AdminRef, d: Body) {
  const out: Body = { userId, workerId: admin.id, ...d };
  if (!d.workerName) out.workerName = admin.name;
  return out;
}

function fail(e: unknown) {
  if (e instanceof BadRequest) return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof Error && e.message === "ACCOUNT_NOT_FOUND") {
    return NextResponse.json({ error: "Trader has no trading account" }, { status: 404 });
  }
  const code = (e as { code?: string })?.code;
  if (code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
  console.error("[crm-records]", e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

async function reflect(
  entity: Entity,
  userId: string,
  admin: AdminRef,
  before: number,
  after: number,
  refId: string,
  verb: string
) {
  const delta = after - before;
  if (Math.abs(delta) < 1e-9) return null;
  const type = entity === "deposit" ? "DEPOSIT" : entity === "withdrawal" ? "WITHDRAWAL" : "MARGIN_ADD";
  const refType =
    entity === "deposit" ? "DepositRequest" : entity === "withdrawal" ? "WithdrawalRequest" : "BalanceRequest";
  return applyBalanceDelta({
    userId,
    delta,
    type,
    comment: `CRM ${verb}: ${refType} ${refId}`,
    admin,
    refType,
    refId,
  });
}

/**
 * Internal transfer between two traders' accounts. Writes a ledger row on BOTH accounts
 * (source: −amount "transfer out", target: +amount "transfer in") in one DB transaction.
 * With applyToBalance the two Account balances move too; otherwise only history is written.
 */
async function internalTransfer(body: Body, targetUserId: string, admin: AdminRef, apply: boolean) {
  const sourceUserId = reqStr(body.sourceUserId, "sourceUserId", 64);
  if (sourceUserId === targetUserId) throw new BadRequest("Source and target account must differ");
  const amount = num(body.amount, "amount");
  if (!(amount > 0)) throw new BadRequest("Amount must be greater than 0");
  const note = str(body.comment, 4000);
  const createdAt = has(body, "createdAt") && body.createdAt !== "" ? date(body.createdAt, "createdAt") : undefined;
  const result = await prisma.$transaction(async (tx) => {
    const [src, dst] = await Promise.all([
      tx.user.findUnique({ where: { id: sourceUserId }, include: { account: true } }),
      tx.user.findUnique({ where: { id: targetUserId }, include: { account: true } }),
    ]);
    if (!src) throw new BadRequest("Source account not found");
    if (!src.account || !dst?.account) throw new Error("ACCOUNT_NOT_FOUND");
    if (src.account.currency !== dst.account.currency) {
      throw new BadRequest(`Currency mismatch (${src.account.currency} → ${dst.account.currency})`);
    }
    if (src.account.balance + 1e-9 < amount) throw new BadRequest("Insufficient source balance");
    const sb = src.account.balance;
    const db = dst.account.balance;
    const label = (u: { name: string; accountLoginId: string | null; email: string }) =>
      `${u.name} (${u.accountLoginId || u.email})`;
    const transferId = `TRF-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const common = {
      type: "TRANSFER",
      currency: dst.account.currency,
      createdById: admin.id,
      createdByName: admin.name,
      refType: "TRANSFER",
      refId: transferId,
      ...(createdAt ? { createdAt } : {}),
    };
    if (apply) {
      // Guarded decrement: fails if a concurrent change dropped the balance below amount.
      const dec = await tx.account.updateMany({
        where: { userId: sourceUserId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (dec.count !== 1) throw new BadRequest("Insufficient source balance");
      await tx.account.update({ where: { userId: targetUserId }, data: { balance: { increment: amount } } });
    }
    await tx.balanceLedger.create({
      data: {
        ...common,
        userId: sourceUserId,
        tradingAccountId: src.account.id,
        amount: -amount,
        balanceBefore: sb,
        balanceAfter: sb - amount,
        comment: `Transfer out to ${label(dst)}${note ? ` — ${note}` : ""}`.slice(0, 5000),
      },
    });
    const row = await tx.balanceLedger.create({
      data: {
        ...common,
        userId: targetUserId,
        tradingAccountId: dst.account.id,
        amount,
        balanceBefore: db,
        balanceAfter: db + amount,
        comment: `Transfer in from ${label(src)}${note ? ` — ${note}` : ""}`.slice(0, 5000),
      },
    });
    return { row, transferId, src: { before: sb, after: sb - amount }, dst: { before: db, after: db + amount } };
  });
  if (apply) {
    const { refreshAccountMetrics } = await import("@/lib/trading");
    await Promise.all([
      refreshAccountMetrics(sourceUserId).catch(() => null),
      refreshAccountMetrics(targetUserId).catch(() => null),
    ]);
  }
  await writeAudit({
    adminId: admin.id,
    action: "CRM_INTERNAL_TRANSFER",
    targetId: targetUserId,
    note: `${amount} from ${sourceUserId}`,
    meta: { sourceUserId, targetUserId, amount, applyToBalance: apply, transferId: result.transferId },
  });
  return {
    row: result.row as unknown as { id: string } & Body,
    balance: apply ? { source: result.src, target: result.dst, delta: amount } : null,
  };
}

export async function POST(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const body = await readBody(req);
  let entity: Entity;
  try {
    entity = parseEntity(body);
  } catch (e) {
    return fail(e);
  }
  const apply = wantsApply(body);
  const a = await auth(entity, apply);
  if (a.error) return a.error;
  const admin = a.admin;
  const userId = ctx.params.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { account: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    let row: { id: string } & Body;
    let balance: unknown = null;
    switch (entity) {
      case "note":
        if (has(body, "team") && body.team && !(writableTeams(a.staff) as string[]).includes(String(body.team).toUpperCase()))
          return NextResponse.json({ error: "Bu alana yorum yazma yetkiniz yok" }, { status: 403 });
        row = await prisma.userNote.create({
          data: { userId, authorId: admin.id, authorName: admin.name, ...noteData(body, true) } as never,
        });
        break;
      case "communication":
        row = await prisma.communication.create({
          data: withWorker(userId, admin, commData(body, true)) as never,
        });
        await touchLastContact(userId, (row as { createdAt?: Date }).createdAt ?? new Date());
        break;
      case "document":
        row = await prisma.documentRecord.create({ data: { userId, ...docData(body, true, null) } as never });
        await syncDocumentsStatus(userId);
        break;
      case "reminder":
        row = await prisma.reminder.create({
          data: withWorker(userId, admin, reminderData(body, true)) as never,
        });
        break;
      case "deposit": {
        const data = await depositData(body, true, null);
        row = await prisma.depositRequest.create({ data: { userId, ...data } as never });
        if (apply) balance = await reflect(entity, userId, admin, 0, depositEffect(row as never), row.id, "create");
        break;
      }
      case "withdrawal": {
        row = await prisma.withdrawalRequest.create({ data: { userId, ...withdrawalData(body, true, null) } as never });
        if (apply) balance = await reflect(entity, userId, admin, 0, withdrawalEffect(row as never), row.id, "create");
        break;
      }
      case "balanceRequest": {
        row = await prisma.balanceRequest.create({
          data: { userId, ...balanceRequestData(body, true, null) } as never,
        });
        if (apply)
          balance = await reflect(entity, userId, admin, 0, balanceRequestEffect(row as never), row.id, "create");
        break;
      }
      case "ledger": {
        if (String(body.type || "").toUpperCase() === "TRANSFER") {
          const t = await internalTransfer(body, userId, admin, apply);
          row = t.row;
          balance = t.balance;
          break;
        }
        const data = ledgerData(body, true);
        const acc = user.account;
        if (!acc) throw new Error("ACCOUNT_NOT_FOUND");
        const type = String(data.type);
        const amount = Number(data.amount);
        const target = ledgerTarget(type);
        if (apply) {
          data.balanceBefore = acc.balance;
          data.balanceAfter = target === "balance" ? acc.balance + amount : acc.balance;
        } else {
          if (data.balanceBefore === undefined) data.balanceBefore = acc.balance;
          if (data.balanceAfter === undefined)
            data.balanceAfter = target === "balance" ? Number(data.balanceBefore) + amount : Number(data.balanceBefore);
        }
        row = await prisma.balanceLedger.create({
          data: {
            userId,
            tradingAccountId: acc.id,
            currency: acc.currency,
            createdById: admin.id,
            createdByName: admin.name,
            refType: "CRM",
            ...data,
          } as never,
        });
        if (apply) balance = await applyLedgerRowDelta(userId, type, amount);
        break;
      }
    }
    await writeAudit({
      adminId: admin.id,
      action: "CRM_RECORD_CREATE",
      targetId: userId,
      note: `${entity} ${row.id}`,
      meta: { entity, id: row.id, applyToBalance: apply, balance },
    });
    return NextResponse.json({ ok: true, row, balance });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const body = await readBody(req);
  let entity: Entity;
  try {
    entity = parseEntity(body);
  } catch (e) {
    return fail(e);
  }
  const apply = wantsApply(body);
  const a = await auth(entity, apply);
  if (a.error) return a.error;
  const admin = a.admin;
  const userId = ctx.params.id;
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    let before: Body | null = null;
    let after: Body;
    let balance: unknown = null;
    let movedTo: string | null = null;
    let convertedTo: Entity | null = null;
    switch (entity) {
      case "note": {
        before = await prisma.userNote.findFirst({ where: { id, userId } });
        if (!before) break;
        if (
          (before.team && !(writableTeams(a.staff) as string[]).includes(String(before.team))) ||
          (has(body, "team") && body.team && !(writableTeams(a.staff) as string[]).includes(String(body.team).toUpperCase()))
        )
          return NextResponse.json({ error: "Bu alana yorum yazma yetkiniz yok" }, { status: 403 });
        after = await prisma.userNote.update({ where: { id }, data: noteData(body, false) as never });
        break;
      }
      case "communication": {
        before = await prisma.communication.findFirst({ where: { id, userId } });
        if (!before) break;
        after = await prisma.communication.update({ where: { id }, data: commData(body, false) as never });
        await recomputeLastContact(userId);
        break;
      }
      case "document": {
        const prev = await prisma.documentRecord.findFirst({ where: { id, userId } });
        before = prev;
        if (!prev) break;
        after = await prisma.documentRecord.update({
          where: { id },
          data: docData(body, false, prev.status) as never,
        });
        await syncDocumentsStatus(userId);
        break;
      }
      case "reminder": {
        before = await prisma.reminder.findFirst({ where: { id, userId } });
        if (!before) break;
        after = await prisma.reminder.update({ where: { id }, data: reminderData(body, false) as never });
        break;
      }
      case "deposit":
      case "withdrawal":
      case "balanceRequest": {
        const prev: Body | null =
          entity === "deposit"
            ? await prisma.depositRequest.findFirst({ where: { id, userId } })
            : entity === "withdrawal"
              ? await prisma.withdrawalRequest.findFirst({ where: { id, userId } })
              : await prisma.balanceRequest.findFirst({ where: { id, userId } });
        before = prev;
        if (!prev) break;
        const ownerId = await resolveMoveTarget(body, userId);
        if (ownerId !== userId) movedTo = ownerId;
        if (apply) await requireAccounts([userId, ownerId]);
        const convertTo = parseConvert(body, entity);
        if (convertTo) {
          const created = await convertTicket({ from: entity, to: convertTo, prev, body, ownerId });
          after = created;
          convertedTo = convertTo;
          if (apply) {
            const r1 = await reflect(entity, userId, admin, ticketEffect(entity, prev), 0, id, "convert");
            const r2 = await reflect(convertTo, ownerId, admin, 0, ticketEffect(convertTo, created), created.id, "convert");
            balance = [r1, r2];
          }
          break;
        }
        const prevStatus = String(prev.status);
        const data: Body =
          entity === "deposit"
            ? await depositData(body, false, prevStatus)
            : entity === "withdrawal"
              ? withdrawalData(body, false, prevStatus)
              : balanceRequestData(body, false, prevStatus);
        if (ownerId !== userId) data.userId = ownerId;
        const next: Body =
          entity === "deposit"
            ? await prisma.depositRequest.update({ where: { id }, data: data as never })
            : entity === "withdrawal"
              ? await prisma.withdrawalRequest.update({ where: { id }, data: data as never })
              : await prisma.balanceRequest.update({ where: { id }, data: data as never });
        after = next;
        if (apply) {
          if (ownerId === userId) {
            balance = await reflect(entity, userId, admin, ticketEffect(entity, prev), ticketEffect(entity, next), id, "edit");
          } else {
            const r1 = await reflect(entity, userId, admin, ticketEffect(entity, prev), 0, id, "move");
            const r2 = await reflect(entity, ownerId, admin, 0, ticketEffect(entity, next), id, "move");
            balance = [r1, r2];
          }
        }
        break;
      }
      case "ledger": {
        const prev = await prisma.balanceLedger.findFirst({ where: { id, userId } });
        before = prev;
        if (!prev) break;
        const ownerId = await resolveMoveTarget(body, userId);
        if (apply) await requireAccounts([userId, ownerId]);
        const data = ledgerData(body, false);
        if (ownerId !== userId) {
          movedTo = ownerId;
          const acc = await prisma.account.findUnique({ where: { userId: ownerId }, select: { id: true } });
          data.userId = ownerId;
          data.tradingAccountId = acc?.id ?? null;
        }
        const next = await prisma.balanceLedger.update({ where: { id }, data: data as never });
        after = next;
        if (apply) {
          if (ownerId !== userId) {
            const r1 = await applyLedgerRowDelta(userId, prev.type, -prev.amount);
            const r2 = await applyLedgerRowDelta(ownerId, next.type, next.amount);
            balance = [r1, r2];
          } else if (ledgerTarget(prev.type) === ledgerTarget(next.type)) {
            balance = await applyLedgerRowDelta(userId, next.type, next.amount - prev.amount);
          } else {
            const r1 = await applyLedgerRowDelta(userId, prev.type, -prev.amount);
            const r2 = await applyLedgerRowDelta(userId, next.type, next.amount);
            balance = [r1, r2];
          }
        }
        break;
      }
    }
    if (!before) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    await writeAudit({
      adminId: admin.id,
      action: "CRM_RECORD_UPDATE",
      targetId: userId,
      note: `${entity} ${id}`,
      meta: { entity, id, applyToBalance: apply, balance, movedTo, convertedTo, before, after: after! },
    });
    return NextResponse.json({ ok: true, row: after!, balance, movedTo, convertedTo });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  await ensureDemoSeed();
  const body = await readBody(req);
  let entity: Entity;
  try {
    entity = parseEntity(body);
  } catch (e) {
    return fail(e);
  }
  const apply = wantsApply(body);
  const a = await auth(entity, apply);
  if (a.error) return a.error;
  const admin = a.admin;
  const userId = ctx.params.id;
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    let before: Body | null = null;
    let balance: unknown = null;
    switch (entity) {
      case "note":
        before = await prisma.userNote.findFirst({ where: { id, userId } });
        if (before && !canSeeTeam(a.staff, before.team)) before = null;
        if (before && before.team && !(writableTeams(a.staff) as string[]).includes(String(before.team)))
          return NextResponse.json({ error: "Bu alana yorum yazma yetkiniz yok" }, { status: 403 });
        if (before) await prisma.userNote.delete({ where: { id } });
        break;
      case "communication":
        before = await prisma.communication.findFirst({ where: { id, userId } });
        if (before) {
          await prisma.communication.delete({ where: { id } });
          await recomputeLastContact(userId);
        }
        break;
      case "document":
        before = await prisma.documentRecord.findFirst({ where: { id, userId } });
        if (before) {
          await prisma.documentRecord.delete({ where: { id } });
          await syncDocumentsStatus(userId);
        }
        break;
      case "reminder":
        before = await prisma.reminder.findFirst({ where: { id, userId } });
        if (before) await prisma.reminder.delete({ where: { id } });
        break;
      case "deposit": {
        const prev = await prisma.depositRequest.findFirst({ where: { id, userId } });
        before = prev;
        if (prev) {
          await prisma.depositRequest.delete({ where: { id } });
          if (apply) balance = await reflect(entity, userId, admin, depositEffect(prev), 0, id, "delete");
        }
        break;
      }
      case "withdrawal": {
        const prev = await prisma.withdrawalRequest.findFirst({ where: { id, userId } });
        before = prev;
        if (prev) {
          await prisma.withdrawalRequest.delete({ where: { id } });
          if (apply) balance = await reflect(entity, userId, admin, withdrawalEffect(prev), 0, id, "delete");
        }
        break;
      }
      case "balanceRequest": {
        const prev = await prisma.balanceRequest.findFirst({ where: { id, userId } });
        before = prev;
        if (prev) {
          await prisma.balanceRequest.delete({ where: { id } });
          if (apply) balance = await reflect(entity, userId, admin, balanceRequestEffect(prev), 0, id, "delete");
        }
        break;
      }
      case "ledger": {
        const prev = await prisma.balanceLedger.findFirst({ where: { id, userId } });
        before = prev;
        if (prev) {
          await prisma.balanceLedger.delete({ where: { id } });
          if (apply) balance = await applyLedgerRowDelta(userId, prev.type, -prev.amount);
        }
        break;
      }
    }
    if (!before) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    await writeAudit({
      adminId: admin.id,
      action: "CRM_RECORD_DELETE",
      targetId: userId,
      note: `${entity} ${id}`,
      meta: { entity, id, applyToBalance: apply, balance, before },
    });
    return NextResponse.json({ ok: true, balance });
  } catch (e) {
    return fail(e);
  }
}
