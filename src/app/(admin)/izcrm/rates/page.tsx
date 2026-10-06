"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useCallback, useEffect, useState } from "react";

type Global = {
  spreadMultiplier: number;
  commissionPerLot: number;
  defaultLeverage: number;
  marginCallThresholdPct: number;
  defaultMinVolume: number;
  defaultMaxVolume: number;
  defaultContractMult: number;
};

type Effective = {
  symbol: string;
  enabled: boolean;
  spread: number;
  contractSize: number;
  minVolume: number;
  maxVolume: number;
  commissionPerLot: number;
};

export default function AdminRatesPage() {
  const { i18n } = useCrmLabels();
  const [global, setGlobal] = useState<Global | null>(null);
  const [effective, setEffective] = useState<Effective[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [editSym, setEditSym] = useState<string | null>(null);
  const [symForm, setSymForm] = useState({
    spreadAbs: "",
    spreadMultiplier: "",
    contractMultiplier: "",
    minVolume: "",
    maxVolume: "",
    commissionPerLot: "",
    enabled: true,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/rates");
    if (!res.ok) return;
    const data = await res.json();
    setGlobal(data.global);
    setEffective(data.effective || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveGlobal() {
    if (!global) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ global }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(i18n("crm.rates.saved"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveSymbol() {
    if (!editSym) return;
    setBusy(true);
    setMsg("");
    try {
      const payload: Record<string, unknown> = { symbol: editSym, enabled: symForm.enabled };
      for (const [k, v] of Object.entries(symForm)) {
        if (k === "enabled") continue;
        payload[k] = v === "" ? null : Number(v);
      }
      const res = await fetch("/api/admin/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(`${editSym} — ${i18n("crm.methods.updated")}`);
      setEditSym(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(sym: string) {
    const row = effective.find((e) => e.symbol === sym);
    setEditSym(sym);
    setSymForm({
      spreadAbs: "",
      spreadMultiplier: "",
      contractMultiplier: "",
      minVolume: row ? String(row.minVolume) : "",
      maxVolume: row ? String(row.maxVolume) : "",
      commissionPerLot: row ? String(row.commissionPerLot) : "",
      enabled: row?.enabled ?? true,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{i18n("crm.rates.title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Spread, commission, contract multiplier and volume limits — applied instantly to the order ticket, margin and P/L.
        </p>
      </div>
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}

      {global && (
        <section className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-4">
          <h2 className="mb-3 text-sm font-semibold">{i18n("crm.rates.globals")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["spreadMultiplier", i18n("crm.rates.spreadMult")],
                ["commissionPerLot", i18n("crm.rates.commLot")],
                ["defaultLeverage", i18n("crm.rates.leverage")],
                ["marginCallThresholdPct", i18n("crm.rates.marginCall")],
                ["defaultMinVolume", i18n("crm.rates.minVol")],
                ["defaultMaxVolume", i18n("crm.rates.maxVol")],
                ["defaultContractMult", i18n("crm.rates.contractMult")],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-[11px] text-neutral-500">
                {label}
                <input
                  type="number"
                  step="any"
                  value={global[key]}
                  onChange={(e) => setGlobal({ ...global, [key]: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-[#111111] bg-white px-2 py-1.5 text-sm text-[#111111] tabular-nums"
                />
              </label>
            ))}
          </div>
          <button
            disabled={busy}
            onClick={saveGlobal}
            className="mt-4 rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {i18n("crm.rates.globalSave")}
          </button>
        </section>
      )}

      <section className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-4">
        <h2 className="mb-3 text-sm font-semibold">{i18n("crm.rates.symbols")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-neutral-500">
              <tr>
                <th className="px-2 py-2">{i18n("crm.ui.symbol")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.status")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.spread")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.contract")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.minMax")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.commission")}</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {effective.map((e) => (
                <tr key={e.symbol} className="border-t border-[#e5e5e5]">
                  <td className="px-2 py-2 font-medium">{e.symbol}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        e.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {e.enabled ? i18n("crm.ui.open") : i18n("crm.ui.closed")}
                    </span>
                  </td>
                  <td className="px-2 py-2 tabular-nums">{e.spread}</td>
                  <td className="px-2 py-2 tabular-nums">{e.contractSize}</td>
                  <td className="px-2 py-2 tabular-nums">
                    {e.minVolume} / {e.maxVolume}
                  </td>
                  <td className="px-2 py-2 tabular-nums">{e.commissionPerLot}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => startEdit(e.symbol)}
                      className="rounded bg-[#e5e5e5] px-2 py-1 hover:bg-[#f0f0f0]"
                    >
                      {i18n("crm.ui.edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editSym && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-4">
            <h3 className="mb-3 text-sm font-semibold">{editSym} — {i18n("crm.rates.override")}</h3>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["spreadAbs", i18n("crm.rates.spreadAbs")],
                  ["spreadMultiplier", i18n("crm.rates.spreadMult")],
                  ["contractMultiplier", i18n("crm.rates.contractMult")],
                  ["minVolume", i18n("crm.rates.minVol")],
                  ["maxVolume", i18n("crm.rates.maxVol")],
                  ["commissionPerLot", i18n("crm.rates.commLot")],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="text-[11px] text-neutral-500">
                  {label}
                  <input
                    value={symForm[k]}
                    onChange={(e) => setSymForm({ ...symForm, [k]: e.target.value })}
                    placeholder={i18n("crm.ui.emptyGlobal")}
                    className="mt-1 w-full rounded border border-[#111111] bg-white px-2 py-1.5 text-sm text-[#111111] text-sm"
                  />
                </label>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={symForm.enabled}
                onChange={(e) => setSymForm({ ...symForm, enabled: e.target.checked })}
              />
              {i18n("crm.rates.tradable")}
            </label>
            <div className="mt-4 flex gap-2">
              <button onClick={saveSymbol} disabled={busy} className="rounded bg-black text-white px-3 py-1.5 text-sm">
                {i18n("crm.ui.save")}
              </button>
              <button onClick={() => setEditSym(null)} className="rounded bg-[#e5e5e5] px-3 py-1.5 text-sm">
                {i18n("crm.ui.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
