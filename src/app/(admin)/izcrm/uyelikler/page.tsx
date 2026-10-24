"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Row = { id: string; userId: string; plan: string; status: string; priceUsd: number; expiresAt: string | null; createdAt: string; user: { name: string; email: string; accountLoginId: string | null } | null };

const T: Record<string, Record<string, string>> = {
  tr: { title: "Üyelikler (AI)", all: "Tümü", PENDING: "Bekliyor", ACTIVE: "Aktif", CANCELLED: "İptal", EXPIRED: "Süresi doldu", customer: "Müşteri", plan: "Plan", status: "Durum", exp: "Bitiş", created: "Talep", activate: "Aktifleştir", extend: "Uzat", cancel: "İptal et", days: "Gün", none: "Kayıt yok", note: "Yöneticiler her zaman sınırsız üyeliğe sahiptir.", confirm: "Üyelik iptal edilsin mi?", search: "Ara: ad, e-posta, hesap no, plan, ID", clearSearch: "Aramayı temizle", records: "kayıt", reset: "Temizle", refresh: "Yenile", loading: "Yükleniyor…", csv: "Gösterilen satırları CSV indir", price: "Ücret (USD)", email: "E-posta", account: "Hesap no", loadMore: "Daha fazla yükle" },
  en: { title: "Memberships (AI)", all: "All", PENDING: "Pending", ACTIVE: "Active", CANCELLED: "Cancelled", EXPIRED: "Expired", customer: "Customer", plan: "Plan", status: "Status", exp: "Expires", created: "Requested", activate: "Activate", extend: "Extend", cancel: "Cancel", days: "Days", none: "No records", note: "Admins always have unlimited membership.", confirm: "Cancel membership?", search: "Search: name, email, account, plan, ID", clearSearch: "Clear search", records: "records", reset: "Clear", refresh: "Refresh", loading: "Loading…", csv: "Download shown rows as CSV", price: "Price (USD)", email: "Email", account: "Account", loadMore: "Load more" },
  ru: { title: "Подписки (AI)", all: "Все", PENDING: "Ожидает", ACTIVE: "Активна", CANCELLED: "Отменена", EXPIRED: "Истекла", customer: "Клиент", plan: "План", status: "Статус", exp: "До", created: "Заявка", activate: "Активировать", extend: "Продлить", cancel: "Отменить", days: "Дней", none: "Нет записей", note: "У админов всегда безлимит.", confirm: "Отменить подписку?", search: "Поиск: имя, e-mail, счёт, план, ID", clearSearch: "Очистить поиск", records: "записей", reset: "Сбросить", refresh: "Обновить", loading: "Загрузка…", csv: "Скачать показанные строки CSV", price: "Цена (USD)", email: "E-mail", account: "Счёт", loadMore: "Загрузить ещё" },
  ar: { title: "العضويات (AI)", all: "الكل", PENDING: "معلّقة", ACTIVE: "نشطة", CANCELLED: "ملغاة", EXPIRED: "منتهية", customer: "العميل", plan: "الخطة", status: "الحالة", exp: "تنتهي", created: "الطلب", activate: "تفعيل", extend: "تمديد", cancel: "إلغاء", days: "أيام", none: "لا سجلات", note: "المسؤولون لديهم عضوية غير محدودة دائمًا.", confirm: "إلغاء العضوية؟", search: "بحث: الاسم، البريد، الحساب، الخطة، المعرّف", clearSearch: "مسح البحث", records: "سجل", reset: "مسح", refresh: "تحديث", loading: "جارٍ التحميل…", csv: "تنزيل الصفوف المعروضة CSV", price: "السعر (USD)", email: "البريد", account: "الحساب", loadMore: "تحميل المزيد" },
  de: { title: "Mitgliedschaften (KI)", all: "Alle", PENDING: "Ausstehend", ACTIVE: "Aktiv", CANCELLED: "Storniert", EXPIRED: "Abgelaufen", customer: "Kunde", plan: "Plan", status: "Status", exp: "Bis", created: "Angefragt", activate: "Aktivieren", extend: "Verlängern", cancel: "Stornieren", days: "Tage", none: "Keine Einträge", note: "Admins haben immer unbegrenzte Mitgliedschaft.", confirm: "Mitgliedschaft stornieren?", search: "Suche: Name, E-Mail, Konto, Plan, ID", clearSearch: "Suche löschen", records: "Einträge", reset: "Zurücksetzen", refresh: "Aktualisieren", loading: "Lädt…", csv: "Angezeigte Zeilen als CSV", price: "Preis (USD)", email: "E-Mail", account: "Konto", loadMore: "Mehr laden" },
};
const COLORS: Record<string, string> = { PENDING: "bg-amber-100 text-amber-800", ACTIVE: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-gray-200 text-gray-700", EXPIRED: "bg-red-100 text-red-700" };

const STATUS_FILTERS = ["", "PENDING", "ACTIVE", "EXPIRED", "CANCELLED"] as const;

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function UyeliklerPage() {
  const { locale } = useI18n();
  const L = T[locale] ?? T.tr;
  // Load the full set once (no status query) so chip counts stay stable; filter client-side
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [days, setDays] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const rowsRef = useRef<Row[]>([]);
  const loadGen = useRef(0);
  const load = useCallback((mode: "replace" | "more" = "replace") => {
    const gen = ++loadGen.current;
    const skip = mode === "more" ? rowsRef.current.length : 0;
    if (mode === "more") setMoreBusy(true);
    else setLoading(true);
    const params = new URLSearchParams({ take: "50", skip: String(skip) });
    fetch(`/api/admin/ai-memberships?${params}`, { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : { memberships: [] }))
      .then((d) => {
        if (gen !== loadGen.current) return;
        const incoming: Row[] = d.memberships || [];
        const seen = new Set(rowsRef.current.map((r) => r.id));
        const next = mode === "more" ? rowsRef.current.concat(incoming.filter((r) => !seen.has(r.id))) : incoming;
        rowsRef.current = next;
        setRows(next);
        setHasMore(Boolean(d.hasMore));
      })
      .catch(() => {
        if (gen !== loadGen.current || mode === "more") return;
        rowsRef.current = [];
        setRows([]);
        setHasMore(false);
      })
      .finally(() => {
        if (gen !== loadGen.current) return;
        if (mode === "more") setMoreBusy(false);
        else setLoading(false);
      });
  }, []);
  useEffect(load, [load]);

  // Stable base counts from the unfiltered loaded set (like tickets page)
  const counts = useMemo(() => {
    const c: Record<string, number> = { "": rows.length };
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr");
    return rows.filter((r) => {
      if (filter && r.status !== filter) return false;
      if (!needle) return true;
      const hay = [r.user?.name, r.user?.email, r.user?.accountLoginId, r.plan, r.userId]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr");
      return hay.includes(needle);
    });
  }, [rows, filter, q]);

  function downloadCsv() {
    const header = [L.customer, L.email, L.account, "User ID", L.plan, L.price, L.status, L.exp, L.created];
    const lines = [header.map(csvCell).join(",")];
    for (const r of shown) {
      lines.push(
        [r.user?.name ?? "", r.user?.email ?? "", r.user?.accountLoginId ?? "", r.userId, r.plan, r.priceUsd, r.status, r.expiresAt ?? "", r.createdAt]
          .map(csvCell)
          .join(","),
      );
    }
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uyelikler-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function act(id: string, action: string) {
    if (action === "cancel" && !confirm(L.confirm)) return;
    setBusy(id);
    await fetch("/api/admin/ai-memberships", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, days: Number(days[id]) || undefined }) });
    setBusy(""); load();
  }
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-1 text-xl font-semibold">{L.title}</h1>
      <p className="mb-4 text-xs text-gray-500">{L.note}</p>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQ("");
            }}
            placeholder={L.search}
            className="w-64 rounded-lg border border-black/15 bg-white px-2 py-1.5 pr-6"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label={L.clearSearch}
              title={`${L.clearSearch} (Esc)`}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-1 text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setFilter("");
            setQ("");
          }}
          className="rounded-lg border border-black/15 bg-white px-2 py-1.5 hover:bg-gray-50"
        >
          {L.reset}
        </button>
        <button type="button" onClick={() => load()} className="rounded-lg border border-black/15 bg-white px-2 py-1.5 hover:bg-gray-50">
          {loading ? L.loading : L.refresh}
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={shown.length === 0}
          title={L.csv}
          className="rounded-lg border border-black/15 bg-white px-2 py-1.5 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          CSV
        </button>
        <span className="text-gray-500 tabular-nums">
          {shown.length} {L.records}
        </span>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={`rounded-full border px-3 py-1 text-xs ${filter === s ? "border-black bg-black text-white" : "border-black/15"}`}>
            {s ? L[s] : L.all} <span className={`ml-0.5 tabular-nums ${filter === s ? "text-white/70" : "text-gray-400"}`}>{counts[s] || 0}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p className="text-sm text-gray-500">{loading && rows.length === 0 ? L.loading : L.none}</p> : (
        <div className="space-y-3">
          {shown.map((r) => (
            <div key={r.id} className="rounded-xl border border-black/10 bg-white p-3 text-sm text-[#111] md:flex md:items-center md:gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{r.user?.name ?? r.userId}</div>
                <div className="truncate text-xs text-gray-500">{r.user?.email} · <span className="font-mono">{r.user?.accountLoginId}</span></div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs md:mt-0">
                <span>{L.plan}: <b>{r.plan}</b> (${r.priceUsd})</span>
                <span className={`rounded-full px-2 py-0.5 ${COLORS[r.status] || ""}`}>{L[r.status] || r.status}</span>
                <span>{L.exp}: {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString(locale) : "—"}</span>
                <span className="text-gray-400">{L.created}: {new Date(r.createdAt).toLocaleDateString(locale)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 md:mt-0">
                <input value={days[r.id] ?? ""} onChange={(e) => setDays({ ...days, [r.id]: e.target.value.replace(/\D/g, "") })} placeholder={L.days} className="w-16 rounded-lg border border-black/15 px-2 py-1.5 text-xs" />
                {r.status === "ACTIVE" ? (
                  <button disabled={busy === r.id} onClick={() => act(r.id, "extend")} className="rounded-lg bg-black px-3 py-1.5 text-xs text-white">{L.extend}</button>
                ) : (
                  <button disabled={busy === r.id} onClick={() => act(r.id, "activate")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white">{L.activate}</button>
                )}
                {r.status !== "CANCELLED" && <button disabled={busy === r.id} onClick={() => act(r.id, "cancel")} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600">{L.cancel}</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {hasMore && (
        <button
          type="button"
          disabled={moreBusy}
          onClick={() => load("more")}
          className="mt-3 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-[#111] hover:bg-[#f7f7f7] disabled:opacity-50"
        >
          {moreBusy ? L.loading : L.loadMore}
        </button>
      )}
    </div>
  );
}
