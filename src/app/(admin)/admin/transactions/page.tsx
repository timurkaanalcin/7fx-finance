"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import CrmRecordTable, { type CrmColumn } from "@/components/crm/CrmRecordTable";
import ClientPicker from "@/components/crm/ClientPicker";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { fmtCrmMoney } from "@/lib/crm-format";
import { ACCOUNT_CURRENCIES } from "@/lib/membership";
import { crmJson, dayEndIso, dayStartIso } from "@/lib/crm-api";

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
  const [limit, setLimit] = useState("400");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (qDebounced) p.set("q", qDebounced);
    if (traderId) p.set("userId", traderId);
    const f = dayStartIso(from);
    const tt = dayEndIso(to);
    if (f) p.set("from", f);
    if (tt) p.set("to", tt);
    p.set("limit", limit);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions?${p}`);
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.transactions || []);
    } finally {
      setLoading(false);
    }
  }, [type, qDebounced, traderId, from, to, limit]);

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
          <Link href={`/admin/traders/${r.traderId}`} className="font-medium text-sky-700 hover:underline">
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
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={i18n("crm.edit.searchClient")}
            className={ctl + " w-56"}
          />
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
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-neutral-500">{i18n("crm.ui.limit")}</span>
          <select value={limit} onChange={(e) => setLimit(e.target.value)} className={ctl}>
            {["100", "400", "1000"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
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
        <button type="button" className={ctl + " hover:bg-neutral-50"} onClick={load}>
          {loading ? i18n("crm.ui.loading") : i18n("crm.ui.refresh")}
        </button>
      </div>
      <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-neutral-600">
        <span>
          {rows.length} {i18n("crm.ui.records")}
        </span>
        {totals.map(([c, v]) => (
          <span key={c} className="tabular-nums">
            {i18n("crm.ui.total")} {c}: <b>{fmtCrmMoney(v, 2)}</b>
          </span>
        ))}
      </div>
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
    </div>
  );
}
