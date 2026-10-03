"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useCallback, useEffect, useState } from "react";

type Report = {
  depositsAmount: number;
  depositsCount: number;
  withdrawalsAmount: number;
  withdrawalsCount: number;
  openPositions: number;
  closedPositions: number;
  pendingTickets: number;
  activeTraders: number;
  frozenTraders: number;
  activeDesks: number;
  pendingDocs: number;
  communications: number;
  ftdCount: number;
  generatedAt: string;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ReportPage() {
  const { i18n } = useCrmLabels();
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/analytics/report");
      if (!res.ok) return;
      const data = await res.json();
      setReport(data.report || null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    if (!report) return;
    const lines = [
      "metric,value",
      ...Object.entries(report).map(([k, v]) => `${k},${v}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `7fx-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cards = report
    ? [
        { label: i18n("crm.rep.deposits"), value: fmt(report.depositsAmount), hint: `${report.depositsCount} ${i18n("crm.rep.count")}` },
        { label: i18n("crm.rep.withdrawals"), value: fmt(report.withdrawalsAmount), hint: `${report.withdrawalsCount} ${i18n("crm.rep.count")}` },
        { label: i18n("crm.fin.openPos"), value: String(report.openPositions), hint: `${report.closedPositions} ${i18n("crm.rep.closedHint")}` },
        { label: i18n("crm.rep.pendingTickets"), value: String(report.pendingTickets), hint: i18n("crm.rep.ticketHint") },
        { label: i18n("crm.rep.activeTraders"), value: String(report.activeTraders), hint: `${report.frozenTraders} ${i18n("crm.rep.frozenHint")}` },
        { label: i18n("crm.rep.activeDesks"), value: String(report.activeDesks), hint: "" },
        { label: i18n("crm.rep.pendingDocs"), value: String(report.pendingDocs), hint: "KYC" },
        { label: i18n("crm.nav.communications"), value: String(report.communications), hint: "" },
        { label: i18n("crm.ui.ftd"), value: String(report.ftdCount), hint: i18n("crm.rep.ftdHint") },
      ]
    : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{i18n("crm.rep.title")}</h1>
          <p className="text-[11px] text-neutral-500">
            {i18n("crm.rep.instant")}
            {report ? ` · ${new Date(report.generatedAt).toLocaleString("en-US")}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={load}
            className="rounded border border-neutral-300 bg-[#ffffff] px-3 py-1.5 text-xs hover:bg-neutral-100"
          >
            {i18n("crm.ui.refresh")}
          </button>
          <button
            type="button"
            disabled={!report}
            onClick={exportCsv}
            className="rounded bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {i18n("crm.rep.csv")}
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-neutral-200 bg-[#ffffff] p-3">
            <div className="text-[10px] uppercase text-neutral-500">{c.label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{c.value}</div>
            {c.hint && <div className="mt-0.5 text-[10px] text-neutral-400">{c.hint}</div>}
          </div>
        ))}
      </div>
      {!report && <p className="mt-4 text-xs text-neutral-500">{i18n("crm.ui.loading")}</p>}
    </div>
  );
}
