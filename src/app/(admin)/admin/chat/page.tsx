"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Msg = {
  id: string;
  title: string | null;
  body: string;
  workerName: string | null;
  createdAt: string;
};
type Profile = {
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
  profile?: Profile;
};
type TraderOpt = { id: string; name: string; email: string };

type Tab = "all" | "new" | "unanswered";

const GREETING_7FX =
  "Merhaba, 7FX Canlı Destek'e hoş geldiniz. Size nasıl yardımcı olabilirim?\n\n7FX Destek";

const EMOJIS = ["👍", "🙏", "✅", "😊", "👋", "💼", "⚡", "📌"];

function relativeTimeTr(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "az önce";
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "birkaç saniye önce";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dakika önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "bir gün önce";
  if (day < 30) return `${day} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
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

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSep(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
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

function ProfileRow({
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
  return (
    <div className="group flex items-start justify-between gap-2 border-b border-white/[0.04] py-2.5">
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
            className="rounded-md p-1 hover:bg-white/5"
            aria-label={`${label} düzenle`}
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
            aria-label={`${label} temizle`}
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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [traders, setTraders] = useState<TraderOpt[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [profileDraft, setProfileDraft] = useState<Profile | null>(null);
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
    if (active?.profile) setProfileDraft({ ...active.profile });
    else if (active) {
      setProfileDraft({
        id: active.traderId,
        name: active.trader,
        email: active.traderEmail,
        desk: active.desk,
        active: active.active,
        accountType: "STANDARD",
        currency: "USD",
        timezone: "Europe/Istanbul",
        language: "tr",
        tradingServer: "Web Trading Server",
        ftd: false,
        brokerName: null,
        affiliateA: null,
        isActiveTrading: active.active,
        isActiveDeposit: true,
        isActiveWithdrawal: true,
      });
    } else setProfileDraft(null);
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
        body: JSON.stringify({ userId, message: text, title: "Sohbet" }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || "Gönderilemedi");
        return;
      }
      setMessage("");
      setEmojiOpen(false);
      setSelected(userId);
      setCreateOpen(false);
      await load();
      flash("Yanıt gönderildi");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfileField(key: string, value: string | boolean) {
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
        flash(data.error || "Kayıt başarısız");
        return;
      }
      setProfileDraft((p) => (p ? { ...p, [key]: value } : p));
      await load();
      flash("Profil güncellendi");
    } finally {
      setBusy(false);
    }
  }

  function editField(key: keyof Profile, label: string) {
    if (!profileDraft) return;
    const current = String(profileDraft[key] ?? "");
    const next = window.prompt(label, current);
    if (next == null) return;
    void saveProfileField(key, next);
  }

  function toggleBool(key: "active" | "ftd") {
    if (!profileDraft) return;
    void saveProfileField(key, !Boolean(profileDraft[key]));
  }

  const messageBlocks = useMemo(() => {
    if (!active) return [] as { key: string; label: string; items: Msg[] }[];
    const blocks: { key: string; label: string; items: Msg[] }[] = [];
    for (const m of active.messages) {
      const key = dayKey(m.createdAt);
      const last = blocks[blocks.length - 1];
      if (!last || last.key !== key) {
        blocks.push({ key, label: formatDateSep(m.createdAt), items: [m] });
      } else last.items.push(m);
    }
    return blocks;
  }, [active]);

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
            <p className="text-sm font-semibold text-neutral-900">Canlı Destek Masası</p>
            <p className="text-[11px] text-neutral-500">
              7FX · {threads.length} konuşma · {unanswered} yanıt bekliyor
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-110"
        >
          Create chat
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
                placeholder="Search"
                className="w-full rounded-xl border border-neutral-200 bg-[#f5f5f5] py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none focus:border-[var(--accent)]/40"
                aria-label="Ara"
              />
            </div>
            <div className="flex gap-1 rounded-xl bg-[#f5f5f5] p-1">
              {(
                [
                  ["all", "All"],
                  ["new", "New"],
                  ["unanswered", "Not Answered"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`relative flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                    tab === id
                      ? "bg-[var(--accent-tint)] text-[var(--accent)] shadow-sm ring-1 ring-[var(--accent)]/25"
                      : "text-neutral-500 hover:text-slate-200"
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
                Sohbet yok — Create chat ile başlatın.
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
                        : "hover:bg-white/[0.03]"
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
                          {relativeTimeTr(t.lastAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`truncate text-[11px] ${
                            unread ? "font-semibold text-slate-200" : "text-neutral-500"
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
            All Chats Loaded
          </p>
        </aside>

        {/* CENTER */}
        <section className="flex min-h-0 flex-col bg-[#070707]">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-neutral-500">
              <p>Soldan bir konuşma seçin veya Create chat</p>
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
                      href={`/admin/traders/${active.traderId}`}
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
                  {active.active ? "Aktif" : "Donuk"}
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messageBlocks.map((block) => (
                  <div key={block.key} className="space-y-2.5">
                    <div className="flex justify-center">
                      <span className="rounded-full bg-[#141414] px-3 py-1 text-[10px] font-medium text-neutral-500 ring-1 ring-white/5">
                        {block.label}
                      </span>
                    </div>
                    {block.items.map((m) => {
                      const agent = Boolean(m.workerName);
                      return (
                        <div
                          key={m.id}
                          className={`flex ${agent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                              agent
                                ? "rounded-br-md bg-[#1a2a16] text-neutral-900 ring-1 ring-[var(--accent)]/20"
                                : "rounded-bl-md bg-[#141414] text-slate-200 ring-1 ring-white/5"
                            }`}
                          >
                            {agent && (
                              <p className="mb-1 text-[10px] font-semibold text-[var(--accent)]">
                                {m.workerName || "7FX Destek"}
                              </p>
                            )}
                            {m.title && m.title !== "Sohbet" && (
                              <p className="mb-0.5 text-[11px] font-medium text-neutral-500">
                                {m.title}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className="mt-1 text-right text-[10px] text-neutral-500">
                              {formatClock(m.createdAt)}
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
                  <div className="absolute bottom-full left-3 mb-2 flex gap-1 rounded-xl border border-neutral-200 bg-[#141414] p-2 shadow-lg">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="rounded-lg px-2 py-1 text-lg hover:bg-white/5"
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
                    7FX karşılama
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-white/5"
                    title="Sesli not"
                    aria-label="Ses"
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
                    placeholder="Enter message"
                    className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-[#f5f5f5] px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--accent)]/40"
                    aria-label="Yanıt"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setEmojiOpen((v) => !v)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-white/5"
                    aria-label="Emoji"
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-white/5"
                    aria-label="Dosya ekle"
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
                    aria-label="Gönder"
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
              Profil için sohbet seçin
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
                      flash("Kopyalandı");
                    }}
                    className="text-neutral-500 hover:text-slate-200"
                    aria-label="Kopyala"
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

              <ProfileRow
                label="Name"
                value={profileDraft.name}
                onEdit={() => editField("name", "Name")}
              />
              <ProfileRow
                label="Account Type"
                value={profileDraft.accountType || "STANDARD"}
                onEdit={() => editField("accountType", "Account Type")}
              />
              <ProfileRow
                label="Currency"
                value={profileDraft.currency || "USD"}
              />
              <ProfileRow
                label="Timezone"
                value={profileDraft.timezone || "Europe/Istanbul"}
                onEdit={() => editField("timezone", "Timezone")}
              />
              <ProfileRow
                label="Language"
                value={profileDraft.language || "tr"}
                onEdit={() => editField("language", "Language")}
              />
              <ProfileRow
                label="Is Active"
                value={profileDraft.active ? "Yes" : "No"}
                danger={!profileDraft.active}
                onEdit={() => toggleBool("active")}
              />
              <ProfileRow
                label="Is Active Trading"
                value={profileDraft.isActiveTrading ? "Yes" : "No"}
                danger={!profileDraft.isActiveTrading}
              />
              <ProfileRow
                label="Is Active Deposit"
                value={profileDraft.isActiveDeposit !== false ? "Yes" : "No"}
              />
              <ProfileRow
                label="Is Active Withdrawal"
                value={profileDraft.isActiveWithdrawal !== false ? "Yes" : "No"}
              />
              <ProfileRow
                label="Trading Server"
                value={profileDraft.tradingServer || "Web Trading Server"}
                onEdit={() => editField("tradingServer", "Trading Server")}
              />
              <ProfileRow
                label="Registered At"
                value={
                  profileDraft.registrationDate
                    ? new Date(profileDraft.registrationDate).toLocaleString("tr-TR")
                    : "—"
                }
              />
              <ProfileRow
                label="Registration Country"
                value={
                  profileDraft.registrationCountry ||
                  profileDraft.country ||
                  "—"
                }
                onEdit={() => editField("registrationCountry", "Registration Country")}
              />
              <ProfileRow label="Registration IP" value="—" />
              <ProfileRow
                label="Last Login At"
                value={
                  profileDraft.lastLoginAt
                    ? new Date(profileDraft.lastLoginAt).toLocaleString("tr-TR")
                    : "—"
                }
              />
              <ProfileRow
                label="Mark FTD"
                value={profileDraft.ftd ? "Yes" : "No"}
                danger={!profileDraft.ftd}
                onEdit={() => toggleBool("ftd")}
              />
              <ProfileRow
                label="Mark Ftd Broker"
                value={profileDraft.brokerName || "Not Assigned"}
                danger={!profileDraft.brokerName}
                onEdit={() => editField("brokerName", "Mark Ftd Broker")}
                onClear={() => void saveProfileField("brokerName", "")}
              />
              <ProfileRow label="Withdrawal Details" value="Empty" danger />
              <ProfileRow
                label="Assignment Affiliate"
                value={profileDraft.affiliateA || "-"}
                onEdit={() => editField("affiliateA", "Assignment Affiliate")}
              />
            </div>
          )}
        </aside>
      </div>

      {/* Create chat modal */}
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
            aria-label="Create chat"
          >
            <h3 className="text-sm font-semibold text-neutral-900">Create chat</h3>
            <p className="mt-1 text-[11px] text-neutral-500">
              Trader seçin — ilk mesaj 7FX karşılama olarak gönderilebilir.
            </p>
            <select
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="mt-3 w-full rounded-xl border border-neutral-200 bg-[#f5f5f5] px-3 py-2 text-sm"
            >
              <option value="">Trader seç…</option>
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
              placeholder="İlk mesaj"
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-[#f5f5f5] px-3 py-2 text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMessage(GREETING_7FX)}
                className="rounded-full bg-[var(--accent-tint)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)]"
              >
                7FX karşılama
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-white/5"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={busy || !newUserId || !message.trim()}
                onClick={() => void send(newUserId)}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                Başlat
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
