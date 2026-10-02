"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Kpis = {
  users: number;
  openPositions: number;
  pendingDeposits: number;
  pendingBalanceRequests: number;
  totalVolume: number;
};

type ActivityPos = {
  id: string;
  symbol: string;
  side: string;
  volume: number;
  status: string;
  profit: number;
  openedAt: string;
  closedAt?: string | null;
  traderId: string;
  traderName: string;
};

type ActivityOrder = {
  id: string;
  symbol: string;
  side: string;
  type: string;
  volume: number;
  status: string;
  createdAt: string;
  traderId: string;
  traderName: string;
};

const POLL_MS = 5000;

function Card({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <div
      className={`rounded-lg border border-neutral-200 bg-[#ffffff] p-3 shadow-sm ${accent || ""}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-1.5 text-xl font-semibold tabular-nums text-neutral-900">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [positions, setPositions] = useState<ActivityPos[]>([]);
  const [orders, setOrders] = useState<ActivityOrder[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load");
      const d = await r.json();
      setKpis(d.kpis);
      setPositions(d.recentActivity?.positions || []);
      setOrders(d.recentActivity?.orders || []);
      setUpdatedAt(d.generatedAt || new Date().toISOString());
      setErr("");
    } catch {
      setErr("Could not load KPI data");
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            7FX Desk CRM · Live account link to the trade engine
            {updatedAt
              ? ` · ${new Date(updatedAt).toLocaleTimeString("en-US")}`
              : ""}
          </p>
        </div>
        <Link
          href="/admin/positions"
          className="rounded bg-black px-3 py-1.5 text-[11px] font-medium text-white"
        >
          Live pozisyonlar →
        </Link>
      </div>
      {err && <p className="mb-3 text-sm text-red-400">{err}</p>}
      {!kpis && !err && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          Loading…
        </div>
      )}
      {kpis && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card label="Traders" value={kpis.users} href="/admin/traders" />
          <Card label="Open Positions" value={kpis.openPositions} href="/admin/positions" />
          <Card
            label="Pending Deposits"
            value={kpis.pendingDeposits}
            href="/admin/tickets?kind=deposit"
            accent={kpis.pendingDeposits > 0 ? "ring-1 ring-amber-500/40" : ""}
          />
          <Card
            label="Margin Talepleri"
            value={kpis.pendingBalanceRequests}
            href="/admin/tickets?kind=margin"
            accent={kpis.pendingBalanceRequests > 0 ? "ring-1 ring-amber-500/40" : ""}
          />
          <Card label="Total Volume (lot)" value={Number(kpis.totalVolume).toFixed(2)} />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-[#ffffff]">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Son pozisyonlar
            </h2>
            <Link href="/admin/positions" className="text-[10px] text-sky-600 hover:underline">
              All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-neutral-500">
                <tr>
                  <th className="px-2 py-1.5">Symbol</th>
                  <th className="px-2 py-1.5">Side</th>
                  <th className="px-2 py-1.5">Vol</th>
                  <th className="px-2 py-1.5">Kâr</th>
                  <th className="px-2 py-1.5">Trader</th>
                  <th className="px-2 py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.id} className="border-t border-neutral-100">
                    <td className="px-2 py-1.5 font-medium">{p.symbol}</td>
                    <td className="px-2 py-1.5">{p.side}</td>
                    <td className="px-2 py-1.5 tabular-nums">{p.volume}</td>
                    <td
                      className={`px-2 py-1.5 tabular-nums ${
                        Number(p.profit) >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {Number(p.profit).toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5">
                      <Link href={`/admin/traders/${p.traderId}`} className="text-sky-600 hover:underline">
                        {p.traderName}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5">{p.status}</td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-neutral-400">
                      No positions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-[#ffffff]">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Son emirler
            </h2>
            <Link
              href="/admin/positions?tab=orders"
              className="text-[10px] text-sky-600 hover:underline"
            >
              All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-neutral-500">
                <tr>
                  <th className="px-2 py-1.5">Symbol</th>
                  <th className="px-2 py-1.5">Tip</th>
                  <th className="px-2 py-1.5">Side</th>
                  <th className="px-2 py-1.5">Vol</th>
                  <th className="px-2 py-1.5">Trader</th>
                  <th className="px-2 py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-neutral-100">
                    <td className="px-2 py-1.5 font-medium">{o.symbol}</td>
                    <td className="px-2 py-1.5">{o.type}</td>
                    <td className="px-2 py-1.5">{o.side}</td>
                    <td className="px-2 py-1.5 tabular-nums">{o.volume}</td>
                    <td className="px-2 py-1.5">
                      <Link href={`/admin/traders/${o.traderId}`} className="text-sky-600 hover:underline">
                        {o.traderName}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5">{o.status}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-neutral-400">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/traders", title: "Traders", desc: "Filters, membership, trading Account" },
          { href: "/admin/tickets", title: "Biletler", desc: "Deposit + margin approval → balance" },
          { href: "/admin/positions", title: "Positions", desc: "Live trade engine positions" },
          { href: "/admin/desks", title: "Desks", desc: "Trader / worker / analytics stub" },
          { href: "/admin/transactions", title: "Ledger", desc: "Balance history" },
          { href: "/admin/rates", title: "Trading Rates", desc: "Spread, komisyon, hacim" },
          { href: "/admin/workers", title: "Workers", desc: "Admin users and permissions" },
          { href: "/admin/methods", title: "Deposit Methods", desc: "IBAN / crypto" },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3 transition hover:border-neutral-400"
          >
            <div className="text-xs font-semibold">{x.title}</div>
            <div className="mt-0.5 text-[10px] text-neutral-500">{x.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
