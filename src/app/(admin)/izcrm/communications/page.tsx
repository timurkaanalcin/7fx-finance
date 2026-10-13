"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { fmtCrmDate } from "@/lib/crm-format";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";

type Row = {
  id: string;
  type: string;
  title: string | null;
  description: string;
  workerName: string | null;
  traderId: string;
  trader: string;
  traderEmail: string;
  desk: string | null;
  createdAt: string;
};

type TraderOpt = { id: string; name: string; email: string };

const COMM_TYPES = ["NOTE", "CALL", "CHAT"];

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function CommunicationsPage() {
  const { i18n } = useCrmLabels();
  const [rows, setRows] = useState<Row[]>([]);
  const [type, setType] = useState("");
  const [traders, setTraders] = useState<TraderOpt[]>([]);
  const [form, setForm] = useState({ userId: "", type: "NOTE", title: "", description: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  // Per-type counts captured from the last load WITHOUT a type filter, so chips stay
  // stable while a type chip is active (the API filters by type server-side).
  const [baseCounts, setBaseCounts] = useState<{ total: number; byType: Map<string, number> } | null>(null);

  const load = useCallback(async () => {
    const q = type ? `?type=${encodeURIComponent(type)}` : "";
    const res = await fetch(`/api/admin/communications${q}`);
    if (!res.ok) return;
    const data = await res.json();
    const list: Row[] = data.communications || [];
    setRows(list);
    if (!type) {
      const m = new Map<string, number>();
      for (const r of list) if (r.type) m.set(r.type, (m.get(r.type) || 0) + 1);
      setBaseCounts({ total: list.length, byType: m });
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) =>
        setTraders(
          (d.users || [])
            .filter((u: { role: string }) => u.role === "TRADER")
            .map((u: TraderOpt & { role: string }) => ({ id: u.id, name: u.name, email: u.email }))
        )
      )
      .catch(() => {});
  }, []);

  const typeChips = useMemo(() => {
    const base = baseCounts || { total: rows.length, byType: new Map<string, number>() };
    const m = new Map(base.byType);
    // Active type: trust the freshly loaded rows.
    if (type) m.set(type, rows.length);
    const list: [string, number][] = COMM_TYPES.map((t) => [t, m.get(t) || 0]);
    // Any unexpected types from the API are appended so nothing is hidden.
    m.forEach((n, t) => {
      if (!COMM_TYPES.includes(t)) list.push([t, n]);
    });
    return { total: base.total, list };
  }, [baseCounts, rows.length, type]);

  const shown = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    if (!q) return rows;
    return rows.filter((r) =>
      [r.title, r.description, r.trader, r.traderEmail, r.workerName, r.desk, r.type].some(
        (v) => v != null && String(v).toLocaleLowerCase("tr").includes(q),
      ),
    );
  }, [rows, search]);

  function downloadCsv() {
    const header = [
      i18n("crm.ui.date"),
      i18n("crm.ui.type"),
      i18n("crm.ui.title"),
      i18n("crm.ui.description"),
      i18n("crm.ui.trader"),
      i18n("crm.ui.email"),
      i18n("crm.ui.desk"),
      i18n("crm.ui.worker"),
    ];
    const lines = [header.map(csvCell).join(",")];
    for (const r of shown) {
      lines.push(
        [r.createdAt || "", r.type || "", r.title || "", r.description || "", r.trader || "", r.traderEmail || "", r.desk || "", r.workerName || ""]
          .map(csvCell)
          .join(","),
      );
    }
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `communications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function create() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setForm((f) => ({ ...f, title: "", description: "" }));
      setMsg(i18n("crm.comms.added"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">{i18n("crm.nav.communications")}</h1>
      <p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.comms.intro")}</p>
      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-lg border border-neutral-200">
          <div className="space-y-2 border-b border-neutral-200 bg-[#ffffff] px-3 py-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearch("");
                  }}
                  placeholder={i18n("crm.ui.search")}
                  aria-label={i18n("crm.ui.search")}
                  className="w-56 rounded border border-neutral-300 bg-white px-2 py-1 pr-6 text-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label={i18n("crm.ui.clearField")}
                    title={i18n("crm.ui.clearField")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 px-1 text-neutral-400 hover:text-neutral-700"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="text-[11px] tabular-nums text-neutral-600">
                {shown.length === rows.length ? rows.length : `${shown.length} / ${rows.length}`} {i18n("crm.ui.records")}
              </span>
              <button
                type="button"
                onClick={downloadCsv}
                disabled={shown.length === 0}
                title="Gösterilen satırları CSV indir · Download shown rows as CSV"
                className="ml-auto rounded border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                CSV
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={i18n("crm.ui.type")}>
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
                    {t || i18n("crm.ui.all")}
                    <span className="ml-1 tabular-nums opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#ffffff] text-neutral-500">
              <tr>
                <th className="px-2 py-2">{i18n("crm.ui.type")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.title")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.trader")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.worker")}</th>
                <th className="px-2 py-2">{i18n("crm.ui.date")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-neutral-200 align-top">
                  <td className="px-2 py-1.5">
                    <StatusBadge status={r.type === "CALL" ? "OPEN" : r.type === "CHAT" ? "PENDING" : "NEW"} />
                    <span className="ml-1 text-neutral-500">{r.type}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="font-medium">{r.title || "—"}</div>
                    <div className="max-w-[280px] truncate text-neutral-500">{r.description}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <Link href={`/izcrm/traders/${r.traderId}`} className="text-sky-400 hover:underline">
                      {r.trader}
                    </Link>
                    <div className="text-neutral-400">{r.desk || "—"}</div>
                  </td>
                  <td className="px-2 py-1.5 text-neutral-500">{r.workerName || "—"}</td>
                  <td className="px-2 py-1.5 text-neutral-500">
                    {fmtCrmDate(r.createdAt)}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-neutral-500">
                    {i18n("crm.comms.none")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
          <h2 className="mb-2 text-xs font-semibold text-neutral-600">{i18n("crm.comms.new")}</h2>
          <div className="space-y-2 text-xs">
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            >
              <option value="">{i18n("crm.comms.selectTrader")}</option>
              {traders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            >
              {["NOTE", "CALL", "CHAT"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={i18n("crm.ui.title")}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={i18n("crm.ui.description")}
              rows={4}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            />
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="w-full rounded bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {i18n("crm.ui.save")}
            </button>
            {msg && <p className="text-[11px] text-neutral-500">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
