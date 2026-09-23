"use client";

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
        setMsg(data.error || "Kayıt başarısız");
        return;
      }
      setMsg("Global oranlar kaydedildi — canlıya uygulandı");
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
        setMsg(data.error || "Kayıt başarısız");
        return;
      }
      setMsg(`${editSym} güncellendi`);
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
        <h1 className="text-xl font-semibold">İşlem Oranları / Sembol Ayarları</h1>
        <p className="mt-1 text-sm text-slate-500">
          Spread, komisyon, sözleşme çarpanı ve hacim limitleri — emir bileti, marj ve K/Z hesabına anında yansır.
        </p>
      </div>
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}

      {global && (
        <section className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
          <h2 className="mb-3 text-sm font-semibold">Global Varsayılanlar</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["spreadMultiplier", "Spread çarpanı"],
                ["commissionPerLot", "Komisyon / lot (USD)"],
                ["defaultLeverage", "Varsayılan kaldıraç (dahili)"],
                ["marginCallThresholdPct", "Marjin çağrısı eşiği %"],
                ["defaultMinVolume", "Min hacim"],
                ["defaultMaxVolume", "Max hacim"],
                ["defaultContractMult", "Sözleşme çarpanı"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-[11px] text-slate-400">
                {label}
                <input
                  type="number"
                  step="any"
                  value={global[key]}
                  onChange={(e) => setGlobal({ ...global, [key]: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-[#1e293b] bg-[#0b1220] px-2 py-1.5 text-sm text-white tabular-nums"
                />
              </label>
            ))}
          </div>
          <button
            disabled={busy}
            onClick={saveGlobal}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            Global Kaydet
          </button>
        </section>
      )}

      <section className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
        <h2 className="mb-3 text-sm font-semibold">Sembol Oranları (efektif)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="px-2 py-2">Sembol</th>
                <th className="px-2 py-2">Durum</th>
                <th className="px-2 py-2">Spread</th>
                <th className="px-2 py-2">Kontrat</th>
                <th className="px-2 py-2">Min/Max</th>
                <th className="px-2 py-2">Komisyon</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {effective.map((e) => (
                <tr key={e.symbol} className="border-t border-[#1e293b]">
                  <td className="px-2 py-2 font-medium">{e.symbol}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        e.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {e.enabled ? "Açık" : "Kapalı"}
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
                      className="rounded bg-[#1e293b] px-2 py-1 hover:bg-[#334155]"
                    >
                      Düzenle
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
          <div className="w-full max-w-md rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
            <h3 className="mb-3 text-sm font-semibold">{editSym} — sembol override</h3>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["spreadAbs", "Spread (mutlak)"],
                  ["spreadMultiplier", "Spread çarpanı"],
                  ["contractMultiplier", "Kontrat çarpanı"],
                  ["minVolume", "Min hacim"],
                  ["maxVolume", "Max hacim"],
                  ["commissionPerLot", "Komisyon/lot"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="text-[11px] text-slate-400">
                  {label}
                  <input
                    value={symForm[k]}
                    onChange={(e) => setSymForm({ ...symForm, [k]: e.target.value })}
                    placeholder="boş = global"
                    className="mt-1 w-full rounded border border-[#1e293b] bg-[#0b1220] px-2 py-1.5 text-sm"
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
              İşleme açık
            </label>
            <div className="mt-4 flex gap-2">
              <button onClick={saveSymbol} disabled={busy} className="rounded bg-blue-600 px-3 py-1.5 text-sm">
                Kaydet
              </button>
              <button onClick={() => setEditSym(null)} className="rounded bg-[#1e293b] px-3 py-1.5 text-sm">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
