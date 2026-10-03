"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

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
  const { i18n, code } = useCrmLabels();
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
      <h1 className="mb-1 text-lg font-semibold">{i18n("crm.fin.title")}</h1>
      <p className="mb-4 text-[11px] text-neutral-500">{i18n("crm.fin.intro")}</p>
      {kpis && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: i18n("crm.fin.revenue"), value: fmt(kpis.income), tone: "text-emerald-400" },
              { label: i18n("crm.fin.expense"), value: fmt(kpis.outcome), tone: "text-rose-400" },
              { label: i18n("crm.ui.net"), value: fmt(kpis.net), tone: "text-sky-400" },
              { label: i18n("crm.fin.approvedDep"), value: fmt(kpis.depositsApproved), tone: "text-emerald-300" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-neutral-200 bg-[#ffffff] p-3">
                <div className="text-[10px] uppercase text-neutral-500">{c.label}</div>
                <div className={`mt-1 text-lg font-semibold tabular-nums ${c.tone}`}>{c.value}</div>
              </div>
            ))}
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: i18n("crm.fin.pendingDep"), value: `${fmt(kpis.depositsPending)} (${kpis.depositsPendingCount})` },
              { label: i18n("crm.fin.openPos"), value: String(kpis.openPositions) },
              { label: i18n("crm.fin.openVol"), value: kpis.openVolume.toFixed(2) },
              { label: i18n("crm.fin.floating"), value: fmt(kpis.floatingPnL) },
              { label: i18n("crm.ui.totalBalance"), value: fmt(kpis.totalBalance) },
              { label: i18n("crm.ui.totalEquity"), value: fmt(kpis.totalEquity) },
              { label: i18n("crm.ui.credit"), value: fmt(kpis.totalCredit) },
              { label: i18n("crm.ui.bonus"), value: fmt(kpis.totalBonus) },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-neutral-200 bg-[#ffffff] p-3">
                <div className="text-[10px] uppercase text-neutral-500">{c.label}</div>
                <div className="mt-1 text-sm font-semibold tabular-nums">{c.value}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-[#ffffff] p-4">
              <h2 className="mb-3 text-xs font-semibold text-neutral-600">{i18n("crm.fin.revExp")}</h2>
              <div className="flex h-40 items-end gap-4 px-4">
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-emerald-500/80"
                    style={{ height: `${Math.max(8, (kpis.income / maxBar) * 100)}%` }}
                    title={fmt(kpis.income)}
                  />
                  <span className="text-[10px] text-neutral-500">{i18n("crm.ui.income")}</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-rose-500/80"
                    style={{ height: `${Math.max(8, (kpis.outcome / maxBar) * 100)}%` }}
                    title={fmt(kpis.outcome)}
                  />
                  <span className="text-[10px] text-neutral-500">{i18n("crm.ui.outcome")}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-[#ffffff] p-4">
              <h2 className="mb-3 text-xs font-semibold text-neutral-600">{i18n("crm.fin.ledgerTypes")}</h2>
              <div className="space-y-2 text-xs">
                {byType.map((t) => (
                  <div key={t.type} className="flex justify-between border-b border-neutral-200 py-1">
                    <span className="text-neutral-500">{code("crm.ledger", t.type)}</span>
                    <span className="tabular-nums">
                      {fmt(t.amount)} <span className="text-neutral-400">({t.count})</span>
                    </span>
                  </div>
                ))}
                {byType.length === 0 && <p className="text-neutral-500">{i18n("crm.fin.noLedger")}</p>}
              </div>
            </div>
          </div>
        </>
      )}
      {!kpis && <p className="text-xs text-neutral-500">{i18n("crm.ui.loading")}</p>}
    </div>
  );
}
