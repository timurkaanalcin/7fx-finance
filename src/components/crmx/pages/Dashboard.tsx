"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bucketSeries, queryString } from "@/lib/crmx/filters";
import { formatMoney, formatNumber, formatWhen, startOfLocalDayIso } from "@/lib/crmx/format";
import { useI18n } from "@/lib/i18n/context";
import { crmxGet } from "../api";
import { ClassicLink, EmptyState, ErrorNote, KpiCard, PageHead } from "../ui";

type Tx = { amount?: number; createdAt?: string };
type Pos = { id?: string; symbol?: string; side?: string; profit?: number; openedAt?: string; traderName?: string; traderId?: string };
type Ord = { id?: string; symbol?: string; side?: string; status?: string; createdAt?: string; traderName?: string; traderId?: string };
type Trader = { lastSeenAt?: string | null };
type Ticket = { openedAt?: string };

type Dash = {
  deposits: number;
  withdrawals: number;
  pending: number;
  traders: number;
  positions: number;
  depositSeries: number[];
  withdrawalSeries: number[];
  pendingSeries: number[];
  traderSeries: number[];
  positionSeries: number[];
  recentPositions: Pos[];
  recentOrders: Ord[];
};

function seriesFrom(rows: { t: number; v: number }[]): number[] {
  return bucketSeries(rows, 8);
}

function timePoints(rows: { at?: string | null; v: number }[]): { t: number; v: number }[] {
  const out: { t: number; v: number }[] = [];
  for (const row of rows) {
    if (!row.at) continue;
    const t = new Date(row.at).getTime();
    if (Number.isFinite(t)) out.push({ t, v: row.v });
  }
  return out;
}

export default function Dashboard() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    const from = startOfLocalDayIso();
    void (async () => {
      try {
        const [stats, deposits, withdrawals, pendingWd, traders, tickets] = await Promise.all([
          crmxGet<{
            kpis?: {
              openPositions?: number;
              pendingDeposits?: number;
              pendingBalanceRequests?: number;
              onlineClients?: number;
            };
            recentActivity?: { positions?: Pos[]; orders?: Ord[] };
          }>("/api/admin/stats"),
          crmxGet<{ transactions?: Tx[] }>(`/api/admin/transactions${queryString({ type: "DEPOSIT", from, take: 50 })}`),
          crmxGet<{ transactions?: Tx[] }>(`/api/admin/transactions${queryString({ type: "WITHDRAWAL", from, take: 50 })}`),
          crmxGet<{ total?: number }>(`/api/admin/withdrawals${queryString({ status: "PENDING", take: 1 })}`),
          crmxGet<{ users?: Trader[] }>(`/api/admin/users${queryString({ view: "table", take: 50, meta: 0, role: "TRADER" })}`),
          crmxGet<{ tickets?: Ticket[] }>(`/api/admin/tickets${queryString({ status: "PENDING", take: 50 })}`),
        ]);
        if (!live) return;
        const depRows = deposits.transactions || [];
        const wdRows = withdrawals.transactions || [];
        let depSum = 0;
        let wdSum = 0;
        for (const row of depRows) depSum += Math.abs(Number(row.amount) || 0);
        for (const row of wdRows) wdSum += Math.abs(Number(row.amount) || 0);
        const kpis = stats.kpis || {};
        setData({
          deposits: depSum,
          withdrawals: wdSum,
          pending: (kpis.pendingDeposits || 0) + (kpis.pendingBalanceRequests || 0) + (pendingWd.total || 0),
          traders: kpis.onlineClients || 0,
          positions: kpis.openPositions || 0,
          depositSeries: seriesFrom(timePoints(depRows.map((row) => ({ at: row.createdAt, v: Math.abs(Number(row.amount) || 0) })))),
          withdrawalSeries: seriesFrom(timePoints(wdRows.map((row) => ({ at: row.createdAt, v: Math.abs(Number(row.amount) || 0) })))),
          pendingSeries: seriesFrom(timePoints((tickets.tickets || []).map((row) => ({ at: row.openedAt, v: 1 })))),
          traderSeries: seriesFrom(timePoints((traders.users || []).map((row) => ({ at: row.lastSeenAt, v: 1 })))),
          positionSeries: seriesFrom(timePoints((stats.recentActivity?.positions || []).map((row) => ({ at: row.openedAt, v: Number(row.profit) || 0 })))),
          recentPositions: stats.recentActivity?.positions || [],
          recentOrders: stats.recentActivity?.orders || [],
        });
        setError(null);
      } catch (err) {
        if (!live) return;
        setError(err instanceof Error ? err.message : t("crmx.error"));
      }
    })();
    return () => {
      live = false;
    };
  }, [tick, t]);

  return (
    <section>
      <PageHead title={t("crm.nav.dashboard")} lead={t("crmx.dash.lead")}>
        <ClassicLink href="/izcrm" />
      </PageHead>
      {error ? <ErrorNote message={error} onRetry={() => setTick((n) => n + 1)} /> : null}
      <div className="crmx-kpis">
        <KpiCard label={t("crmx.kpi.deposits")} value={formatMoney(data?.deposits || 0, "USD", locale)} hint={t("crmx.sample")} series={data?.depositSeries || []} tone="buy" />
        <KpiCard label={t("crmx.kpi.withdrawals")} value={formatMoney(data?.withdrawals || 0, "USD", locale)} hint={t("crmx.sample")} series={data?.withdrawalSeries || []} tone="sell" />
        <KpiCard label={t("crmx.kpi.pending")} value={formatNumber(data?.pending || 0, locale)} hint={t("crmx.sample")} series={data?.pendingSeries || []} tone="ink" />
        <KpiCard label={t("crmx.kpi.traders")} value={formatNumber(data?.traders || 0, locale)} hint={t("crmx.online")} series={data?.traderSeries || []} tone="ink" />
        <KpiCard label={t("crmx.kpi.positions")} value={formatNumber(data?.positions || 0, locale)} hint={t("crmx.sample")} series={data?.positionSeries || []} tone="buy" />
      </div>
      <div className="crmx-grid-2">
        <article className="crmx-card">
          <h2>{t("crmx.dash.activity")}</h2>
          {data && data.recentPositions.length === 0 ? <EmptyState /> : null}
          <div className="crmx-mini">
            {(data?.recentPositions || []).map((row) => (
              <Link key={row.id || row.symbol} href={row.traderId ? `/crmx/traders/${row.traderId}` : "/crmx/positions"}>
                <span>{row.symbol} · {row.side}</span>
                <span className={Number(row.profit) < 0 ? "crmx-sell" : "crmx-buy"}>{formatNumber(row.profit, locale)}</span>
              </Link>
            ))}
          </div>
        </article>
        <article className="crmx-card">
          <h2>{t("crmx.orders")}</h2>
          {data && data.recentOrders.length === 0 ? <EmptyState /> : null}
          <div className="crmx-mini">
            {(data?.recentOrders || []).map((row) => (
              <Link key={row.id || row.symbol} href="/crmx/positions?tab=orders">
                <span>{row.traderName || "—"} · {row.symbol}</span>
                <span className="crmx-muted">{formatWhen(row.createdAt, locale)}</span>
              </Link>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
