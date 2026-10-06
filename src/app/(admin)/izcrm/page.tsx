"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import LeadDashboard from "@/components/crm/LeadDashboard";

type Kpis = {
  users: number;
  openPositions: number;
  pendingDeposits: number;
  pendingBalanceRequests: number;
  totalVolume: number;
  onlineClients?: number;
  recentClients?: number;
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
  sub,
  dot,
}: {
  label: string;
  value: string | number;
  href?: string;
  accent?: string;
  sub?: string;
  dot?: string;
}) {
  const inner = (
    <div
      className={`rounded-lg border border-neutral-200 bg-[#ffffff] p-3 shadow-sm ${accent || ""}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-1.5 flex items-center gap-2 text-xl font-semibold tabular-nums text-neutral-900">
        {dot && <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />}
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-neutral-500">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const { i18n, code, locale } = useCrmLabels();
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
      setErr(i18n("crm.dash.kpiError"));
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
          <h1 className="text-lg font-semibold">{i18n("crm.nav.dashboard")}</h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            {i18n("crm.dash.subtitle")}
            {updatedAt ? ` · ${new Date(updatedAt).toLocaleTimeString(locale === "tr" ? "tr-TR" : locale === "ru" ? "ru-RU" : "en-GB", { hour12: false })}` : ""}
          </p>
        </div>
        <Link
          href="/izcrm/positions"
          className="rounded bg-black px-3 py-1.5 text-[11px] font-medium text-white"
        >
          {i18n("crm.dash.livePositions")}
        </Link>
      </div>

      <LeadDashboard />
      {err && <p className="mb-3 text-sm text-red-400">{err}</p>}
      {!kpis && !err && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          {i18n("crm.ui.loading")}
        </div>
      )}
      {kpis && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card
            label={i18n("crm.presence.dashOnline")}
            value={kpis.onlineClients ?? 0}
            href="/izcrm/traders"
            dot={(kpis.onlineClients ?? 0) > 0 ? "bg-emerald-500" : "bg-neutral-300"}
            sub={`${kpis.recentClients ?? 0} ${i18n("crm.presence.dashRecent")}`}
            accent={(kpis.onlineClients ?? 0) > 0 ? "ring-1 ring-emerald-500/30" : ""}
          />
          <Card label={i18n("crm.nav.traders")} value={kpis.users} href="/izcrm/traders" />
          <Card label={i18n("crm.dash.openPositions")} value={kpis.openPositions} href="/izcrm/positions" />
          <Card
            label={i18n("crm.dash.pendingDeposits")}
            value={kpis.pendingDeposits}
            href="/izcrm/tickets?kind=deposit"
            accent={kpis.pendingDeposits > 0 ? "ring-1 ring-amber-500/40" : ""}
          />
          <Card
            label={i18n("crm.dash.marginRequests")}
            value={kpis.pendingBalanceRequests}
            href="/izcrm/tickets?kind=margin"
            accent={kpis.pendingBalanceRequests > 0 ? "ring-1 ring-amber-500/40" : ""}
          />
          <Card label={i18n("crm.dash.totalVolume")} value={Number(kpis.totalVolume).toFixed(2)} />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-[#ffffff]">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {i18n("crm.dash.recentPositions")}
            </h2>
            <Link href="/izcrm/positions" className="text-[10px] text-sky-600 hover:underline">
              {i18n("crm.ui.all")}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-neutral-500">
                <tr>
                  <th className="px-2 py-1.5">{i18n("crm.ui.symbol")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.side")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.vol")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.profit")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.trader")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.status")}</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.id} className="border-t border-neutral-100">
                    <td className="px-2 py-1.5 font-medium">{p.symbol}</td>
                    <td className="px-2 py-1.5">{code("crm.kind", p.side)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{p.volume}</td>
                    <td
                      className={`px-2 py-1.5 tabular-nums ${
                        Number(p.profit) >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {Number(p.profit).toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5">
                      <Link href={`/izcrm/traders/${p.traderId}`} className="text-sky-600 hover:underline">
                        {p.traderName}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5">{code("crm.status", p.status)}</td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-neutral-400">
                      {i18n("crm.ui.noPositions")}
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
              {i18n("crm.dash.recentOrders")}
            </h2>
            <Link
              href="/izcrm/positions?tab=orders"
              className="text-[10px] text-sky-600 hover:underline"
            >
              All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-neutral-500">
                <tr>
                  <th className="px-2 py-1.5">{i18n("crm.ui.symbol")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.type")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.side")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.vol")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.trader")}</th>
                  <th className="px-2 py-1.5">{i18n("crm.ui.status")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-neutral-100">
                    <td className="px-2 py-1.5 font-medium">{o.symbol}</td>
                    <td className="px-2 py-1.5">{code("crm.kind", o.type)}</td>
                    <td className="px-2 py-1.5">{code("crm.kind", o.side)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{o.volume}</td>
                    <td className="px-2 py-1.5">
                      <Link href={`/izcrm/traders/${o.traderId}`} className="text-sky-600 hover:underline">
                        {o.traderName}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5">{code("crm.status", o.status)}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-neutral-400">
                      {i18n("crm.ui.noOrders")}
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
          { href: "/izcrm/traders", title: i18n("crm.nav.traders"), desc: i18n("crm.dash.cardTraders") },
          { href: "/izcrm/tickets", title: i18n("crm.nav.tickets"), desc: i18n("crm.dash.cardTickets") },
          { href: "/izcrm/positions", title: i18n("crm.nav.positions"), desc: i18n("crm.dash.cardPositions") },
          { href: "/izcrm/desks", title: i18n("crm.nav.desks"), desc: i18n("crm.dash.cardDesks") },
          { href: "/izcrm/transactions", title: i18n("crm.nav.transactions"), desc: i18n("crm.dash.cardLedger") },
          { href: "/izcrm/rates", title: i18n("crm.nav.rates"), desc: i18n("crm.dash.cardRates") },
          { href: "/izcrm/workers", title: i18n("crm.nav.workers"), desc: i18n("crm.dash.cardWorkers") },
          { href: "/izcrm/methods", title: i18n("crm.nav.methods"), desc: i18n("crm.dash.cardMethods") },
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
