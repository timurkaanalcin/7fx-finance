"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListPlaceholder } from "@/components/crm/CrmStates";
import CrmRecordTable from "@/components/crm/crm-record-lazy";
import type { CrmColumn } from "@/components/crm/CrmRecordTable";
import ClientPicker from "@/components/crm/ClientPicker";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { fmtCrmMoney } from "@/lib/crm-format";
import { ACCOUNT_CURRENCIES } from "@/lib/membership";
import { crmJson, dayEndIso, dayStartIso } from "@/lib/crm-api";
import { CRM_LIST_PAGE } from "@/lib/trader-list";

type Row = Record<string, unknown>;
type Result = { ok: boolean; error?: string };

const LEDGER_TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "ADJUSTMENT",
  "BONUS",
  "CREDIT",
  "TRADE_PNL",
  "MARGIN_ADD",
  "RESET",
  "FINANCE_SET",
  "CURRENCY_CHANGE",
];

const ctl = "rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Global balance ledger. Writes reuse /api/admin/users/[id]/records (entity=ledger) —
 * the same API and 'Bakiyeye yansıt' rule as the trader-detail "Bakiye geçmişi" tab.
 */
export default function TransactionsPage() {
  const { i18n, code } = useCrmLabels();
  const [rows, setRows] = useState<Row[]>([]);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [traderId, setTraderId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [listFailed, setListFailed] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  // Server counts ignore the type chip so the chips stay stable while a type is selected.
  const [baseCounts, setBaseCounts] = useState<{ total: number; byType: [string, number][] } | null>(null);
  const rowsRef = useRef<Row[]>([]);
  const listGen = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const gen = ++listGen.current;
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (qDebounced) p.set("q", qDebounced);
    if (traderId) p.set("userId", traderId);
    const f = dayStartIso(from);
    const tt = dayEndIso(to);
    if (f) p.set("from", f);
    if (tt) p.set("to", tt);
    p.set("take", String(CRM_LIST_PAGE));
    p.set("skip", mode === "more" ? String(rowsRef.current.length) : "0");
    if (mode === "replace") p.set("counts", "1");
    if (mode === "more") setMoreBusy(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions?${p}`);
      if (gen !== listGen.current) return;
      if (!res.ok) {
        if (mode !== "more") setListFailed(true);
        return;
      }
      const data = await res.json();
      const list: Row[] = data.transactions || [];
      const next =
        mode === "more"
          ? rowsRef.current.concat(list.filter((r) => !rowsRef.current.some((row) => row.id === r.id)))
          : list;
      rowsRef.current = next;
      setRows(next);
      if (mode !== "more") setListFailed(false);
      setHasMore(Boolean(data.hasMore));
      if (data.counts && mode === "replace") {
        const byKey = (data.counts.byKey || {}) as Record<string, number>;
        const byType = Object.entries(byKey)
          .map(([k, n]) => [k, Number(n) || 0] as [string, number])
          .sort((a, b) => b[1] - a[1]);
        setBaseCounts({ total: Number(data.counts.total) || 0, byType });
      }
    } catch {
      if (gen === listGen.current && mode !== "more") setListFailed(true);
    } finally {
      if (gen !== listGen.current) return;
      if (mode === "more") setMoreBusy(false);
      else setLoading(false);
    }
  }, [type, qDebounced, traderId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const c = String(r.currency || "USD");
      m.set(c, (m.get(c) || 0) + (Number(r.amount) || 0));
    }
    return Array.from(m.entries());
  }, [rows]);

  const typeChips = useMemo(() => {
    const base = baseCounts || { total: rows.length, byType: [] as [string, number][] };
    const m = new Map(base.byType);
    const list = Array.from(m.entries());
    return { total: base.total, list };
  }, [baseCounts, rows.length]);

  function downloadCsv() {
    const header = [
      i18n("crm.ui.date"),
      i18n("crm.ui.type"),
      i18n("crm.ui.amount"),
      i18n("crm.ui.currency"),
      i18n("crm.ui.trader"),
      i18n("crm.ui.comment"),
      i18n("crm.edit.ref"),
    ];
    const lines = [header.map(csvCell).join(",")];
    for (const r of rows) {
      const trader = [r.trader, r.traderEmail].filter(Boolean).map(String).join(" · ");
      const ref = r.refType ? `${r.refType}${r.refId ? ` · ${String(r.refId)}` : ""}` : "";
      lines.push(
        [
          r.createdAt ? String(r.createdAt) : "",
          r.type ? code("crm.ledger", String(r.type)) : "",
          r.amount ?? "",
          r.currency || "",
          trader,
          r.comment || "",
          ref,
        ]
          .map(csvCell)
          .join(","),
      );
    }
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const byId = useMemo(() => new Map(rows.map((r) => [String(r.id), r])), [rows]);

  async function onCreate(values: Row, applyToBalance: boolean): Promise<Result> {
    const { traderId: tid, ...rest } = values;
    if (!tid) return { ok: false, error: `${i18n("crm.ui.trader")}: ${i18n("crm.edit.required")}` };
    const r = await crmJson(`/api/admin/users/${tid}/records`, "POST", { entity: "ledger", ...rest, applyToBalance });
    if (r.ok) await load();
    return r;
  }
  async function onUpdate(id: string, values: Row, applyToBalance: boolean): Promise<Result> {
    const row = byId.get(id);
    if (!row) return { ok: false, error: "Not found" };
    const { traderId: tid, ...rest } = values;
    const body: Row = { entity: "ledger", id, ...rest, applyToBalance };
    if (tid && tid !== row.traderId) body.moveToUserId = tid;
    const r = await crmJson(`/api/admin/users/${row.traderId}/records`, "PATCH", body);
    if (r.ok) await load();
    return r;
  }
  async function onDelete(id: string, applyToBalance: boolean): Promise<Result> {
    const row = byId.get(id);
    if (!row) return { ok: false, error: "Not found" };
    const r = await crmJson(`/api/admin/users/${row.traderId}/records`, "DELETE", {
      entity: "ledger",
      id,
      applyToBalance,
    });
    if (r.ok) await load();
    return r;
  }

  const typeOpts = LEDGER_TYPES.map((t) => ({ value: t, label: code("crm.ledger", t) }));
  const currencyOpts = ACCOUNT_CURRENCIES.map((c) => ({ value: c, label: c }));
  const columns: CrmColumn[] = [
    { key: "type", label: "crm.ui.type", type: "select", options: typeOpts, required: true },
    {
      key: "amount",
      label: "crm.ui.amount",
      type: "money",
      required: true,
      render: (r) => (
        <span className={`whitespace-nowrap font-medium ${Number(r.amount) < 0 ? "text-red-600" : "text-emerald-700"}`}>
          {Number(r.amount) > 0 ? "+" : ""}
          {fmtCrmMoney(r.amount, 2)} {String(r.currency || "")}
        </span>
      ),
    },
    { key: "balanceBefore", label: "crm.edit.balanceBefore", type: "money" },
    { key: "balanceAfter", label: "crm.edit.balanceAfter", type: "money" },
    { key: "currency", label: "crm.ui.currency", type: "select", options: currencyOpts, hideOnCreate: true },
    {
      key: "traderId",
      label: "crm.ui.trader",
      required: true,
      editor: (value, onChange, _d, row) => (
        <ClientPicker
          value={value}
          initialLabel={row && value === row.traderId ? `${row.trader} · ${row.traderEmail}` : undefined}
          onChange={(id) => onChange(id)}
        />
      ),
      render: (r) => (
        <div className="min-w-[9rem]">
          <Link href={`/izcrm/traders/${r.traderId}`} className="font-medium text-sky-700 hover:underline">
            {String(r.trader)}
          </Link>
          <div className="text-[9px] text-neutral-500">
            {String(r.traderEmail || "")}
            {r.accountLoginId ? ` · ${r.accountLoginId}` : ""}
          </div>
        </div>
      ),
    },
    { key: "createdByName", label: "crm.ui.createdBy", hideOnCreate: true },
    { key: "comment", label: "crm.ui.comment", type: "textarea" },
    {
      key: "refType",
      label: "crm.edit.ref",
      editable: false,
      render: (r) => (r.refType ? `${r.refType}${r.refId ? ` · ${String(r.refId).slice(-6)}` : ""}` : "—"),
    },
    { key: "createdAt", label: "crm.ui.date", type: "datetime" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">{i18n("crm.tx.title")}</h1>
      <p className="mb-2 text-[11px] text-neutral-500">{i18n("crm.tx.intro")}</p>
      <p className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
        {i18n("crm.edit.ledgerRule")} {i18n("crm.edit.reassignHint")}
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-neutral-500">{i18n("crm.ui.type")}</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className={ctl}>
            <option value="">{i18n("crm.ui.allTypes")}</option>
            {typeOpts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-neutral-500">{i18n("crm.ui.search")}</span>
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQ("");
              }}
              placeholder={i18n("crm.edit.searchClient")}
              className={ctl + " w-56 pr-6"}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label={i18n("crm.ui.clearField")}
                title={i18n("crm.ui.clearField")}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-1 text-neutral-400 hover:text-neutral-700"
              >
                ×
              </button>
            )}
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-neutral-500">{i18n("crm.ui.trader")}</span>
          <div className="flex items-center gap-1">
            <div className="w-56">
              <ClientPicker value={traderId} onChange={(id) => setTraderId(id)} />
            </div>
            {traderId && (
              <button type="button" className={ctl} onClick={() => setTraderId("")}>
                ✕
              </button>
            )}
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-neutral-500">{i18n("crm.ui.from")}</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={ctl} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-neutral-500">{i18n("crm.ui.to")}</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={ctl} />
        </label>
        <button
          type="button"
          className={ctl + " hover:bg-neutral-50"}
          onClick={() => {
            setType("");
            setQ("");
            setTraderId("");
            setFrom("");
            setTo("");
          }}
        >
          {i18n("crm.ui.clear")}
        </button>
        <button type="button" className={ctl + " hover:bg-neutral-50"} onClick={() => void load()}>
          {loading ? i18n("crm.ui.loading") : i18n("crm.ui.refresh")}
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={rows.length === 0}
          title="Yüklenen satırları CSV indir · Download loaded rows as CSV"
          className={ctl + " font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"}
        >
          CSV
        </button>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {[["", typeChips.total] as [string, number], ...typeChips.list].map(([t, n]) => {
          const active = type === t;
          return (
            <button
              key={t || "__all"}
              type="button"
              aria-pressed={active}
              onClick={() => setType(t)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                active
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {t ? code("crm.ledger", t) : i18n("crm.ui.all")}
              <span className="ml-1 tabular-nums opacity-70">{n}</span>
            </button>
          );
        })}
      </div>
      <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-neutral-600">
        <span>
          {rows.length}{hasMore ? "+" : ""} {i18n("crm.ui.records")}
        </span>
        {totals.map(([c, v]) => (
          <span key={c} className="tabular-nums">
            {i18n("crm.ui.total")} {c}: <b>{fmtCrmMoney(v, 2)}</b>
          </span>
        ))}
      </div>
      {listFailed && (
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
      <CrmRecordTable
        rows={rows}
        columns={columns}
        balanceAware
        createInitial={{ type: "ADJUSTMENT", traderId: traderId || "" }}
        addTitle={i18n("crm.edit.newRecord")}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
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
