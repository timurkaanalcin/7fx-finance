"use client";

import { ListPlaceholder } from "@/components/crm/CrmStates";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type Row = {
  userId: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  openPositions: number;
  floatingPnL: number;
  openVolume: number;
};

type Totals = { balance: number; equity: number; margin: number };

type SortKey =
  | "name"
  | "balance"
  | "equity"
  | "margin"
  | "freeMargin"
  | "openPositions"
  | "floatingPnL"
  | "openVolume";

type Filter = "all" | "open" | "profit" | "loss";

const CSV_FIELDS = [
  "name",
  "email",
  "userId",
  "balance",
  "equity",
  "margin",
  "freeMargin",
  "openPositions",
  "floatingPnL",
  "openVolume",
  "active",
] as const;

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : 0);

export default function AdminSummaryPage() {
  const { i18n } = useCrmLabels();
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [accountsPartial, setAccountsPartial] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(() => {
    setPhase("loading");
    fetch("/api/admin/summary")
      .then((r) => {
        if (!r.ok) throw new Error("load");
        return r.json();
      })
      .then((d) => {
        setRows(d.accounts || []);
        setTotals(d.totals || null);
        setAccountsPartial(Boolean(d.accountsPartial));
        setPhase("ready");
      })
      .catch(() => setPhase("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n: number) =>
    num(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

  const counts = useMemo(
    () => ({
      all: rows.length,
      open: rows.filter((r) => num(r.openPositions) > 0).length,
      profit: rows.filter((r) => num(r.floatingPnL) > 0).length,
      loss: rows.filter((r) => num(r.floatingPnL) < 0).length,
    }),
    [rows]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    let list = rows.filter((r) => {
      if (filter === "open" && !(num(r.openPositions) > 0)) return false;
      if (filter === "profit" && !(num(r.floatingPnL) > 0)) return false;
      if (filter === "loss" && !(num(r.floatingPnL) < 0)) return false;
      if (!q) return true;
      return [r.name, r.email, r.userId].some((v) =>
        String(v ?? "").toLocaleLowerCase("tr").includes(q)
      );
    });
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        if (sortKey === "name") {
          return (
            dir *
            String(a.name ?? "").localeCompare(String(b.name ?? ""), "tr", { sensitivity: "base" })
          );
        }
        return dir * (num(a[sortKey]) - num(b[sortKey]));
      });
    }
    return list;
  }, [rows, query, filter, sortKey, sortDir]);

  const shownPnL = useMemo(() => shown.reduce((s, r) => s + num(r.floatingPnL), 0), [shown]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "desc");
    }
  }

  function downloadCsv() {
    const lines = [CSV_FIELDS.join(",")];
    for (const r of shown) {
      lines.push(CSV_FIELDS.map((f) => csvCell(r[f])).join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const chips: { k: Filter; label: string }[] = [
    { k: "all", label: i18n("crm.ui.all") },
    { k: "open", label: "Açık pozisyonlu" },
    { k: "profit", label: "Kârda" },
    { k: "loss", label: "Zararda" },
  ];

  const th = (k: SortKey, children: ReactNode) => {
    const active = sortKey === k;
    return (
      <th
        key={k}
        className="px-3 py-2"
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={`inline-flex items-center gap-1 hover:text-neutral-800 ${
            active ? "text-neutral-900" : ""
          }`}
        >
          {children}
          <span className={`text-[8px] ${active ? "opacity-80" : "opacity-0"}`}>
            {active && sortDir === "asc" ? "▲" : "▼"}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{i18n("crm.nav.summary")}</h1>
      <p className="mb-4 text-sm text-neutral-500">{i18n("crm.sum.intro")}</p>
      {totals && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">{i18n("crm.ui.totalBalance")}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totals.balance)}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">{i18n("crm.ui.totalEquity")}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totals.equity)}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">{i18n("crm.ui.usedMargin")}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totals.margin)}</div>
          </div>
        </div>
      )}
      {accountsPartial && (
        <p className="mb-3 text-[11px] text-amber-700">{i18n("crm.sum.accountsPartial")}</p>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e5e5e5] bg-[#ffffff] px-3 py-2">
          {chips.map(({ k, label }) => {
            const active = filter === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(k)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {label}
                <span className="ml-1 tabular-nums opacity-70">{counts[k]}</span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder="Ad, e-posta, ID…"
                aria-label={i18n("crm.ui.search")}
                className="w-48 rounded border border-neutral-300 bg-white py-1 pl-2 pr-6 text-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={i18n("crm.ui.clearField")}
                  title={i18n("crm.ui.clearField")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-1 text-neutral-400 hover:text-neutral-700"
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={shown.length === 0}
              title="Filtrelenmiş satırları CSV indir · Download filtered rows as CSV"
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              CSV
            </button>
          </div>
          <div className="w-full text-[10px] text-neutral-500 tabular-nums">
            {shown.length} / {rows.length} · {i18n("crm.ui.pnl")}:{" "}
            <span className={shownPnL >= 0 ? "text-emerald-600" : "text-red-500"}>{fmt(shownPnL)}</span>
          </div>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              {th("name", i18n("crm.ui.account"))}
              {th("balance", i18n("crm.ui.balance"))}
              {th("equity", i18n("crm.ui.equity"))}
              {th("margin", i18n("crm.ui.margin"))}
              {th("freeMargin", i18n("crm.ui.freeMargin"))}
              {th("openPositions", i18n("crm.ui.open"))}
              {th("floatingPnL", i18n("crm.ui.pnl"))}
              {th("openVolume", i18n("crm.ui.volume"))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.userId} className="border-t border-[#e5e5e5]">
                <td className="px-3 py-2">
                  <div className="font-medium">
                    {r.name}{" "}
                    {!r.active && <span className="text-red-400">{i18n("crm.sum.frozenTag")}</span>}
                  </div>
                  <div className="text-neutral-500">{r.email}</div>
                </td>
                <td className="px-3 py-2 tabular-nums">{fmt(r.balance)}</td>
                <td className="px-3 py-2 tabular-nums">{fmt(r.equity)}</td>
                <td className="px-3 py-2 tabular-nums">{fmt(r.margin)}</td>
                <td className="px-3 py-2 tabular-nums">{fmt(r.freeMargin)}</td>
                <td className="px-3 py-2 tabular-nums">{r.openPositions}</td>
                <td
                  className={`px-3 py-2 tabular-nums ${
                    r.floatingPnL >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {fmt(r.floatingPnL)}
                </td>
                <td className="px-3 py-2 tabular-nums">{num(r.openVolume).toFixed(2)}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  <ListPlaceholder
                    phase={phase === "ready" && rows.length > 0 ? "ready" : phase}
                    empty={i18n("crm.sum.empty")}
                    title={i18n("crm.ui.loadFailed")}
                    retry={i18n("crm.ui.tryAgain")}
                    loading={i18n("crm.ui.loading")}
                    onRetry={load}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
