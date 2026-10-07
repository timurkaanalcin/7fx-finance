"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Msg = {
  id: string;
  title: string | null;
  body: string;
  workerName: string | null;
  createdAt: string;
};
type Profilee = {
  id: string;
  name: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  language?: string | null;
  timezone?: string | null;
  country?: string | null;
  accountType?: string | null;
  currency?: string;
  balance?: number;
  registrationDate?: string | null;
  registrationCountry?: string | null;
  tradingServer?: string | null;
  ftd?: boolean;
  brokerName?: string | null;
  assigneeName?: string | null;
  affiliateA?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  desk?: string | null;
  active?: boolean;
  isActiveTrading?: boolean;
  isActiveDeposit?: boolean;
  isActiveWithdrawal?: boolean;
};
type Thread = {
  traderId: string;
  trader: string;
  traderEmail: string;
  desk: string | null;
  active: boolean;
  lastAt: string;
  messages: Msg[];
  profile?: Profilee;
};
type TraderOpt = { id: string; name: string; email: string };

type Tab = "all" | "new" | "unanswered";

const GREETING_7FX =
  "Hello, welcome to 7FX Live Support. How can I help you?\n\n7FX Support";

const EMOJIS = ["👍", "🙏", "✅", "😊", "👋", "💼", "⚡", "📌"];

function relativeTimeTr(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "—";
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const sec = Math.round(diff / 1000);
  if (Math.abs(sec) < 45) return rtf.format(-sec, "second");
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return rtf.format(-min, "minute");
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(-hr, "hour");
  const day = Math.round(hr / 24);
  if (Math.abs(day) < 30) return rtf.format(-day, "day");
  return new Date(iso).toLocaleDateString(locale);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarHue(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * 17) % 360;
  return `hsl(${h} 32% 38%)`;
}

