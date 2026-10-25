"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { LOCALE_META } from "@/lib/i18n/locales";
import { fmtCrmDate } from "@/lib/crm-format";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVisiblePoll } from "@/lib/use-visible-poll";

type Row = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  note: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string };
};

/** Withdrawal queue. Approve and reject stay on the existing POST. */
export default function AdminWithdrawalsPage() {
  const { i18n, code, locale } = useCrmLabels();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [query, setQuery] = useState("");
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const rowsRef = useRef<Row[]>([]);

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const skip = mode === "more" ? rowsRef.current.length : 0;
    if (mode === "more") setMoreBusy(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ take: "50", skip: String(skip) });
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/admin/withdrawals?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const incoming: Row[] = data.requests || [];
      const seen = new Set(rowsRef.current.map((r) => r.id));
      const next = mode === "more" ? rowsRef.current.concat(incoming.filter((r) => !seen.has(r.id))) : incoming;
      rowsRef.current = next;
      setRows(next);
      setHasMore(Boolean(data.hasMore));
      setLoadedAt(new Date());
    } finally {
      if (mode === "more") setMoreBusy(false);
      else setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useVisiblePoll(load, 30_000, filter === "PENDING");

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return rows;
    return rows.filter((r) =>
      [r.user.name, r.user.email, r.method, r.note || "", r.currency]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(q),
    );
  }, [rows, query]);

  function money(amount: number, currency: string) {
    try {
      return amount.toLocaleString("en-US", { style: "currency", currency: currency || "USD" });
    } catch {
      return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
    }
  }

  async function act(id: string, action: "approve" | "reject") {
    const row = rows.find((r) => r.id === id);
    const detail = row ? `\n\n${row.user.name} · ${row.user.email}\n${money(row.amount, row.currency)}` : "";
    const question = action === "approve" ? i18n("crm.ui.approve") : i18n("crm.ui.reject");
    if (!window.confirm(question + detail)) return;
    setBusy(id);
    setMsg("");
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.actionFailed"));
        return;
      }
      setMsg(action === "approve" ? i18n("crm.dep.approved") : i18n("crm.dep.rejected"));
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-medium">{i18n("crm.edit.withdrawals")}</h1>
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
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            placeholder={i18n("crm.dep.searchPh")}
            aria-label={i18n("crm.ui.search")}
            className="w-full rounded border border-[#e5e5e5] bg-white py-1 pl-2 pr-6 text-xs outline-none focus:border-black/40"
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
        <span className="rounded bg-[#f2f2f2] px-2 py-1 text-xs tabular-nums">
          {i18n("crm.dep.count")}: <b>{shown.length}</b>
        </span>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-neutral-500">
          {loadedAt && (
            <span>
              {i18n("crm.dep.updated")} {loadedAt.toLocaleTimeString(LOCALE_META[locale].htmlLang, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded bg-[#e5e5e5] px-2 py-1 text-xs text-black disabled:opacity-50"
          >
            {i18n("crm.dep.refresh")}
          </button>
        </div>
      </div>
      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}
      <div className="overflow-x-auto rounded-lg border border-[#e5e5e5]">
        <table className="fx-crm-table w-full text-left text-xs">
          <thead className="border-b border-black/10 bg-white text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.date")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.user")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.method")}</th>
              <th className="fx-crm-num px-3 py-2">{i18n("crm.ui.amount")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.note")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.status")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.action")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-[#e5e5e5]">
                <td className="px-3 py-2 whitespace-nowrap">{fmtCrmDate(r.createdAt)}</td>
                <td className="px-3 py-2">
                  <Link href={`/izcrm/traders/${r.user.id}`} className="text-sky-600 hover:underline">
                    {r.user.name}
                  </Link>
                  <div className="text-neutral-500">{r.user.email}</div>
                </td>
                <td className="px-3 py-2">{r.method || "—"}</td>
                <td className="fx-crm-num px-3 py-2">{money(r.amount, r.currency)}</td>
                <td className="px-3 py-2 max-w-[160px] truncate text-neutral-500">{r.note || "—"}</td>
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
      {hasMore && (
        <button
          type="button"
          disabled={moreBusy}
          onClick={() => void load("more")}
          className="mt-3 w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
        >
          {moreBusy ? i18n("crm.ui.loading") : i18n("crm.ui.loadMore")}
        </button>
      )}
    </div>
  );
}
