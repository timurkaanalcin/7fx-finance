"use client";

import { useState } from "react";
import {
  fmtCrmDate,
  fmtCrmMoney,
  fmtCrmPrice,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/crm-format";
import {
  openingNotionalFromDraft,
  syncDraftFromPrices,
  syncDraftFromProfit,
  type PositionEditDraft,
  type RecalcFrom,
} from "@/lib/crm-position-pnl";
import { SYMBOLS } from "@/lib/symbols";

type Row = Record<string, unknown>;
type Draft = PositionEditDraft;

const CHART_OPTIONS = SYMBOLS.map((s) => s.symbol);

function toDraft(p: Row): Draft {
  const symbol = String(p.symbol ?? "");
  const chart =
    p.chartSymbol != null && String(p.chartSymbol).trim()
      ? String(p.chartSymbol).trim().toUpperCase()
      : "";
  const base: Draft = {
    id: String(p.id),
    symbol,
    chartSymbol: chart,
    side: String(p.side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY",
    volume: String(p.volume ?? ""),
    openPrice: String(p.openPrice ?? ""),
    currentPrice: String(p.currentPrice ?? ""),
    closePrice: p.closePrice != null ? String(p.closePrice) : "",
    profit: Number.isFinite(Number(p.profit)) ? String(Number(p.profit)) : "0",
    closeProfit:
      p.closeProfit != null
        ? String(p.closeProfit)
        : p.status === "CLOSED"
          ? String(p.profit ?? "0")
          : "",
    amount: "",
    margin: Number.isFinite(Number(p.margin)) ? String(Number(p.margin)) : "",
    status: String(p.status) === "CLOSED" ? "CLOSED" : "OPEN",
    openedAt: toDatetimeLocalValue(p.openedAt),
    closedAt: toDatetimeLocalValue(p.closedAt),
  };
  return syncDraftFromPrices(base);
}

const inp =
  "w-full min-w-[4.5rem] rounded border border-[#111111] bg-white px-1.5 py-1 text-[11px] text-[#111111] tabular-nums";

type Props = {
  rows: Row[];
  onSaved?: () => void;
};

export default function EditablePositionsTable({ rows, onSaved }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [recalcFrom, setRecalcFrom] = useState<RecalcFrom>("prices");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  function startEdit(p: Row) {
    setEditingId(String(p.id));
    setDraft(toDraft(p));
    setRecalcFrom("prices");
    setErr("");
    setMsg("");
  }

  function cancel() {
    setEditingId(null);
    setDraft(null);
  }

  function patchPrices(partial: Partial<Draft>) {
    if (!draft) return;
    setRecalcFrom("prices");
    setDraft(syncDraftFromPrices({ ...draft, ...partial }));
  }

  function patchProfit(partial: Partial<Draft>, source: "profit" | "closeProfit") {
    if (!draft) return;
    setRecalcFrom("profit");
    setDraft(syncDraftFromProfit({ ...draft, ...partial }, source));
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const openedAt = fromDatetimeLocalValue(draft.openedAt);
      const closedAt = fromDatetimeLocalValue(draft.closedAt);
      const notional = openingNotionalFromDraft(draft);
      const payload: Record<string, unknown> = {
        entity: "position",
        id: draft.id,
        symbol: draft.symbol.trim().toUpperCase(),
        chartSymbol: draft.chartSymbol.trim()
          ? draft.chartSymbol.trim().toUpperCase()
          : null,
        side: draft.side,
        volume: Number(draft.volume),
        openPrice: Number(draft.openPrice),
        currentPrice: Number(draft.currentPrice),
        profit: Number(draft.profit),
        status: draft.status,
        recalcFrom,
      };
      if (Number.isFinite(notional)) {
        // Server recomputes margin = notional/leverage; send amount hint via omitting margin
      }
      if (draft.margin !== "" && Number.isFinite(Number(draft.margin))) {
        // Prefer server auto-margin from open price; only send if user typed margin alone
      }
      if (draft.closePrice !== "") payload.closePrice = Number(draft.closePrice);
      if (draft.closeProfit !== "") payload.closeProfit = Number(draft.closeProfit);
      if (openedAt) payload.openedAt = openedAt;
      if (draft.status === "CLOSED") {
        if (closedAt) payload.closedAt = closedAt;
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
      setMsg("Saved");
      setEditingId(null);
      setDraft(null);
      onSaved?.();
    } catch {
      setErr("Connection error");
    } finally {
      setSaving(false);
    }
  }

  function displayAmount(p: Row, isEdit: boolean): string {
    if (isEdit && draft) {
      const n = openingNotionalFromDraft(draft);
      return Number.isFinite(n) ? fmtCrmMoney(n, 2) : "—";
    }
    const vol = Number(p.volume);
    const open = Number(p.openPrice);
    const sym = String(p.symbol ?? "");
    const cs = SYMBOLS.find((s) => s.symbol === sym.toUpperCase())?.contractSize ?? 1;
    if (![vol, open].every(Number.isFinite) || vol <= 0) return "—";
    return fmtCrmMoney(vol * cs * open, 2);
  }

  function displayChart(p: Row): string {
    const c = p.chartSymbol != null && String(p.chartSymbol).trim()
      ? String(p.chartSymbol)
      : String(p.symbol ?? "");
    return c || "—";
  }

  return (
    <div>
      {(err || msg) && (
        <p className={`mb-2 text-[11px] ${err ? "text-red-600" : "text-emerald-600"}`}>
          {err || msg}
        </p>
      )}
      {editingId && (
        <p className="mb-2 text-[11px] text-neutral-500">
          Live sync: edit <strong>Profit</strong> → adjusts open (or close if CLOSED); edit
          prices/volume/side → recalculates profit and{" "}
          <strong>Amount</strong> (lot×contract×open).{" "}
          <strong>Chart</strong> overrides which catalog symbol drives the terminal chart /
          live feed (leave blank = same as Symbol). Times are 24h (HH:mm:ss).
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <table className="w-full min-w-[1180px] text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              {[
                "Symbol",
                "Chart",
                "Side",
                "Volume",
                "Open",
                "Amount",
                "Current",
                "Close",
                "Profit",
                "Realized",
                "Status",
                "Opened",
                "Closed",
                "Trader",
                "Edit",
              ].map((h) => (
                <th key={h} className="whitespace-nowrap px-2 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const id = String(p.id);
              const isEdit = editingId === id && draft;
              const profitN = Number(isEdit ? draft!.profit : p.profit);
              const realizedN =
                isEdit && draft!.closeProfit !== ""
                  ? Number(draft!.closeProfit)
                  : p.closeProfit != null
                    ? Number(p.closeProfit)
                    : p.status === "CLOSED"
                      ? Number(p.profit)
                      : NaN;
              return (
                <tr
                  key={id}
                  className={`border-t border-[#e5e5e5] ${isEdit ? "bg-amber-50/70" : ""}`}
                >
                  <td className="px-2 py-1.5 font-medium">
                    {isEdit ? (
                      <input
                        className={inp}
                        value={draft!.symbol}
                        onChange={(e) => patchPrices({ symbol: e.target.value })}
                        title="Trade symbol (PnL / rates)"
                      />
                    ) : (
                      String(p.symbol)
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {isEdit ? (
                      <select
                        className={inp + " min-w-[6.5rem]"}
                        value={draft!.chartSymbol}
                        onChange={(e) =>
                          setDraft({ ...draft!, chartSymbol: e.target.value })
                        }
                        title="Chart / live price catalog symbol"
                      >
                        <option value="">(= Symbol)</option>
                        {CHART_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-neutral-600" title="Chart / feed symbol">
                        {displayChart(p)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {isEdit ? (
                      <select
                        className={inp}
                        value={draft!.side}
                        onChange={(e) => patchPrices({ side: e.target.value })}
                      >
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
                    ) : (
                      String(p.side)
                    )}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {isEdit ? (
                      <input
                        className={inp}
                        value={draft!.volume}
                        onChange={(e) => patchPrices({ volume: e.target.value })}
                      />
                    ) : (
                      fmtCrmMoney(p.volume, 2)
                    )}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {isEdit ? (
                      <input
                        className={inp}
                        value={draft!.openPrice}
                        onChange={(e) => patchPrices({ openPrice: e.target.value })}
                      />
                    ) : (
                      fmtCrmPrice(p.openPrice)
                    )}
                  </td>
                  <td
                    className="px-2 py-1.5 tabular-nums text-neutral-700"
                    title="Opening notional = lot × contract × open price"
                  >
                    {displayAmount(p, !!isEdit)}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {isEdit ? (
                      <input
                        className={inp}
                        value={draft!.currentPrice}
                        onChange={(e) => patchPrices({ currentPrice: e.target.value })}
                      />
                    ) : (
                      fmtCrmPrice(p.currentPrice)
                    )}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {isEdit ? (
                      <input
                        className={inp}
                        placeholder="—"
                        value={draft!.closePrice}
                        onChange={(e) => patchPrices({ closePrice: e.target.value })}
                      />
                    ) : p.closePrice != null ? (
                      fmtCrmPrice(p.closePrice)
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className={`px-2 py-1.5 tabular-nums ${
                      Number.isFinite(profitN) && profitN >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {isEdit ? (
                      <input
                        className={inp}
                        value={draft!.profit}
                        onChange={(e) => patchProfit({ profit: e.target.value }, "profit")}
                      />
                    ) : (
                      fmtCrmMoney(profitN, 2)
                    )}
                  </td>
                  <td
                    className={`px-2 py-1.5 tabular-nums ${
                      Number.isFinite(realizedN)
                        ? realizedN >= 0
                          ? "text-emerald-600"
                          : "text-red-500"
                        : "text-neutral-400"
                    }`}
                  >
                    {isEdit ? (
                      <input
                        className={inp}
                        placeholder="e.g. 102"
                        value={draft!.closeProfit}
                        onChange={(e) =>
                          patchProfit({ closeProfit: e.target.value }, "closeProfit")
                        }
                      />
                    ) : Number.isFinite(realizedN) ? (
                      fmtCrmMoney(realizedN, 2)
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {isEdit ? (
                      <select
                        className={inp}
                        value={draft!.status}
                        onChange={(e) => {
                          const status = e.target.value as "OPEN" | "CLOSED";
                          setRecalcFrom("prices");
                          setDraft(
                            syncDraftFromPrices({
                              ...draft!,
                              status,
                              closePrice:
                                status === "CLOSED" && draft!.closePrice === ""
                                  ? draft!.currentPrice
                                  : draft!.closePrice,
                            })
                          );
                        }}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    ) : (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          p.status === "OPEN"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {String(p.status)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-neutral-600">
                    {isEdit ? (
                      <input
                        type="datetime-local"
                        step={1}
                        className={inp + " min-w-[12.5rem]"}
                        value={draft!.openedAt}
                        onChange={(e) => setDraft({ ...draft!, openedAt: e.target.value })}
                      />
                    ) : (
                      fmtCrmDate(p.openedAt)
                    )}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-neutral-600">
                    {isEdit ? (
                      <input
                        type="datetime-local"
                        step={1}
                        className={inp + " min-w-[12.5rem]"}
                        value={draft!.closedAt}
                        onChange={(e) => setDraft({ ...draft!, closedAt: e.target.value })}
                        disabled={draft!.status !== "CLOSED"}
                      />
                    ) : (
                      fmtCrmDate(p.closedAt)
                    )}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-neutral-600">
                    {p.traderName != null
                      ? String(p.traderName)
                      : p.user && typeof p.user === "object" && p.user !== null && "name" in (p.user as object)
                        ? String((p.user as { name?: string }).name ?? "—")
                        : "—"}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {isEdit ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={save}
                          className="rounded bg-black px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={cancel}
                          className="rounded border border-neutral-300 px-2 py-1 text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="rounded border border-[#111111] bg-white px-2 py-1 text-[10px] font-semibold text-[#111111] hover:bg-neutral-50"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={15} className="px-3 py-8 text-center text-neutral-500">
                  No positions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
