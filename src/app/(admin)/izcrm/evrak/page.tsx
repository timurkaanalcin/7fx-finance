"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type PickUser = { id: string; name: string; firstName?: string | null; lastName?: string | null; email: string; accountLoginId?: string | null; phone?: string | null };
type Doc = {
  id: string;
  userId: string | null;
  title: string;
  fileName: string;
  mime: string;
  size: number;
  createdAt: string;
  user: { id: string; name: string; email: string; accountLoginId: string | null } | null;
};

const T: Record<string, Record<string, string>> = {
  tr: { title: "Evrak Ekle", customer: "Müşteri", search: "Ad, e-posta, hesap no veya telefon yazın", noMatch: "Eşleşen müşteri yok", searching: "…", change: "Değiştir", pick: "Müşteri seçin", global: "Tüm müşterilere (genel)", docTitle: "Evrak başlığı", file: "Dosya (PNG, JPG, WEBP, GIF, PDF · en fazla 8 MB)", save: "Kaydet", list: "Mevcut evraklar", filter: "Sadece seçili müşteri", del: "Sil", dl: "İndir", none: "Evrak yok", saved: "Evrak eklendi", confirm: "Bu evrak silinsin mi?", all: "Genel", loadMore: "Daha fazla yükle" },
  en: { title: "Add document", customer: "Customer", search: "Type name, email, account ID or phone", noMatch: "No matching customers", searching: "…", change: "Change", pick: "Select customer", global: "All customers (global)", docTitle: "Document title", file: "File (PNG, JPG, WEBP, GIF, PDF · max 8 MB)", save: "Save", list: "Existing documents", filter: "Selected customer only", del: "Delete", dl: "Download", none: "No documents", saved: "Document added", confirm: "Delete this document?", all: "Global", loadMore: "Load more" },
  ru: { title: "Добавить документ", customer: "Клиент", search: "Имя, e-mail, номер счёта или телефон", noMatch: "Клиенты не найдены", searching: "…", change: "Изменить", pick: "Выберите клиента", global: "Всем клиентам (общий)", docTitle: "Название документа", file: "Файл (PNG, JPG, WEBP, GIF, PDF · до 8 МБ)", save: "Сохранить", list: "Документы", filter: "Только выбранный клиент", del: "Удалить", dl: "Скачать", none: "Документов нет", saved: "Документ добавлен", confirm: "Удалить документ?", all: "Общий", loadMore: "Загрузить ещё" },
  ar: { title: "إضافة مستند", customer: "العميل", search: "اكتب الاسم أو البريد أو رقم الحساب أو الهاتف", noMatch: "لا يوجد عملاء مطابقون", searching: "…", change: "تغيير", pick: "اختر العميل", global: "لكل العملاء (عام)", docTitle: "عنوان المستند", file: "ملف (PNG, JPG, WEBP, GIF, PDF · حتى 8 ميغابايت)", save: "حفظ", list: "المستندات الحالية", filter: "العميل المحدد فقط", del: "حذف", dl: "تنزيل", none: "لا توجد مستندات", saved: "تمت إضافة المستند", confirm: "حذف هذا المستند؟", all: "عام", loadMore: "تحميل المزيد" },
  de: { title: "Dokument hinzufügen", customer: "Kunde", search: "Name, E-Mail, Kontonr. oder Telefon eingeben", noMatch: "Keine passenden Kunden", searching: "…", change: "Ändern", pick: "Kunde auswählen", global: "Alle Kunden (global)", docTitle: "Dokumenttitel", file: "Datei (PNG, JPG, WEBP, GIF, PDF · max. 8 MB)", save: "Speichern", list: "Vorhandene Dokumente", filter: "Nur ausgewählter Kunde", del: "Löschen", dl: "Herunterladen", none: "Keine Dokumente", saved: "Dokument hinzugefügt", confirm: "Dokument löschen?", all: "Global", loadMore: "Mehr laden" },
};

const cls = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-black/30";

