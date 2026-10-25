"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

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
import { ConfirmDialog } from "@/components/crm/CrmRecordTable";

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
  /** Trader-detail mode: delete rows + explicit "Bakiyeye yansıt" option on save/delete */
  manage?: boolean;
};

export default function EditablePositionsTable({ rows, onSaved, manage }: Props) {
  const { i18n, code } = useCrmLabels();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [recalcFrom, setRecalcFrom] = useState<RecalcFrom>("prices");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [sltp, setSltp] = useState({ stopLoss: "", takeProfit: "" });
  const [apply, setApply] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function doDelete(applyToBalance: boolean) {
    if (!deleteId) return;
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/positions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "position", id: deleteId, applyToBalance }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(i18n("crm.edit.deleted"));
      onSaved?.();
    } catch {
      setErr(i18n("crm.ui.connectionError"));
    } finally {
      setSaving(false);
      setDeleteId(null);
    }
  }

  function startEdit(p: Row) {
    setEditingId(String(p.id));
    setApply(false);
    setSltp({
      stopLoss: p.stopLoss != null ? String(p.stopLoss) : "",
      takeProfit: p.takeProfit != null ? String(p.takeProfit) : "",
    });
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
        stopLoss: sltp.stopLoss.trim() === "" ? null : Number(sltp.stopLoss),
        takeProfit: sltp.takeProfit.trim() === "" ? null : Number(sltp.takeProfit),
      };
      if (manage && apply) payload.applyToBalance = true;
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
        setErr(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(i18n("crm.ui.saved"));
      setEditingId(null);
      setDraft(null);
      onSaved?.();
    } catch {
      setErr(i18n("crm.ui.connectionError"));
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
        <p className="mb-2 text-[11px] text-neutral-500">{i18n("crm.pos.syncHint")}</p>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <table className="w-full min-w-[1180px] text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              {[
                ["symbol", "crm.ui.symbol"],
                ["chart", "crm.ui.chart"],
                ["side", "crm.ui.side"],
                ["volume", "crm.ui.volume"],
                ["open", "crm.ui.open"],
                ["amount", "crm.ui.amount"],
                ["current", "crm.ui.current"],
                ["close", "crm.ui.closePrice"],
                ["profit", "crm.ui.profit"],
                ["realized", "crm.ui.realized"],
                ["status", "crm.ui.status"],
                ["sl", "crm.edit.stopLoss"],
                ["tp", "crm.edit.takeProfit"],
                ["opened", "crm.ui.opened"],
                ["closed", "crm.ui.closedAt"],
                ["trader", "crm.ui.trader"],
                ["edit", "crm.ui.edit"],
              ].map(([key, label]) => (
                <th key={key} className="whitespace-nowrap px-2 py-2 font-semibold">
                  {i18n(label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const id = String(p.id);
              const editing = editingId === id && draft ? draft : null;
              const isEdit = editing !== null;
              const profitN = Number(editing ? editing.profit : p.profit);
              const realizedN =
                editing && editing.closeProfit !== ""
                  ? Number(editing.closeProfit)
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
                    {editing ? (
                      <input
                        className={inp}
                        value={editing.symbol}
                        onChange={(e) => patchPrices({ symbol: e.target.value })}
                        title={i18n("crm.ui.tradeSymbol")}
                      />
                    ) : (
                      String(p.symbol)
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {editing ? (
                      <select
                        className={inp + " min-w-[6.5rem]"}
                        value={editing.chartSymbol}
                        onChange={(e) =>
                          setDraft({ ...editing, chartSymbol: e.target.value })
                        }
                        title={i18n("crm.ui.chartHint")}
                      >
                        <option value="">{i18n("crm.ui.sameAsSymbol")}</option>
                        {CHART_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-neutral-600" title={i18n("crm.ui.chartCol")}>
                        {displayChart(p)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {editing ? (
                      <select
                        className={inp}
                        value={editing.side}
                        onChange={(e) => patchPrices({ side: e.target.value })}
                      >
                        <option value="BUY">{code("crm.kind", "BUY")}</option>
                        <option value="SELL">{code("crm.kind", "SELL")}</option>
                      </select>
                    ) : (
                      code("crm.kind", String(p.side))
                    )}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {editing ? (
                      <input
                        className={inp}
                        value={editing.volume}
                        onChange={(e) => patchPrices({ volume: e.target.value })}
                      />
                    ) : (
                      fmtCrmMoney(p.volume, 2)
                    )}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {editing ? (
                      <input
                        className={inp}
                        value={editing.openPrice}
                        onChange={(e) => patchPrices({ openPrice: e.target.value })}
                      />
                    ) : (
                      fmtCrmPrice(p.openPrice)
                    )}
                  </td>
                  <td
                    className="px-2 py-1.5 tabular-nums text-neutral-700"
                    title={i18n("crm.ui.amountHint")}
                  >
                    {displayAmount(p, !!isEdit)}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {editing ? (
                      <input
                        className={inp}
                        value={editing.currentPrice}
                        onChange={(e) => patchPrices({ currentPrice: e.target.value })}
                      />
                    ) : (
                      fmtCrmPrice(p.currentPrice)
                    )}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {editing ? (
                      <input
                        className={inp}
                        placeholder="—"
                        value={editing.closePrice}
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
                    {editing ? (
                      <input
                        className={inp}
                        value={editing.profit}
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
                    {editing ? (
                      <input
                        className={inp}
                        placeholder={i18n("crm.ui.exampleProfit")}
                        value={editing.closeProfit}
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
                    {editing ? (
                      <select
                        className={inp}
                        value={editing.status}
                        onChange={(e) => {
                          const status = e.target.value as "OPEN" | "CLOSED";
                          setRecalcFrom("prices");
                          setDraft(
                            syncDraftFromPrices({
                              ...editing,
                              status,
                              closePrice:
                                status === "CLOSED" && editing.closePrice === ""
                                  ? editing.currentPrice
                                  : editing.closePrice,
                            })
                          );
                        }}
                      >
                        <option value="OPEN">{code("crm.status", "OPEN")}</option>
                        <option value="CLOSED">{code("crm.status", "CLOSED")}</option>
                      </select>
                    ) : (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          p.status === "OPEN"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {code("crm.status", String(p.status))}
                      </span>
                    )}
                  </td>
                  {(["stopLoss", "takeProfit"] as const).map((k) => (
                    <td key={k} className="px-2 py-1.5 tabular-nums">
                      {editing ? (
                        <input
                          className={inp}
                          placeholder="—"
                          value={sltp[k]}
                          onChange={(e) => setSltp({ ...sltp, [k]: e.target.value })}
                        />
                      ) : p[k] != null ? (
                        fmtCrmPrice(p[k])
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 whitespace-nowrap text-neutral-600">
                    {editing ? (
                      <input
                        type="datetime-local"
                        step={1}
                        className={inp + " min-w-[12.5rem]"}
                        value={editing.openedAt}
                        onChange={(e) => setDraft({ ...editing, openedAt: e.target.value })}
                      />
                    ) : (
                      fmtCrmDate(p.openedAt)
                    )}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-neutral-600">
                    {editing ? (
                      <input
                        type="datetime-local"
                        step={1}
                        className={inp + " min-w-[12.5rem]"}
                        value={editing.closedAt}
                        onChange={(e) => setDraft({ ...editing, closedAt: e.target.value })}
                        disabled={editing.status !== "CLOSED"}
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
                    {editing ? (
                      <div className="flex flex-col gap-1">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={save}
                          className="rounded bg-black px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                        >
                          {i18n("crm.ui.save")}
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={cancel}
                          className="rounded border border-neutral-300 px-2 py-1 text-[10px]"
                        >
                          {i18n("crm.ui.cancel")}
                        </button>
                      </div>
                      {manage && (
                        <label
                          className="flex items-center gap-1 text-[10px] text-amber-800"
                          title={i18n("crm.edit.reflectPosHint")}
                        >
                          <input type="checkbox" checked={apply} onChange={(e) => setApply(e.target.checked)} />
                          {i18n("crm.edit.reflect")}
                        </label>
                      )}
                      </div>
                    ) : (
                      <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="rounded border border-[#111111] bg-white px-2 py-1 text-[10px] font-semibold text-[#111111] hover:bg-neutral-50"
                      >
                        {i18n("crm.ui.edit")}
                      </button>
                      {manage && (
                        <button
                          type="button"
                          onClick={() => setDeleteId(id)}
                          className="rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                        >
                          {i18n("crm.ui.delete")}
                        </button>
                      )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={17} className="px-3 py-8 text-center text-neutral-500">
                  {i18n("crm.ui.noPositions")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={deleteId != null}
        title={i18n("crm.edit.confirmTitle")}
        message={i18n("crm.edit.confirmDeletePosition")}
        confirmLabel={i18n("crm.edit.yesDelete")}
        danger
        balanceAware={manage}
        busy={saving}
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
