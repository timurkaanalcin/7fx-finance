"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";

export default function PositionsPage() {
  const [tab, setTab] = useState<"OPEN" | "CLOSED" | "ALL" | "ORDERS">("OPEN");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    if (tab === "ORDERS") {
      const res = await fetch("/api/admin/positions?tab=orders");
      if (!res.ok) return;
      const data = await res.json();
      setOrders(data.orders || []);
      return;
    }
    const res = await fetch(`/api/admin/positions?status=${tab}`);
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.positions || []);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Pozisyonlar / Emirler</h1>
      <p className="mb-3 text-[11px] text-slate-500">
        Trade engine verisi — her satır trader üyeliğinin 1:1 Account kaydına bağlıdır.
      </p>
      <div className="mb-3 flex gap-1">
        {(["OPEN", "CLOSED", "ALL", "ORDERS"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1 text-xs ${tab === t ? "bg-sky-600" : "bg-slate-800 text-slate-400"}`}
          >
            {t === "OPEN" ? "Açık" : t === "CLOSED" ? "Kapalı" : t === "ALL" ? "Tümü" : "Emirler"}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#0a1020] text-slate-500">
            {tab === "ORDERS" ? (
              <tr>
                <th className="px-2 py-2">Sembol</th>
                <th className="px-2 py-2">Side</th>
                <th className="px-2 py-2">Tip</th>
                <th className="px-2 py-2">Hacim</th>
                <th className="px-2 py-2">Trader</th>
                <th className="px-2 py-2">Durum</th>
                <th className="px-2 py-2">Tarih</th>
              </tr>
            ) : (
              <tr>
                <th className="px-2 py-2">Sembol</th>
                <th className="px-2 py-2">Side</th>
                <th className="px-2 py-2">Hacim</th>
                <th className="px-2 py-2">Açılış</th>
                <th className="px-2 py-2">Güncel</th>
                <th className="px-2 py-2">Kâr</th>
                <th className="px-2 py-2">Trader</th>
                <th className="px-2 py-2">Broker</th>
                <th className="px-2 py-2">Account</th>
                <th className="px-2 py-2">Durum</th>
              </tr>
            )}
          </thead>
          <tbody>
            {tab === "ORDERS"
              ? orders.map((o) => {
                  const u = o.user as { id: string; name: string } | undefined;
                  return (
                    <tr key={String(o.id)} className="border-t border-slate-800">
                      <td className="px-2 py-1.5 font-medium">{String(o.symbol)}</td>
                      <td className="px-2 py-1.5">{String(o.side)}</td>
                      <td className="px-2 py-1.5">{String(o.type)}</td>
                      <td className="px-2 py-1.5 tabular-nums">{String(o.volume)}</td>
                      <td className="px-2 py-1.5">
                        {u ? (
                          <Link href={`/admin/traders/${u.id}`} className="text-sky-400 hover:underline">
                            {u.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <StatusBadge status={String(o.status)} />
                      </td>
                      <td className="px-2 py-1.5 text-slate-500">
                        {new Date(String(o.createdAt)).toLocaleString("tr-TR")}
                      </td>
                    </tr>
                  );
                })
              : rows.map((p) => (
                  <tr key={String(p.id)} className="border-t border-slate-800">
                    <td className="px-2 py-1.5 font-medium">{String(p.symbol)}</td>
                    <td className="px-2 py-1.5">{String(p.side)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{String(p.volume)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{String(p.openPrice)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{String(p.currentPrice)}</td>
                    <td
                      className={`px-2 py-1.5 tabular-nums ${
                        Number(p.profit) >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {Number(p.profit).toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5">
                      <Link
                        href={`/admin/traders/${(p.user as { id: string }).id}`}
                        className="text-sky-400 hover:underline"
                      >
                        {String(p.traderName)}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5 text-slate-400">{String(p.broker || "—")}</td>
                    <td className="px-2 py-1.5 font-mono text-[9px] text-slate-500">
                      {String(p.tradingAccountId || "—").slice(0, 10)}
                    </td>
                    <td className="px-2 py-1.5">
                      <StatusBadge status={String(p.status)} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
