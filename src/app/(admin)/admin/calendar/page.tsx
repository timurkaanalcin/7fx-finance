"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Reminder = {
  id: string;
  body: string;
  remindAt: string;
  color: string;
  workerName: string | null;
  traderId: string | null;
  trader: string | null;
  createdAt: string;
};

type Opt = { id: string; name: string; email?: string };

export default function CalendarPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [traders, setTraders] = useState<Opt[]>([]);
  const [form, setForm] = useState({
    body: "",
    remindAt: "",
    color: "#3b82f6",
    userId: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/calendar");
    if (!res.ok) return;
    const data = await res.json();
    setReminders(data.reminders || []);
    setTraders(data.traders || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: form.body,
          remindAt: form.remindAt,
          color: form.color,
          userId: form.userId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Kayıt başarısız");
        return;
      }
      setForm((f) => ({ ...f, body: "", remindAt: "" }));
      setMsg("Hatırlatıcı eklendi");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const now = Date.now();

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Takvim</h1>
      <p className="mb-3 text-[11px] text-slate-500">Hatırlatıcılar / takip listesi</p>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          {reminders.map((r) => {
            const ts = new Date(r.remindAt).getTime();
            const overdue = ts < now;
            return (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-lg border border-slate-800 bg-[#0a1020] p-3"
              >
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: r.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.body}</p>
                  <p className={`text-[11px] ${overdue ? "text-amber-400" : "text-slate-500"}`}>
                    {new Date(r.remindAt).toLocaleString("tr-TR")}
                    {overdue ? " · gecikmiş" : ""}
                    {r.workerName ? ` · ${r.workerName}` : ""}
                    {r.trader ? (
                      <>
                        {" · "}
                        <Link href={`/admin/traders/${r.traderId}`} className="text-sky-400 hover:underline">
                          {r.trader}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(r.id)}
                  className="text-[10px] text-slate-500 hover:text-red-400"
                >
                  Sil
                </button>
              </div>
            );
          })}
          {reminders.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-800 px-3 py-8 text-center text-xs text-slate-500">
              Hatırlatıcı yok
            </p>
          )}
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0a1020] p-3">
          <h2 className="mb-2 text-xs font-semibold text-slate-300">Yeni hatırlatıcı</h2>
          <div className="space-y-2 text-xs">
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
              placeholder="Ne hatırlatılsın?"
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            />
            <input
              type="datetime-local"
              value={form.remindAt}
              onChange={(e) => setForm({ ...form, remindAt: e.target.value })}
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            />
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            >
              <option value="">Trader (opsiyonel)</option>
              {traders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-slate-500">Renk</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded border border-slate-700 bg-transparent"
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="w-full rounded bg-sky-600 px-3 py-1.5 font-medium hover:bg-sky-500 disabled:opacity-50"
            >
              Ekle
            </button>
            {msg && <p className="text-[11px] text-slate-400">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
