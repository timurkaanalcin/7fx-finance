"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fmtCrmDate, fmtCrmMoney } from "@/lib/crm-format";
import EditableOrdersTable from "@/components/crm/EditableOrdersTable";
import EditablePositionsTable from "@/components/crm/EditablePositionsTable";

const POLL_MS = 4000;

type PosRow = Record<string, unknown>;

/** Lowercased haystack for the quick search (customer, e-mail, symbol, ticket id). */
function rowHaystack(r: PosRow): string {
  const u = (r.user && typeof r.user === "object" ? r.user : {}) as Record<string, unknown>;
  return [r.id, r.symbol, r.chartSymbol, r.side, u.name, u.email, u.brokerName, r.userId]
    .filter((v) => v != null && v !== "")
    .map((v) => String(v).toLowerCase())
    .join(" ");
}

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
  const [showExposure, setShowExposure] = useState(true);

  const needle = q.trim().toLowerCase();
  const filteredRows = useMemo(
    () => (needle ? rows.filter((r) => rowHaystack(r).includes(needle)) : rows),
    [rows, needle]
  );
  const filteredOrders = useMemo(
    () => (needle ? orders.filter((r) => rowHaystack(r).includes(needle)) : orders),
    [orders, needle]
  );
  const exposure = useMemo(() => {
    const map = new Map<string, Exposure>();
    for (const r of filteredRows) {
      if (String(r.status ?? "OPEN").toUpperCase() !== "OPEN") continue;
      const sym = String(r.symbol ?? "").toUpperCase() || "—";
      const vol = Number(r.volume);
      const pnl = Number(r.profit);
      const e = map.get(sym) ?? { symbol: sym, buy: 0, sell: 0, count: 0, pnl: 0 };
      if (Number.isFinite(vol)) {
        if (String(r.side ?? "").toUpperCase() === "SELL") e.sell += vol;
        else e.buy += vol;
      }
      if (Number.isFinite(pnl)) e.pnl += pnl;
      e.count += 1;
      map.set(sym, e);
    }
    return Array.from(map.values()).sort((a, b) => b.buy + b.sell - (a.buy + a.sell));
  }, [filteredRows]);
  const exposureTotal = useMemo(
    () =>
      exposure.reduce(
        (t, e) => ({ buy: t.buy + e.buy, sell: t.sell + e.sell, count: t.count + e.count, pnl: t.pnl + e.pnl }),
        { buy: 0, sell: 0, count: 0, pnl: 0 }
      ),
    [exposure]
  );

  const load = useCallback(async () => {
    try {
      if (tab === "ORDERS") {
        const res = await fetch("/api/admin/positions?tab=orders", { cache: "no-store" });
        if (!res.ok) {
          setErr(i18n("crm.pos.ordersFail"));
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
        setErr(i18n("crm.pos.posFail"));
        return;
      }
      const data = await res.json();
      setRows(data.positions || []);
      setUpdatedAt(data.generatedAt || new Date().toISOString());
      setErr("");
    } catch {
      setErr(i18n("crm.ui.connectionError"));
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!live || editing) return;
    const id = window.setInterval(() => {
      load();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [live, load, editing]);

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
          {i18n("crm.ui.live")} ({POLL_MS / 1000}s)
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
          onClick={() => load()}
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
          {tab === "ORDERS" ? filteredOrders.length : filteredRows.length} /{" "}
          {tab === "ORDERS" ? orders.length : rows.length} {i18n("crm.pos.shown")}
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
        <EditableOrdersTable rows={filteredOrders} onSaved={() => load()} />
      ) : (
        <div
          onFocusCapture={() => setEditing(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setEditing(false);
          }}
        >
          <EditablePositionsTable
            rows={filteredRows}
            onSaved={() => {
              setEditing(false);
              load();
            }}
          />
        </div>
      )}
    </div>
  );
}
