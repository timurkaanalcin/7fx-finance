"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ListPlaceholder, listPhase } from "@/components/crm/CrmStates";
import { StatusBadge } from "@/components/crm/StubPage";
import { ConfirmDialog, CrmFormGrid, type CrmColumn } from "@/components/crm/CrmRecordTable";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { crmJson } from "@/lib/crm-api";

type Asset = {
  symbol: string;
  name: string;
  class: string;
  flag: string | null;
  digits: number;
  pipSize: number;
  contractSize: number;
  baseSpread: number;
  basePrice: number;
  yahoo: string;
  custom: boolean;
  builtin: boolean;
  enabled: boolean;
  effectiveSpread: number;
  effectiveContract: number;
  minVolume: number;
  maxVolume: number;
  volumeStep: number | null;
  commissionPerLot: number;
  openPositions: number;
  pendingOrders: number;
};
type Draft = Record<string, string>;

const CLASSES = ["STOCK", "FX", "CRYPTO", "INDEX", "COMMODITY"];
const ctl = "rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs";

/** Full-precision number → string without exponent noise. */
function numStr(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return String(Number(n.toPrecision(12)));
}

function assetDraft(a: Asset): Draft {
  return {
    symbol: a.symbol,
    name: a.name,
    class: a.class,
    flag: a.flag || "",
    digits: String(a.digits),
    pipSize: numStr(a.pipSize),
    spread: numStr(a.effectiveSpread),
    contractSize: numStr(a.effectiveContract),
    minVolume: numStr(a.minVolume),
    maxVolume: numStr(a.maxVolume),
    volumeStep: numStr(a.volumeStep),
    commissionPerLot: numStr(a.commissionPerLot),
    yahoo: a.yahoo,
    basePrice: numStr(a.basePrice),
    enabled: a.enabled ? "true" : "false",
  };
}

/** Only changed fields → API body (symbol rename via newSymbol). */
function diffBody(d: Draft, orig: Draft): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(d)) {
    if (d[k] === orig[k]) continue;
    if (k === "symbol") out.newSymbol = d.symbol.trim().toUpperCase();
    else if (k === "enabled") out.enabled = d.enabled === "true";
    else out[k] = d[k].trim();
  }
  return out;
}

