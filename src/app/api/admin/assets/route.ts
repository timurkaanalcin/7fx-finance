import { NextResponse } from "next/server";
import { writeAudit, requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUILTIN_SYMBOLS, SYMBOLS, getBuiltinSymbol, getSymbol, type AssetClass } from "@/lib/symbols";
import {
  ASSET_CLASSES,
  ensureSymbolCatalog,
  ensureTradingSettings,
  getAllEffectiveRates,
  getTradingSettings,
  invalidateTradingSettingsCache,
} from "@/lib/trading-settings";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

/**
 * Asset catalog (CRM "Varlıklar").
 *   GET                         → live catalog with effective rates + open-position counts
 *   POST   { symbol, … }        → add a custom symbol (or restore a deleted built-in)
 *   PATCH  { symbol, newSymbol?, … } → edit (rename = re-key; refused while positions/orders are open)
 *   DELETE { symbol }           → remove (refused while open positions / pending orders exist)
 * Writes need canEditRates; every write invalidates the rates + catalog cache so the
 * terminal (quotes, order ticket, margin/P&L) uses the new values immediately.
 */

class BadRequest extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(msg: string, status = 400, extra?: Record<string, unknown>) {
    super(msg);
    this.status = status;
    this.extra = extra;
  }
}

type Body = Record<string, unknown>;
const SYMBOL_RE = /^[A-Z0-9][A-Z0-9._\-/]{0,23}$/;

function has(b: Body, k: string) {
  return Object.prototype.hasOwnProperty.call(b, k) && b[k] !== undefined;
}
function txt(v: unknown, max: number): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}
/** "" / null → null (use default); otherwise a finite number with bounds. */
function optNum(v: unknown, label: string, opts?: { min?: number; positive?: boolean; int?: boolean; max?: number }) {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) throw new BadRequest(`Invalid ${label}`);
  if (opts?.positive && n <= 0) throw new BadRequest(`${label} must be > 0`);
  if (opts?.min != null && n < opts.min) throw new BadRequest(`${label} must be ≥ ${opts.min}`);
  if (opts?.max != null && n > opts.max) throw new BadRequest(`${label} must be ≤ ${opts.max}`);
  if (opts?.int && !Number.isInteger(n)) throw new BadRequest(`${label} must be an integer`);
  return n;
}
function normSymbol(v: unknown): string {
  const s = String(v ?? "").trim().toUpperCase();
  if (!SYMBOL_RE.test(s)) throw new BadRequest("Invalid symbol (A–Z, 0–9, . _ - /; max 24)");
  return s;
}
function bool(v: unknown) {
  return v === true || v === "true" || v === "1" || v === 1;
}

async function openUsage(symbol: string) {
  const [positions, orders] = await Promise.all([
    prisma.position.count({ where: { status: "OPEN", OR: [{ symbol }, { chartSymbol: symbol }] } }),
    prisma.order.count({ where: { status: "PENDING", symbol } }),
  ]);
  return { positions, orders };
}

