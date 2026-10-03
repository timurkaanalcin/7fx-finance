"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useState } from "react";
import {
  fmtCrmDate,
  fmtCrmMoney,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/crm-format";

type Row = Record<string, unknown>;

type Draft = {
  id: string;
  symbol: string;
  side: string;
  type: string;
  volume: string;
  price: string;
  status: string;
  createdAt: string;
};

const inp =
  "w-full min-w-[4.5rem] rounded border border-[#111111] bg-white px-1.5 py-1 text-[11px] text-[#111111] tabular-nums";

export default function EditableOrdersTable({
  rows,
  onSaved,
}: {
  rows: Row[];
  onSaved?: () => void;
}) {
  const { i18n, code } = useCrmLabels();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function start(p: Row) {
    setEditingId(String(p.id));
    setDraft({
      id: String(p.id),
      symbol: String(p.symbol ?? ""),
      side: String(p.side ?? "BUY"),
      type: String(p.type ?? "MARKET"),
      volume: String(p.volume ?? ""),
      price: p.price != null ? String(p.price) : "",
      status: String(p.status ?? "PENDING"),
      createdAt: toDatetimeLocalValue(p.createdAt),
    });
    setErr("");
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const createdAt = fromDatetimeLocalValue(draft.createdAt);
      const payload: Record<string, unknown> = {
        entity: "order",
        id: draft.id,
        symbol: draft.symbol,
        side: draft.side,
        type: draft.type,
        volume: Number(draft.volume),
        status: draft.status,
      };
      if (draft.price !== "") payload.price = Number(draft.price);
      if (createdAt) payload.createdAt = createdAt;
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
      setEditingId(null);
      setDraft(null);
      onSaved?.();
    } catch {
      setErr(i18n("crm.ui.connectionError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {err && <p className="mb-2 text-[11px] text-red-600">{err}</p>}
      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <table className="w-full min-w-[720px] text-left text-[11px]">
          <thead className="bg-white text-neutral-500">
            <tr>
              {[i18n("crm.ui.symbol"), i18n("crm.ui.side"), i18n("crm.ui.type"), i18n("crm.ui.volume"), i18n("crm.ui.price"), i18n("crm.ui.status"), i18n("crm.ui.date"), i18n("crm.ui.edit")].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const id = String(o.id);
              const isEdit = editingId === id && draft;
              return (
                <tr key={id} className={`border-t border-[#e5e5e5] ${isEdit ? "bg-amber-50/70" : ""}`}>
                  <td className="px-2 py-1.5 font-medium">
                    {isEdit ? (
                      <input className={inp} value={draft!.symbol} onChange={(e) => setDraft({ ...draft!, symbol: e.target.value })} />
                    ) : (
                      String(o.symbol)
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {isEdit ? (
                      <select className={inp} value={draft!.side} onChange={(e) => setDraft({ ...draft!, side: e.target.value })}>
                        <option value="BUY">{code("crm.kind", "BUY")}</option>
                        <option value="SELL">{code("crm.kind", "SELL")}</option>
                      </select>
                    ) : (
                      code("crm.kind", String(o.side))
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {isEdit ? (
                      <select className={inp} value={draft!.type} onChange={(e) => setDraft({ ...draft!, type: e.target.value })}>
                        <option value="MARKET">{code("crm.kind", "MARKET")}</option>
                        <option value="LIMIT">{code("crm.kind", "LIMIT")}</option>
                        <option value="STOP">{code("crm.kind", "STOP")}</option>
                      </select>
                    ) : (
                      code("crm.kind", String(o.type))
                    )}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {isEdit ? (
                      <input className={inp} value={draft!.volume} onChange={(e) => setDraft({ ...draft!, volume: e.target.value })} />
                    ) : (
                      fmtCrmMoney(o.volume, 2)
                    )}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {isEdit ? (
                      <input className={inp} value={draft!.price} onChange={(e) => setDraft({ ...draft!, price: e.target.value })} />
                    ) : o.price != null ? (
                      fmtCrmMoney(o.price, 5)
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {isEdit ? (
                      <select className={inp} value={draft!.status} onChange={(e) => setDraft({ ...draft!, status: e.target.value })}>
                        {["PENDING", "FILLED", "CANCELLED", "REJECTED"].map((s) => (
                          <option key={s} value={s}>
                            {code("crm.status", s)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      code("crm.status", String(o.status))
                    )}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-neutral-600">
                    {isEdit ? (
                      <input
                        type="datetime-local"
                        step={1}
                        className={inp + " min-w-[11rem]"}
                        value={draft!.createdAt}
                        onChange={(e) => setDraft({ ...draft!, createdAt: e.target.value })}
                      />
                    ) : (
                      fmtCrmDate(o.createdAt)
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {isEdit ? (
                      <div className="flex gap-1">
                        <button type="button" disabled={saving} onClick={save} className="rounded bg-black px-2 py-1 text-[10px] font-semibold text-white">
                          {i18n("crm.ui.save")}
                        </button>
                        <button type="button" onClick={() => { setEditingId(null); setDraft(null); }} className="rounded border border-neutral-300 px-2 py-1 text-[10px]">
                          {i18n("crm.ui.cancel")}
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => start(o)} className="rounded border border-[#111111] px-2 py-1 text-[10px] font-semibold">
                        {i18n("crm.ui.edit")}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  {i18n("crm.ui.noOrders")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
