"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";

const POLL_MS = 4000;

export default function PositionsPage() {
  const [tab, setTab] = useState<"OPEN" | "CLOSED" | "ALL" | "ORDERS">("OPEN");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      if (tab === "ORDERS") {
        const res = await fetch("/api/admin/positions?tab=orders", { cache: "no-store" });
        if (!res.ok) {
          setErr("Emirler yüklenemedi");
          return;
        }
        const data = await res.json();
        setOrders(data.orders || []);
        setUpdatedAt(data.generatedAt || new Date().toISOString());
        setErr("");
        return;
      }
      const res = await fetch(`/api/admin/positions?status=${tab}`, { cache: "no-store" });
      if (!res.ok) {
        setErr("Pozisyonlar yüklenemedi");
        return;
      }
      const data = await res.json();
      setRows(data.positions || []);
      setUpdatedAt(data.generatedAt || new Date().toISOString());
      setErr("");
    } catch {
      setErr("Bağlantı hatası");
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      load();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [live, load]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Pozisyonlar / Emirler</h1>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Trade engine verisi — trader emir/pozisyon aç-kapa anında CRM&apos;e yansır
            {updatedAt
              ? ` · son güncelleme ${new Date(updatedAt).toLocaleTimeString("tr-TR")}`
              : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-neutral-600">
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.target.checked)}
            className="rounded border-neutral-300"
          />
          Canlı ({POLL_MS / 1000}sn)
        </label>
      </div>
      {err && <p className="mb-2 text-xs text-red-500">{err}</p>}
      <div className="mb-3 flex gap-1">
        {(["OPEN", "CLOSED", "ALL", "ORDERS"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1 text-xs ${tab === t ? "bg-black text-white" : "bg-neutral-100 text-neutral-500"}`}
          >
            {t === "OPEN" ? "Açık" : t === "CLOSED" ? "Kapalı" : t === "ALL" ? "Tümü" : "Emirler"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load()}
          className="ml-auto rounded bg-neutral-100 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
        >
          Yenile
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
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
                    <tr key={String(o.id)} className="border-t border-neutral-200">
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
                      <td className="px-2 py-1.5 text-neutral-500">
                        {new Date(String(o.createdAt)).toLocaleString("tr-TR")}
                      </td>
                    </tr>
                  );
                })
              : rows.map((p) => (
                  <tr key={String(p.id)} className="border-t border-neutral-200">
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
                    <td className="px-2 py-1.5 text-neutral-500">{String(p.broker || "—")}</td>
                    <td className="px-2 py-1.5 font-mono text-[9px] text-neutral-500">
                      {String(p.tradingAccountId || "—").slice(0, 10)}
                    </td>
                    <td className="px-2 py-1.5">
                      <StatusBadge status={String(p.status)} />
                    </td>
                  </tr>
                ))}
            {tab === "ORDERS" && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-neutral-400">
                  Emir yok
                </td>
              </tr>
            )}
            {tab !== "ORDERS" && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-2 py-6 text-center text-neutral-400">
                  Pozisyon yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
