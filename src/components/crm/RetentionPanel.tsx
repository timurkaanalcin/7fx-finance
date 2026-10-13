"use client";

import { useEffect, useState } from "react";
import { RETENTION_STATUSES } from "@/lib/membership";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

const STATUSES: readonly string[] = RETENTION_STATUSES;

type R = {
  retentionStatus: string | null;
  retentionNote: string | null;
  retentionFollowUpAt: string | null;
  notes: { id: string; body: string; authorName: string | null; createdAt: string }[];
};

/** ISO (UTC) → value for <input type="datetime-local"> in the browser's local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
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

  const apply = (x: R) => {
    setR(x);
    setStatus(x.retentionStatus || "");
    setNote(x.retentionNote || "");
    setFollow(toLocalInput(x.retentionFollowUpAt));
  };

  useEffect(() => {
    fetch(`/api/admin/retention/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d?.retention && apply(d.retention))
      .catch(() => {});
  }, [userId]);

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
      apply(d.retention);
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
          {r.notes.slice(0, 10).map((n) => (
            <li key={n.id} className="text-neutral-600">
              <span className="text-neutral-400">{new Date(n.createdAt).toLocaleString()} · {n.authorName || "—"}:</span> {n.body}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Admin-only: assign this customer to a staff member (sets assigneeId + assigneeName). */
export function AssigneePicker({ userId, current }: { userId: string; current: string | null }) {
  const { i18n } = useCrmLabels();
  const [workers, setWorkers] = useState<{ id: string; name: string; jobTitle?: string | null }[]>([]);
  const [val, setVal] = useState(current || "");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/admin/workers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWorkers(Array.isArray(d?.workers) ? d.workers : []))
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
      {msg ? <span className="text-neutral-500">{msg}</span> : null}
    </label>
  );
}
