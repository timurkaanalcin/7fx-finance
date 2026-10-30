"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { ACCOUNT_CURRENCIES, SALE_STATUSES } from "@/lib/membership";

type DeskOpt = { id: string; name: string; code: string | null };

type TargetField =
  | "ignore"
  | "firstName"
  | "lastName"
  | "fullName"
  | "email"
  | "phone"
  | "country"
  | "city"
  | "language"
  | "currency"
  | "desk"
  | "saleStatus"
  | "source"
  | "note"
  | "balance"
  | "password";

type ParsePayload = {
  columns: string[];
  rows: string[][];
  samples: Record<string, string[]>;
  suggestedMapping: Record<string, TargetField>;
  format: string;
  fileName: string;
  unstructured?: boolean;
  warning?: string | null;
};

type ValidationRow = {
  rowIndex: number;
  ok: boolean;
  errors: string[];
  warnings: string[];
  duplicateInFile: boolean;
  duplicateInDb: boolean;
  mapped: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    country: string | null;
    desk: string | null;
    saleStatus: string | null;
    currency: string;
    balance: number;
    emailPlaceholder: boolean;
  };
};

type ImportResult = {
  rowIndex: number;
  status: string;
  email: string;
  accountLoginId: string | null;
  password: string | null;
  message: string | null;
};

const FIELD_LABEL_KEYS: Record<TargetField, string> = {
  ignore: "crm.import.field.ignore",
  firstName: "crm.import.field.firstName",
  lastName: "crm.import.field.lastName",
  fullName: "crm.import.field.fullName",
  email: "crm.import.field.email",
  phone: "crm.import.field.phone",
  country: "crm.import.field.country",
  city: "crm.import.field.city",
  language: "crm.import.field.language",
  currency: "crm.import.field.currency",
  desk: "crm.import.field.desk",
  saleStatus: "crm.import.field.saleStatus",
  source: "crm.import.field.source",
  note: "crm.import.field.note",
  balance: "crm.import.field.balance",
  password: "crm.import.field.password",
};

const TARGET_FIELDS = Object.keys(FIELD_LABEL_KEYS) as TargetField[];

