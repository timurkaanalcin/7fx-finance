"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { fmtCrmDate } from "@/lib/crm-format";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function TransactionsPage() {
  const { i18n, code, deskName } = useCrmLabels();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [type, setType] = useState("");

  const load = useCallback(async () => {
    const q = type ? `?type=${type}` : "";
    const res = await fetch(`/api/admin/transactions${q}`);
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.transactions || []);
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">{i18n("crm.tx.title")}</h1>
<p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.tx.intro")}</p>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="mb-3 rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5 text-xs"
      >
        <option value="">{i18n("crm.ui.allTypes")}</option>
        {["DEPOSIT", "MARGIN_ADD", "RESET", "ADJUSTMENT", "FINANCE_SET", "BONUS", "CREDIT"].map(
          (t) => (
            <option key={code("crm.ledger", t)} value={t}>
              {t}
            </option>
          )
        )}
      </select>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-2 py-2">{i18n("crm.ui.type")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.amount")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.beforeAfter")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.trader")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.account")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.createdBy")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.comment")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.date")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} className="border-t border-neutral-200">
                <td className="px-2 py-1.5 font-medium">{code("crm.ledger", String(r.type))}</td>
                <td className="px-2 py-1.5 tabular-nums">{Number(r.amount).toFixed(2)}</td>
                <td className="px-2 py-1.5 tabular-nums text-neutral-500">
                  {Number(r.balanceBefore).toFixed(2)} → {Number(r.balanceAfter).toFixed(2)}
                </td>
                <td className="px-2 py-1.5">
                  <Link href={`/admin/traders/${r.traderId}`} className="text-sky-400 hover:underline">
                    {String(r.trader)}
                  </Link>
                </td>
                <td className="px-2 py-1.5 font-mono text-[9px] text-neutral-500">
                  {String(r.tradingAccountId || "—").slice(0, 12)}
                </td>
                <td className="px-2 py-1.5 text-neutral-500">{String(r.createdByName || "—")}</td>
                <td className="max-w-[180px] truncate px-2 py-1.5 text-neutral-500">
                  {String(r.comment || "—")}
                </td>
                <td className="px-2 py-1.5 text-neutral-500">
                  {fmtCrmDate(r.createdAt)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
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
