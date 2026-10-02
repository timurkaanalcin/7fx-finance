"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";
import { fmtMoney, fmtNum } from "@/lib/format";

const POLL_MS = 4000;

type PosRow = Record<string, unknown>;

type EditDraft = {
  id: string;
  volume: string;
  openPrice: string;
  currentPrice: string;
  closePrice: string;
  profit: string;
  closeProfit: string;
  status: "OPEN" | "CLOSED";
};

function toDraft(p: PosRow): EditDraft {
  return {
    id: String(p.id),
    volume: String(p.volume ?? ""),
    openPrice: String(p.openPrice ?? ""),
    currentPrice: String(p.currentPrice ?? ""),
    closePrice: p.closePrice != null ? String(p.closePrice) : "",
    profit: String(p.profit ?? "0"),
    closeProfit:
      p.closeProfit != null
        ? String(p.closeProfit)
        : p.status === "CLOSED"
          ? String(p.profit ?? "0")
          : "",
    status: String(p.status) === "CLOSED" ? "CLOSED" : "OPEN",
  };
}

export default function PositionsPage() {
  const [tab, setTab] = useState<"OPEN" | "CLOSED" | "ALL" | "ORDERS">("OPEN");
  const [rows, setRows] = useState<PosRow[]>([]);
  const [orders, setOrders] = useState<PosRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (!live || editingId) return;
    const id = window.setInterval(() => {
      load();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [live, load, editingId]);

  function startEdit(p: PosRow) {
    setLive(false);
    setEditingId(String(p.id));
    setDraft(toDraft(p));
    setMsg("");
    setErr("");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit() {
    if (!draft) return;
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const payload: Record<string, unknown> = {
        id: draft.id,
        volume: Number(draft.volume),
        openPrice: Number(draft.openPrice),
        currentPrice: Number(draft.currentPrice),
        profit: Number(draft.profit),
        status: draft.status,
      };
      if (draft.closePrice !== "") payload.closePrice = Number(draft.closePrice);
      if (draft.closeProfit !== "") payload.closeProfit = Number(draft.closeProfit);
      // When closing, ensure custom PnL is applied (e.g. Nejat +102)
      if (draft.status === "CLOSED") {
        const realized =
          draft.closeProfit !== "" ? Number(draft.closeProfit) : Number(draft.profit);
        payload.closeProfit = realized;
        payload.profit = realized;
        if (draft.closePrice === "") {
          payload.closePrice = Number(draft.currentPrice);
        }
      } else {
        payload.clearCloseFields = true;
      }

      const res = await fetch("/api/admin/positions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Save failed");
        return;
      }
      setMsg(
        draft.status === "CLOSED"
          ? `Saved — CLOSED with PnL ${fmtNum(Number(payload.closeProfit), 2)}`
          : "Position updated"
      );
      setEditingId(null);
      setDraft(null);
      await load();
    } catch {
      setErr("Connection error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Positions / Orders</h1>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Trade engine data — edit open/closed fields inline (volume, prices, PnL, status).
            Closing with a custom PnL sets realized profit (e.g. +102.00).
            {updatedAt
              ? ` · last update ${new Date(updatedAt).toLocaleTimeString("en-US")}`
              : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-neutral-600">
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.target.checked)}
            className="rounded border-neutral-300"
            disabled={!!editingId}
          />
          Live ({POLL_MS / 1000}s)
        </label>
      </div>
      {err && <p className="mb-2 text-xs text-red-500">{err}</p>}
      {msg && <p className="mb-2 text-xs text-emerald-600">{msg}</p>}
      <div className="mb-3 flex gap-1">
        {(["OPEN", "CLOSED", "ALL", "ORDERS"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              cancelEdit();
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
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
            {tab === "ORDERS" ? (
              <tr>
                <th className="px-2 py-2">Symbol</th>
                <th className="px-2 py-2">Side</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Trader</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Date</th>
              </tr>
            ) : (
              <tr>
                <th className="px-2 py-2">Symbol</th>
                <th className="px-2 py-2">Side</th>
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Open</th>
                <th className="px-2 py-2">Current</th>
                <th className="px-2 py-2">Close</th>
                <th className="px-2 py-2">Profit</th>
                <th className="px-2 py-2">Realized</th>
                <th className="px-2 py-2">Trader</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Edit</th>
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
                      <td className="px-2 py-1.5 tabular-nums">{fmtNum(Number(o.volume), 2)}</td>
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
                        {new Date(String(o.createdAt)).toLocaleString("en-US")}
                      </td>
                    </tr>
                  );
                })
              : rows.map((p) => {
                  const id = String(p.id);
                  const isEdit = editingId === id && draft;
                  const profit = Number(isEdit ? draft!.profit : p.profit);
                  const realized =
                    isEdit && draft!.closeProfit !== ""
                      ? Number(draft!.closeProfit)
                      : p.closeProfit != null
                        ? Number(p.closeProfit)
                        : null;
                  return (
                    <tr
                      key={id}
                      className={`border-t border-neutral-200 ${isEdit ? "bg-amber-50/60" : ""}`}
                    >
                      <td className="px-2 py-1.5 font-medium">{String(p.symbol)}</td>
                      <td className="px-2 py-1.5">{String(p.side)}</td>
                      <td className="px-2 py-1.5 tabular-nums">
                        {isEdit ? (
                          <input
                            className="w-16 rounded border border-neutral-300 px-1 py-0.5 tabular-nums"
                            value={draft!.volume}
                            onChange={(e) => setDraft({ ...draft!, volume: e.target.value })}
                          />
                        ) : (
                          fmtNum(Number(p.volume), 2)
                        )}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums">
                        {isEdit ? (
                          <input
                            className="w-20 rounded border border-neutral-300 px-1 py-0.5 tabular-nums"
                            value={draft!.openPrice}
                            onChange={(e) => setDraft({ ...draft!, openPrice: e.target.value })}
                          />
                        ) : (
                          fmtNum(Number(p.openPrice), 5)
                        )}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums">
                        {isEdit ? (
                          <input
                            className="w-20 rounded border border-neutral-300 px-1 py-0.5 tabular-nums"
                            value={draft!.currentPrice}
                            onChange={(e) =>
                              setDraft({ ...draft!, currentPrice: e.target.value })
                            }
                          />
                        ) : (
                          fmtNum(Number(p.currentPrice), 5)
                        )}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums">
                        {isEdit ? (
                          <input
                            className="w-20 rounded border border-neutral-300 px-1 py-0.5 tabular-nums"
                            placeholder="close"
                            value={draft!.closePrice}
                            onChange={(e) => setDraft({ ...draft!, closePrice: e.target.value })}
                          />
                        ) : p.closePrice != null ? (
                          fmtNum(Number(p.closePrice), 5)
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className={`px-2 py-1.5 tabular-nums ${
                          profit >= 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {isEdit ? (
                          <input
                            className="w-20 rounded border border-neutral-300 px-1 py-0.5 tabular-nums"
                            value={draft!.profit}
                            onChange={(e) => setDraft({ ...draft!, profit: e.target.value })}
                          />
                        ) : (
                          fmtMoney(profit, 2, "USD")
                        )}
                      </td>
                      <td
                        className={`px-2 py-1.5 tabular-nums ${
                          realized != null && realized >= 0
                            ? "text-emerald-600"
                            : realized != null
                              ? "text-red-500"
                              : "text-neutral-400"
                        }`}
                      >
                        {isEdit ? (
                          <input
                            className="w-20 rounded border border-neutral-300 px-1 py-0.5 tabular-nums"
                            placeholder="e.g. 102"
                            value={draft!.closeProfit}
                            onChange={(e) =>
                              setDraft({ ...draft!, closeProfit: e.target.value })
                            }
                          />
                        ) : realized != null ? (
                          fmtMoney(realized, 2, "USD")
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <Link
                          href={`/admin/traders/${(p.user as { id: string }).id}`}
                          className="text-sky-400 hover:underline"
                        >
                          {String(p.traderName)}
                        </Link>
                      </td>
                      <td className="px-2 py-1.5">
                        {isEdit ? (
                          <select
                            className="rounded border border-neutral-300 px-1 py-0.5"
                            value={draft!.status}
                            onChange={(e) =>
                              setDraft({
                                ...draft!,
                                status: e.target.value as "OPEN" | "CLOSED",
                              })
                            }
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        ) : (
                          <StatusBadge status={String(p.status)} />
                        )}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {isEdit ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => saveEdit()}
                              className="rounded bg-black px-2 py-0.5 text-[10px] font-medium text-white disabled:opacity-50"
                            >
                              {saving ? "…" : "Save"}
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => cancelEdit()}
                              className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700 hover:bg-neutral-200"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            {tab === "ORDERS" && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-neutral-400">
                  No orders
                </td>
              </tr>
            )}
            {tab !== "ORDERS" && rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-2 py-6 text-center text-neutral-400">
                  No positions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editingId && draft?.status === "CLOSED" && (
        <p className="mt-2 text-[11px] text-neutral-500">
          Tip: set <strong>Realized</strong> to the closed PnL (e.g. <code>102</code> for +102.00 USD)
          then Save. Status CLOSED writes closeProfit and closedAt.
        </p>
      )}
    </div>
  );
}