/** Parse editable fields → SymbolSettings data (only keys present in body). */
function parseFields(body: Body, create: boolean) {
  const d: Body = {};
  if (create || has(body, "name")) {
    const name = txt(body.name, 191);
    if (create && !name) throw new BadRequest("name required");
    d.name = name;
  }
  if (create || has(body, "class")) {
    const c = String(body.class ?? "").trim().toUpperCase();
    if (c || create) {
      if (!(ASSET_CLASSES as string[]).includes(c)) throw new BadRequest("Invalid class");
      d.assetClass = c;
    } else d.assetClass = null;
  }
  if (has(body, "digits")) d.digits = optNum(body.digits, "digits", { min: 0, max: 10, int: true });
  if (has(body, "pipSize")) d.pipSize = optNum(body.pipSize, "pipSize", { positive: true });
  if (has(body, "contractSize")) {
    d.contractSize = optNum(body.contractSize, "contractSize", { positive: true });
    // The edited value IS the effective contract size → neutralise the multiplier.
    if (d.contractSize != null) d.contractMultiplier = 1;
  }
  if (has(body, "contractMultiplier")) d.contractMultiplier = optNum(body.contractMultiplier, "contractMultiplier", { positive: true });
  if (has(body, "spread")) d.spreadAbs = optNum(body.spread, "spread", { min: 0 });
  if (has(body, "spreadMultiplier")) d.spreadMultiplier = optNum(body.spreadMultiplier, "spreadMultiplier", { min: 0 });
  if (has(body, "minVolume")) d.minVolume = optNum(body.minVolume, "minVolume", { positive: true });
  if (has(body, "maxVolume")) d.maxVolume = optNum(body.maxVolume, "maxVolume", { positive: true });
  if (has(body, "volumeStep")) d.volumeStep = optNum(body.volumeStep, "volumeStep", { positive: true });
  if (has(body, "commissionPerLot")) d.commissionPerLot = optNum(body.commissionPerLot, "commission", { min: 0 });
  if (has(body, "basePrice")) d.basePrice = optNum(body.basePrice, "basePrice", { min: 0 });
  if (has(body, "yahoo")) d.yahoo = txt(body.yahoo, 64);
  if (has(body, "flag")) d.flag = txt(body.flag, 16);
  if (has(body, "enabled")) d.enabled = bool(body.enabled);
  if (d.minVolume != null && d.maxVolume != null && (d.minVolume as number) > (d.maxVolume as number)) {
    throw new BadRequest("minVolume must be ≤ maxVolume");
  }
  return d;
}

function fail(e: unknown) {
  if (e instanceof BadRequest) return NextResponse.json({ error: e.message, ...(e.extra || {}) }, { status: e.status });
  const code = (e as { code?: string })?.code;
  if (code === "P2002") return NextResponse.json({ error: "Symbol already exists" }, { status: 409 });
  console.error("[admin/assets]", e);
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
  if (body.symbol === undefined && url.searchParams.get("symbol")) body.symbol = url.searchParams.get("symbol");
  return body;
}

async function refresh() {
  invalidateTradingSettingsCache();
  await ensureSymbolCatalog(true);
}

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await ensureTradingSettings();
  await ensureSymbolCatalog();
  const [overrides, effective, global, posGroups, ordGroups] = await Promise.all([
    prisma.symbolSettings.findMany(),
    getAllEffectiveRates(),
    getTradingSettings(),
    prisma.position.groupBy({ by: ["symbol"], where: { status: "OPEN" }, _count: { _all: true } }),
    prisma.order.groupBy({ by: ["symbol"], where: { status: "PENDING" }, _count: { _all: true } }),
  ]);
  const ovMap = new Map(overrides.map((o) => [o.symbol, o]));
  const effMap = new Map(effective.map((e) => [e.symbol, e]));
  const posMap = new Map(posGroups.map((g) => [g.symbol, g._count._all]));
  const ordMap = new Map(ordGroups.map((g) => [g.symbol, g._count._all]));

  const assets = [...SYMBOLS].map((s) => {
    const ov = ovMap.get(s.symbol);
    const eff = effMap.get(s.symbol);
    return {
      symbol: s.symbol,
      name: s.name,
      class: s.class,
      flag: s.flag || null,
      digits: s.digits,
      pipSize: s.pipSize,
      contractSize: s.contractSize,
      baseSpread: s.spread,
      basePrice: s.basePrice,
      yahoo: s.yahoo,
      custom: Boolean(s.custom),
      builtin: Boolean(getBuiltinSymbol(s.symbol)),
      enabled: ov?.enabled ?? true,
      effectiveSpread: eff?.spread ?? s.spread,
      effectiveContract: eff?.contractSize ?? s.contractSize,
      minVolume: eff?.minVolume ?? global.defaultMinVolume,
      maxVolume: eff?.maxVolume ?? global.defaultMaxVolume,
      volumeStep: eff?.volumeStep ?? null,
      commissionPerLot: eff?.commissionPerLot ?? 0,
      overrides: ov
        ? {
            spreadAbs: ov.spreadAbs,
            spreadMultiplier: ov.spreadMultiplier,
            contractMultiplier: ov.contractMultiplier,
            minVolume: ov.minVolume,
            maxVolume: ov.maxVolume,
            commissionPerLot: ov.commissionPerLot,
          }
        : null,
      openPositions: posMap.get(s.symbol) ?? 0,
      pendingOrders: ordMap.get(s.symbol) ?? 0,
    };
  });

  const deletedBuiltins = overrides
    .filter((o) => o.deleted && BUILTIN_SYMBOLS.some((b) => b.symbol === o.symbol))
    .map((o) => ({ symbol: o.symbol, name: getBuiltinSymbol(o.symbol)?.name ?? o.symbol }));

  const byClass: Record<string, number> = {};
  for (const a of assets) byClass[a.class] = (byClass[a.class] || 0) + 1;

  return NextResponse.json({
    assets,
    deletedBuiltins,
    defaults: {
      minVolume: global.defaultMinVolume,
      maxVolume: global.defaultMaxVolume,
      commissionPerLot: global.commissionPerLot,
      spreadMultiplier: global.spreadMultiplier,
      contractMultiplier: global.defaultContractMult,
    },
    classes: ASSET_CLASSES,
    counts: { total: assets.length, enabled: assets.filter((a) => a.enabled).length, byClass },
  });
}

