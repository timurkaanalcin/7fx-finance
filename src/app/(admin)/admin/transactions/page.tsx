"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function TransactionsPage() {
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
      <h1 className="mb-3 text-lg font-semibold">İşlemler (Balance Ledger)</h1>
      <p className="mb-3 text-[11px] text-slate-500">
        Yatırma onayı, marjin reset/add ve finans düzeltmeleri aynı trading bakiyesine işlenir.
      </p>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="mb-3 rounded border border-slate-700 bg-[#0a1020] px-2 py-1.5 text-xs"
      >
        <option value="">Tüm tipler</option>
        {["DEPOSIT", "MARGIN_ADD", "RESET", "ADJUSTMENT", "FINANCE_SET", "BONUS", "CREDIT"].map(
          (t) => (
            <option key={t} value={t}>
              {t}
            </option>
          )
        )}
      </select>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#0a1020] text-slate-500">
            <tr>
              <th className="px-2 py-2">Tip</th>
              <th className="px-2 py-2">Tutar</th>
              <th className="px-2 py-2">Önce → Sonra</th>
              <th className="px-2 py-2">Trader</th>
              <th className="px-2 py-2">Account</th>
              <th className="px-2 py-2">Oluşturan</th>
              <th className="px-2 py-2">Yorum</th>
              <th className="px-2 py-2">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} className="border-t border-slate-800">
                <td className="px-2 py-1.5 font-medium">{String(r.type)}</td>
                <td className="px-2 py-1.5 tabular-nums">{Number(r.amount).toFixed(2)}</td>
                <td className="px-2 py-1.5 tabular-nums text-slate-400">
                  {Number(r.balanceBefore).toFixed(2)} → {Number(r.balanceAfter).toFixed(2)}
                </td>
                <td className="px-2 py-1.5">
                  <Link href={`/admin/traders/${r.traderId}`} className="text-sky-400 hover:underline">
                    {String(r.trader)}
                  </Link>
                </td>
                <td className="px-2 py-1.5 font-mono text-[9px] text-slate-500">
                  {String(r.tradingAccountId || "—").slice(0, 12)}
                </td>
                <td className="px-2 py-1.5 text-slate-400">{String(r.createdByName || "—")}</td>
                <td className="max-w-[180px] truncate px-2 py-1.5 text-slate-500">
                  {String(r.comment || "—")}
                </td>
                <td className="px-2 py-1.5 text-slate-500">
                  {new Date(String(r.createdAt)).toLocaleString("tr-TR")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  Kayıt yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
