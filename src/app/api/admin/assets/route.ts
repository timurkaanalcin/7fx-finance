import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SYMBOLS } from "@/lib/symbols";
import { getAllEffectiveRates, ensureTradingSettings } from "@/lib/trading-settings";
import { ensureDemoSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoSeed();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  await ensureTradingSettings();
  const [overrides, effective] = await Promise.all([
    prisma.symbolSettings.findMany(),
    getAllEffectiveRates(),
  ]);
  const ovMap = new Map(overrides.map((o) => [o.symbol, o]));
  const effMap = new Map(effective.map((e) => [e.symbol, e]));

  const assets = SYMBOLS.map((s) => {
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
      yahoo: s.yahoo,
      enabled: ov?.enabled ?? true,
      effectiveSpread: eff?.spread ?? s.spread,
      effectiveContract: eff?.contractSize ?? s.contractSize,
      minVolume: eff?.minVolume ?? 0.01,
      maxVolume: eff?.maxVolume ?? 100,
      commissionPerLot: eff?.commissionPerLot ?? 0,
    };
  });

  const byClass: Record<string, number> = {};
  for (const a of assets) byClass[a.class] = (byClass[a.class] || 0) + 1;

  return NextResponse.json({
    assets,
    counts: { total: assets.length, enabled: assets.filter((a) => a.enabled).length, byClass },
  });
}
