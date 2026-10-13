"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Row = { name: string; leads: number; valid: number; invalid: number; deposits: number; day: number; week: number; month: number; m3: number; m6: number; year: number };
type Lang = "ru" | "tr" | "en";
const L: Record<Lang, Record<string, string>> = {
  ru: { title: "Аффилейты", intro: "Аффилейт = источник/название при загрузке лидов (Массовое добавление). Невалид — отмеченные вручную или по статусу.", aff: "Аффилейт", leads: "Лиды", valid: "Валид", invalid: "Невалид", dep: "Депозиты", cr: "Конв. %", crv: "Конв. валид %", day: "День", week: "Неделя", month: "Месяц", m3: "3 мес", m6: "6 мес", year: "Год", all: "Всё время", total: "Итого", period: "Период", csv: "CSV", bulk: "Отметить невалиды списком", hint: "Вставьте email / телефоны / ID (по одному в строке, или через запятую). Можно загрузить .txt/.csv.", markInv: "Отметить невалид", markVal: "Снять невалид", upd: "Обновлено", nf: "Не найдено", load: "Загрузить файл" },
  tr: { title: "Affiliateler", intro: "Affiliate = lead yüklemedeki kaynak adı. Geçersiz: elle işaretlenen veya statüye göre.", aff: "Affiliate", leads: "Lead", valid: "Geçerli", invalid: "Geçersiz", dep: "Yatırım", cr: "Dönüşüm %", crv: "Geçerli dön. %", day: "Gün", week: "Hafta", month: "Ay", m3: "3 ay", m6: "6 ay", year: "Yıl", all: "Tümü", total: "Toplam", period: "Dönem", csv: "CSV", bulk: "Listeyle geçersiz işaretle", hint: "E-posta / telefon / ID yapıştırın (satır satır veya virgülle). .txt/.csv yüklenebilir.", markInv: "Geçersiz yap", markVal: "Geçersizi kaldır", upd: "Güncellendi", nf: "Bulunamadı", load: "Dosya yükle" },
  en: { title: "Affiliates", intro: "Affiliate = source name set at lead upload. Invalid = manually flagged or by status.", aff: "Affiliate", leads: "Leads", valid: "Valid", invalid: "Invalid", dep: "Deposits", cr: "Conv. %", crv: "Conv. valid %", day: "Day", week: "Week", month: "Month", m3: "3 mo", m6: "6 mo", year: "Year", all: "All time", total: "Total", period: "Period", csv: "CSV", bulk: "Mark invalids by list", hint: "Paste emails / phones / IDs (one per line or comma separated). .txt/.csv upload supported.", markInv: "Mark invalid", markVal: "Unmark invalid", upd: "Updated", nf: "Not found", load: "Upload file" },
};
const PERIODS = ["day", "week", "month", "m3", "m6", "year", "all"] as const;
const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) : "0.0");

