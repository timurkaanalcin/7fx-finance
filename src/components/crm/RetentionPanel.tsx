"use client";

import { useEffect, useState } from "react";
import { RETENTION_STATUSES } from "@/lib/membership";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

const STATUSES: readonly string[] = RETENTION_STATUSES;

type NoteRow = { id: string; body: string; authorName: string | null; createdAt: string };
type ReminderRow = { id: string; body: string; workerName: string | null; remindAt: string };
type R = {
  retentionStatus: string | null;
  retentionNote: string | null;
  retentionFollowUpAt: string | null;
  notes: NoteRow[];
  reminders: ReminderRow[];
};

/** ISO (UTC) → value for <input type="datetime-local"> in the browser's local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Quick follow-up presets (browser local time). "+N gün" = now + N days, rounded up to the next full hour. */
function quickFollow(kind: "today10" | number): string {
  const d = new Date();
  if (kind === "today10") {
    d.setHours(10, 0, 0, 0);
  } else {
    d.setDate(d.getDate() + kind);
    if (d.getMinutes() || d.getSeconds() || d.getMilliseconds()) d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
  }
  return toLocalInput(d.toISOString());
}

/** Retention card: status, note, follow-up date, quick notes. Server enforces assignment scope. */
export default function RetentionPanel({ userId }: { userId: string }) {
  const { i18n, code } = useCrmLabels();
  const [r, setR] = useState<R | null>(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [follow, setFollow] = useState("");
  const [addNote, setAddNote] = useState("");
  const [msg, setMsg] = useState("");
  const [notesHasMore, setNotesHasMore] = useState(false);
  const [notesNext, setNotesNext] = useState(0);
  const [remindersHasMore, setRemindersHasMore] = useState(false);
  const [remindersNext, setRemindersNext] = useState(0);

  const apply = (x: R, flags?: { notesHasMore?: boolean; notesNextSkip?: number; remindersHasMore?: boolean; remindersNextSkip?: number }) => {
    setR({ ...x, notes: x.notes || [], reminders: x.reminders || [] });
    setStatus(x.retentionStatus || "");
    setNote(x.retentionNote || "");
    setFollow(toLocalInput(x.retentionFollowUpAt));
    if (flags) {
      setNotesHasMore(Boolean(flags.notesHasMore));
      setNotesNext(flags.notesNextSkip || (x.notes || []).length);
      setRemindersHasMore(Boolean(flags.remindersHasMore));
      setRemindersNext(flags.remindersNextSkip || (x.reminders || []).length);
    }
  };

  useEffect(() => {
    fetch(`/api/admin/retention/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d?.retention && apply(d.retention, d))
      .catch(() => {});
  }, [userId]);

  async function more(kind: "notes" | "reminders") {
    const skip = kind === "notes" ? notesNext : remindersNext;
    const key = kind === "notes" ? "notesSkip" : "remindersSkip";
    const res = await fetch(`/api/admin/retention/${userId}?${key}=${skip}`);
    const d = await res.json().catch(() => null);
    if (!res.ok || !d?.retention) return;
    if (kind === "notes") {
      const incoming = (d.retention.notes || []) as NoteRow[];
      setR((prev) => {
        if (!prev) return prev;
        const have = new Set(prev.notes.map((row) => row.id));
        return { ...prev, notes: prev.notes.concat(incoming.filter((row) => !have.has(row.id))) };
      });
      setNotesHasMore(Boolean(d.notesHasMore));
      setNotesNext(d.notesNextSkip || skip);
      return;
    }
    const incoming = (d.retention.reminders || []) as ReminderRow[];
    setR((prev) => {
      if (!prev) return prev;
      const have = new Set(prev.reminders.map((row) => row.id));
      return { ...prev, reminders: prev.reminders.concat(incoming.filter((row) => !have.has(row.id))) };
    });
    setRemindersHasMore(Boolean(d.remindersHasMore));
    setRemindersNext(d.remindersNextSkip || skip);
  }

  async function save() {
    setMsg("");
    const res = await fetch(`/api/admin/retention/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        retentionStatus: status,
        retentionNote: note,
        retentionFollowUpAt: follow ? new Date(follow).toISOString() : "",
        addNote,
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.retention) {
      apply(d.retention, d);
      setAddNote("");
      setMsg(i18n("crm.ret.saved", "Kaydedildi"));
    } else setMsg(d.error || i18n("crm.ret.error", "Hata"));
  }

  if (!r) return null;
  return (
    <div className="mt-4 rounded border border-black/10 p-3 text-xs">
      <div className="mb-2 font-semibold">{i18n("crm.ui.retention", "Retention")}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          {i18n("crm.ret.status", "Durum")}
          <select className="rounded border px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">—</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{code("crm.retention", s)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {i18n("crm.ret.followUp", "Takip tarihi")}
          <input type="datetime-local" className="rounded border px-2 py-1" value={follow} onChange={(e) => setFollow(e.target.value)} />
          <span className="flex flex-wrap gap-1" title={i18n("crm.ret.qHint", "Sadece tarihi doldurur — uygulamak için Kaydet'e basın")}>
            {([
              ["today10", i18n("crm.ret.qToday10", "Bugün 10:00")],
              [1, i18n("crm.ret.qPlus1", "+1 gün")],
              [3, i18n("crm.ret.qPlus3", "+3 gün")],
              [7, i18n("crm.ret.qPlus7", "+7 gün")],
            ] as const).map(([k, label]) => (
              <button
                key={String(k)}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFollow(quickFollow(k));
                }}
                className="rounded border border-black/15 px-2 py-0.5 text-xs hover:bg-black/5"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setFollow("");
              }}
              disabled={!follow}
              className="rounded border border-black/15 px-2 py-0.5 text-xs text-neutral-500 hover:bg-black/5 disabled:opacity-40"
            >
              {i18n("crm.ret.qClear", "Temizle")}
            </button>
          </span>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          {i18n("crm.ret.note", "Retention notu")}
          <textarea className="rounded border px-2 py-1" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          {i18n("crm.ret.addNote", "Görüşme notu ekle")}
          <input className="rounded border px-2 py-1" value={addNote} onChange={(e) => setAddNote(e.target.value)} />
        </label>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={save} className="rounded bg-black px-3 py-1 text-white">{i18n("crm.ret.save", "Kaydet")}</button>
        {msg ? <span className="text-neutral-500">{msg}</span> : null}
      </div>
      {r.notes?.length ? (
        <ul className="mt-2 max-h-40 space-y-1 overflow-auto">
          {r.notes.map((n) => (
            <li key={n.id} className="text-neutral-600">
              <span className="text-neutral-400">{new Date(n.createdAt).toLocaleString()} · {n.authorName || "—"}:</span> {n.body}
            </li>
          ))}
        </ul>
      ) : null}
      {notesHasMore && (
        <button type="button" onClick={() => void more("notes")} className="mt-1 text-[11px] font-semibold underline">
          {i18n("crm.ret.notesMore")}
        </button>
      )}
      {r.reminders?.length ? (
        <div className="mt-3">
          <div className="mb-1 font-semibold">{i18n("crm.ret.reminders")}</div>
          <ul className="max-h-32 space-y-1 overflow-auto">
            {r.reminders.map((n) => (
              <li key={n.id} className="text-neutral-600">
                <span className="text-neutral-400">{new Date(n.remindAt).toLocaleString()} · {n.workerName || "—"}:</span> {n.body}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {remindersHasMore && (
        <button type="button" onClick={() => void more("reminders")} className="mt-1 text-[11px] font-semibold underline">
          {i18n("crm.ret.remindersMore")}
        </button>
      )}
    </div>
  );
}

/** Admin-only: assign this customer to a staff member (sets assigneeId + assigneeName). */
export function AssigneePicker({ userId, current }: { userId: string; current: string | null }) {
  const { i18n } = useCrmLabels();
  const [workers, setWorkers] = useState<{ id: string; name: string; jobTitle?: string | null }[]>([]);
  const [partial, setPartial] = useState(false);
  const [val, setVal] = useState(current || "");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/admin/workers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = Array.isArray(d?.workers) ? d.workers : [];
        setWorkers(list);
        setPartial(Boolean(d?.workersPartial || d?.hasMore));
      })
      .catch(() => {});
  }, []);
  if (!workers.length) return null;
  async function change(v: string) {
    setVal(v);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: v }),
    });
    setMsg(res.ok ? i18n("crm.ret.assigned", "Atandı") : i18n("crm.ret.error", "Hata"));
  }
  return (
    <label className="mt-3 flex flex-col gap-1 text-xs">
      {i18n("crm.ret.assignTo", "Atanan personel (Sales / Retention Manager)")}
      <select className="rounded border px-2 py-1" value={val} onChange={(e) => change(e.target.value)}>
        <option value="">{i18n("crm.ret.unassigned", "— Atanmamış —")}</option>
        {workers.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
      {partial ? <span className="text-amber-800">{i18n("crm.workers.listPartial")}</span> : null}
      {msg ? <span className="text-neutral-500">{msg}</span> : null}
    </label>
  );
}