function formatClock(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSep(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function isUnanswered(t: Thread): boolean {
  if (t.messages.length === 0) return true;
  // Last message without workerName ≈ customer/system note; with workerName ≈ agent
  const last = t.messages[t.messages.length - 1];
  return !last.workerName;
}

function isNew(t: Thread): boolean {
  return t.messages.length <= 1;
}

function ProfileeRow({
  label,
  value,
  danger,
  onEdit,
  onClear,
}: {
  label: string;
  value: string;
  danger?: boolean;
  onEdit?: () => void;
  onClear?: () => void;
}) {
  const { i18n } = useCrmLabels();
  return (
    <div className="group flex items-start justify-between gap-2 border-b border-black/5 py-2.5">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        <p
          className={`mt-0.5 break-words text-[13px] font-medium ${
            danger ? "text-red-400" : "text-neutral-900"
          }`}
        >
          {value || "—"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-50 transition group-hover:opacity-100">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1 hover:bg-neutral-100"
            aria-label={`${i18n("crm.ui.edit")} ${label}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="m13 7 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1 text-red-400 hover:bg-red-500/10"
            aria-label={`${label} ${i18n("crm.ui.clearField")}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 7h14M10 11v6M14 11v6M9 7V5h6v2M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { i18n, locale } = useCrmLabels();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [traders, setTraders] = useState<TraderOpt[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [profileDraft, setProfileeDraft] = useState<Profilee | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/chat");
    if (!res.ok) return;
    const data = await res.json();
    setThreads(data.threads || []);
    setTraders(data.traders || []);
  }, []);

  useEffect(() => {
    load();
    const iv = window.setInterval(load, 8000);
    return () => window.clearInterval(iv);
  }, [load]);

  const unanswered = useMemo(
    () => threads.filter(isUnanswered).length,
    [threads],
  );

  const list = useMemo(() => {
    let rows = threads;
    if (tab === "new") rows = rows.filter(isNew);
    else if (tab === "unanswered") rows = rows.filter(isUnanswered);
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (t) =>
          t.trader.toLowerCase().includes(q) ||
          t.traderEmail.toLowerCase().includes(q) ||
          t.messages.some((m) => m.body.toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [threads, tab, query]);

  const active = threads.find((t) => t.traderId === selected) || list[0] || null;

  useEffect(() => {
    if (active && active.traderId !== selected) setSelected(active.traderId);
    if (active?.profile) setProfileeDraft({ ...active.profile });
    else if (active) {
      setProfileeDraft({
        id: active.traderId,
        name: active.trader,
        email: active.traderEmail,
        desk: active.desk,
        active: active.active,
        accountType: "STANDARD",
        currency: "USD",
        timezone: "Europe/Istanbul",
        language: "en",
        tradingServer: "Web Trading Server",
        ftd: false,
        brokerName: null,
        affiliateA: null,
        isActiveTrading: active.active,
        isActiveDeposit: true,
        isActiveWithdrawal: true,
      });
    } else setProfileeDraft(null);
  }, [active, selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.traderId, active?.messages.length]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function send(userId: string, body?: string) {
    const text = (body ?? message).trim();
    if (!text || !userId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: text, title: "Chat" }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || i18n("crm.chat.sendFail"));
        return;
      }
      setMessage("");
      setEmojiOpen(false);
      setSelected(userId);
      setCreateOpen(false);
      await load();
      flash(i18n("crm.chat.sent"));
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(m: Msg) {
    setEditingId(m.id);
    setEditDraft(m.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function saveEdit() {
    if (!editingId) return;
    const textBody = editDraft.trim();
    if (!textBody) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, message: textBody }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        flash(data.error || i18n("crm.chat.editFail"));
        return;
      }
      setEditingId(null);
      setEditDraft("");
      await load();
      flash(i18n("crm.chat.edited"));
    } finally {
      setBusy(false);
    }
  }

  async function saveProfileeField(key: string, value: string | boolean) {
    if (!profileDraft) return;
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { [key]: value };
      // map UI keys
      if (key === "name") {
        payload.name = value;
      }
      const res = await fetch(`/api/admin/users/${profileDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setProfileeDraft((p) => (p ? { ...p, [key]: value } : p));
      await load();
      flash(i18n("crm.chat.profileUpdated"));
    } finally {
      setBusy(false);
    }
  }

  function editField(key: keyof Profilee, label: string) {
    if (!profileDraft) return;
    const current = String(profileDraft[key] ?? "");
    const next = window.prompt(label, current);
    if (next == null) return;
    void saveProfileeField(key, next);
  }

  function toggleBool(key: "active" | "ftd") {
    if (!profileDraft) return;
    void saveProfileeField(key, !Boolean(profileDraft[key]));
  }

  const messageBlocks = useMemo(() => {
    if (!active) return [] as { key: string; label: string; items: Msg[] }[];
    const blocks: { key: string; label: string; items: Msg[] }[] = [];
    for (const m of active.messages) {
      const key = dayKey(m.createdAt);
      const last = blocks[blocks.length - 1];
      if (!last || last.key !== key) {
        blocks.push({ key, label: formatDateSep(m.createdAt, locale), items: [m] });
      } else last.items.push(m);
    }
    return blocks;
  }, [active, locale]);

  function onSend(e?: FormEvent) {
    e?.preventDefault();
    if (!active) return;
    void send(active.traderId);
  }

  return (
    <div className="-mx-1 flex h-[calc(100dvh-3.5rem)] min-h-[560px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg md:-mx-0">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">
            CRM
          </span>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{i18n("crm.chat.title")}</p>
            <p className="text-[11px] text-neutral-500">
              7FX · {threads.length} {i18n("crm.chat.conversations")} · {unanswered} {i18n("crm.chat.awaiting")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-110"
        >
          {i18n("crm.chat.create")}
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(260px,320px)]">
        {/* LEFT */}
        <aside className="flex min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r">
          <div className="space-y-2 border-b border-neutral-200 p-3">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="m16 16 3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={i18n("crm.ui.search")}
                className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none focus:border-[var(--accent)]/40"
                aria-label={i18n("crm.ui.search")}
              />
            </div>
            <div className="flex gap-1 rounded-xl border border-neutral-200 bg-white p-1">
              {(
                [
                  ["all", i18n("crm.ui.all")],
                  ["new", i18n("crm.ui.new")],
                  ["unanswered", i18n("crm.chat.unanswered")],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`relative flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                    tab === id
                      ? "bg-[var(--accent-tint)] text-[var(--accent)] shadow-sm ring-1 ring-[var(--accent)]/25"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {label}
                  {id === "unanswered" && unanswered > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] text-white">
                      {unanswered}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
            {list.length === 0 && (
              <li className="rounded-xl px-3 py-8 text-center text-sm text-neutral-500">
                {i18n("crm.chat.emptyList")}
              </li>
            )}
            {list.map((t) => {
              const last = t.messages[t.messages.length - 1];
              const isActive = active?.traderId === t.traderId;
              const unread = isUnanswered(t);
              return (
                <li key={t.traderId}>
                  <button
                    type="button"
                    onClick={() => setSelected(t.traderId)}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${
                      isActive
                        ? "bg-[var(--accent-tint)] ring-1 ring-[var(--accent)]/30"
                        : "hover:bg-neutral-100"
                    }`}
                  >
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: avatarHue(t.trader) }}
                    >
                      {initials(t.trader)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-neutral-900">
                          {t.trader}
                        </span>
                        <span className="shrink-0 text-[10px] text-neutral-500">
                          {relativeTimeTr(t.lastAt, locale)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`truncate text-[11px] ${
                            unread ? "font-semibold text-neutral-800" : "text-neutral-500"
                          }`}
                        >
                          {last?.body || t.traderEmail}
                        </span>
                        {unread && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-neutral-200 px-3 py-2 text-center text-[10px] text-neutral-400">
            {i18n("crm.chat.allLoaded")}
          </p>
        </aside>

        {/* CENTER */}
        <section className="flex min-h-0 flex-col bg-white">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-neutral-500">
              <p>{i18n("crm.chat.emptyThread")}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: avatarHue(active.trader) }}
                  >
                    {initials(active.trader)}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/izcrm/traders/${active.traderId}`}
                      className="truncate text-sm font-semibold text-[var(--accent)] hover:underline"
                    >
                      {active.trader}
                    </Link>
                    <p className="truncate text-[11px] text-neutral-500">
                      {active.traderEmail} · {active.desk || "—"}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    active.active
                      ? "bg-[var(--accent-tint)] text-[var(--accent)]"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {active.active ? i18n("crm.ui.active") : i18n("crm.ui.frozen")}
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messageBlocks.map((block) => (
                  <div key={block.key} className="space-y-2.5">
                    <div className="flex justify-center">
                      <span className="rounded-full bg-[#ffffff] px-3 py-1 text-[10px] font-medium text-neutral-500 ring-1 ring-black/10">
                        {block.label}
                      </span>
                    </div>
                    {block.items.map((m) => {
                      const agent = Boolean(m.workerName);
                      const isEditing = editingId === m.id;
                      return (
                        <div
                          key={m.id}
                          className={`group flex ${agent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`relative max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                              agent
                                ? "rounded-br-md bg-[var(--accent-tint)] text-neutral-900 ring-1 ring-[var(--accent)]/20"
                                : "rounded-bl-md bg-[#ffffff] text-neutral-800 ring-1 ring-black/10"
                            }`}
                          >
                            {agent && (
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <p className="text-[10px] font-semibold text-[var(--accent)]">
                                  {m.workerName || "7FX Support"}
                                </p>
                                {!isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => beginEdit(m)}
                                    disabled={busy}
                                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] opacity-70 hover:bg-[var(--accent)]/10 hover:opacity-100 disabled:opacity-40"
                                    aria-label={i18n("crm.chat.editPrompt")}
                                    title={i18n("crm.ui.edit")}
                                  >
                                    {i18n("crm.ui.edit")}
                                  </button>
                                )}
                              </div>
                            )}
                            {m.title && m.title !== "Chat" && (
                              <p className="mb-0.5 text-[11px] font-medium text-neutral-500">
                                {m.title}
                              </p>
                            )}
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editDraft}
                                  onChange={(e) => setEditDraft(e.target.value)}
                                  rows={Math.min(12, Math.max(3, editDraft.split("\n").length + 1))}
                                  className="w-full rounded-xl border border-[var(--accent)]/30 bg-white px-2.5 py-2 text-[13px] text-neutral-900 outline-none focus:border-[var(--accent)]/50"
                                  aria-label={i18n("crm.chat.editPrompt")}
                                  disabled={busy}
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={busy}
                                    className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
                                  >
                                    {i18n("crm.ui.cancel")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void saveEdit()}
                                    disabled={busy || !editDraft.trim()}
                                    className="rounded-lg bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
                                  >
                                    {i18n("crm.ui.save")}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            )}
                            <p className="mt-1 text-right text-[10px] text-neutral-500">
                              {formatClock(m.createdAt, locale)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={onSend}
                className="relative border-t border-neutral-200 bg-white p-3"
              >
                {emojiOpen && (
                  <div className="absolute bottom-full left-3 mb-2 flex gap-1 rounded-xl border border-neutral-200 bg-[#ffffff] p-2 shadow-lg">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="rounded-lg px-2 py-1 text-lg hover:bg-neutral-100"
                        onClick={() => {
                          setMessage((r) => r + e);
                          setEmojiOpen(false);
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mb-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMessage(GREETING_7FX)}
                    className="rounded-full bg-[var(--accent-tint)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)] ring-1 ring-[var(--accent)]/20"
                  >
                    {i18n("crm.chat.welcome")}
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                    title={i18n("crm.chat.voice")}
                    aria-label={i18n("crm.chat.voice")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      <path d="M12 17.5V21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </button>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={i18n("crm.chat.enter")}
                    className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--accent)]/40"
                    aria-label={i18n("crm.ui.reply")}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setEmojiOpen((v) => !v)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                    aria-label={i18n("crm.chat.emoji")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                      <path d="M8.5 14c1.2 1.4 2.7 2 3.5 2s2.3-.6 3.5-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                    aria-label={i18n("crm.chat.attach")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M14.5 7.5 8 14a3 3 0 0 0 4.2 4.2l7.1-7.1a4.5 4.5 0 0 0-6.4-6.4L6 11.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && active) {
                        void send(
                          active.traderId,
                          `📎 Dosya eklendi: ${f.name} (${Math.round(f.size / 1024)} KB)`,
                        );
                      }
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="submit"
                    disabled={busy || !message.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white disabled:opacity-40"
                    aria-label={i18n("crm.ui.send")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12 20 4l-5.5 16-2.5-6.5L4 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        {/* RIGHT profile */}
        <aside className="hidden min-h-0 flex-col overflow-y-auto border-l border-neutral-200 bg-white lg:flex">
          {!profileDraft ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-neutral-500">
              Select a chat for the profile
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-bold text-[var(--accent)]">
                    {profileDraft.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(
                        `${profileDraft.name} · ${profileDraft.id}`,
                      );
                      flash(i18n("crm.ui.copied"));
                    }}
                    className="text-neutral-500 hover:text-neutral-800"
                    aria-label={i18n("crm.ui.copy")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M6 16V6a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <p className="mt-0.5 text-[12px] text-neutral-500">
                  ID: {profileDraft.id.slice(0, 12)}…
                </p>
              </div>

              <ProfileeRow
                label={i18n("crm.ui.name")}
                value={profileDraft.name}
                onEdit={() => editField("name", i18n("crm.ui.name"))}
              />
              <ProfileeRow
                label={i18n("crm.ui.accountType")}
                value={profileDraft.accountType || "STANDARD"}
                onEdit={() => editField("accountType", i18n("crm.ui.accountType"))}
              />
              <ProfileeRow
                label={i18n("crm.ui.currency")}
                value={profileDraft.currency || "USD"}
              />
              <ProfileeRow
                label={i18n("crm.ui.timezone")}
                value={profileDraft.timezone || "Europe/Istanbul"}
                onEdit={() => editField("timezone", i18n("crm.ui.timezone"))}
              />
              <ProfileeRow
                label={i18n("crm.ui.language")}
                value={profileDraft.language || "tr"}
                onEdit={() => editField("language", i18n("crm.ui.language"))}
              />
              <ProfileeRow
                label={i18n("crm.chat.isActive")}
                value={profileDraft.active ? i18n("crm.ui.yes") : i18n("crm.ui.no")}
                danger={!profileDraft.active}
                onEdit={() => toggleBool("active")}
              />
              <ProfileeRow
                label={i18n("crm.chat.activeTrading")}
                value={profileDraft.isActiveTrading ? i18n("crm.ui.yes") : i18n("crm.ui.no")}
                danger={!profileDraft.isActiveTrading}
              />
              <ProfileeRow
                label={i18n("crm.chat.activeDeposit")}
                value={profileDraft.isActiveDeposit !== false ? i18n("crm.ui.yes") : i18n("crm.ui.no")}
              />
              <ProfileeRow
                label={i18n("crm.chat.activeWithdraw")}
                value={profileDraft.isActiveWithdrawal !== false ? i18n("crm.ui.yes") : i18n("crm.ui.no")}
              />
              <ProfileeRow
                label={i18n("crm.ui.tradingServer")}
                value={profileDraft.tradingServer || "Web Trading Server"}
                onEdit={() => editField("tradingServer", i18n("crm.ui.tradingServer"))}
              />
              <ProfileeRow
                label={i18n("crm.chat.registeredAt")}
                value={
                  profileDraft.registrationDate
                    ? new Date(profileDraft.registrationDate).toLocaleString(locale)
                    : "—"
                }
              />
              <ProfileeRow
                label={i18n("crm.ui.regCountry")}
                value={
                  profileDraft.registrationCountry ||
                  profileDraft.country ||
                  "—"
                }
                onEdit={() => editField("registrationCountry", i18n("crm.ui.regCountry"))}
              />
              <ProfileeRow label={i18n("crm.chat.regIp")} value="—" />
              <ProfileeRow
                label={i18n("crm.ui.lastLogin")}
                value={
                  profileDraft.lastLoginAt
                    ? new Date(profileDraft.lastLoginAt).toLocaleString(locale)
                    : "—"
                }
              />
              <ProfileeRow
                label={i18n("crm.chat.markFtd")}
                value={profileDraft.ftd ? i18n("crm.ui.yes") : i18n("crm.ui.no")}
                danger={!profileDraft.ftd}
                onEdit={() => toggleBool("ftd")}
              />
              <ProfileeRow
                label={i18n("crm.chat.ftdBroker")}
                value={profileDraft.brokerName || i18n("crm.ui.notAssigned")}
                danger={!profileDraft.brokerName}
                onEdit={() => editField("brokerName", i18n("crm.chat.ftdBroker"))}
                onClear={() => void saveProfileeField("brokerName", "")}
              />
              <ProfileeRow label={i18n("crm.chat.withdrawDetails")} value={i18n("crm.ui.emptyValue")} danger />
              <ProfileeRow
                label={i18n("crm.chat.affiliate")}
                value={profileDraft.affiliateA || "-"}
                onEdit={() => editField("affiliateA", i18n("crm.chat.affiliate"))}
              />
            </div>
          )}
        </aside>
      </div>

      {/* create chat modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setCreateOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={i18n("crm.chat.create")}
          >
            <h3 className="text-sm font-semibold text-neutral-900">{i18n("crm.chat.create")}</h3>
            <p className="mt-1 text-[11px] text-neutral-500">
              {i18n("crm.chat.pick")}
            </p>
            <select
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">{i18n("crm.comms.selectTrader")}</option>
              {traders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.email}
                </option>
              ))}
            </select>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={i18n("crm.chat.first")}
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMessage(GREETING_7FX)}
                className="rounded-full bg-[var(--accent-tint)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)]"
              >
                {i18n("crm.chat.welcome")}
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
              >
                {i18n("crm.ui.cancel")}
              </button>
              <button
                type="button"
                disabled={busy || !newUserId || !message.trim()}
                onClick={() => void send(newUserId)}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                {i18n("crm.ui.start")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
