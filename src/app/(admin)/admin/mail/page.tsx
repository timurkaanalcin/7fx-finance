"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";

type Tpl = {
  id: string;
  name: string;
  subject: string;
  body: string;
  deskName: string | null;
  active: boolean;
  updatedAt: string;
};

export default function MailPage() {
  const [templates, setTemplates] = useState<Tpl[]>([]);
  const [form, setForm] = useState({ name: "", subject: "", body: "", deskName: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/mail");
    if (!res.ok) return;
    const data = await res.json();
    setTemplates(data.templates || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const payload = editId
        ? { action: "update", id: editId, ...form, active: true }
        : { action: "create", ...form };
      const res = await fetch("/api/admin/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Kayıt başarısız");
        return;
      }
      setForm({ name: "", subject: "", body: "", deskName: "" });
      setEditId(null);
      setMsg(editId ? "Şablon güncellendi" : "Şablon eklendi");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch("/api/admin/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(t: Tpl) {
    setEditId(t.id);
    setForm({ name: t.name, subject: t.subject, body: t.body, deskName: t.deskName || "" });
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Mail Şablonları</h1>
      <p className="mb-3 text-[11px] text-slate-500">
        CRM e-posta şablonları — {"{{name}}"} yer tutucusu kullanılabilir
      </p>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-slate-800 bg-[#0a1020] p-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold">{t.name}</h2>
                <StatusBadge status={t.active ? "ACTIVE" : "CLOSED"} />
              </div>
              <p className="text-[11px] text-slate-400">Konu: {t.subject}</p>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[11px] text-slate-300">{t.body}</p>
              <p className="mt-2 text-[10px] text-slate-600">Desk: {t.deskName || "—"}</p>
              <div className="mt-2 flex gap-2 text-[10px]">
                <button type="button" onClick={() => startEdit(t)} className="text-sky-400 hover:underline">
                  Düzenle
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(t.id)}
                  className="text-red-400 hover:underline"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="col-span-2 rounded-lg border border-dashed border-slate-800 px-3 py-8 text-center text-xs text-slate-500">
              Şablon yok
            </p>
          )}
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0a1020] p-3">
          <h2 className="mb-2 text-xs font-semibold text-slate-300">
            {editId ? "Şablon düzenle" : "Yeni şablon"}
          </h2>
          <div className="space-y-2 text-xs">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ad"
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            />
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Konu"
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            />
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={8}
              placeholder="Gövde"
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5 font-mono text-[11px]"
            />
            <input
              value={form.deskName}
              onChange={(e) => setForm({ ...form, deskName: e.target.value })}
              placeholder="Desk (opsiyonel)"
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            />
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className="w-full rounded bg-sky-600 px-3 py-1.5 font-medium hover:bg-sky-500 disabled:opacity-50"
            >
              {editId ? "Güncelle" : "Kaydet"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({ name: "", subject: "", body: "", deskName: "" });
                }}
                className="w-full text-[11px] text-slate-500 hover:text-slate-300"
              >
                İptal
              </button>
            )}
            {msg && <p className="text-[11px] text-slate-400">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
