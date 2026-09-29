"use client";

import { useEffect, useState } from "react";

type Kpis = {
  income: number;
  outcome: number;
  net: number;
  depositsApproved: number;
  depositsApprovedCount: number;
  depositsPending: number;
  depositsPendingCount: number;
  openPositions: number;
  openVolume: number;
  floatingPnL: number;
  totalBalance: number;
  totalEquity: number;
  totalCredit: number;
  totalBonus: number;
};

type ByType = { type: string; amount: number; count: number };

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function FinanceAnalyticsPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [byType, setByType] = useState<ByType[]>([]);

  useEffect(() => {
    fetch("/api/admin/analytics/finance")
      .then((r) => r.json())
      .then((d) => {
        setKpis(d.kpis || null);
        setByType(d.byType || []);
      })
      .catch(() => {});
  }, []);

  const maxBar = Math.max(kpis?.income || 1, kpis?.outcome || 1, 1);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Analitik · Finans</h1>
      <p className="mb-4 text-[11px] text-slate-500">Ledger / yatırma / pozisyon özetleri</p>
      {kpis && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Gelir (Income)", value: fmt(kpis.income), tone: "text-emerald-400" },
              { label: "Gider (Outcome)", value: fmt(kpis.outcome), tone: "text-rose-400" },
              { label: "Net", value: fmt(kpis.net), tone: "text-sky-400" },
              { label: "Onaylı Yatırım", value: fmt(kpis.depositsApproved), tone: "text-emerald-300" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-800 bg-[#0a1020] p-3">
                <div className="text-[10px] uppercase text-slate-500">{c.label}</div>
                <div className={`mt-1 text-lg font-semibold tabular-nums ${c.tone}`}>{c.value}</div>
              </div>
            ))}
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Bekleyen Yatırım", value: `${fmt(kpis.depositsPending)} (${kpis.depositsPendingCount})` },
              { label: "Açık Pozisyon", value: String(kpis.openPositions) },
              { label: "Açık Hacim", value: kpis.openVolume.toFixed(2) },
              { label: "Floating K/Z", value: fmt(kpis.floatingPnL) },
              { label: "Toplam Bakiye", value: fmt(kpis.totalBalance) },
              { label: "Toplam Equity", value: fmt(kpis.totalEquity) },
              { label: "Credit", value: fmt(kpis.totalCredit) },
              { label: "Bonus", value: fmt(kpis.totalBonus) },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-800 bg-[#0a1020] p-3">
                <div className="text-[10px] uppercase text-slate-500">{c.label}</div>
                <div className="mt-1 text-sm font-semibold tabular-nums">{c.value}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#0a1020] p-4">
              <h2 className="mb-3 text-xs font-semibold text-slate-300">Gelir / Gider</h2>
              <div className="flex h-40 items-end gap-4 px-4">
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-emerald-500/80"
                    style={{ height: `${Math.max(8, (kpis.income / maxBar) * 100)}%` }}
                    title={fmt(kpis.income)}
                  />
                  <span className="text-[10px] text-slate-500">Income</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-rose-500/80"
                    style={{ height: `${Math.max(8, (kpis.outcome / maxBar) * 100)}%` }}
                    title={fmt(kpis.outcome)}
                  />
                  <span className="text-[10px] text-slate-500">Outcome</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0a1020] p-4">
              <h2 className="mb-3 text-xs font-semibold text-slate-300">Ledger tipleri</h2>
              <div className="space-y-2 text-xs">
                {byType.map((t) => (
                  <div key={t.type} className="flex justify-between border-b border-slate-800/80 py-1">
                    <span className="text-slate-400">{t.type}</span>
                    <span className="tabular-nums">
                      {fmt(t.amount)} <span className="text-slate-600">({t.count})</span>
                    </span>
                  </div>
                ))}
                {byType.length === 0 && <p className="text-slate-500">Ledger kaydı yok</p>}
              </div>
            </div>
          </div>
        </>
      )}
      {!kpis && <p className="text-xs text-slate-500">Yükleniyor…</p>}
    </div>
  );
}
