"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { fmtCrmDate } from "@/lib/crm-format";
import { CRM_LIST_PAGE } from "@/lib/trader-list";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const { i18n } = useCrmLabels();
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
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const remindersRef = useRef<Reminder[]>([]);
  const loadGen = useRef(0);

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const gen = ++loadGen.current;
    const skip = mode === "more" ? remindersRef.current.length : 0;
    if (mode === "more") setMoreBusy(true);
    try {
      const res = await fetch(`/api/admin/calendar?take=${CRM_LIST_PAGE}&skip=${skip}`);
      if (!res.ok || gen !== loadGen.current) return;
      const data = await res.json();
      const incoming: Reminder[] = data.reminders || [];
      const seen = new Set(remindersRef.current.map((r) => r.id));
      const next =
        mode === "more" ? remindersRef.current.concat(incoming.filter((r) => !seen.has(r.id))) : incoming;
      remindersRef.current = next;
      setReminders(next);
      setHasMore(Boolean(data.hasMore));
      if (Array.isArray(data.traders)) setTraders(data.traders);
    } finally {
      if (mode === "more" && gen === loadGen.current) setMoreBusy(false);
    }
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
        setMsg(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setForm((f) => ({ ...f, body: "", remindAt: "" }));
      setMsg(i18n("crm.cal.added"));
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
      <h1 className="mb-1 text-lg font-semibold">{i18n("crm.nav.calendar")}</h1>
      <p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.cal.intro")}</p>
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
                    {overdue ? ` · ${i18n("crm.cal.overdue")}` : ""}
                    {r.workerName ? ` · ${r.workerName}` : ""}
                    {r.trader ? (
                      <>
                        {" · "}
                        <Link href={`/izcrm/traders/${r.traderId}`} className="text-sky-400 hover:underline">
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
                  {i18n("crm.ui.delete")}
                </button>
              </div>
            );
          })}
          {reminders.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-8 text-center text-xs text-neutral-500">
              {i18n("crm.cal.none")}
            </p>
          )}
          {hasMore && (
            <button
              type="button"
              disabled={moreBusy}
              onClick={() => void load("more")}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              {moreBusy ? i18n("crm.ui.loading") : i18n("crm.ui.loadMore")}
            </button>
          )}
        </div>
        <div className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
          <h2 className="mb-2 text-xs font-semibold text-neutral-600">{i18n("crm.cal.new")}</h2>
          <div className="space-y-2 text-xs">
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
              placeholder={i18n("crm.cal.ph")}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            />
            <input
              type="datetime-local" step={1}
              value={form.remindAt}
              onChange={(e) => setForm({ ...form, remindAt: e.target.value })}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            />
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5"
            >
              <option value="">{i18n("crm.cal.traderOpt")}</option>
              {traders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-neutral-500">{i18n("crm.ui.color")}</label>
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
