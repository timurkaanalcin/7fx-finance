"use client";

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
        { label: "Yatırımlar", value: fmt(report.depositsAmount), hint: `${report.depositsCount} adet` },
        { label: "Çekimler", value: fmt(report.withdrawalsAmount), hint: `${report.withdrawalsCount} adet` },
        { label: "Açık Pozisyon", value: String(report.openPositions), hint: `${report.closedPositions} kapalı` },
        { label: "Bekleyen Bilet", value: String(report.pendingTickets), hint: "yatırım + marjin" },
        { label: "Aktif Trader", value: String(report.activeTraders), hint: `${report.frozenTraders} donuk` },
        { label: "Aktif Desk", value: String(report.activeDesks), hint: "" },
        { label: "Bekleyen Belge", value: String(report.pendingDocs), hint: "KYC" },
        { label: "İletişim", value: String(report.communications), hint: "" },
        { label: "FTD", value: String(report.ftdCount), hint: "ilk yatırım yapan" },
      ]
    : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Analitik · Rapor</h1>
          <p className="text-[11px] text-slate-500">
            Anlık özet
            {report ? ` · ${new Date(report.generatedAt).toLocaleString("tr-TR")}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={load}
            className="rounded border border-slate-700 bg-[#0a1020] px-3 py-1.5 text-xs hover:bg-slate-800"
          >
            Yenile
          </button>
          <button
            type="button"
            disabled={!report}
            onClick={exportCsv}
            className="rounded bg-sky-600 px-3 py-1.5 text-xs font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            CSV Export
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-800 bg-[#0a1020] p-3">
            <div className="text-[10px] uppercase text-slate-500">{c.label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{c.value}</div>
            {c.hint && <div className="mt-0.5 text-[10px] text-slate-600">{c.hint}</div>}
          </div>
        ))}
      </div>
      {!report && <p className="mt-4 text-xs text-slate-500">Yükleniyor…</p>}
    </div>
  );
}
