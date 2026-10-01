"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";

type Asset = {
  symbol: string;
  name: string;
  class: string;
  flag: string | null;
  digits: number;
  contractSize: number;
  baseSpread: number;
  enabled: boolean;
  effectiveSpread: number;
  effectiveContract: number;
  minVolume: number;
  maxVolume: number;
  commissionPerLot: number;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [counts, setCounts] = useState<{ total: number; enabled: number; byClass: Record<string, number> } | null>(null);
  const [cls, setCls] = useState("");

  useEffect(() => {
    fetch("/api/admin/assets")
      .then((r) => r.json())
      .then((d) => {
        setAssets(d.assets || []);
        setCounts(d.counts || null);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () => (cls ? assets.filter((a) => a.class === cls) : assets),
    [assets, cls]
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Varlıklar</h1>
          <p className="text-[11px] text-neutral-500">
            Sembol kataloğu — efektif spread/komisyon için{" "}
            <Link href="/admin/rates" className="text-sky-400 hover:underline">
              İşlem Oranları
            </Link>
          </p>
        </div>
        {counts && (
          <div className="flex gap-3 text-[11px] text-neutral-500">
            <span>{counts.total} sembol</span>
            <span className="text-emerald-400">{counts.enabled} aktif</span>
          </div>
        )}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={cls}
          onChange={(e) => setCls(e.target.value)}
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5 text-xs"
        >
          <option value="">Tüm sınıflar</option>
          {["STOCK", "FX", "CRYPTO", "INDEX", "COMMODITY"].map((c) => (
            <option key={c} value={c}>
              {c}
              {counts?.byClass?.[c] != null ? ` (${counts.byClass[c]})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-2 py-2">Sembol</th>
              <th className="px-2 py-2">Ad</th>
              <th className="px-2 py-2">Sınıf</th>
              <th className="px-2 py-2">Spread</th>
              <th className="px-2 py-2">Kontrat</th>
              <th className="px-2 py-2">Hacim</th>
              <th className="px-2 py-2">Komisyon</th>
              <th className="px-2 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.symbol} className="border-t border-neutral-200">
                <td className="px-2 py-1.5 font-medium">
                  {a.flag ? `${a.flag} ` : ""}
                  {a.symbol}
                </td>
                <td className="px-2 py-1.5 text-neutral-500">{a.name}</td>
                <td className="px-2 py-1.5">{a.class}</td>
                <td className="px-2 py-1.5 tabular-nums">{a.effectiveSpread}</td>
                <td className="px-2 py-1.5 tabular-nums">{a.effectiveContract}</td>
                <td className="px-2 py-1.5 tabular-nums text-neutral-500">
                  {a.minVolume}–{a.maxVolume}
                </td>
                <td className="px-2 py-1.5 tabular-nums">{a.commissionPerLot}</td>
                <td className="px-2 py-1.5">
                  <StatusBadge status={a.enabled ? "ACTIVE" : "CLOSED"} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  Varlık yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
