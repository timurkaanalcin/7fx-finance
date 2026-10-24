"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fmtCrmDate } from "@/lib/crm-format";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

type Note = { id: string; body?: unknown; authorName?: unknown; team?: unknown; createdAt?: unknown };
type Team = "SALE" | "RET";
type View = "ALL" | Team;

/**
 * Separate comment areas for the Sale manager and the Ret (retention) manager.
 * Stored as UserNote rows with team = SALE | RET; time is stamped by the server (now).
 * UI: blue section header + segmented control (Tümü | Sale | Ret), selectable target cards,
 * text-link secondary + solid blue primary action, comment cards.
 */
export default function TeamComments({
  userId,
  readOnly,
  onChanged,
}: {
  userId: string;
  readOnly?: boolean;
  onChanged?: () => void | Promise<void>;
}) {
  const { i18n } = useCrmLabels();
  const [notes, setNotes] = useState<Note[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const notesRef = useRef<Note[]>([]);
  // Server decides what this viewer may see / write (Sale staff never receive Retention comments).
  const [visible, setVisible] = useState<Team[]>([]);
  const [writable, setWritable] = useState<Team[]>([]);
  const [view, setView] = useState<View>("SALE");
  const [target, setTarget] = useState<Team>("SALE");
  const apply = useCallback((d: { notes?: Note[]; visibleTeams?: Team[]; writableTeams?: Team[]; hasMore?: boolean }, mode: "replace" | "more" = "replace") => {
    const incoming = Array.isArray(d.notes) ? d.notes : [];
    const next =
      mode === "more"
        ? notesRef.current.concat(incoming.filter((row) => !notesRef.current.some((prev) => prev.id === row.id)))
        : incoming;
    notesRef.current = next;
    setNotes(next);
    if (typeof d.hasMore === "boolean") setHasMore(d.hasMore);
    const vis = Array.isArray(d.visibleTeams) ? d.visibleTeams : [];
    const wr = Array.isArray(d.writableTeams) ? d.writableTeams : [];
    setVisible(vis);
    setWritable(wr);
    setTarget((t) => (wr.includes(t) ? t : wr[0] || "SALE"));
    setView((v) => (v === "ALL" ? (vis.length > 1 ? "ALL" : vis[0] || "SALE") : vis.includes(v) ? v : wr[0] || vis[0] || "SALE"));
  }, []);
  const reload = useCallback(async () => {
    const res = await fetch(`/api/admin/users/${userId}/team-notes?take=50&skip=0`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) apply(await res.json());
  }, [userId, apply]);
  const loadMore = useCallback(async () => {
    if (moreBusy) return;
    setMoreBusy(true);
    try {
      const skip = notesRef.current.length;
      const res = await fetch(`/api/admin/users/${userId}/team-notes?take=50&skip=${skip}`, { cache: "no-store" });
      if (res.ok) apply(await res.json(), "more");
    } finally {
      setMoreBusy(false);
    }
  }, [userId, apply, moreBusy]);
  useEffect(() => {
    void reload();
  }, [reload]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const teamNotes = notes.filter((n) => n.team === "SALE" || n.team === "RET");
  const count = (t: View) => (t === "ALL" ? teamNotes.length : teamNotes.filter((n) => n.team === t).length);
  const list = view === "ALL" ? teamNotes : teamNotes.filter((n) => n.team === view);
  const teamTitle = (t: Team) =>
    t === "SALE" ? i18n("crm.ui.saleComments", "Sale yorumları") : i18n("crm.ui.retComments", "Retention yorumları");

  function pickView(v: View) {
    setView(v);
    if (v !== "ALL" && writable.includes(v)) setTarget(v);
  }

  async function add() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/team-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, team: target }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setText("");
        apply(d);
        await onChanged?.();
      } else setMsg(String(d.error || i18n("crm.ret.error", "Hata")));
    } finally {
      setBusy(false);
    }
  }

  const segs: { v: View; label: string }[] = (
    [
      { v: "ALL", label: i18n("crm.ui.all", "Tümü") },
      { v: "SALE", label: "Sale" },
      { v: "RET", label: "Retention" },
    ] as { v: View; label: string }[]
  ).filter((x) => (x.v === "ALL" ? visible.length > 1 : visible.includes(x.v as Team)));
  const allTargets: { t: Team; icon: string; desc: string }[] = [
    { t: "SALE", icon: "💼", desc: i18n("crm.ui.saleCommentDesc", "Sale manager notu — satış görüşmeleri ve teklifler.") },
    { t: "RET", icon: "🔁", desc: i18n("crm.ui.retCommentDesc", "Retention manager notu — retention takibi ve müşteri ilişkisi.") },
  ];
  const targets = allTargets.filter((x) => writable.includes(x.t));
  if (!visible.length) return null;

  return (
    <section className="mt-4 rounded-xl border border-[#e5e7eb] bg-white p-4 text-xs" data-fx-team-comments>
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2563eb]">
          <span aria-hidden className="inline-block h-3 w-3 rounded-[3px] bg-[repeating-linear-gradient(45deg,#2563eb_0_2px,#93c5fd_2px_4px)]" />
          {i18n("crm.ui.comments", "Yorumlar")}
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <button
            type="button"
            onClick={() => void reload()}
            title={i18n("crm.ui.refresh", "Yenile")}
            aria-label={i18n("crm.ui.refresh", "Yenile")}
            className="rounded-md p-1 text-base leading-none hover:bg-neutral-100 hover:text-neutral-700"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Segmented control */}
      <div role="tablist" className="mb-4 flex rounded-xl bg-[#e8ecf4] p-1" data-fx-team-seg>
        {segs.map(({ v, label }) => {
          const on = view === v;
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => pickView(v)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition ${
                on ? "bg-white font-medium text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {label}
              <span className={`ml-1.5 text-[11px] tabular-nums ${on ? "text-neutral-400" : "text-neutral-400/80"}`}>{count(v)}</span>
            </button>
          );
        })}
      </div>

      {/* Add comment: target cards + input + actions */}
      {!readOnly && targets.length > 0 && (
        <div className="mb-4" data-fx-team-add>
          <div className="mb-2 text-[12px] text-neutral-600">{i18n("crm.ui.commentArea", "Yorum alanı")}</div>
          <div className={`grid gap-3 ${targets.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {targets.map(({ t, icon, desc }) => {
              const on = target === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setTarget(t);
                    if (view !== "ALL") setView(t);
                  }}
                  data-fx-team-target={t}
                  className={`relative rounded-lg border p-3 text-left transition ${
                    on ? "border-[#2563eb] bg-[#eef2ff]" : "border-[#e5e7eb] bg-[#f3f4f6] hover:border-neutral-300"
                  }`}
                >
                  {on && <span className="absolute right-3 top-2.5 text-sm text-[#2563eb]">✓</span>}
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-neutral-800">
                    <span aria-hidden>{icon}</span>
                    {teamTitle(t)}
                  </div>
                  <div className="mt-1 text-[12px] leading-snug text-neutral-500">{desc}</div>
                </button>
              );
            })}
          </div>
          <textarea
            className="mt-3 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`${teamTitle(target)} — ${i18n("crm.ui.addComment", "Yorum ekle")}`}
          />
          <div className="mt-2 flex items-center justify-end gap-4">
            {msg ? <span className="mr-auto text-red-600">{msg}</span> : null}
            <button
              type="button"
              onClick={() => setText("")}
              disabled={!text}
              className="text-[13px] text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-900 disabled:opacity-40"
            >
              {i18n("crm.fu.clear", "Temizle")}
            </button>
            <button
              type="button"
              onClick={add}
              disabled={busy || !text.trim()}
              className="rounded-md bg-[#2563eb] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-40"
            >
              {i18n("crm.ui.addComment", "Yorum ekle")}
            </button>
          </div>
        </div>
      )}

      {/* Comment cards */}
      {list.length ? (
        <ul className="grid max-h-80 gap-2 overflow-auto sm:grid-cols-2" data-fx-team-list>
          {list.map((n) => (
            <li key={n.id} className="rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] p-3" data-fx-team-comment={String(n.team)}>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    n.team === "SALE" ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-[#ede9fe] text-[#6d28d9]"
                  }`}
                >
                  {n.team === "SALE" ? "Sale" : "Retention"}
                </span>
                <span className="text-[12px] font-semibold text-neutral-800">{String(n.authorName || "—")}</span>
                <span className="ml-auto text-[11px] text-neutral-400">{fmtCrmDate(String(n.createdAt || ""))}</span>
              </div>
              <div className="whitespace-pre-wrap text-[12px] leading-snug text-neutral-600">{String(n.body || "")}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg bg-[#f3f4f6] p-3 text-center text-neutral-400">{i18n("crm.ui.noComments", "Henüz yorum yok")}</div>
      )}
      {hasMore && (
        <button
          type="button"
          disabled={moreBusy}
          onClick={() => void loadMore()}
          className="mt-3 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
        >
          {moreBusy ? i18n("crm.ui.loading") : i18n("crm.ui.loadMore")}
        </button>
      )}
    </section>
  );
}
