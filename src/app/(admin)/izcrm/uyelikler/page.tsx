"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Row = { id: string; userId: string; plan: string; status: string; priceUsd: number; expiresAt: string | null; createdAt: string; user: { name: string; email: string; accountLoginId: string | null } | null };

const T: Record<string, Record<string, string>> = {
  tr: { title: "Üyelikler (AI)", all: "Tümü", PENDING: "Bekliyor", ACTIVE: "Aktif", CANCELLED: "İptal", EXPIRED: "Süresi doldu", customer: "Müşteri", plan: "Plan", status: "Durum", exp: "Bitiş", created: "Talep", activate: "Aktifleştir", extend: "Uzat", cancel: "İptal et", days: "Gün", none: "Kayıt yok", note: "Yöneticiler her zaman sınırsız üyeliğe sahiptir.", confirm: "Üyelik iptal edilsin mi?" },
  en: { title: "Memberships (AI)", all: "All", PENDING: "Pending", ACTIVE: "Active", CANCELLED: "Cancelled", EXPIRED: "Expired", customer: "Customer", plan: "Plan", status: "Status", exp: "Expires", created: "Requested", activate: "Activate", extend: "Extend", cancel: "Cancel", days: "Days", none: "No records", note: "Admins always have unlimited membership.", confirm: "Cancel membership?" },
  ru: { title: "Подписки (AI)", all: "Все", PENDING: "Ожидает", ACTIVE: "Активна", CANCELLED: "Отменена", EXPIRED: "Истекла", customer: "Клиент", plan: "План", status: "Статус", exp: "До", created: "Заявка", activate: "Активировать", extend: "Продлить", cancel: "Отменить", days: "Дней", none: "Нет записей", note: "У админов всегда безлимит.", confirm: "Отменить подписку?" },
  ar: { title: "العضويات (AI)", all: "الكل", PENDING: "معلّقة", ACTIVE: "نشطة", CANCELLED: "ملغاة", EXPIRED: "منتهية", customer: "العميل", plan: "الخطة", status: "الحالة", exp: "تنتهي", created: "الطلب", activate: "تفعيل", extend: "تمديد", cancel: "إلغاء", days: "أيام", none: "لا سجلات", note: "المسؤولون لديهم عضوية غير محدودة دائمًا.", confirm: "إلغاء العضوية؟" },
  de: { title: "Mitgliedschaften (KI)", all: "Alle", PENDING: "Ausstehend", ACTIVE: "Aktiv", CANCELLED: "Storniert", EXPIRED: "Abgelaufen", customer: "Kunde", plan: "Plan", status: "Status", exp: "Bis", created: "Angefragt", activate: "Aktivieren", extend: "Verlängern", cancel: "Stornieren", days: "Tage", none: "Keine Einträge", note: "Admins haben immer unbegrenzte Mitgliedschaft.", confirm: "Mitgliedschaft stornieren?" },
};
const COLORS: Record<string, string> = { PENDING: "bg-amber-100 text-amber-800", ACTIVE: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-gray-200 text-gray-700", EXPIRED: "bg-red-100 text-red-700" };

export default function UyeliklerPage() {
  const { locale } = useI18n();
  const L = T[locale] ?? T.tr;
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("");
  const [days, setDays] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const load = useCallback(() => {
    fetch(`/api/admin/ai-memberships${filter ? `?status=${filter}` : ""}`, { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : { memberships: [] })).then((d) => setRows(d.memberships || []));
  }, [filter]);
  useEffect(load, [load]);
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
      <div className="mb-4 flex flex-wrap gap-2">
        {["", "PENDING", "ACTIVE", "EXPIRED", "CANCELLED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full border px-3 py-1 text-xs ${filter === s ? "border-black bg-black text-white" : "border-black/15"}`}>{s ? L[s] : L.all}</button>
        ))}
      </div>
      {rows.length === 0 ? <p className="text-sm text-gray-500">{L.none}</p> : (
        <div className="space-y-3">
          {rows.map((r) => (
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
    </div>
  );
}