export default function AffiliatesPage() {
  const { locale } = useI18n();
  const t = L[(["ru", "tr"].includes(String(locale)) ? locale : "en") as Lang];
  const [period, setPeriod] = useState<string>("month");
  const [rows, setRows] = useState<Row[]>([]);
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 }>({ k: "leads", d: -1 });
  const [list, setList] = useState("");
  const [msg, setMsg] = useState("");
  const [canWrite, setCanWrite] = useState(false);

  const load = () =>
    fetch(`/api/admin/analytics/affiliates?period=${period}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
  useEffect(() => {
    load();
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCanWrite(!d.permissions?.scoped && !d.permissions?.readOnly))
      .catch(() => {});
  }, []);

  const val = (r: Row, k: string): number | string =>
    k === "name" ? r.name.toLowerCase() : k === "cr" ? r.leads ? r.deposits / r.leads : 0 : k === "crv" ? r.valid ? r.deposits / r.valid : 0 : (r[k as keyof Row] as number);
  const sorted = useMemo(
    () => [...rows].sort((a, b) => (val(a, sort.k) > val(b, sort.k) ? 1 : val(a, sort.k) < val(b, sort.k) ? -1 : 0) * sort.d),
    [rows, sort] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const tot = useMemo(() => {
    const z: Row = { name: t.total, leads: 0, valid: 0, invalid: 0, deposits: 0, day: 0, week: 0, month: 0, m3: 0, m6: 0, year: 0 };
    for (const r of rows) for (const k of Object.keys(z) as (keyof Row)[]) if (k !== "name") (z[k] as number) += r[k] as number;
    return z;
  }, [rows, t.total]);

  const cols: [string, string][] = [["name", t.aff], ["day", t.day], ["week", t.week], ["month", t.month], ["m3", t.m3], ["m6", t.m6], ["year", t.year], ["leads", `${t.leads} (${t[period]})`], ["valid", t.valid], ["invalid", t.invalid], ["deposits", t.dep], ["cr", t.cr], ["crv", t.crv]];
  const cell = (r: Row, k: string) => (k === "cr" ? pct(r.deposits, r.leads) : k === "crv" ? pct(r.deposits, r.valid) : String(r[k as keyof Row]));

  const csv = () => {
    const lines = [cols.map((c) => c[1]), ...[...sorted, tot].map((r) => cols.map((c) => cell(r, c[0])))];
    const blob = new Blob(["\ufeff" + lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `affiliates-${period}.csv`;
    a.click();
  };
  const mark = async (invalid: boolean) => {
    setMsg("…");
    const r = await fetch("/api/admin/analytics/affiliates/invalid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list, invalid }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Error");
    setMsg(`${t.upd}: ${d.updated} · ${t.nf}: ${d.notFoundCount}${d.notFound?.length ? " — " + d.notFound.slice(0, 20).join(", ") : ""}`);
    load();
  };

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">{t.title}</h1>
      <p className="mb-3 text-[11px] text-neutral-500">{t.intro}</p>
      <div className="mb-3 flex flex-wrap items-center gap-1 text-[11px]">
        <span className="mr-1 text-neutral-500">{t.period}:</span>
        {PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`rounded border px-2 py-1 ${period === p ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
            {t[p]}
          </button>
        ))}
        <button onClick={csv} className="ml-auto rounded border border-neutral-300 px-2 py-1">⬇ {t.csv}</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              {cols.map(([k, l]) => (
                <th key={k} className="cursor-pointer whitespace-nowrap px-2 py-2" onClick={() => setSort((s) => ({ k, d: s.k === k ? (-s.d as 1 | -1) : -1 }))}>
                  {l}{sort.k === k ? (sort.d === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.name} className="border-t border-neutral-100">
                {cols.map(([k]) => <td key={k} className="whitespace-nowrap px-2 py-1.5">{cell(r, k)}</td>)}
              </tr>
            ))}
            <tr className="border-t-2 border-neutral-300 font-semibold">
              {cols.map(([k]) => <td key={k} className="whitespace-nowrap px-2 py-1.5">{cell(tot, k)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      {canWrite && (
        <div className="mt-4 rounded-lg border border-neutral-200 p-3 text-[11px]">
          <div className="mb-1 font-semibold">{t.bulk}</div>
          <p className="mb-2 text-neutral-500">{t.hint}</p>
          <textarea value={list} onChange={(e) => setList(e.target.value)} rows={5} className="w-full rounded border border-neutral-300 p-2 font-mono" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded border border-neutral-300 px-2 py-1">
              {t.load}
              <input type="file" accept=".txt,.csv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setList((await f.text()).trim()); }} />
            </label>
            <button onClick={() => mark(true)} className="rounded bg-red-600 px-3 py-1 text-white">{t.markInv}</button>
            <button onClick={() => mark(false)} className="rounded border border-neutral-300 px-3 py-1">{t.markVal}</button>
            <span className="text-neutral-600">{msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
