import { readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pushConfigured } from "@/lib/notify";
import { fetchQuotesBatch } from "@/lib/yahoo";
import {
  API_KEY_DESIGN,
  BACKUP_STATE,
  auditLevel,
  clampPage,
  parseRange,
  scrubMeta,
} from "@/lib/crmv2/control";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function appVersion(): string {
  try {
    const raw = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as { version?: string };
    return String(raw.version || "");
  } catch {
    return "";
  }
}

function commitSha(): string | null {
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "").trim();
  return sha ? sha.slice(0, 12) : null;
}

async function databasePing(): Promise<{ ok: boolean; latencyMs: number }> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, latencyMs: Date.now() - started };
  }
}

async function quotePing(): Promise<{ ok: boolean; latencyMs: number }> {
  const started = Date.now();
  try {
    const result = await Promise.race([
      fetchQuotesBatch([{ symbol: "EURUSD", yahoo: "EURUSD=X" }]),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    return { ok: result.quotes.length > 0, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, latencyMs: Date.now() - started };
  }
}

function memoryMb() {
  const used = process.memoryUsage();
  return {
    rssMb: Math.round(used.rss / 1048576),
    heapMb: Math.round(used.heapUsed / 1048576),
  };
}

async function statusPayload(handlerStarted: number) {
  const [db, quote] = await Promise.all([databasePing(), quotePing()]);
  const checkedAt = new Date().toISOString();
  const cronSet = Boolean(process.env.CRON_SECRET?.trim());
  const pushOn = pushConfigured();
  return {
    ok: db.ok,
    checkedAt,
    app: {
      name: "7fx-finance",
      version: appVersion(),
      commit: commitSha(),
      node: process.version,
      uptimeSec: Math.round(process.uptime()),
      memory: memoryMb(),
      handlerMs: Date.now() - handlerStarted,
    },
    database: db,
    services: [
      { id: "app", status: "up", latencyMs: Date.now() - handlerStarted, checkedAt },
      { id: "database", status: db.ok ? "up" : "down", latencyMs: db.latencyMs, checkedAt },
      { id: "priceFeed", status: quote.ok ? "up" : "down", latencyMs: quote.latencyMs, checkedAt },
      { id: "engineCron", status: cronSet ? "configured" : "not_configured", latencyMs: null, checkedAt },
      { id: "mail", status: "not_configured", latencyMs: null, checkedAt },
      { id: "push", status: pushOn ? "up" : "not_configured", latencyMs: null, checkedAt },
    ],
  };
}

async function logPayload(url: URL) {
  const { take, skip } = clampPage(url.searchParams.get("take"), url.searchParams.get("skip"));
  const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
  const level = (url.searchParams.get("level") || "all").toLowerCase();
  const source = (url.searchParams.get("source") || "audit").toLowerCase();
  const range = parseRange(url.searchParams.get("from"), url.searchParams.get("to"));
  const hasRange = Boolean(range.gte || range.lte);

  if (source === "login") {
    const where: Prisma.LoginEventWhereInput = {};
    if (hasRange) where.at = range;
    if (level === "error") where.success = false;
    if (level === "info") where.success = true;
    if (level === "warn") where.success = false;
    if (q) {
      where.OR = [
        { method: { contains: q } },
        { reason: { contains: q } },
        { ip: { contains: q } },
        { country: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }
    const found = await prisma.loginEvent.findMany({
      where,
      orderBy: { at: "desc" },
      skip,
      take: take + 1,
      select: {
        id: true,
        at: true,
        success: true,
        method: true,
        reason: true,
        ip: true,
        country: true,
        user: { select: { name: true } },
      },
    });
    const hasMore = found.length > take;
    const page = hasMore ? found.slice(0, take) : found;
    return {
      source: "login",
      hasMore,
      nextSkip: skip + page.length,
      rows: page.map((row) => ({
        id: row.id,
        at: row.at,
        level: row.success ? "info" : "error",
        action: row.method,
        actor: row.user?.name || "",
        target: row.country || "",
        detail: scrubMeta(JSON.stringify({ reason: row.reason, ip: row.ip, success: row.success })),
      })),
    };
  }

  if (source === "communication") {
    const where: Prisma.CommunicationWhereInput = {};
    if (hasRange) where.createdAt = range;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { workerName: { contains: q } },
        { type: { contains: q } },
        { user: { name: { contains: q } } },
      ];
    }
    const found = await prisma.communication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: take + 1,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        workerName: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });
    const hasMore = found.length > take;
    const page = hasMore ? found.slice(0, take) : found;
    const rows = page.map((row) => ({
      id: row.id,
      at: row.createdAt,
      level: "info" as const,
      action: row.type,
      actor: row.workerName || "",
      target: row.user?.name || "",
      detail: scrubMeta(JSON.stringify({ title: row.title, description: row.description })),
    }));
    return { source: "communication", hasMore, nextSkip: skip + page.length, rows, levelIgnored: level !== "all" && level !== "info" };
  }

  const and: Prisma.AuditLogWhereInput[] = [];
  if (hasRange) and.push({ createdAt: range });
  if (q) {
    and.push({
      OR: [{ action: { contains: q } }, { note: { contains: q } }, { targetId: { contains: q } }, { admin: { name: { contains: q } } }],
    });
  }
  if (level === "error") {
    and.push({
      OR: [
        { action: { contains: "FAIL" } },
        { action: { contains: "ERROR" } },
        { action: { contains: "DELETE" } },
        { action: { contains: "DENIED" } },
      ],
    });
  } else if (level === "warn") {
    and.push({
      OR: [
        { action: { contains: "REJECT" } },
        { action: { contains: "FREEZE" } },
        { action: { contains: "LOCK" } },
        { action: { contains: "INVALID" } },
      ],
    });
  }
  const found = await prisma.auditLog.findMany({
    where: and.length ? { AND: and } : {},
    orderBy: { createdAt: "desc" },
    skip,
    take: take + 1,
    select: {
      id: true,
      action: true,
      note: true,
      targetId: true,
      meta: true,
      createdAt: true,
      admin: { select: { name: true } },
    },
  });
  const hasMore = found.length > take;
  const page = hasMore ? found.slice(0, take) : found;
  const rows = page
    .map((row) => ({
      id: row.id,
      at: row.createdAt,
      level: auditLevel(row.action),
      action: row.action,
      actor: row.admin?.name || "",
      target: row.targetId || "",
      detail: scrubMeta(JSON.stringify({ note: row.note, meta: scrubMeta(row.meta) })),
    }))
    .filter((row) => level !== "info" || row.level === "info");
  return { source: "audit", hasMore, nextSkip: skip + page.length, rows };
}

export async function GET(req: Request) {
  const started = Date.now();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const url = new URL(req.url);
  const part = (url.searchParams.get("part") || "status").toLowerCase();
  try {
    if (part === "logs") return NextResponse.json(await logPayload(url));
    if (part === "backups") return NextResponse.json(BACKUP_STATE);
    if (part === "keys") return NextResponse.json(API_KEY_DESIGN);
    return NextResponse.json(await statusPayload(started));
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
