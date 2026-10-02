"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function DeskDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [desk, setDesk] = useState<Record<string, unknown> | null>(null);
  const [traders, setTraders] = useState<Record<string, unknown>[]>([]);
  const [workers, setWorkers] = useState<Record<string, unknown>[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<"info" | "traders" | "workers" | "analytics">("info");

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/admin/desks/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setDesk(data.desk);
    setTraders(data.traders || []);
    setWorkers(data.workers || []);
    setAnalytics(data.analytics || null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!desk) return <div className="text-xs text-neutral-500">Loading…</div>;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Link href="/admin/desks" className="text-xs text-neutral-500 hover:text-white">
          ← Desks
        </Link>
        <h1 className="text-lg font-semibold">{String(desk.name)}</h1>
      </div>
      <div className="mb-3 flex gap-1 border-b border-neutral-200 pb-2">
        {(
          [
            ["info", "Info"],
            ["traders", "Traders"],
            ["workers", "Workers"],
            ["analytics", "Analytics"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded px-3 py-1 text-xs ${tab === k ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "info" && (
        <div className="grid max-w-xl gap-2 text-xs sm:grid-cols-2">
          {[
            ["Kod", desk.code],
            ["Active", desk.active ? "Yes" : "No"],
            ["Chat", desk.chatStatus ? "Open" : "Closed"],
            ["Min deposit", desk.minimalDeposit],
            ["Max deposit", desk.maximumDeposit],
            ["Ofis", desk.office],
            ["Email", desk.defaultEmail],
            ["Platform", desk.tradePlatformLink],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded border border-neutral-200 bg-[#ffffff] px-3 py-2">
              <div className="text-[10px] text-neutral-500">{String(l)}</div>
              <div className="mt-0.5">{v == null || v === "" ? "—" : String(v)}</div>
            </div>
          ))}
        </div>
      )}
      {tab === "traders" && (
        <ul className="space-y-1 text-xs">
          {traders.map((t) => (
            <li key={String(t.id)} className="flex justify-between rounded border border-neutral-200 px-3 py-2">
              <Link href={`/admin/traders/${t.id}`} className="text-sky-300 hover:underline">
                {String(t.name)}
              </Link>
              <span className="tabular-nums text-neutral-500">
                {Number(t.balance || 0).toLocaleString("en-US", {
                  style: "currency",
                  currency: String(t.currency || "USD"),
                })}
              </span>
            </li>
          ))}
          {traders.length === 0 && <li className="text-neutral-500">Trader yok</li>}
        </ul>
      )}
      {tab === "workers" && (
        <ul className="space-y-1 text-xs">
          {workers.map((w) => (
            <li key={String(w.id)} className="rounded border border-neutral-200 px-3 py-2">
              {String(w.name)} · {String(w.email)}
            </li>
          ))}
          {workers.length === 0 && <li className="text-neutral-500">Worker yok</li>}
        </ul>
      )}
      {tab === "analytics" && analytics && (
        <div className="space-y-2 text-xs">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded border border-neutral-200 bg-[#ffffff] p-3">
              <div className="text-neutral-500">Trader</div>
              <div className="text-xl font-semibold">{String(analytics.tradersCount)}</div>
            </div>
            <div className="rounded border border-neutral-200 bg-[#ffffff] p-3">
              <div className="text-neutral-500">Worker</div>
              <div className="text-xl font-semibold">{String(analytics.workersCount)}</div>
            </div>
            <div className="rounded border border-neutral-200 bg-[#ffffff] p-3">
              <div className="text-neutral-500">Total bakiye</div>
              <div className="text-xl font-semibold tabular-nums">
                {Number(analytics.totalBalance || 0).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </div>
            </div>
          </div>
          <p className="text-neutral-500">{String(analytics.note)}</p>
        </div>
      )}
    </div>
  );
}
