"use client";

import { useEffect, useState } from "react";

const STATUSES = ["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "NO_ANSWER", "CALL_AGAIN", "DEPOSITED", "NOT_INTERESTED", "LOST"];
const TR: Record<string, string> = {
  NEW: "Yeni", CONTACTED: "Ulaşıldı", FOLLOW_UP: "Takipte", INTERESTED: "İlgili", NO_ANSWER: "Cevap yok",
  CALL_AGAIN: "Tekrar ara", DEPOSITED: "Yatırım yaptı", NOT_INTERESTED: "İlgilenmiyor", LOST: "Kayıp",
};

type R = {
  retentionStatus: string | null;
  retentionNote: string | null;
  retentionFollowUpAt: string | null;
  notes: { id: string; body: string; authorName: string | null; createdAt: string }[];
};

/** Retention card: status, note, follow-up date, quick notes. Server enforces assignment scope. */
export default function RetentionPanel({ userId }: { userId: string }) {
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
    setFollow(x.retentionFollowUpAt ? x.retentionFollowUpAt.slice(0, 16) : "");
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
      setMsg("Kaydedildi");
    } else setMsg(d.error || "Hata");
  }

  if (!r) return null;
  return (
    <div className="mt-4 rounded border border-black/10 p-3 text-xs">
      <div className="mb-2 font-semibold">Retention</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          Durum
          <select className="rounded border px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">—</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{TR[s] || s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Takip tarihi
          <input type="datetime-local" className="rounded border px-2 py-1" value={follow} onChange={(e) => setFollow(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          Retention notu
          <textarea className="rounded border px-2 py-1" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          Görüşme notu ekle
          <input className="rounded border px-2 py-1" value={addNote} onChange={(e) => setAddNote(e.target.value)} />
        </label>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={save} className="rounded bg-black px-3 py-1 text-white">Kaydet</button>
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
    setMsg(res.ok ? "Atandı" : "Hata");
  }
  return (
    <label className="mt-3 flex flex-col gap-1 text-xs">
      Atanan personel (Sales / Retention Manager)
      <select className="rounded border px-2 py-1" value={val} onChange={(e) => change(e.target.value)}>
        <option value="">— Atanmamış —</option>
        {workers.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
      {msg ? <span className="text-neutral-500">{msg}</span> : null}
    </label>
  );
}
