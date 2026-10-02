"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtCrmDate } from "@/lib/crm-format";
import EditableOrdersTable from "@/components/crm/EditableOrdersTable";
import EditablePositionsTable from "@/components/crm/EditablePositionsTable";

const POLL_MS = 4000;

type PosRow = Record<string, unknown>;

export default function PositionsPage() {
  const [tab, setTab] = useState<"OPEN" | "CLOSED" | "ALL" | "ORDERS">("OPEN");
  const [rows, setRows] = useState<PosRow[]>([]);
  const [orders, setOrders] = useState<PosRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      if (tab === "ORDERS") {
        const res = await fetch("/api/admin/positions?tab=orders", { cache: "no-store" });
        if (!res.ok) {
          setErr("Could not load orders");
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
        setErr("Could not load positions");
        return;
      }
      const data = await res.json();
      setRows(data.positions || []);
      setUpdatedAt(data.generatedAt || new Date().toISOString());
      setErr("");
    } catch {
      setErr("Connection error");
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
          <h1 className="text-lg font-semibold">Positions / Orders</h1>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Trade engine data — edit inline. Profit ↔ open/close syncs live
            (volume×contractSize×price delta). Amount = lot×contract×open updates with price.
            Chart overrides terminal chart / live feed symbol. Times are 24h (HH:mm:ss).
            {updatedAt ? ` · last update ${fmtCrmDate(updatedAt)}` : ""}
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
          Live ({POLL_MS / 1000}s)
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
            {t === "OPEN" ? "Open" : t === "CLOSED" ? "Closed" : t === "ALL" ? "All" : "Orders"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load()}
          className="ml-auto rounded bg-neutral-100 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
        >
          Refresh
        </button>
      </div>
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
              load();
            }}
          />
        </div>
      )}
    </div>
  );
}