export default function AssetsPage() {
  const { i18n } = useCrmLabels();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [deletedBuiltins, setDeletedBuiltins] = useState<{ symbol: string; name: string }[]>([]);
  const [counts, setCounts] = useState<{ total: number; enabled: number; byClass: Record<string, number> } | null>(null);
  const [cls, setCls] = useState("");
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editSym, setEditSym] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [orig, setOrig] = useState<Draft>({});
  const [editErr, setEditErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>({});
  const [newErr, setNewErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/assets");
      if (!r.ok) {
        setFailed(true);
        return;
      }
      const d = await r.json();
      setAssets(d.assets || []);
      setCounts(d.counts || null);
      setDeletedBuiltins(d.deletedBuiltins || []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return assets.filter((a) => {
      if (cls && a.class !== cls) return false;
      if (state === "on" && !a.enabled) return false;
      if (state === "off" && a.enabled) return false;
      if (state === "custom" && !a.custom) return false;
      if (!s) return true;
      return (
        a.symbol.toLowerCase().includes(s) || a.name.toLowerCase().includes(s) || a.yahoo.toLowerCase().includes(s)
      );
    });
  }, [assets, cls, q, state]);

  const classLabel = (c: string) => i18n(`crm.assetClass.${c}`, c);
  const ph = i18n("crm.assets.defaultPh");

  const columns: CrmColumn[] = [
    { key: "symbol", label: "crm.ui.symbol", required: true },
    { key: "name", label: "crm.ui.name", required: true },
    {
      key: "class",
      label: "crm.ui.class",
      type: "select",
      required: true,
      options: CLASSES.map((c) => ({ value: c, label: classLabel(c) })),
    },
    { key: "flag", label: "crm.assets.flag" },
    { key: "spread", label: "crm.ui.spread", type: "number", placeholder: ph },
    { key: "contractSize", label: "crm.ui.contract", type: "number", placeholder: ph },
    { key: "minVolume", label: "crm.assets.minVolume", type: "number", placeholder: ph },
    { key: "maxVolume", label: "crm.assets.maxVolume", type: "number", placeholder: ph },
    { key: "volumeStep", label: "crm.assets.volumeStep", type: "number", placeholder: "—" },
    { key: "commissionPerLot", label: "crm.ui.commission", type: "number", placeholder: ph },
    { key: "digits", label: "crm.assets.digits", type: "number", placeholder: ph },
    { key: "pipSize", label: "crm.assets.pipSize", type: "number", placeholder: ph },
    { key: "yahoo", label: "crm.assets.source", placeholder: "AAPL / EURUSD=X / BTC-USD" },
    { key: "basePrice", label: "crm.assets.basePrice", type: "number", placeholder: ph },
    { key: "enabled", label: "crm.assets.enabled", type: "checkbox" },
  ];

  function startEdit(a: Asset) {
    const d = assetDraft(a);
    setEditSym(a.symbol);
    setDraft(d);
    setOrig(d);
    setEditErr("");
    setMsg("");
    setErr("");
  }

  async function saveEdit(a: Asset) {
    const body = diffBody(draft, orig);
    if (!Object.keys(body).length) {
      setEditSym(null);
      return;
    }
    if (!draft.name.trim() || !draft.symbol.trim()) {
      setEditErr(`${i18n("crm.ui.name")}: ${i18n("crm.edit.required")}`);
      return;
    }
    setBusy(true);
    setEditErr("");
    try {
      const r = await crmJson("/api/admin/assets", "PATCH", { symbol: a.symbol, ...body });
      if (!r.ok) {
        setEditErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setEditSym(null);
      setMsg(i18n("crm.ui.saved"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openAdd() {
    setAdding(true);
    setNewErr("");
    setNewDraft({
      symbol: "",
      name: "",
      class: "STOCK",
      flag: "",
      spread: "",
      contractSize: "",
      minVolume: "",
      maxVolume: "",
      volumeStep: "",
      commissionPerLot: "",
      digits: "",
      pipSize: "",
      yahoo: "",
      basePrice: "",
      enabled: "true",
    });
  }

  async function saveNew() {
    if (!newDraft.symbol.trim() || !newDraft.name.trim()) {
      setNewErr(`${i18n("crm.ui.symbol")} / ${i18n("crm.ui.name")}: ${i18n("crm.edit.required")}`);
      return;
    }
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(newDraft)) {
      if (k === "enabled") body.enabled = v === "true";
      else if (v.trim() !== "") body[k] = k === "symbol" ? v.trim().toUpperCase() : v.trim();
    }
    setBusy(true);
    setNewErr("");
    try {
      const r = await crmJson("/api/admin/assets", "POST", body);
      if (!r.ok) {
        setNewErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setAdding(false);
      setMsg(i18n("crm.edit.created"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function restore(symbol: string) {
    setBusy(true);
    setErr("");
    try {
      const r = await crmJson("/api/admin/assets", "POST", { symbol });
      if (!r.ok) setErr(r.error || i18n("crm.ui.saveFailed"));
      else {
        setMsg(i18n("crm.ui.saved"));
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    const a = deleteTarget;
    if (!a) return;
    setBusy(true);
    setErr("");
    try {
      const r = await crmJson("/api/admin/assets", "DELETE", { symbol: a.symbol });
      if (!r.ok) setErr(r.error || i18n("crm.ui.saveFailed"));
      else {
        setMsg(i18n("crm.edit.deleted"));
        await load();
      }
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{i18n("crm.nav.assets")}</h1>
          <p className="text-[11px] text-neutral-500">
            {i18n("crm.assets.title")} —{" "}
            <Link href="/izcrm/rates" className="text-sky-700 hover:underline">
              {i18n("crm.nav.rates")}
            </Link>
          </p>
        </div>
        {counts && (
          <div className="flex gap-3 text-[11px] text-neutral-500">
            <span>
              {counts.total} {i18n("crm.ui.symbol")}
            </span>
            <span className="text-emerald-600">
              {counts.enabled} {i18n("crm.ui.active")}
            </span>
          </div>
        )}
      </div>
      <p className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
        {i18n("crm.assets.liveHint")} {i18n("crm.assets.renameHint")}
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={i18n("crm.assets.search")}
          className={ctl + " w-60"}
        />
        <select value={cls} onChange={(e) => setCls(e.target.value)} className={ctl}>
          <option value="">{i18n("crm.ui.allClasses")}</option>
          {CLASSES.map((c) => (
            <option key={c} value={c}>
              {classLabel(c)}
              {counts?.byClass?.[c] != null ? ` (${counts.byClass[c]})` : ""}
            </option>
          ))}
        </select>
        <select value={state} onChange={(e) => setState(e.target.value)} className={ctl}>
          <option value="">{i18n("crm.ui.allStatuses")}</option>
          <option value="on">{i18n("crm.ui.active")}</option>
          <option value="off">{i18n("crm.ui.inactive")}</option>
          <option value="custom">{i18n("crm.assets.custom")}</option>
        </select>
        <button
          type="button"
          onClick={openAdd}
          className="rounded border border-[#111111] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#111111] hover:bg-neutral-50"
        >
          + {i18n("crm.assets.new")}
        </button>
        <span className="text-[11px] text-neutral-500">
          {filtered.length} / {assets.length}
        </span>
      </div>

      {adding && (
        <div className="mb-3 rounded-xl border border-[#e5e5e5] bg-white p-3">
          <div className="mb-2 text-xs font-semibold">{i18n("crm.assets.new")}</div>
          <CrmFormGrid columns={columns} draft={newDraft} setDraft={setNewDraft} />
          {newErr && <p className="mt-2 text-[11px] text-red-600">{newErr}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={saveNew}
              className="rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              {i18n("crm.ui.save")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setAdding(false)}
              className="rounded border border-neutral-300 px-3 py-1.5 text-[11px]"
            >
              {i18n("crm.ui.cancel")}
            </button>
          </div>
        </div>
      )}

      {msg && <p className="mb-2 text-xs text-emerald-700">{msg}</p>}
      {err && <p className="mb-2 text-xs text-red-600">{err}</p>}

      {failed && (
        <div className="mb-3 rounded-xl border border-black/10 bg-white px-4 py-6 text-center">
          <ListPlaceholder
            phase="error"
            empty={i18n("crm.ui.noRecords")}
            title={i18n("crm.ui.loadFailed")}
            retry={i18n("crm.ui.tryAgain")}
            loading={i18n("crm.ui.loading")}
            onRetry={() => void load()}
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] bg-white">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-white text-neutral-500">
            <tr>
              <th className="px-2 py-2">{i18n("crm.ui.symbol")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.name")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.class")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.spread")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.contract")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.volume")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.commission")}</th>
              <th className="px-2 py-2">{i18n("crm.assets.source")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.status")}</th>
              <th className="px-2 py-2">{i18n("crm.edit.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const isEdit = editSym === a.symbol;
              const inUse = a.openPositions + a.pendingOrders > 0;
              return (
                <Fragment key={a.symbol}>
                  <tr className={`border-t border-[#e5e5e5] ${isEdit ? "bg-amber-50/70" : ""}`}>
                    <td className="whitespace-nowrap px-2 py-1.5 font-medium">
                      {a.flag ? `${a.flag} ` : ""}
                      {a.symbol}
                      {a.custom && (
                        <span className="ml-1 rounded bg-sky-50 px-1 text-[9px] font-semibold text-sky-700">
                          {i18n("crm.assets.custom")}
                        </span>
                      )}
                      {inUse && (
                        <div className="text-[9px] font-normal text-amber-700">
                          {a.openPositions} {i18n("crm.assets.openPos")}
                          {a.pendingOrders ? ` · ${a.pendingOrders} ${i18n("crm.assets.pendingOrders")}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-neutral-600">{a.name}</td>
                    <td className="px-2 py-1.5">{classLabel(a.class)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{numStr(a.effectiveSpread)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{numStr(a.effectiveContract)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-neutral-600">
                      {numStr(a.minVolume)}–{numStr(a.maxVolume)}
                      {a.volumeStep ? <span className="text-neutral-400"> / {numStr(a.volumeStep)}</span> : null}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">{numStr(a.commissionPerLot)}</td>
                    <td className="px-2 py-1.5 font-mono text-[10px] text-neutral-500">{a.yahoo}</td>
                    <td className="px-2 py-1.5">
                      <StatusBadge status={a.enabled ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5">
                      {isEdit ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => saveEdit(a)}
                            className="rounded bg-black px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                          >
                            {i18n("crm.ui.save")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setEditSym(null)}
                            className="rounded border border-neutral-300 px-2 py-1 text-[10px]"
                          >
                            {i18n("crm.ui.cancel")}
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(a)}
                            className="rounded border border-[#111111] bg-white px-2 py-1 text-[10px] font-semibold text-[#111111] hover:bg-neutral-50"
                          >
                            {i18n("crm.ui.edit")}
                          </button>
                          <button
                            type="button"
                            disabled={inUse}
                            title={inUse ? i18n("crm.assets.deleteBlocked") : undefined}
                            onClick={() => setDeleteTarget(a)}
                            className="rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {i18n("crm.ui.delete")}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {isEdit && (
                    <tr className="border-t border-amber-100 bg-amber-50/70">
                      <td colSpan={10} className="px-3 py-3">
                        <CrmFormGrid columns={columns} draft={draft} setDraft={setDraft} />
                        {editErr && <p className="mt-2 text-[11px] text-red-600">{editErr}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => saveEdit(a)}
                            className="rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                          >
                            {i18n("crm.ui.save")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setEditSym(null)}
                            className="rounded border border-neutral-300 px-3 py-1.5 text-[11px]"
                          >
                            {i18n("crm.ui.cancel")}
                          </button>
                          <span className="text-[10px] text-neutral-500">{i18n("crm.assets.emptyDefaultHint")}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && !failed && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-neutral-500">
                  <ListPlaceholder
                    phase={listPhase(false, loading && assets.length === 0)}
                    empty={i18n("crm.ui.noRecords")}
                    title={i18n("crm.ui.loadFailed")}
                    retry={i18n("crm.ui.tryAgain")}
                    loading={i18n("crm.ui.loading")}
                    onRetry={() => void load()}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deletedBuiltins.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#e5e5e5] bg-white p-3 text-[11px]">
          <div className="mb-2 font-semibold">{i18n("crm.assets.deletedBuiltins")}</div>
          <div className="flex flex-wrap gap-2">
            {deletedBuiltins.map((d) => (
              <span key={d.symbol} className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1">
                <b>{d.symbol}</b> <span className="text-neutral-500">{d.name}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => restore(d.symbol)}
                  className="ml-1 rounded border border-[#111111] px-1.5 text-[10px] font-semibold hover:bg-neutral-50"
                >
                  {i18n("crm.assets.restore")}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title={i18n("crm.edit.confirmTitle")}
        message={`${deleteTarget?.symbol ?? ""} — ${i18n("crm.assets.confirmDelete")}`}
        confirmLabel={i18n("crm.edit.yesDelete")}
        danger
        busy={busy}
        onConfirm={() => confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
