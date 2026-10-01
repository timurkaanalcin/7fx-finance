"use client";

import { useEffect, useState } from "react";

type Row = {
  object: string;
  traders: number;
  active: number;
  ftdCount: number;
  depositCount: number;
  depositAmount: number;
  depositAverage: number;
  withdrawalCount: number;
  withdrawalAmount: number;
  netDeposit: number;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ScoreboardPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/admin/analytics/scoreboard")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Analitik · Skor Tablosu</h1>
      <p className="mb-3 text-[11px] text-neutral-500">Desk bazlı trader / FTD / yatırım özeti</p>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-2 py-2">Desk</th>
              <th className="px-2 py-2">Trader</th>
              <th className="px-2 py-2">Aktif</th>
              <th className="px-2 py-2">FTD</th>
              <th className="px-2 py-2">Yatırım #</th>
              <th className="px-2 py-2">Yatırım $</th>
              <th className="px-2 py-2">Ort.</th>
              <th className="px-2 py-2">Çekim #</th>
              <th className="px-2 py-2">Çekim $</th>
              <th className="px-2 py-2">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.object} className="border-t border-neutral-200">
                <td className="px-2 py-1.5 font-medium">{r.object}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.traders}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.active}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.ftdCount}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.depositCount}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(r.depositAmount)}</td>
                <td className="px-2 py-1.5 tabular-nums text-neutral-500">{fmt(r.depositAverage)}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.withdrawalCount}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(r.withdrawalAmount)}</td>
                <td
                  className={`px-2 py-1.5 tabular-nums font-medium ${
                    r.netDeposit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {fmt(r.netDeposit)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-neutral-500">
                  Veri yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
