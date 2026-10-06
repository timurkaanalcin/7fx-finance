"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

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
  const { i18n, deskName } = useCrmLabels();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/admin/analytics/scoreboard")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">{i18n("crm.board.title")}</h1>
      <p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.board.intro")}</p>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-2 py-2">{i18n("crm.ui.desk")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.trader")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.active")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.ftd")}</th>
              <th className="px-2 py-2">{i18n("crm.board.depositsN")}</th>
              <th className="px-2 py-2">{i18n("crm.board.depositsUsd")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.avg")}</th>
              <th className="px-2 py-2">{i18n("crm.board.wdN")}</th>
              <th className="px-2 py-2">{i18n("crm.board.wdUsd")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.net")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.object} className="border-t border-neutral-200">
                <td className="px-2 py-1.5 font-medium">{String(r.object).includes("Unassigned") ? i18n("crm.board.unassigned") : deskName(r.object)}</td>
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
                  {i18n("crm.ui.noRecords")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
