"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { INVALID_REASONS } from "@/lib/lead-invalid-reasons";

type Row = { name: string; leads: number; valid: number; invalid: number; reasons?: Record<string, number>; deposits: number; day: number; week: number; month: number; m3: number; m6: number; year: number };
type Lang = "en" | "tr" | "de" | "ru" | "ar";
const LANGS: readonly Lang[] = ["en", "tr", "de", "ru", "ar"];
function affiliateLang(locale: string): Lang {
  const base = locale.toLowerCase().split("-")[0];
  return (LANGS as readonly string[]).includes(base) ? (base as Lang) : "en";
}
const L: Record<Lang, Record<string, string>> = {
  ru: { reason: "Причина", allR: "Все причины", noneR: "Без причины (валидный)", other: "Без причины", recalc: "Пересчитать", rules: "Правила автоклассификации", wh: "Рабочие часы", days: "Дни (0=Вс…6=Сб)", tz: "Часовой пояс", geo: "Разрешённые страны", age: "Возраст", save: "Сохранить", recalcDone: "Проверено / изменено", byReason: "Невалидные по причинам", title: "Партнёры", intro: "Партнёр — источник, указанный при загрузке лидов. Невалидный — отмечен вручную или по статусу.", aff: "Партнёр", leads: "Лиды", valid: "Валидный", invalid: "Невалидный", dep: "Депозиты", cr: "Конв. %", crv: "Конв. валидных %", day: "День", week: "Неделя", month: "Месяц", m3: "3 мес", m6: "6 мес", year: "Год", all: "Всё время", total: "Итого", period: "Период", csv: "CSV", bulk: "Отметить невалидные списком", hint: "Вставьте эл. почту, телефоны или ID (по одному в строке или через запятую). Можно загрузить .txt/.csv.", markInv: "Отметить невалидным", markVal: "Снять невалидность", upd: "Обновлено", nf: "Не найдено", load: "Загрузить файл" },
  tr: { reason: "Sebep", allR: "Tüm sebepler", noneR: "Sebepsiz (geçerli)", other: "Sebepsiz", recalc: "Yeniden hesapla", rules: "Otomatik sınıflandırma kuralları", wh: "Mesai saatleri", days: "Günler (0=Paz…6=Cmt)", tz: "Saat dilimi", geo: "İzinli ülkeler", age: "Yaş", save: "Kaydet", recalcDone: "Taranan / değişen", byReason: "Sebebe göre geçersizler", title: "Yönlendirenler", intro: "Yönlendiren, aday yüklemedeki kaynak adıdır. Geçersiz: elle işaretlenen veya duruma göre ayrılan kayıt.", aff: "Yönlendiren", leads: "Aday", valid: "Geçerli", invalid: "Geçersiz", dep: "Yatırım", cr: "Dönüşüm %", crv: "Geçerli dön. %", day: "Gün", week: "Hafta", month: "Ay", m3: "3 ay", m6: "6 ay", year: "Yıl", all: "Tümü", total: "Toplam", period: "Dönem", csv: "CSV", bulk: "Listeyle geçersiz işaretle", hint: "E-posta, telefon veya ID yapıştırın (satır satır veya virgülle). .txt/.csv yüklenebilir.", markInv: "Geçersiz yap", markVal: "Geçersizi kaldır", upd: "Güncellendi", nf: "Bulunamadı", load: "Dosya yükle" },
  de: { reason: "Grund", allR: "Alle Gründe", noneR: "Ohne Grund (gültig)", other: "Ohne Grund", recalc: "Neu berechnen", rules: "Regeln der automatischen Einstufung", wh: "Arbeitszeit", days: "Tage (0=So…6=Sa)", tz: "Zeitzone", geo: "Erlaubte Länder", age: "Alter", save: "Speichern", recalcDone: "Geprüft / geändert", byReason: "Ungültig nach Grund", title: "Partner", intro: "Partner ist der Quellenname beim Lead-Upload. Ungültig heißt manuell markiert oder nach Status.", aff: "Partner", leads: "Leads", valid: "Gültig", invalid: "Ungültig", dep: "Einzahlungen", cr: "Konv. %", crv: "Konv. gültig %", day: "Tag", week: "Woche", month: "Monat", m3: "3 Mon.", m6: "6 Mon.", year: "Jahr", all: "Gesamt", total: "Summe", period: "Zeitraum", csv: "CSV", bulk: "Ungültige per Liste markieren", hint: "E-Mails, Telefone oder IDs einfügen (eine pro Zeile oder mit Komma). .txt/.csv möglich.", markInv: "Ungültig markieren", markVal: "Ungültig aufheben", upd: "Aktualisiert", nf: "Nicht gefunden", load: "Datei laden" },
  ar: { reason: "السبب", allR: "كل الأسباب", noneR: "بلا سبب (صالح)", other: "بلا سبب", recalc: "إعادة الحساب", rules: "قواعد التصنيف التلقائي", wh: "ساعات العمل", days: "الأيام (0=أحد…6=سبت)", tz: "المنطقة الزمنية", geo: "الدول المسموحة", age: "العمر", save: "حفظ", recalcDone: "فُحص / تغيّر", byReason: "غير الصالح حسب السبب", title: "الشركاء", intro: "الشريك هو اسم المصدر عند رفع العملاء المحتملين. غير الصالح يُعلَّم يدويًا أو حسب الحالة.", aff: "الشريك", leads: "عملاء", valid: "صالح", invalid: "غير صالح", dep: "إيداعات", cr: "تحويل %", crv: "تحويل الصالح %", day: "يوم", week: "أسبوع", month: "شهر", m3: "3 أش.", m6: "6 أش.", year: "سنة", all: "الكل", total: "المجموع", period: "الفترة", csv: "CSV", bulk: "تعليم غير الصالح بقائمة", hint: "ألصق البريد أو الهاتف أو المعرّف (سطر لكل واحد أو مفصول بفاصلة). يمكن رفع .txt/.csv.", markInv: "تعليم غير صالح", markVal: "إزالة غير الصالح", upd: "تم التحديث", nf: "غير موجود", load: "رفع ملف" },
  en: { reason: "Reason", allR: "All reasons", noneR: "No reason (valid)", other: "No reason", recalc: "Recalculate", rules: "Auto-classification rules", wh: "Working hours", days: "Days (0=Sun…6=Sat)", tz: "Timezone", geo: "Allowed countries", age: "Age", save: "Save", recalcDone: "Scanned / changed", byReason: "Invalids by reason", title: "Affiliates", intro: "Affiliate = source name set at lead upload. Invalid = manually flagged or by status.", aff: "Affiliate", leads: "Leads", valid: "Valid", invalid: "Invalid", dep: "Deposits", cr: "Conv. %", crv: "Conv. valid %", day: "Day", week: "Week", month: "Month", m3: "3 mo", m6: "6 mo", year: "Year", all: "All time", total: "Total", period: "Period", csv: "CSV", bulk: "Mark invalids by list", hint: "Paste emails / phones / IDs (one per line or comma separated). .txt/.csv upload supported.", markInv: "Mark invalid", markVal: "Unmark invalid", upd: "Updated", nf: "Not found", load: "Upload file" },
};
const PERIODS = ["day", "week", "month", "m3", "m6", "year", "all"] as const;
const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) : "0.0");

