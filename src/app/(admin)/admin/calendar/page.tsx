"use client";

import { fmtCrmDate } from "@/lib/crm-format";

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
        setMsg(data.error || "Registration failed");
        return;
      }
      setForm((f) => ({ ...f, body: "", remindAt: "" }));
      setMsg("Reminder added");
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
      <h1 className="mb-1 text-lg font-semibold">Calendar</h1>
      <p className="mb-3 text-[11px] text-neutral-500">Reminderlar / takip listesi</p>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          {reminders.map((r) => {
            const ts = new Date(r.remindAt).getTime();
            const overdue = ts < now;
            return (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-[#ffffff] p-3"
              >
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: r.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.body}</p>
                  <p className={`text-[11px] ${overdue ? "text-amber-400" : "text-neutral-500"}`}>
                    {fmtCrmDate(r.remindAt)}
                    {overdue ? " · overdue" : ""}
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
                  className="text-[10px] text-neutral-500 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            );
          })}
          {reminders.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-8 text-center text-xs text-neutral-500">
              Reminder yok
            </p>
          )}
        </div>
        <div className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
          <h2 className="mb-2 text-xs font-semibold text-slate-300">New reminder</h2>
          <div className="space-y-2 text-xs">
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
              placeholder="What should be reminded?"
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            />
            <input
              type="datetime-local" step={1}
              value={form.remindAt}
              onChange={(e) => setForm({ ...form, remindAt: e.target.value })}
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            />
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            >
              <option value="">Trader (opsiyonel)</option>
              {traders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-neutral-500">Renk</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded border border-neutral-300 bg-transparent"
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="w-full rounded bg-black text-white px-3 py-1.5 font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              Ekle
            </button>
            {msg && <p className="text-[11px] text-neutral-500">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