export default function AdminImportPage() {
  const { i18n, code } = useCrmLabels();
  const t = i18n;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [desks, setDesks] = useState<DeskOpt[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [parse, setParse] = useState<ParsePayload | null>(null);
  const [mapping, setMapping] = useState<Record<string, TargetField>>({});
  const [defaults, setDefaults] = useState({
    desk: "",
    assigneeName: "",
    saleStatus: "NEW",
    currency: "USD",
    source: "",
    language: "tr",
    country: "",
  });
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");
  const [validations, setValidations] = useState<ValidationRow[]>([]);
  const [previewSummary, setPreviewSummary] = useState<{
    total: number;
    ok: number;
    errors: number;
    duplicatesDb: number;
    placeholders: number;
  } | null>(null);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [resultsCsv, setResultsCsv] = useState("");
  const [execSummary, setExecSummary] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const all: DeskOpt[] = [];
      let skip = 0;
      for (let page = 0; page < 20; page++) {
        const res = await fetch(`/api/admin/import/meta?take=50&skip=${skip}`).catch(() => null);
        if (!res || !res.ok || cancel) return;
        const data = await res.json();
        const rows: DeskOpt[] = data.desks || [];
        for (const row of rows) {
          if (!all.some((desk) => desk.id === row.id)) all.push(row);
        }
        if (!data.hasMore || typeof data.nextSkip !== "number" || data.nextSkip <= skip) break;
        skip = data.nextSkip;
      }
      if (!cancel) setDesks(all);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const fieldOptions = useMemo(
    () =>
      TARGET_FIELDS.map((f) => ({
        value: f,
        label: t(FIELD_LABEL_KEYS[f]),
      })),
    [t]
  );

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setMsg("");
    setParse(null);
    setValidations([]);
    setResults([]);
    setExecSummary(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/import/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || data.warning || t("crm.import.parseFailed"));
        return;
      }
      setParse({
        columns: data.columns || [],
        rows: data.rows || [],
        samples: data.samples || {},
        suggestedMapping: data.suggestedMapping || {},
        format: data.format,
        fileName: data.fileName,
        unstructured: data.unstructured,
        warning: data.warning,
      });
      setMapping(data.suggestedMapping || {});
      setStep(2);
      if (data.warning) setMsg(data.warning);
    } catch {
      setMsg(t("crm.import.parseFailed"));
    } finally {
      setBusy(false);
    }
  }

  const runPreview = useCallback(async () => {
    if (!parse) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: parse.columns,
          rows: parse.rows,
          mapping,
          defaults,
          duplicateMode,
          format: parse.format,
          fileName: parse.fileName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || t("crm.import.previewFailed"));
        return;
      }
      setValidations(data.validations || []);
      setPreviewSummary(data.summary || null);
      setStep(3);
    } catch {
      setMsg(t("crm.import.previewFailed"));
    } finally {
      setBusy(false);
    }
  }, [parse, mapping, defaults, duplicateMode, t]);

  async function runImport() {
    if (!parse) return;
    if (!window.confirm(t("crm.import.confirm"))) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: parse.columns,
          rows: parse.rows,
          mapping,
          defaults,
          duplicateMode,
          format: parse.format,
          fileName: parse.fileName,
          confirm: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || t("crm.import.executeFailed"));
        return;
      }
      setResults(data.results || []);
      setResultsCsv(data.resultsCsv || "");
      setExecSummary(data.summary || null);
      setStep(4);
    } catch {
      setMsg(t("crm.import.executeFailed"));
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    const blob = new Blob([resultsCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetAll() {
    setStep(1);
    setParse(null);
    setMapping({});
    setValidations([]);
    setPreviewSummary(null);
    setResults([]);
    setResultsCsv("");
    setExecSummary(null);
    setMsg("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-black">{t("crm.import.title")}</h1>
          <p className="mt-0.5 text-xs text-neutral-500">{t("crm.import.subtitle")}</p>
      <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-950">
        <p className="font-semibold">{t("crm.import.assignModelTitle")}</p>
        <p className="mt-0.5">{t("crm.import.assignModel")}</p>
      </div>

        </div>
        <div className="flex gap-1 text-[10px]">
          {[1, 2, 3, 4].map((s) => (
            <span
              key={s}
              className={`rounded px-2 py-1 ${
                step === s ? "bg-black text-white" : step > s ? "bg-neutral-200 text-black" : "bg-white text-neutral-400 border border-neutral-200"
              }`}
            >
              {s}.{" "}
              {s === 1
                ? t("crm.import.step.upload")
                : s === 2
                  ? t("crm.import.step.mapping")
                  : s === 3
                    ? t("crm.import.step.preview")
                    : t("crm.import.step.result")}
            </span>
          ))}
        </div>
      </div>

      {msg && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {msg}
        </div>
      )}

      {step === 1 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="mb-3 text-sm text-neutral-600">{t("crm.import.uploadHint")}</p>
          <p className="mb-4 text-[11px] text-neutral-400">{t("crm.import.formats")}</p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-white px-6 py-10 hover:border-neutral-400">
            <span className="text-sm font-medium text-black">{t("crm.import.chooseFile")}</span>
            <span className="mt-1 text-[11px] text-neutral-400">max 10 MB</span>
            <input
              type="file"
              className="hidden"
              accept=".csv,.tsv,.xlsx,.xls,.ods,.json,.txt,.docx,.pdf,text/csv,application/json,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              disabled={busy}
              onChange={(e) => onUpload(e.target.files?.[0] || null)}
            />
          </label>
          {busy && <p className="mt-3 text-xs text-neutral-500">{t("crm.ui.loading")}</p>}
          <div className="mt-4 rounded border border-neutral-200 bg-white p-3 text-[11px] text-neutral-600 space-y-1">
            <p>• {t("crm.import.note.email")}</p>
            <p>• {t("crm.import.note.balance")}</p>
            <p>• {t("crm.import.note.pdf")}</p>
          </div>
        </div>
      )}

      {step === 2 && parse && (
        <div className="space-y-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-medium">{parse.fileName}</span>
                <span className="ml-2 text-neutral-400">
                  {parse.format.toUpperCase()} · {parse.rows.length} {t("crm.import.rows")}
                  {parse.unstructured ? ` · ${t("crm.import.unstructured")}` : ""}
                </span>
              </div>
              <button
                type="button"
                className="rounded bg-neutral-100 px-2 py-1 hover:bg-neutral-200"
                onClick={resetAll}
              >
                {t("crm.import.newFile")}
              </button>
            </div>

            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("crm.import.defaults")}
            </h2>
            <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-[11px]">
                <span className="text-neutral-500">{t("crm.ui.desk")}</span>
                <select
                  className="mt-0.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs"
                  value={defaults.desk}
                  onChange={(e) => setDefaults((d) => ({ ...d, desk: e.target.value }))}
                >
                  <option value="">—</option>
                  {desks.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                  <option value="Retention">{t("crm.team.ret")}</option>
                  <option value="Sale">{t("crm.team.sale")}</option>
                  <option value="TR">TR</option>
                </select>
              </label>
              <label className="text-[11px]">
                <span className="text-neutral-500">{t("crm.import.assignee")}</span>
                <input
                  className="mt-0.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs"
                  value={defaults.assigneeName || ""}
                  onChange={(e) => setDefaults((d) => ({ ...d, assigneeName: e.target.value }))}
                  placeholder={t("crm.import.assigneePh")}
                />
              </label>
              <label className="text-[11px]">
                <span className="text-neutral-500">{t("crm.ui.saleStatus")}</span>
                <select
                  className="mt-0.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs"
                  value={defaults.saleStatus}
                  onChange={(e) => setDefaults((d) => ({ ...d, saleStatus: e.target.value }))}
                >
                  {SALE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {code("crm.sale", s)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px]">
                <span className="text-neutral-500">{t("crm.ui.currency")}</span>
                <select
                  className="mt-0.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs"
                  value={defaults.currency}
                  onChange={(e) => setDefaults((d) => ({ ...d, currency: e.target.value }))}
                >
                  {ACCOUNT_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px]">
                <span className="text-neutral-500">{t("crm.import.field.source")}</span>
                <input
                  className="mt-0.5 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs"
                  value={defaults.source}
                  onChange={(e) => setDefaults((d) => ({ ...d, source: e.target.value }))}
                  placeholder={t("crm.import.sourcePh")}
                />
              </label>
              <label className="text-[11px]">
                <span className="text-neutral-500">{t("crm.import.field.language")}</span>
                <select
                  className="mt-0.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs"
                  value={defaults.language}
                  onChange={(e) => setDefaults((d) => ({ ...d, language: e.target.value }))}
                >
                  {["tr", "en", "ru", "de", "ar"].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px]">
                <span className="text-neutral-500">{t("crm.import.dupMode")}</span>
                <select
                  className="mt-0.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs"
                  value={duplicateMode}
                  onChange={(e) => setDuplicateMode(e.target.value as "skip" | "update")}
                >
                  <option value="skip">{t("crm.import.dupSkip")}</option>
                  <option value="update">{t("crm.import.dupUpdate")}</option>
                </select>
              </label>
            </div>

            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("crm.import.columnMap")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[10px] uppercase text-neutral-500">
                    <th className="px-2 py-1.5">{t("crm.import.sourceCol")}</th>
                    <th className="px-2 py-1.5">{t("crm.import.samples")}</th>
                    <th className="px-2 py-1.5">{t("crm.import.targetField")}</th>
                  </tr>
                </thead>
                <tbody>
                  {parse.columns.map((col) => (
                    <tr key={col} className="border-b border-neutral-100">
                      <td className="px-2 py-2 font-medium">{col}</td>
                      <td className="px-2 py-2 text-neutral-500">
                        {(parse.samples[col] || []).slice(0, 3).join(" · ") || "—"}
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className="w-full rounded border border-neutral-200 bg-white px-2 py-1"
                          value={mapping[col] || "ignore"}
                          onChange={(e) =>
                            setMapping((m) => ({ ...m, [col]: e.target.value as TargetField }))
                          }
                        >
                          {fieldOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={runPreview}
                className="rounded bg-black px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {busy ? t("crm.ui.loading") : t("crm.import.toPreview")}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            {previewSummary && (
              <div className="mb-3 flex flex-wrap gap-3 text-xs">
                <span className="rounded bg-neutral-100 px-2 py-1">
                  {t("crm.import.total")}: {previewSummary.total}
                </span>
                <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-800">
                  OK: {previewSummary.ok}
                </span>
                <span className="rounded bg-red-50 px-2 py-1 text-red-800">
                  {t("crm.import.errors")}: {previewSummary.errors}
                </span>
                <span className="rounded bg-amber-50 px-2 py-1 text-amber-800">
                  {t("crm.import.dupDb")}: {previewSummary.duplicatesDb}
                </span>
                {previewSummary.placeholders > 0 && (
                  <span className="rounded bg-sky-50 px-2 py-1 text-sky-800">
                    {t("crm.import.placeholders")}: {previewSummary.placeholders}
                  </span>
                )}
              </div>
            )}
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[800px] border-collapse text-[11px]">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-neutral-200 text-left text-[10px] uppercase text-neutral-500">
                    <th className="px-2 py-1">#</th>
                    <th className="px-2 py-1">{t("crm.ui.name")}</th>
                    <th className="px-2 py-1">Email</th>
                    <th className="px-2 py-1">{t("crm.ui.phone")}</th>
                    <th className="px-2 py-1">{t("crm.ui.desk")}</th>
                    <th className="px-2 py-1">{t("crm.ui.balance")}</th>
                    <th className="px-2 py-1">{t("crm.ui.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {validations.map((v) => (
                    <tr
                      key={v.rowIndex}
                      className={`border-b border-neutral-50 ${!v.ok ? "bg-red-50/60" : v.duplicateInDb ? "bg-amber-50/40" : ""}`}
                    >
                      <td className="px-2 py-1.5 text-neutral-400">{v.rowIndex + 1}</td>
                      <td className="px-2 py-1.5">
                        {v.mapped.firstName} {v.mapped.lastName}
                      </td>
                      <td className="px-2 py-1.5">
                        {v.mapped.email}
                        {v.mapped.emailPlaceholder && (
                          <span className="ml-1 text-[9px] text-sky-600">placeholder</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">{v.mapped.phone || "—"}</td>
                      <td className="px-2 py-1.5">{v.mapped.desk || "—"}</td>
                      <td className="px-2 py-1.5">
                        {v.mapped.balance} {v.mapped.currency}
                      </td>
                      <td className="px-2 py-1.5">
                        {v.ok ? (
                          <span className="text-emerald-700">OK</span>
                        ) : (
                          <span className="text-red-700">{v.errors.join(", ")}</span>
                        )}
                        {v.warnings.length > 0 && (
                          <div className="text-[9px] text-amber-700">{v.warnings.join(", ")}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between gap-2">
              <button
                type="button"
                className="rounded border border-neutral-200 px-3 py-2 text-xs hover:bg-neutral-50"
                onClick={() => setStep(2)}
              >
                {t("crm.import.back")}
              </button>
              <button
                type="button"
                disabled={busy || !validations.some((v) => v.ok)}
                onClick={runImport}
                className="rounded bg-black px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {busy ? t("crm.ui.loading") : t("crm.import.run")}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && execSummary && (
        <div className="space-y-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">{t("crm.import.done")}</h2>
            <div className="mb-4 flex flex-wrap gap-3 text-xs">
              <span className="rounded bg-emerald-50 px-3 py-1.5 text-emerald-800">
                {t("crm.import.created")}: {execSummary.created}
              </span>
              <span className="rounded bg-sky-50 px-3 py-1.5 text-sky-800">
                {t("crm.import.updated")}: {execSummary.updated}
              </span>
              <span className="rounded bg-neutral-100 px-3 py-1.5">
                {t("crm.import.skipped")}: {execSummary.skipped}
              </span>
              <span className="rounded bg-red-50 px-3 py-1.5 text-red-800">
                {t("crm.import.errors")}: {execSummary.errors}
              </span>
            </div>
            <p className="mb-3 text-[11px] text-amber-800">{t("crm.import.passwordOnce")}</p>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={downloadCsv}
                className="rounded bg-black px-3 py-1.5 text-xs text-white"
              >
                {t("crm.import.downloadCsv")}
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="rounded border border-neutral-200 px-3 py-1.5 text-xs"
              >
                {t("crm.import.newFile")}
              </button>
            </div>
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[10px] uppercase text-neutral-500">
                    <th className="px-2 py-1">#</th>
                    <th className="px-2 py-1">{t("crm.ui.status")}</th>
                    <th className="px-2 py-1">Email</th>
                    <th className="px-2 py-1">Account ID</th>
                    <th className="px-2 py-1">{t("common.password")}</th>
                    <th className="px-2 py-1">{t("crm.ui.note")}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.rowIndex} className="border-b border-neutral-50">
                      <td className="px-2 py-1.5 text-neutral-400">{r.rowIndex + 1}</td>
                      <td className="px-2 py-1.5">{r.status}</td>
                      <td className="px-2 py-1.5">{r.email}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px]">{r.accountLoginId || "—"}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px]">{r.password || "—"}</td>
                      <td className="px-2 py-1.5 text-neutral-500">{r.message || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
