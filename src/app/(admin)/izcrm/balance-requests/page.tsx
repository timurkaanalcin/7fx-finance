"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { fmtCrmDate } from "@/lib/crm-format";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_RESET_BALANCE } from "@/lib/margin-call";

type Row = {
  id: string;
  type: string;
  amount: number | null;
  status: string;
  reason: string;
  equityAt: number | null;
  marginLvl: number | null;
  riskAcknowledged?: boolean;
  riskAcknowledgedAt?: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; email: string; name: string };
};

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const TYPE_FILTERS = ["", "ADD", "RESET"] as const;

export default function AdminBalanceRequestsPage() {
  const { i18n, code } = useCrmLabels();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [ruleTr, setRuleTr] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [csvBusy, setCsvBusy] = useState(false);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const q = filter ? `?status=${filter}` : "";
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/balance-requests${q}`);
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.requests || []);
      if (data.config?.ruleTr) setRuleTr(data.config.ruleTr);
      setLoadedAt(new Date());
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Pending queue refreshes itself so new requests show up without a manual reload.
  useEffect(() => {
    if (filter !== "PENDING") return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30_000);
    return () => window.clearInterval(t);
  }, [filter, load]);

  // Stable base counts per type from the loaded set (independent of the type chip / search)
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { "": rows.length, ADD: 0, RESET: 0 };
    for (const r of rows) c[r.type] = (c[r.type] || 0) + 1;
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return rows.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false;
      if (!q) return true;
      return [r.user.name, r.user.email, r.type, r.reason || "", r.adminNote || ""]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(q);
    });
  }, [rows, query, typeFilter]);

  /** CSV of shown rows; gated + audited by the existing export-audit endpoint (RO / scoped staff denied). */
  async function downloadCsv() {
    if (shown.length === 0 || csvBusy) return;
    setCsvBusy(true);
    try {
      const audit = await fetch("/api/admin/export-audit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "balance_requests_csv", path: "/izcrm/balance-requests", rows: shown.length }),
      }).catch(() => null);
      if (!audit || !audit.ok) {
        setMsg(i18n("crm.ui.csvDenied", "CSV dışa aktarma bu hesap için kapalı."));
        return;
      }
      const header = [
        i18n("crm.ui.date"),
        i18n("crm.ui.name"),
        i18n("crm.ui.email"),
        i18n("crm.ui.type"),
        i18n("crm.ui.amount"),
        i18n("crm.ui.equity"),
        "Margin %",
        i18n("crm.ui.status"),
        i18n("crm.bal.reason", "Sebep"),
        i18n("crm.ui.note"),
        i18n("crm.bal.riskAck"),
      ];
      const lines = [header.map(csvCell).join(",")];
      for (const r of shown) {
        lines.push(
          [
            r.createdAt,
            r.user.name,
            r.user.email,
            r.type === "RESET" ? i18n("crm.bal.reset") : r.type === "ADD" ? i18n("crm.bal.add") : r.type,
            r.type === "ADD" && r.amount != null ? r.amount : r.type === "RESET" ? `-> ${DEFAULT_RESET_BALANCE}` : "",
            r.equityAt ?? "",
            r.marginLvl != null ? r.marginLvl.toFixed(1) : "",
            code("crm.status", r.status),
            r.reason || "",
            r.adminNote || "",
            r.type === "ADD" ? (r.riskAcknowledged ? `YES${r.riskAcknowledgedAt ? ` ${r.riskAcknowledgedAt}` : ""}` : "NO") : "",
          ]
            .map(csvCell)
            .join(","),
        );
      }
      const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `balance-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setCsvBusy(false);
    }
  }

  const totals = useMemo(() => {
    let add = 0;
    let resets = 0;
    for (const r of shown) {
      if (r.type === "RESET") resets += 1;
      else if (r.type === "ADD") add += Number(r.amount) || 0;
    }
    return { add, resets };
  }, [shown]);

  function usd(amount: number) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  async function act(id: string, action: "approve" | "reject") {
    const row = rows.find((r) => r.id === id);
    const what =
      row?.type === "ADD" && row.amount != null
        ? `${i18n("crm.bal.add")} · ${usd(row.amount)}`
        : `${i18n("crm.bal.reset")} → ${DEFAULT_RESET_BALANCE.toLocaleString("en-US")} USD`;
    const detail = row ? `\n\n${row.user.name} · ${row.user.email}\n${what}` : "";
    const question = action === "approve" ? i18n("crm.bal.confirmApprove") : i18n("crm.bal.confirmReject");
    if (!window.confirm(question + detail)) return;
    setBusy(id);
    setMsg("");
    try {
      const res = await fetch("/api/admin/balance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.actionFailed"));
        return;
      }
      setMsg(action === "approve" ? i18n("crm.bal.approved") : i18n("crm.bal.rejected"));
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{i18n("crm.bal.title")}</h1>
        <div className="ml-auto flex gap-1">
          {["PENDING", "APPROVED", "REJECTED", ""].map((f) => (
            <button
              key={f || "ALL"}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-1 text-xs ${filter === f ? "bg-black text-white" : "bg-[#e5e5e5]"}`}
            >
              {f ? code("crm.status", f) : i18n("crm.ui.all")}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-1 rounded-lg border border-[#e5e5e5] bg-[#ffffff]/50 p-3 text-[11px] text-neutral-500">
        <p className="font-medium text-neutral-600">{i18n("crm.bal.rules")}</p>
        <p>{ruleTr || i18n("crm.bal.resetLine")}</p>
        <p>{i18n("crm.bal.addLine")}</p>
        <p>{i18n("crm.bal.rejected")}</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            placeholder={i18n("crm.bal.searchPh")}
            aria-label={i18n("crm.ui.search")}
            className="w-full rounded border border-[#e5e5e5] bg-white px-2 py-1 pr-6 text-xs outline-none focus:border-black/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={i18n("crm.ui.clearSearch", "Aramayı temizle")}
              title={`${i18n("crm.ui.clearSearch", "Aramayı temizle")} (Esc)`}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-1 text-neutral-400 hover:text-neutral-700"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label={i18n("crm.ui.type")}>
          {TYPE_FILTERS.map((t) => (
            <button
              key={t || "ALL"}
              type="button"
              onClick={() => setTypeFilter(t)}
              aria-pressed={typeFilter === t}
              className={`rounded-full border px-2.5 py-0.5 text-xs ${typeFilter === t ? "border-black bg-black text-white" : "border-[#e5e5e5] bg-white"}`}
            >
              {t === "ADD" ? i18n("crm.bal.add") : t === "RESET" ? i18n("crm.bal.reset") : i18n("crm.ui.all")}{" "}
              <span className={`tabular-nums ${typeFilter === t ? "text-white/70" : "text-neutral-400"}`}>{typeCounts[t] || 0}</span>
            </button>
          ))}
        </div>
        {(query || typeFilter) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTypeFilter("");
            }}
            className="rounded border border-[#e5e5e5] bg-white px-2 py-1 text-xs text-neutral-600 hover:bg-[#f5f5f5]"
          >
            {i18n("crm.ui.clear")}
          </button>
        )}
        <span className="rounded bg-[#f2f2f2] px-2 py-1 text-xs tabular-nums">
          {i18n("crm.bal.count")}: <b>{shown.length}</b>
        </span>
        <span className="rounded bg-[#f2f2f2] px-2 py-1 text-xs tabular-nums">
          {i18n("crm.bal.totalAdd")}: <b>{usd(totals.add)}</b>
        </span>
        <span className="rounded bg-[#f2f2f2] px-2 py-1 text-xs tabular-nums">
          {i18n("crm.bal.resetCount")}: <b>{totals.resets}</b>
        </span>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-neutral-500">
          {loadedAt && (
            <span title={filter === "PENDING" ? i18n("crm.bal.autoRefresh") : undefined}>
              {i18n("crm.bal.updated")} {loadedAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => load()}
            disabled={loading}
            className="rounded bg-[#e5e5e5] px-2 py-1 text-xs text-black disabled:opacity-50"
          >
            {i18n("crm.bal.refresh")}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={shown.length === 0 || csvBusy}
            title="Gösterilen satırları CSV indir · Download shown rows as CSV"
            className="rounded border border-[#e5e5e5] bg-white px-2 py-1 text-xs font-medium text-black hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
          >
            CSV
          </button>
        </div>
      </div>

      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}
      <div className="overflow-x-auto rounded-lg border border-[#e5e5e5]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-black/10 bg-white text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.date")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.user")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.type")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.amount")}</th>
              <th className="px-3 py-2">{i18n("crm.bal.marginPct")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.status")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.action")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-[#e5e5e5]">
                <td className="px-3 py-2 whitespace-nowrap">
                  {fmtCrmDate(r.createdAt)}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/izcrm/traders/${r.user.id}`} className="text-sky-600 hover:underline">
                    {r.user.name}
                  </Link>
                  <div className="text-neutral-500">{r.user.email}</div>
                </td>
                <td className="px-3 py-2">
                  {r.type === "RESET" ? i18n("crm.bal.reset") : i18n("crm.bal.add")}
                  {r.type === "ADD" && (
                    <div
                      className={`mt-0.5 text-[10px] ${r.riskAcknowledged ? "text-emerald-700" : "text-neutral-500"}`}
                      title={r.riskAcknowledged ? i18n("crm.bal.riskAckText") : undefined}
                    >
                      {r.riskAcknowledged
                        ? `✓ ${i18n("crm.bal.riskAck")}${r.riskAcknowledgedAt ? ` · ${fmtCrmDate(r.riskAcknowledgedAt)}` : ""}`
                        : i18n("crm.bal.riskAckNo")}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums font-medium">
                  {r.type === "ADD" && r.amount != null
                    ? r.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
                    : `→ ${DEFAULT_RESET_BALANCE.toLocaleString("en-US")} USD`}
                </td>
                <td className="px-3 py-2 tabular-nums text-neutral-500">
                  {r.equityAt != null ? r.equityAt.toFixed(2) : "—"} /{" "}
                  {r.marginLvl != null ? `%${r.marginLvl.toFixed(1)}` : "—"}
                </td>
                <td className="px-3 py-2">{code("crm.status", r.status)}</td>
                <td className="px-3 py-2">
                  {r.status === "PENDING" ? (
                    <div className="flex gap-1">
                      <button
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "approve")}
                        className="rounded bg-emerald-600 px-2 py-1 hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {i18n("crm.ui.approve")}
                      </button>
                      <button
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "reject")}
                        className="rounded bg-red-600/80 px-2 py-1 hover:bg-red-500 disabled:opacity-50"
                      >
                        {i18n("crm.ui.reject")}
                      </button>
                    </div>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">
                  {i18n("crm.ui.noRecords")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
