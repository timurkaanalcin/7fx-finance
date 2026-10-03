"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useEffect, useState } from "react";

type Row = {
  userId: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  openPositions: number;
  floatingPnL: number;
  openVolume: number;
};

type Totals = { balance: number; equity: number; margin: number };

export default function AdminSummaryPage() {
  const { i18n, code, deskName } = useCrmLabels();
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((r) => r.json())
      .then((d) => {
        setRows(d.accounts || []);
        setTotals(d.totals || null);
      });
  }, []);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{i18n("crm.nav.summary")}</h1>
      <p className="mb-4 text-sm text-neutral-500">{i18n("crm.sum.intro")}</p>
      {totals && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">{i18n("crm.ui.totalBalance")}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totals.balance)}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">{i18n("crm.ui.totalEquity")}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totals.equity)}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">{i18n("crm.ui.usedMargin")}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totals.margin)}</div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.account")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.balance")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.equity")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.margin")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.freeMargin")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.open")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.pnl")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.volume")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-t border-[#e5e5e5]">
                <td className="px-3 py-2">
                  <div className="font-medium">
                    {r.name}{" "}
                    {!r.active && <span className="text-red-400">{i18n("crm.sum.frozenTag")}</span>}
                  </div>
                  <div className="text-neutral-500">{r.email}</div>
                </td>
                <td className="px-3 py-2 tabular-nums">{fmt(r.balance)}</td>
                <td className="px-3 py-2 tabular-nums">{fmt(r.equity)}</td>
                <td className="px-3 py-2 tabular-nums">{fmt(r.margin)}</td>
                <td className="px-3 py-2 tabular-nums">{fmt(r.freeMargin)}</td>
                <td className="px-3 py-2 tabular-nums">{r.openPositions}</td>
                <td
                  className={`px-3 py-2 tabular-nums ${
                    r.floatingPnL >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {fmt(r.floatingPnL)}
                </td>
                <td className="px-3 py-2 tabular-nums">{r.openVolume.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  {i18n("crm.sum.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
