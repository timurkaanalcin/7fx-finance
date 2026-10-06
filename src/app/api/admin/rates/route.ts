import { NextResponse } from "next/server";
import { writeAudit, requireAdmin, requireAdminPerm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTradingSettings,
  getAllEffectiveRates,
  invalidateTradingSettingsCache,
  ensureTradingSettings,
  ensureSymbolCatalog,
} from "@/lib/trading-settings";
import { SYMBOLS } from "@/lib/symbols";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSymbolCatalog();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await ensureTradingSettings();
  const [global, overrides, effective] = await Promise.all([
    getTradingSettings(),
    prisma.symbolSettings.findMany({ orderBy: { symbol: "asc" } }),
    getAllEffectiveRates(),
  ]);

  return NextResponse.json({
    global,
    overrides,
    effective,
    catalog: SYMBOLS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      class: s.class,
      digits: s.digits,
      pipSize: s.pipSize,
      contractSize: s.contractSize,
      baseSpread: s.spread,
    })),
  });
}

export async function PUT(req: Request) {
  await ensureSymbolCatalog();
  const admin = await requireAdminPerm("canEditRates");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));

  if (body.global && typeof body.global === "object") {
    const g = body.global as Record<string, unknown>;
    const data: Record<string, number> = {};
    for (const key of [
      "spreadMultiplier",
      "commissionPerLot",
      "defaultLeverage",
      "marginCallThresholdPct",
      "defaultMinVolume",
      "defaultMaxVolume",
      "defaultContractMult",
    ] as const) {
      if (g[key] != null && Number.isFinite(Number(g[key]))) {
        data[key] = Number(g[key]);
      }
    }
    if (Object.keys(data).length) {
      await prisma.tradingSettings.upsert({
        where: { id: "default" },
        update: data,
        create: { id: "default", ...data },
      });
      await writeAudit({
        adminId: admin.id,
        action: "UPDATE_GLOBAL_RATES",
        meta: data,
      });
    }
  }

  if (body.symbol && typeof body.symbol === "string") {
    const symbol = body.symbol.toUpperCase();
    if (!SYMBOLS.some((s) => s.symbol === symbol)) {
      return NextResponse.json({ error: "Bilinmeyen sembol" }, { status: 400 });
    }
    const patch: Record<string, unknown> = {};
    for (const key of [
      "spreadAbs",
      "spreadMultiplier",
      "contractMultiplier",
      "minVolume",
      "maxVolume",
      "commissionPerLot",
    ] as const) {
      if (body[key] === null) patch[key] = null;
      else if (body[key] != null && body[key] !== "" && Number.isFinite(Number(body[key]))) {
        patch[key] = Number(body[key]);
      }
    }
    if (typeof body.enabled === "boolean") patch.enabled = body.enabled;

    await prisma.symbolSettings.upsert({
      where: { symbol },
      update: patch,
      create: { symbol, ...patch },
    });
    await writeAudit({
      adminId: admin.id,
      action: "UPDATE_SYMBOL_RATES",
      targetId: symbol,
      meta: patch,
    });
  }

  invalidateTradingSettingsCache();
  const global = await getTradingSettings();
  const overrides = await prisma.symbolSettings.findMany({ orderBy: { symbol: "asc" } });
  return NextResponse.json({ ok: true, global, overrides });
}
