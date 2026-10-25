"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CRM_IDLE_POLL_MS, useVisiblePoll } from "@/lib/use-visible-poll";
import { fmtCrmDate, fmtCrmMoney } from "@/lib/crm-format";
import EditableOrdersTable from "@/components/crm/EditableOrdersTable";
import EditablePositionsTable from "@/components/crm/EditablePositionsTable";
import { CRM_LIST_PAGE, CRM_LIST_TAKE_CAP } from "@/lib/trader-list";


type PosRow = Record<string, unknown>;

type Exposure = {
  symbol: string;
  buy: number;
  sell: number;
  count: number;
  pnl: number;
};

function lotsFmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PositionsPage() {
  const { i18n } = useCrmLabels();
  const [tab, setTab] = useState<"OPEN" | "CLOSED" | "ALL" | "ORDERS">("OPEN");
  const [rows, setRows] = useState<PosRow[]>([]);
  const [orders, setOrders] = useState<PosRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [showExposure, setShowExposure] = useState(true);
  const [exposure, setExposure] = useState<Exposure[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const rowsRef = useRef<PosRow[]>([]);
  const ordersRef = useRef<PosRow[]>([]);
  const listGen = useRef(0);
  const appliedKey = useRef("");

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const exposureTotal = useMemo(
    () =>
      exposure.reduce(
        (t, e) => ({ buy: t.buy + e.buy, sell: t.sell + e.sell, count: t.count + e.count, pnl: t.pnl + e.pnl }),
        { buy: 0, sell: 0, count: 0, pnl: 0 }
      ),
    [exposure]
  );

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const gen = ++listGen.current;
    const filterKey = `${tab}|${qDebounced}`;
    const filtersChanged = mode === "replace" && appliedKey.current !== filterKey;
    if (filtersChanged) appliedKey.current = filterKey;
    const p = new URLSearchParams();
    if (qDebounced) p.set("q", qDebounced);
    const ordersTab = tab === "ORDERS";
    const loaded = filtersChanged ? 0 : (ordersTab ? ordersRef.current.length : rowsRef.current.length);
    const pageTake = mode === "more" ? CRM_LIST_PAGE : Math.min(CRM_LIST_TAKE_CAP, Math.max(CRM_LIST_PAGE, loaded || CRM_LIST_PAGE));
    p.set("take", String(pageTake));
    p.set("skip", mode === "more" ? String(loaded) : "0");
    if (ordersTab) p.set("tab", "orders");
    else p.set("status", tab);
    if (mode === "more") setMoreBusy(true);
    try {
      const res = await fetch(`/api/admin/positions?${p}`, { cache: "no-store" });
      if (gen !== listGen.current) return;
      if (!res.ok) {
        setErr(ordersTab ? i18n("crm.pos.ordersFail") : i18n("crm.pos.posFail"));
        return;
      }
      const data = await res.json();
      const list: PosRow[] = ordersTab ? data.orders || [] : data.positions || [];
      const prev = ordersTab ? ordersRef.current : rowsRef.current;
      const next =
        mode === "more" ? prev.concat(list.filter((row) => !prev.some((old) => old.id === row.id))) : list;
      if (ordersTab) {
        ordersRef.current = next;
        setOrders(next);
      } else {
        rowsRef.current = next;
        setRows(next);
        setExposure(Array.isArray(data.exposure) ? data.exposure : []);
      }
      setHasMore(Boolean(data.hasMore));
      setUpdatedAt(data.generatedAt || new Date().toISOString());
      setErr("");
    } catch {
      if (gen === listGen.current) setErr(i18n("crm.ui.connectionError"));
    } finally {
      if (mode === "more" && gen === listGen.current) setMoreBusy(false);
    }
  }, [tab, qDebounced, i18n]);

  useEffect(() => {
    load();
  }, [load]);

  useVisiblePoll(load, CRM_IDLE_POLL_MS, live && !editing);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{i18n("crm.pos.title")}</h1>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            {i18n("crm.pos.intro")}
            {updatedAt ? ` · ${i18n("crm.pos.lastUpdate")} ${fmtCrmDate(updatedAt)}` : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-neutral-600">
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.target.checked)}
            className="rounded border-neutral-300"
            disabled={editing}
          />
          {i18n("crm.ui.live")} ({CRM_IDLE_POLL_MS / 1000}s)
        </label>
      </div>
      {err && <p className="mb-2 text-xs text-red-500">{err}</p>}
      <div className="mb-3 flex gap-1">
        {(["OPEN", "CLOSED", "ALL", "ORDERS"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setEditing(false);
              setTab(t);
            }}
            className={`rounded px-3 py-1 text-xs ${tab === t ? "bg-black text-white" : "bg-neutral-100 text-neutral-500"}`}
          >
            {t === "OPEN" ? i18n("crm.ui.open") : t === "CLOSED" ? i18n("crm.ui.closed") : t === "ALL" ? i18n("crm.ui.all") : i18n("crm.ui.orders")}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto rounded bg-neutral-100 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
        >
          {i18n("crm.ui.refresh")}
        </button>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1 sm:max-w-sm">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQ("");
            }}
            placeholder={i18n("crm.pos.search")}
            aria-label={i18n("crm.pos.search")}
            className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none"
          />
        </div>
        <span className="text-[11px] tabular-nums text-neutral-500">
          {(tab === "ORDERS" ? orders.length : rows.length)}
          {hasMore ? "+" : ""} {i18n("crm.pos.shown")}
        </span>
        {tab === "OPEN" && (
          <button
            type="button"
            onClick={() => setShowExposure((v) => !v)}
            aria-expanded={showExposure}
            className={`rounded px-2.5 py-1 text-[11px] ${showExposure ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
          >
            {i18n("crm.pos.exposure")}
          </button>
        )}
      </div>
      {tab === "OPEN" && showExposure && exposure.length > 0 && (
        <div className="mb-3 overflow-x-auto rounded border border-neutral-200 bg-white">
          <p className="border-b border-neutral-100 px-3 py-1.5 text-[11px] text-neutral-500">
            {i18n("crm.pos.exposureHint")}
          </p>
          <table className="w-full text-[11px] tabular-nums">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">{i18n("crm.ui.symbol")}</th>
                <th className="px-3 py-1.5 text-right font-medium">{i18n("crm.pos.buyLots")}</th>
                <th className="px-3 py-1.5 text-right font-medium">{i18n("crm.pos.sellLots")}</th>
                <th className="px-3 py-1.5 text-right font-medium">{i18n("crm.pos.netLots")}</th>
                <th className="px-3 py-1.5 text-right font-medium">{i18n("crm.pos.count")}</th>
                <th className="px-3 py-1.5 text-right font-medium">{i18n("crm.pos.floating")}</th>
              </tr>
            </thead>
            <tbody>
              {exposure.map((e) => {
                const net = e.buy - e.sell;
                return (
                  <tr key={e.symbol} className="border-t border-neutral-100">
                    <td className="px-3 py-1">
                      <button
                        type="button"
                        onClick={() => setQ(e.symbol)}
                        className="font-semibold text-neutral-900 hover:underline"
                      >
                        {e.symbol}
                      </button>
                    </td>
                    <td className="px-3 py-1 text-right text-emerald-700">{lotsFmt(e.buy)}</td>
                    <td className="px-3 py-1 text-right text-red-600">{lotsFmt(e.sell)}</td>
                    <td className={`px-3 py-1 text-right font-medium ${net > 0 ? "text-emerald-700" : net < 0 ? "text-red-600" : "text-neutral-500"}`}>
                      {net > 0 ? "+" : ""}
                      {lotsFmt(net)}
                    </td>
                    <td className="px-3 py-1 text-right text-neutral-600">{e.count}</td>
                    <td className={`px-3 py-1 text-right font-medium ${e.pnl >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {fmtCrmMoney(e.pnl)}
                    </td>
                  </tr>
                );
              })}
              {exposure.length > 1 && (
                <tr className="border-t border-neutral-200 bg-neutral-50 font-semibold">
                  <td className="px-3 py-1">{i18n("crm.pos.total")}</td>
                  <td className="px-3 py-1 text-right text-emerald-700">{lotsFmt(exposureTotal.buy)}</td>
                  <td className="px-3 py-1 text-right text-red-600">{lotsFmt(exposureTotal.sell)}</td>
                  <td className="px-3 py-1 text-right">{lotsFmt(exposureTotal.buy - exposureTotal.sell)}</td>
                  <td className="px-3 py-1 text-right">{exposureTotal.count}</td>
                  <td className={`px-3 py-1 text-right ${exposureTotal.pnl >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {fmtCrmMoney(exposureTotal.pnl)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {tab === "ORDERS" ? (
        <EditableOrdersTable rows={orders} onSaved={() => load()} />
      ) : (
        <div
          onFocusCapture={() => setEditing(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setEditing(false);
          }}
        >
          <EditablePositionsTable
            rows={rows}
            onSaved={() => {
              setEditing(false);
              void load();
            }}
          />
        </div>
      )}
      {hasMore && (
        <div className="mt-3 text-center">
          <button
            type="button"
            disabled={moreBusy}
            onClick={() => void load("more")}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            {i18n("crm.ui.loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
