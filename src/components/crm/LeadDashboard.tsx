"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CRM_IDLE_POLL_MS, useVisiblePoll } from "@/lib/use-visible-poll";
import Link from "next/link";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

type Kpis = {
  total: number;
  valid: number;
  invalid: number;
  callback: number;
  potential: number;
};

type AffiliateRow = {
  name: string;
  total: number;
  valid: number;
  invalid: number;
  callback: number;
  deposited: number;
  notDeposited: number;
  depositAmount: number;
};

function KpiCard({
  label,
  value,
  href,
  tone,
  sub,
}: {
  label: string;
  value: number;
  href?: string;
  tone?: string;
  sub?: string;
}) {
  const inner = (
    <div className={`rounded-lg border border-neutral-200 bg-white p-3 shadow-sm ${tone || ""}`}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums text-neutral-900">{value}</div>
      {sub ? <div className="mt-0.5 text-[10px] text-neutral-500">{sub}</div> : null}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/** Simple CSS bar + pie without chart library */
function AffiliateCharts({ rows }: { rows: AffiliateRow[] }) {
  const { i18n } = useCrmLabels();
  const top = rows.slice(0, 8);
  const max = Math.max(1, ...top.map((r) => r.total));
  const pieTotal = Math.max(1, top.reduce((s, r) => s + r.total, 0));
  let acc = 0;
  const colors = ["#111111", "#2563eb", "#16a34a", "#dc2626", "#ca8a04", "#7c3aed", "#0891b2", "#db2777"];
  const segments = top.map((r, i) => {
    const start = acc / pieTotal;
    acc += r.total;
    const end = acc / pieTotal;
    return { ...r, start, end, color: colors[i % colors.length] };
  });
  const gradient = segments.length
    ? `conic-gradient(${segments
        .map((s) => `${s.color} ${s.start * 360}deg ${s.end * 360}deg`)
        .join(", ")})`
    : "#e5e5e5";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <div className="mb-2 text-[11px] font-semibold text-neutral-700">{i18n("crm.leads.chartBar")}</div>
        <div className="space-y-2">
          {top.map((r, i) => (
            <div key={r.name} className="flex items-center gap-2 text-[11px]">
              <span className="w-24 truncate text-neutral-600" title={r.name}>
                {r.name}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded bg-neutral-100">
                <div
                  className="h-full rounded"
                  style={{ width: `${(r.total / max) * 100}%`, background: colors[i % colors.length] }}
                />
              </div>
              <span className="w-8 text-right tabular-nums font-medium">{r.total}</span>
            </div>
          ))}
          {!top.length && <p className="text-[11px] text-neutral-400">{i18n("crm.leads.noAffiliates")}</p>}
        </div>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <div className="mb-2 text-[11px] font-semibold text-neutral-700">{i18n("crm.leads.chartPie")}</div>
        <div className="flex items-center gap-4">
          <div className="h-28 w-28 shrink-0 rounded-full" style={{ background: gradient }} />
          <ul className="max-h-32 space-y-1 overflow-y-auto text-[10px] text-neutral-600">
            {segments.map((s) => (
              <li key={s.name} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />
                <span className="truncate">{s.name}</span>
                <span className="tabular-nums text-neutral-400">
                  ({Math.round((s.total / pieTotal) * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function LeadDashboard() {
  const { i18n } = useCrmLabels();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [importMsg, setImportMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/leads/stats", { cache: "no-store" });
      if (!r.ok) throw new Error("fail");
      const d = await r.json();
      setKpis(d.kpis);
      setAffiliates(d.affiliates || []);
      setUpdatedAt(d.generatedAt || new Date().toISOString());
      setErr("");
    } catch {
      setErr(i18n("crm.leads.loadError"));
    }
  }, [i18n]);

  useEffect(() => {
    load();
  }, [load]);
  useVisiblePoll(load, CRM_IDLE_POLL_MS);

  const highDepositCut = useMemo(() => {
    const amounts = affiliates.map((a) => a.depositAmount).filter((n) => n > 0).sort((a, b) => a - b);
    if (!amounts.length) return 1000;
    return amounts[Math.floor(amounts.length * 0.5)] || 1000;
  }, [affiliates]);

  async function onImportComments(file: File | null) {
    if (!file) return;
    setImportMsg("");
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/admin/leads/import-comments", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setImportMsg(d.error || i18n("crm.leads.importFail"));
      return;
    }
    setImportMsg(
      i18n("crm.leads.importOk")
        .replace("{updated}", String(d.updated))
        .replace("{notes}", String(d.notesAdded))
    );
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">{i18n("crm.leads.title")}</h2>
          <p className="text-[11px] text-neutral-500">
            {i18n("crm.leads.subtitle")}
            {updatedAt
              ? ` · ${new Date(updatedAt).toLocaleTimeString("tr-TR", { hour12: false })}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/leads/export"
            className="rounded bg-black px-3 py-1.5 text-[11px] font-medium text-white"
            onClick={() => {
              void fetch("/api/admin/export-audit", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: "leads_xlsx", path: "/izcrm" }),
              });
            }}
          >
            {i18n("crm.leads.exportXlsx")}
          </a>
          <label className="cursor-pointer rounded border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-800 hover:bg-neutral-50">
            {i18n("crm.leads.importComments")}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => void onImportComments(e.target.files?.[0] || null)}
            />
          </label>
          <Link
            href="/izcrm/settings#lead-mapping"
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-800 hover:bg-neutral-50"
          >
            {i18n("crm.leads.mappingLink")}
          </Link>
        </div>
      </div>

      {err && <p className="mb-2 text-xs text-red-600">{err}</p>}
      {importMsg && <p className="mb-2 text-xs text-emerald-700">{importMsg}</p>}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label={i18n("crm.leads.total")}
          value={kpis?.total ?? 0}
          href="/izcrm/traders"
          sub={i18n("crm.leads.totalSub")}
        />
        <KpiCard
          label={i18n("crm.leads.valid")}
          value={kpis?.valid ?? 0}
          href="/izcrm/traders"
          tone="border-emerald-200 bg-emerald-50/40"
          sub={i18n("crm.leads.validSub")}
        />
        <KpiCard
          label={i18n("crm.leads.invalid")}
          value={kpis?.invalid ?? 0}
          href="/izcrm/traders"
          tone="border-red-200 bg-red-50/40"
          sub={i18n("crm.leads.invalidSub")}
        />
        <KpiCard
          label={i18n("crm.leads.callback")}
          value={kpis?.callback ?? 0}
          href="/izcrm/traders?saleStatus=CALLBACK"
          tone="border-amber-200 bg-amber-50/40"
          sub={i18n("crm.leads.callbackSub")}
        />
        <KpiCard
          label={i18n("crm.leads.potential")}
          value={kpis?.potential ?? 0}
          href="/izcrm/traders"
          tone="border-sky-200 bg-sky-50/40"
          sub={i18n("crm.leads.potentialSub")}
        />
      </div>

      <AffiliateCharts rows={affiliates} />

      <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-[11px]">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">{i18n("crm.leads.affName")}</th>
              <th className="px-3 py-2 font-medium">{i18n("crm.leads.total")}</th>
              <th className="px-3 py-2 font-medium">{i18n("crm.leads.valid")}</th>
              <th className="px-3 py-2 font-medium">{i18n("crm.leads.invalid")}</th>
              <th className="px-3 py-2 font-medium">{i18n("crm.leads.deposited")}</th>
              <th className="px-3 py-2 font-medium">{i18n("crm.leads.depositAmt")}</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map((a) => {
              const high = a.depositAmount >= highDepositCut && a.depositAmount > 0;
              return (
                <tr key={a.name} className="border-b border-neutral-100">
                  <td className="px-3 py-1.5 font-medium text-neutral-900">{a.name}</td>
                  <td className="px-3 py-1.5 tabular-nums">{a.total}</td>
                  <td className="px-3 py-1.5 tabular-nums text-emerald-700">{a.valid}</td>
                  <td className="px-3 py-1.5 tabular-nums text-red-600">{a.invalid}</td>
                  <td className="px-3 py-1.5">
                    {a.valid === 0 ? (
                      "—"
                    ) : (
                      <span className={a.deposited ? "text-emerald-700" : "text-neutral-500"}>
                        {a.deposited ? i18n("crm.leads.yes") : i18n("crm.leads.no")}
                        {a.deposited ? ` (${a.deposited}/${a.valid})` : ` (${a.notDeposited})`}
                      </span>
                    )}
                  </td>
                  <td className={`px-3 py-1.5 tabular-nums font-semibold ${high ? "text-emerald-700" : "text-neutral-600"}`}>
                    {a.depositAmount > 0
                      ? a.depositAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })
                      : "—"}
                    {a.depositAmount > 0 ? (
                      <span className="ml-1 text-[9px] font-normal text-neutral-400">
                        {high ? i18n("crm.leads.high") : i18n("crm.leads.low")}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!affiliates.length && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-neutral-400">
                  {i18n("crm.leads.noAffiliates")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
