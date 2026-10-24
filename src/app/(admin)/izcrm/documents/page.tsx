"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";
import TraderSearchPicker from "@/components/crm/TraderSearchPicker";
import { fmtCrmDate } from "@/lib/crm-format";
import { CRM_LIST_PAGE } from "@/lib/trader-list";

const DOC_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

type Doc = {
  id: string;
  name: string;
  docType: string;
  status: string;
  note: string | null;
  traderId: string;
  trader: string;
  traderEmail: string;
  desk: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export default function DocumentsPage() {
  const { i18n } = useCrmLabels();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ userId: "", name: "", docType: "ID", note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [query, setQuery] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const docsRef = useRef<Doc[]>([]);
  const listGen = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const gen = ++listGen.current;
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (qDebounced) p.set("q", qDebounced);
    p.set("take", String(CRM_LIST_PAGE));
    p.set("skip", mode === "more" ? String(docsRef.current.length) : "0");
    if (mode === "replace") p.set("counts", "1");
    if (mode === "more") setMoreBusy(true);
    try {
      const res = await fetch(`/api/admin/documents?${p}`);
      if (!res.ok || gen !== listGen.current) return;
      const data = await res.json();
      const list: Doc[] = data.documents || [];
      const next =
        mode === "more" ? docsRef.current.concat(list.filter((d) => !docsRef.current.some((row) => row.id === d.id))) : list;
      docsRef.current = next;
      setDocs(next);
      setHasMore(Boolean(data.hasMore));
      if (data.counts && mode === "replace") {
        const c: Record<string, number> = { "": Number(data.counts.total) || 0 };
        const byKey = (data.counts.byKey || {}) as Record<string, number>;
        for (const [k, n] of Object.entries(byKey)) c[k] = Number(n) || 0;
        setCounts(c);
      }
    } finally {
      if (mode === "more" && gen === listGen.current) setMoreBusy(false);
    }
  }, [status, qDebounced]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, next: "APPROVED" | "REJECTED") {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", id, status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.actionFailed"));
        return;
      }
      setMsg(next === "APPROVED" ? i18n("crm.status.APPROVED") : i18n("crm.status.REJECTED"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setForm((f) => ({ ...f, name: "", note: "" }));
      setMsg(i18n("crm.docs.added"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">{i18n("crm.nav.documents")}</h1>
      <p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.docs.intro")}</p>
      {msg && <p className="mb-2 text-[11px] text-neutral-500">{msg}</p>}
      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-lg border border-neutral-200">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-200 bg-[#ffffff] px-3 py-2">
            {(["", ...DOC_STATUSES] as string[]).map((s) => {
              const n = counts[s] ?? 0;
              const active = status === s;
              return (
                <button
                  key={s || "ALL"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatus(s)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                    active
                      ? "border-black bg-black text-white"
                      : s === "PENDING" && n > 0
                        ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                        : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {s ? i18n(`crm.status.${s}`, s) : i18n("crm.ui.all")}
                  <span className="ml-1 tabular-nums opacity-70">{n}</span>
                </button>
              );
            })}
            <div className="relative ml-auto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder={i18n("crm.docs.searchPh", "Belge, müşteri, e-posta…")}
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
            {query && (
              <span className="w-full text-[10px] text-neutral-500">
                {i18n("crm.docs.matches", "{n} sonuç").replace("{n}", String(docs.length))}
              </span>
            )}
          </div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#ffffff] text-neutral-500">
              <tr>
                <th className="px-2 py-2">{i18n("crm.ui.document")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.type")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.trader")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.status")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.date")}</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-t border-neutral-200">
                  <td className="px-2 py-1.5">
                    <div className="font-medium">{d.name}</div>
                    {d.note && <div className="text-neutral-400">{d.note}</div>}
                  </td>
                  <td className="px-2 py-1.5">{d.docType}</td>
                  <td className="px-2 py-1.5">
                    <Link href={`/izcrm/traders/${d.traderId}`} className="text-sky-400 hover:underline">
                      {d.trader}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-2 py-1.5 text-neutral-500">
                    {fmtCrmDate(d.createdAt)}
                  </td>
                  <td className="px-2 py-1.5 space-x-1">
                    {d.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => review(d.id, "APPROVED")}
                          className="rounded bg-emerald-600/80 px-1.5 py-0.5 text-[10px] hover:bg-emerald-500"
                        >
                          {i18n("crm.ui.approve")}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => review(d.id, "REJECTED")}
                          className="rounded bg-red-600/80 px-1.5 py-0.5 text-[10px] hover:bg-red-500"
                        >
                          {i18n("crm.ui.reject")}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-neutral-500">
                    {qDebounced ? i18n("crm.docs.noMatch", "Aramayla eşleşen belge yok") : i18n("crm.docs.none")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {hasMore && (
            <div className="border-t border-neutral-200 p-2 text-center">
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
        <div className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
          <h2 className="mb-2 text-xs font-semibold text-neutral-600">{i18n("crm.docs.add")}</h2>
          <div className="space-y-2 text-xs">
            <TraderSearchPicker value={form.userId} onChange={(userId) => setForm({ ...form, userId })} />
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={i18n("crm.docs.namePh")}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            />
            <select
              value={form.docType}
              onChange={(e) => setForm({ ...form, docType: e.target.value })}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            >
              {["ID", "ADDRESS", "SELFIE", "OTHER"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder={i18n("crm.docs.notePh")}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            />
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="w-full rounded bg-black text-white px-3 py-1.5 font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {i18n("crm.ui.add")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