export async function POST(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canEditRates");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    await ensureSymbolCatalog(true);
    const body = await readBody(req);
    const symbol = normSymbol(body.symbol);
    const builtin = getBuiltinSymbol(symbol);
    const existing = await prisma.symbolSettings.findUnique({ where: { symbol } });
    if (getSymbol(symbol)) throw new BadRequest("Symbol already exists", 409);
    const fields = parseFields(body, !builtin);
    let row;
    if (builtin) {
      // Restore a deleted built-in (optionally with new values).
      row = await prisma.symbolSettings.upsert({
        where: { symbol },
        update: { ...fields, deleted: false } as never,
        create: { symbol, ...fields, deleted: false, isCustom: false } as never,
      });
    } else {
      const cls = String(fields.assetClass || "FX") as AssetClass;
      const digits = (fields.digits as number | null) ?? (cls === "FX" ? 5 : 2);
      const data: Body = {
        ...fields,
        digits,
        pipSize: (fields.pipSize as number | null) ?? Number((cls === "FX" ? 10 ** -(digits - 1) : 10 ** -digits).toPrecision(6)),
        contractSize: (fields.contractSize as number | null) ?? (cls === "FX" ? 100000 : 1),
        contractMultiplier: 1,
        spreadAbs: (fields.spreadAbs as number | null) ?? 0,
        yahoo: (fields.yahoo as string | null) || symbol,
        basePrice: (fields.basePrice as number | null) ?? 0,
        enabled: fields.enabled === undefined ? true : fields.enabled,
        isCustom: true,
        deleted: false,
      };
      row = existing
        ? await prisma.symbolSettings.update({ where: { symbol }, data: data as never })
        : await prisma.symbolSettings.create({ data: { symbol, ...data } as never });
    }
    await refresh();
    await writeAudit({
      adminId: admin.id,
      action: builtin ? "ASSET_RESTORE" : "ASSET_CREATE",
      targetId: symbol,
      meta: { symbol, fields },
    });
    return NextResponse.json({ ok: true, row, asset: getSymbol(symbol) ?? null });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canEditRates");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    await ensureSymbolCatalog(true);
    const body = await readBody(req);
    const symbol = normSymbol(body.symbol);
    const current = getSymbol(symbol);
    if (!current) throw new BadRequest("Unknown symbol", 404);
    const before = await prisma.symbolSettings.findUnique({ where: { symbol } });
    const fields = parseFields(body, false);
    const newSymbol = has(body, "newSymbol") && body.newSymbol !== "" ? normSymbol(body.newSymbol) : symbol;

    let target = symbol;
    if (newSymbol !== symbol) {
      const usage = await openUsage(symbol);
      if (usage.positions || usage.orders) {
        throw new BadRequest(
          `Cannot rename: ${usage.positions} open position(s) / ${usage.orders} pending order(s) on ${symbol}`,
          409,
          { usage }
        );
      }
      const clash = await prisma.symbolSettings.findUnique({ where: { symbol: newSymbol } });
      if (clash?.deleted && getBuiltinSymbol(newSymbol)) {
        throw new BadRequest("A removed built-in symbol uses this name — restore it instead", 409);
      }
      if (getSymbol(newSymbol) || getBuiltinSymbol(newSymbol) || clash) {
        throw new BadRequest("New symbol already exists", 409);
      }
      // Re-key: the new symbol becomes a custom entry carrying every effective value.
      await prisma.symbolSettings.create({
        data: {
          symbol: newSymbol,
          name: current.name,
          assetClass: current.class,
          digits: current.digits,
          pipSize: current.pipSize,
          contractSize: current.contractSize,
          basePrice: current.basePrice,
          volumeStep: current.volumeStep ?? null,
          yahoo: current.yahoo,
          flag: current.flag ?? null,
          spreadAbs: before?.spreadAbs ?? current.spread,
          spreadMultiplier: before?.spreadMultiplier ?? null,
          contractMultiplier: before?.contractMultiplier ?? null,
          minVolume: before?.minVolume ?? null,
          maxVolume: before?.maxVolume ?? null,
          commissionPerLot: before?.commissionPerLot ?? null,
          enabled: before?.enabled ?? true,
          isCustom: true,
          deleted: false,
        },
      });
      if (getBuiltinSymbol(symbol)) {
        await prisma.symbolSettings.upsert({
          where: { symbol },
          update: { deleted: true },
          create: { symbol, deleted: true },
        });
      } else if (before) {
        await prisma.symbolSettings.delete({ where: { symbol } });
      }
      target = newSymbol;
    }

    if (Object.keys(fields).length) {
      const isCustom = !getBuiltinSymbol(target);
      if (isCustom && (fields.name === null || fields.assetClass === null)) {
        throw new BadRequest("Custom symbols need a name and class");
      }
      await prisma.symbolSettings.upsert({
        where: { symbol: target },
        update: fields as never,
        create: { symbol: target, ...fields } as never,
      });
    }
    const after = await prisma.symbolSettings.findUnique({ where: { symbol: target } });
    if (after && after.minVolume != null && after.maxVolume != null && after.minVolume > after.maxVolume) {
      // keep data sane; revert this field pair
      await prisma.symbolSettings.update({
        where: { symbol: target },
        data: { minVolume: before?.minVolume ?? null, maxVolume: before?.maxVolume ?? null },
      });
      await refresh();
      throw new BadRequest("minVolume must be ≤ maxVolume");
    }
    await refresh();
    const usage = await openUsage(target);
    await writeAudit({
      adminId: admin.id,
      action: newSymbol !== symbol ? "ASSET_RENAME" : "ASSET_UPDATE",
      targetId: target,
      meta: { symbol, newSymbol: newSymbol !== symbol ? newSymbol : undefined, fields, before, after },
    });
    return NextResponse.json({ ok: true, symbol: target, asset: getSymbol(target) ?? null, usage });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  await ensureDemoSeed();
  const admin = await requireAdminPerm("canEditRates");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    await ensureSymbolCatalog(true);
    const body = await readBody(req);
    const symbol = normSymbol(body.symbol);
    if (!getSymbol(symbol)) throw new BadRequest("Unknown symbol", 404);
    const usage = await openUsage(symbol);
    if (usage.positions || usage.orders) {
      throw new BadRequest(
        `Cannot delete: ${usage.positions} open position(s) / ${usage.orders} pending order(s) on ${symbol}. Close them or deactivate the symbol instead.`,
        409,
        { usage }
      );
    }
    const before = await prisma.symbolSettings.findUnique({ where: { symbol } });
    const builtin = Boolean(getBuiltinSymbol(symbol));
    if (builtin) {
      await prisma.symbolSettings.upsert({ where: { symbol }, update: { deleted: true }, create: { symbol, deleted: true } });
    } else if (before) {
      await prisma.symbolSettings.delete({ where: { symbol } });
    }
    await refresh();
    await writeAudit({
      adminId: admin.id,
      action: "ASSET_DELETE",
      targetId: symbol,
      meta: { symbol, builtin, before },
    });
    return NextResponse.json({ ok: true, symbol, builtin });
  } catch (e) {
    return fail(e);
  }
}