export default function EvrakPage() {
  const { locale } = useI18n();
  const L = T[locale] ?? T.en;
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<PickUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [picked, setPicked] = useState<PickUser | null>(null);
  const [global, setGlobal] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [onlySel, setOnlySel] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const docsRef = useRef<Doc[]>([]);
  const loadGen = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) {
      setOpts([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const h = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/customer-documents/search?q=${encodeURIComponent(term)}`, { cache: "no-store" });
        const d = await r.json().catch(() => ({}));
        if (!cancelled) setOpts(r.ok ? d.users || [] : []);
      } catch {
        if (!cancelled) setOpts([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(h);
    };
  }, [q]);

  const label = (u: PickUser) => u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const gen = ++loadGen.current;
    const skip = mode === "more" ? docsRef.current.length : 0;
    if (mode === "more") setMoreBusy(true);
    try {
      const params = new URLSearchParams({ take: "50", skip: String(skip) });
      if (onlySel && userId) params.set("userId", userId);
      const r = await fetch(`/api/admin/customer-documents?${params}`, { cache: "no-store" });
      if (!r.ok || gen !== loadGen.current) return;
      const data = await r.json();
      const incoming: Doc[] = data.documents || [];
      const seen = new Set(docsRef.current.map((d) => d.id));
      const next = mode === "more" ? docsRef.current.concat(incoming.filter((d) => !seen.has(d.id))) : incoming;
      docsRef.current = next;
      setDocs(next);
      setHasMore(Boolean(data.hasMore));
    } finally {
      if (mode === "more" && gen === loadGen.current) setMoreBusy(false);
    }
  }, [onlySel, userId]);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setMsg("");
    if (!file || (!global && !userId)) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("title", title);
      if (global) fd.set("global", "1");
      else fd.set("userId", userId);
      const r = await fetch("/api/admin/customer-documents", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(d.error || "Error");
        return;
      }
      setMsg(L.saved);
      setTitle("");
      setFile(null);
      const fi = document.getElementById("evrak-file") as HTMLInputElement | null;
      if (fi) fi.value = "";
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!window.confirm(L.confirm)) return;
    const r = await fetch(`/api/admin/customer-documents/${id}`, { method: "DELETE" });
    if (r.ok) await load();
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold text-[#111]">{L.title}</h1>
      <div className="mb-6 grid gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#5c657a]">{L.customer}</label>
          {picked && !global ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-black/15 bg-[#f6f6f6] px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#111]">{label(picked)}</span>
                <span className="block truncate text-xs text-[#5c657a]">
                  {picked.email}
                  {picked.accountLoginId ? ` · ${picked.accountLoginId}` : ""}
                </span>
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md border border-black/15 px-2 py-1 text-xs text-[#111]"
                onClick={() => {
                  setPicked(null);
                  setUserId("");
                  setDropOpen(true);
                }}
              >
                {L.change}
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                className={cls}
                placeholder={L.search}
                value={q}
                disabled={global}
                autoComplete="off"
                onFocus={() => setDropOpen(true)}
                onBlur={() => window.setTimeout(() => setDropOpen(false), 150)}
                onChange={(e) => {
                  setQ(e.target.value);
                  setDropOpen(true);
                }}
              />
              {dropOpen && !global && q.trim().length >= 1 && (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-black/10 bg-white shadow-lg">
                  {searching && opts.length === 0 && <li className="px-3 py-2 text-sm text-[#5c657a]">{L.searching}</li>}
                  {!searching && opts.length === 0 && <li className="px-3 py-2 text-sm text-[#5c657a]">{L.noMatch}</li>}
                  {opts.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-[#f3f3f3]"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setPicked(u);
                          setUserId(u.id);
                          setDropOpen(false);
                          setQ("");
                        }}
                      >
                        <span className="block text-sm font-medium text-[#111]">{label(u)}</span>
                        <span className="block text-xs text-[#5c657a]">
                          {u.email}
                          {u.accountLoginId ? ` · ${u.accountLoginId}` : ""}
                          {u.phone ? ` · ${u.phone}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-[#111]">
            <input type="checkbox" checked={global} onChange={(e) => setGlobal(e.target.checked)} />
            {L.global}
          </label>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#5c657a]">{L.docTitle}</label>
          <input className={cls} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
          <label className="block text-xs font-medium text-[#5c657a]">{L.file}</label>
          <input
            id="evrak-file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="block w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={busy || !file || (!global && !userId)}
              className="min-h-[40px] rounded-lg bg-[#111] px-5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {L.save}
            </button>
            {msg && <span className="text-sm text-[#5c657a]">{msg}</span>}
          </div>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#111]">{L.list}</h2>
        <label className="flex items-center gap-2 text-xs text-[#5c657a]">
          <input type="checkbox" checked={onlySel} onChange={(e) => setOnlySel(e.target.checked)} />
          {L.filter}
        </label>
      </div>
      <div className="space-y-2 md:hidden">
        {docs.length === 0 && <div className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#5c657a]">{L.none}</div>}
        {docs.map((d) => (
          <div key={d.id} className="rounded-xl border border-black/10 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 break-words text-sm font-semibold text-[#111]">{d.title}</div>
              <span className="shrink-0 rounded bg-[#f3f3f3] px-1.5 py-0.5 text-[10px] font-bold text-[#5c657a]">{d.mime === "application/pdf" ? "PDF" : "IMG"}</span>
            </div>
            <div className="mt-1 break-words text-xs text-[#5c657a]">{d.user ? `${d.user.name} · ${d.user.accountLoginId || d.user.email}` : L.all}</div>
            <div className="mt-0.5 text-xs text-[#5c657a]">
              {new Date(d.createdAt).toLocaleString()} · {Math.max(1, Math.round(d.size / 1024))} KB
            </div>
            <div className="mt-2 flex gap-2">
              <a href={`/api/admin/customer-documents/${d.id}`} className="flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-black/15 text-sm text-[#111]">
                {L.dl}
              </a>
              <button type="button" onClick={() => del(d.id)} className="min-h-[40px] flex-1 rounded-lg border border-red-200 text-sm text-red-600">
                {L.del}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-black/10 bg-white md:block">
        <table className="w-full text-sm">
          <tbody>
            {docs.length === 0 && (
              <tr>
                <td className="p-6 text-center text-[#5c657a]">{L.none}</td>
              </tr>
            )}
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-black/5">
                <td className="p-3 font-medium text-[#111]">{d.title}</td>
                <td className="p-3 text-[#5c657a]">{d.user ? `${d.user.name} · ${d.user.accountLoginId || d.user.email}` : L.all}</td>
                <td className="p-3 text-[#5c657a]">{d.mime === "application/pdf" ? "PDF" : "IMG"} · {Math.max(1, Math.round(d.size / 1024))} KB</td>
                <td className="p-3 text-[#5c657a]">{new Date(d.createdAt).toLocaleString()}</td>
                <td className="whitespace-nowrap p-3 text-right">
                  <a href={`/api/admin/customer-documents/${d.id}`} className="mr-3 text-[#111] underline">
                    {L.dl}
                  </a>
                  <button type="button" onClick={() => del(d.id)} className="text-red-600">
                    {L.del}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          type="button"
          disabled={moreBusy}
          onClick={() => void load("more")}
          className="mt-3 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-[#111] hover:bg-[#f7f7f7] disabled:opacity-50"
        >
          {moreBusy ? L.searching : L.loadMore}
        </button>
      )}
    </div>
  );
}