export default function AffiliatesPage() {
  const { locale } = useI18n();
  const t = L[affiliateLang(String(locale))];
  const [period, setPeriod] = useState<string>("month");
  const [rows, setRows] = useState<Row[]>([]);
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 }>({ k: "leads", d: -1 });
  const [list, setList] = useState("");
  const [msg, setMsg] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [rules, setRules] = useState<{ whStart: string; whEnd: string; whDays: number[]; tz: string; countries: string[]; minAge: number; maxAge: number } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const lang = affiliateLang(String(locale));
  const rLabel = (c: string) => (c === "OTHER" ? t.other : (INVALID_REASONS.find((r) => r.code === c)?.[lang] ?? c));

  const load = () =>
    fetch(`/api/admin/analytics/affiliates?period=${period}${reason ? `&reason=${reason}` : ""}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
  useEffect(() => {
    load();
  }, [period, reason]); // eslint-disable-line react-hooks/exhaustive-deps -- load uses period and reason; its identity changes every render
  useEffect(() => {
    fetch("/api/auth/me?scope=admin")
      .then((r) => r.json())
      .then((d) => setCanWrite(!d.permissions?.scoped && !d.permissions?.readOnly))
      .catch(() => {});
    fetch("/api/admin/analytics/affiliates/rules").then((r) => r.json()).then((d) => d.rules && setRules(d.rules)).catch(() => {});
  }, []);
  const recalc = async () => {
    setMsg("…");
    const r = await fetch("/api/admin/analytics/affiliates/recalc", { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? `${t.recalcDone}: ${d.scanned} / ${d.changed}` : d.error || "Error");
    load();
  };
  const saveRules = async () => {
    const r = await fetch("/api/admin/analytics/affiliates/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setRules(d.rules); setMsg("✓"); } else setMsg(d.error || "Error");
  };

  const val = (r: Row, k: string): number | string =>
    k === "name" ? r.name.toLowerCase() : k === "cr" ? r.leads ? r.deposits / r.leads : 0 : k === "crv" ? r.valid ? r.deposits / r.valid : 0 : (r[k as keyof Row] as number);
  const sorted = useMemo(
    () => [...rows].sort((a, b) => (val(a, sort.k) > val(b, sort.k) ? 1 : val(a, sort.k) < val(b, sort.k) ? -1 : 0) * sort.d),
    [rows, sort] // eslint-disable-line react-hooks/exhaustive-deps -- val closes over rows and sort and changes every render
  );
  const tot = useMemo(() => {
    const z: Row = { name: t.total, leads: 0, valid: 0, invalid: 0, deposits: 0, day: 0, week: 0, month: 0, m3: 0, m6: 0, year: 0 };
    const zr: Record<string, number> = {};
    for (const r of rows) {
      for (const k of Object.keys(z) as (keyof Row)[]) if (k !== "name" && k !== "reasons") (z[k] as number) += r[k] as number;
      for (const [c, n] of Object.entries(r.reasons || {})) zr[c] = (zr[c] || 0) + n;
    }
    z.reasons = zr;
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
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="ml-2 rounded border border-neutral-300 px-2 py-1">
          <option value="">{t.reason}: {t.allR}</option>
          <option value="NONE">{t.noneR}</option>
          {INVALID_REASONS.map((r) => <option key={r.code} value={r.code}>{r[lang]}</option>)}
        </select>
        {canWrite && <button onClick={recalc} className="rounded border border-neutral-900 px-2 py-1">↻ {t.recalc}</button>}
        {canWrite && <button onClick={() => setShowRules((v) => !v)} className="rounded border border-neutral-300 px-2 py-1">⚙ {t.rules}</button>}
        <button onClick={csv} className="ml-auto rounded border border-neutral-300 px-2 py-1">⬇ {t.csv}</button>
      </div>
      {showRules && rules && (
        <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-3 text-[11px]">
          <label>{t.wh}<br /><input type="time" value={rules.whStart} onChange={(e) => setRules({ ...rules, whStart: e.target.value })} className="rounded border px-1" /> – <input type="time" value={rules.whEnd} onChange={(e) => setRules({ ...rules, whEnd: e.target.value })} className="rounded border px-1" /></label>
          <label>{t.days}<br /><input value={rules.whDays.join(",")} onChange={(e) => setRules({ ...rules, whDays: e.target.value.split(/[\s,]+/).filter(Boolean).map(Number) })} className="w-24 rounded border px-1" /></label>
          <label>{t.tz}<br /><input value={rules.tz} onChange={(e) => setRules({ ...rules, tz: e.target.value })} className="w-36 rounded border px-1" /></label>
          <label>{t.geo}<br /><input value={rules.countries.join(",")} onChange={(e) => setRules({ ...rules, countries: e.target.value.split(/[\s,]+/).filter(Boolean) })} className="w-28 rounded border px-1" /></label>
          <label>{t.age}<br /><input type="number" value={rules.minAge} onChange={(e) => setRules({ ...rules, minAge: +e.target.value })} className="w-14 rounded border px-1" /> – <input type="number" value={rules.maxAge} onChange={(e) => setRules({ ...rules, maxAge: +e.target.value })} className="w-14 rounded border px-1" /></label>
          <button onClick={saveRules} className="rounded bg-neutral-900 px-3 py-1 text-white">{t.save}</button>
        </div>
      )}
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
            {[...sorted, tot].map((r, i) => {
              const isTot = i === sorted.length;
              const key = isTot ? "__total" : r.name;
              const reasons = Object.entries(r.reasons || {}).sort((a, b) => b[1] - a[1]);
              return [
                <tr key={key} onClick={() => reasons.length && setOpen(open === key ? null : key)} className={`${isTot ? "border-t-2 border-neutral-300 font-semibold" : "border-t border-neutral-100"} ${reasons.length ? "cursor-pointer hover:bg-neutral-50" : ""}`}>
                  {cols.map(([k]) => <td key={k} className="whitespace-nowrap px-2 py-1.5">{k === "invalid" && reasons.length ? `${cell(r, k)} ${open === key ? "▾" : "▸"}` : cell(r, k)}</td>)}
                </tr>,
                open === key && (
                  <tr key={key + "-r"} className="bg-red-50/40">
                    <td colSpan={cols.length} className="px-3 py-2">
                      <div className="mb-1 text-neutral-500">{t.byReason}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {reasons.map(([c, n]) => (
                          <span key={c} className="rounded border border-red-200 bg-white px-2 py-0.5">{rLabel(c)}: <b>{n}</b> ({pct(n, r.invalid)}%)</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
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
