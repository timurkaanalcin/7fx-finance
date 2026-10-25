"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { activeFilterCount, filterRows, queryString } from "@/lib/crmx/filters";
import { formatNumber, formatWhen } from "@/lib/crmx/format";
import { useI18n } from "@/lib/i18n/context";
import { crmxGet } from "../api";
import { ClassicLink, DataTable, EmptyState, ErrorNote, FactList, FilterDrawer, PageHead, StatusPill } from "../ui";

type Position = {
  id: string;
  userId?: string;
  symbol?: string;
  side?: string;
  volume?: number;
  openPrice?: number;
  currentPrice?: number;
  profit?: number;
  margin?: number;
  status?: string;
  openedAt?: string;
  stopLoss?: number | null;
  takeProfit?: number | null;
  traderName?: string;
  closePrice?: number | null;
  closeProfit?: number | null;
};

type Order = {
  id: string;
  userId?: string;
  symbol?: string;
  side?: string;
  type?: string;
  volume?: number;
  price?: number | null;
  status?: string;
  createdAt?: string;
  traderName?: string;
};

export default function Positions() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") || "";
  const status = sp.get("status") || "OPEN";
  const tab = sp.get("tab") === "orders" ? "orders" : "positions";
  const userId = sp.get("userId") || "";
  const selectedId = sp.get("id") || "";
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [draft, setDraft] = useState({ q, status });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "orders") {
        const data = await crmxGet<{ orders?: Order[] }>(`/api/admin/positions${queryString({ tab: "orders", take: 50, q, userId })}`);
        setOrders(filterRows(data.orders || [], q, (row) => [row.traderName, row.symbol, row.side, row.type, row.status]));
        setPositions([]);
      } else {
        const data = await crmxGet<{ positions?: Position[] }>(`/api/admin/positions${queryString({ tab: "positions", status, take: 50, q, userId })}`);
        setPositions(filterRows(data.positions || [], q, (row) => [row.traderName, row.symbol, row.side, row.status]));
        setOrders([]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("crmx.error"));
    } finally {
      setLoading(false);
    }
  }, [tab, status, q, userId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function push(next: URLSearchParams) {
    if (userId) next.set("userId", userId);
    const suffix = next.toString();
    router.push(suffix ? `/crmx/positions?${suffix}` : "/crmx/positions");
  }

  const selectedPos = positions.find((row) => row.id === selectedId) || null;
  const selectedOrd = orders.find((row) => row.id === selectedId) || null;
  const count = activeFilterCount({ q, status: tab === "positions" && status !== "OPEN" ? status : "" }, ["q"]);

  return (
    <section>
      <PageHead title={t("crm.nav.positions")}>
        <button type="button" className={`crmx-btn${tab === "positions" ? " crmx-btn-primary" : ""}`} onClick={() => { const next = new URLSearchParams(sp.toString()); next.delete("tab"); next.delete("id"); push(next); }}>{t("crm.ui.open")}</button>
        <button type="button" className={`crmx-btn${tab === "orders" ? " crmx-btn-primary" : ""}`} onClick={() => { const next = new URLSearchParams(sp.toString()); next.set("tab", "orders"); next.delete("id"); push(next); }}>{t("crmx.orders")}</button>
        <button type="button" className="crmx-btn" onClick={() => { setDraft({ q, status }); setDrawer(true); }}>
          {t("crmx.filters")} {count ? <span className="crmx-badge">{count}</span> : null}
        </button>
        <ClassicLink href={tab === "orders" ? "/izcrm/positions?tab=orders" : "/izcrm/positions"} />
      </PageHead>
      {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
      <div className={`crmx-split${selectedId ? " is-detail" : ""}`}>
        <div className="crmx-list">
          {tab === "positions" && positions.length === 0 && !loading ? <EmptyState /> : null}
          {tab === "orders" && orders.length === 0 && !loading ? <EmptyState /> : null}
          {tab === "positions" && positions.length > 0 ? (
            <DataTable
              label={t("crm.nav.positions")}
              rows={positions}
              rowKey={(row) => row.id}
              selectedKey={selectedId}
              onRow={(row) => { const next = new URLSearchParams(sp.toString()); next.set("id", row.id); push(next); }}
              cols={[
                { key: "who", header: t("crm.ui.trader"), render: (row) => row.userId ? <Link href={`/crmx/traders/${row.userId}`}>{row.traderName || "—"}</Link> : (row.traderName || "—") },
                { key: "symbol", header: t("crm.ui.symbol"), render: (row) => row.symbol || "—" },
                { key: "side", header: t("crm.ui.side"), render: (row) => <span className={row.side === "SELL" ? "crmx-sell" : "crmx-buy"}>{row.side}</span> },
                { key: "vol", header: t("crm.ui.volume"), render: (row) => formatNumber(row.volume, locale) },
                { key: "pl", header: t("crm.ui.profit"), render: (row) => <span className={Number(row.profit) < 0 ? "crmx-sell" : "crmx-buy"}>{formatNumber(row.profit, locale)}</span> },
              ]}
            />
          ) : null}
          {tab === "orders" && orders.length > 0 ? (
            <DataTable
              label={t("crmx.orders")}
              rows={orders}
              rowKey={(row) => row.id}
              selectedKey={selectedId}
              onRow={(row) => { const next = new URLSearchParams(sp.toString()); next.set("id", row.id); push(next); }}
              cols={[
                { key: "who", header: t("crm.ui.trader"), render: (row) => row.traderName || "—" },
                { key: "symbol", header: t("crm.ui.symbol"), render: (row) => row.symbol || "—" },
                { key: "type", header: t("crm.ui.type"), render: (row) => `${row.side || ""} ${row.type || ""}` },
                { key: "status", header: t("crm.ui.status"), render: (row) => <StatusPill status={row.status} /> },
              ]}
            />
          ) : null}
        </div>
        <aside className="crmx-detail" aria-label={t("crm.ui.detail")}>
          {selectedId ? <button type="button" className="crmx-btn" onClick={() => { const next = new URLSearchParams(sp.toString()); next.delete("id"); push(next); }}>{t("crmx.back")}</button> : null}
          {selectedPos ? (
            <>
              <h2 className="crmx-h1" style={{ fontSize: 18 }}>{selectedPos.symbol}</h2>
              <FactList
                items={[
                  { label: t("crm.ui.trader"), value: selectedPos.traderName || "—" },
                  { label: t("crm.ui.side"), value: selectedPos.side || "—" },
                  { label: t("crm.ui.volume"), value: formatNumber(selectedPos.volume, locale) },
                  { label: t("crm.ui.status"), value: <StatusPill status={selectedPos.status} /> },
                  { label: "Open", value: formatNumber(selectedPos.openPrice, locale) },
                  { label: "Mark", value: formatNumber(selectedPos.currentPrice, locale) },
                  { label: t("crm.ui.profit"), value: formatNumber(selectedPos.profit, locale) },
                  { label: "SL / TP", value: `${formatNumber(selectedPos.stopLoss, locale)} / ${formatNumber(selectedPos.takeProfit, locale)}` },
                  { label: t("crm.ui.date"), value: formatWhen(selectedPos.openedAt, locale) },
                ]}
              />
            </>
          ) : null}
          {selectedOrd ? (
            <>
              <h2 className="crmx-h1" style={{ fontSize: 18 }}>{selectedOrd.symbol}</h2>
              <FactList
                items={[
                  { label: t("crm.ui.trader"), value: selectedOrd.traderName || "—" },
                  { label: t("crm.ui.side"), value: selectedOrd.side || "—" },
                  { label: t("crm.ui.type"), value: selectedOrd.type || "—" },
                  { label: t("crm.ui.volume"), value: formatNumber(selectedOrd.volume, locale) },
                  { label: t("crm.ui.amount"), value: formatNumber(selectedOrd.price, locale) },
                  { label: t("crm.ui.status"), value: <StatusPill status={selectedOrd.status} /> },
                  { label: t("crm.ui.date"), value: formatWhen(selectedOrd.createdAt, locale) },
                ]}
              />
            </>
          ) : null}
          {!selectedPos && !selectedOrd ? <EmptyState label={t("crmx.detail.pick")} /> : null}
        </aside>
      </div>
      <FilterDrawer
        open={drawer}
        title={t("crmx.filters")}
        onClose={() => setDrawer(false)}
        onClear={() => {
          const next = new URLSearchParams();
          if (tab === "orders") next.set("tab", "orders");
          push(next);
          setDrawer(false);
        }}
        onApply={() => {
          const next = new URLSearchParams(sp.toString());
          next.delete("id");
          if (draft.q.trim()) next.set("q", draft.q.trim()); else next.delete("q");
          if (tab === "positions") {
            if (draft.status) next.set("status", draft.status); else next.delete("status");
          }
          push(next);
          setDrawer(false);
        }}
      >
        <label>{t("crm.ui.search")}<input value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} /></label>
        {tab === "positions" ? (
          <label>
            {t("crm.ui.status")}
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option value="OPEN">{t("crm.ui.open")}</option>
              <option value="CLOSED">{t("crm.ui.closed")}</option>
              <option value="ALL">{t("crm.ui.all")}</option>
            </select>
          </label>
        ) : null}
      </FilterDrawer>
    </section>
  );
}
