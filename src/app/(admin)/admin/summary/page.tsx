"use client";

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
      <h1 className="mb-1 text-xl font-semibold">Account Summary</h1>
      <p className="mb-4 text-sm text-neutral-500">Balance, equity and open positions across all trader accounts</p>
      {totals && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">Total Balance</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totals.balance)}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">Total Equity</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totals.equity)}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">Used Margin</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totals.margin)}</div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-3 py-2">Account</th>
              <th className="px-3 py-2">Balance</th>
              <th className="px-3 py-2">Equity</th>
              <th className="px-3 py-2">Marj</th>
              <th className="px-3 py-2">Serbest</th>
              <th className="px-3 py-2">Open</th>
              <th className="px-3 py-2">P/L</th>
              <th className="px-3 py-2">Volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-t border-[#e5e5e5]">
                <td className="px-3 py-2">
                  <div className="font-medium">
                    {r.name}{" "}
                    {!r.active && <span className="text-red-400">(donuk)</span>}
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
                  Account yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
