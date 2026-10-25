"use client";

import { useDialogFocus } from "@/components/a11y/useDialogFocus";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CRM_IDLE_POLL_MS, useVisiblePoll } from "@/lib/use-visible-poll";
import { CHAT_MESSAGE_PAGE, CHAT_THREAD_PAGE, prependChatMessages } from "@/lib/trader-list";
import { CrmListPager, useListQueryUrl } from "@/components/crm/CrmListBar";
import { CHAT_LIST_TAKES, chatListSearchString, listPageRange, listPageSkip, parseChatListQuery } from "@/lib/crm-list-url";
import {
  compareByLatestCustomer,
  formatChatStamp,
  isCustomerMessage,
  latestCustomerAt,
  unreadCustomerCount,
  viewerIntlLocale,
} from "@/lib/crm-inbox";
import { ChatFormattedBody } from "@/components/chat/ChatFormattedBody";
import { ChatFormatToolbar } from "@/components/chat/ChatFormatToolbar";
import { applyFormatAction, type FormatAction } from "@/components/chat/chatFormat";
import { ChatStatusLine } from "@/components/chat/ChatStatusLine";
import { CannedRepliesPanel, slashQueryAt, slug, useCannedReplies } from "@/components/chat/CannedReplies";
import { messageReadByPeer, type ChatPresenceSnapshot } from "@/lib/chat-presence-shared";
import { presenceState } from "@/lib/presence-shared";
import { isSystemAutoReply } from "@/lib/support-autoreply";

type Msg = {
  id: string;
  title: string | null;
  body: string;
  workerName: string | null;
  workerId?: string | null;
  automatic?: boolean;
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
  messageCount?: number;
  profile?: Profilee;
  presence?: ChatPresenceSnapshot;
};
type TraderOpt = { id: string; name: string; email: string };

type Tab = "all" | "new" | "unanswered";

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

function mergeChatThreads(prev: Thread[], incoming: Thread[], mode: "replace" | "more", keepId?: string | null): Thread[] {
  const prevById = new Map(prev.map((t) => [t.traderId, t]));
  const merged = incoming.map((t) => {
    const old = prevById.get(t.traderId);
    if (!old || old.messages.length <= t.messages.length) return t;
    const seen = new Set(old.messages.map((m) => m.id));
    const extra = t.messages.filter((m) => !seen.has(m.id));
    const messages = extra.length
      ? [...old.messages, ...extra].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      : old.messages;
    return { ...t, messages };
  });
  if (mode === "more") {
    const seen = new Set(prev.map((t) => t.traderId));
    return prev.concat(merged.filter((t) => !seen.has(t.traderId)));
  }
  if (keepId && !merged.some((t) => t.traderId === keepId)) {
    const kept = prev.find((t) => t.traderId === keepId);
    if (kept) return [kept, ...merged];
  }
  return merged;
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
  return formatChatStamp(iso, locale);
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
  // Automatic 7FX acknowledgements are not a staff reply.
  for (let i = t.messages.length - 1; i >= 0; i--) {
    const m = t.messages[i];
    if (isSystemAutoReply(m)) continue;
    return !m.workerName;
  }
  return true;
}

function isNew(t: Thread): boolean {
  return (t.messageCount ?? t.messages.length) <= 1;
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

const PIN_KEY = "7fx.crm.chat.pinned.v1";
const PIN_MAX = 20;
/** Per-browser pinned live-support threads (traderIds, newest pin first). Soft-fails. */
function loadPins(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(PIN_KEY) || "[]");
    if (!Array.isArray(v)) return [];
    const out: string[] = [];
    for (const x of v) if (typeof x === "string" && x && !out.includes(x)) out.push(x);
    return out.slice(0, PIN_MAX);
  } catch {
    return [];
  }
}
function savePins(list: string[]) {
  try {
    localStorage.setItem(PIN_KEY, JSON.stringify(list));
  } catch {}
}

const SEEN_KEY = "7fx.crm.chat.seen.v1";
function loadSeen(): Record<string, string> {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v)) {
      if (typeof k === "string" && typeof val === "string" && k && val) out[k] = val;
    }
    return out;
  } catch {
    return {};
  }
}
function saveSeen(map: Record<string, string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {}
}

function useInboxWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return wide;
}

const QUICK_REPLIES = [
  ["crm.chat.quickLooking", "crm.chat.quickLookingBody"],
  ["crm.chat.quickWait", "crm.chat.quickWaitBody"],
  ["crm.chat.quickDetails", "crm.chat.quickDetailsBody"],
  ["crm.chat.quickHours", "crm.chat.quickHoursBody"],
] as const;

export default function ChatPage() {
  const { i18n, locale } = useCrmLabels();
  const wide = useInboxWide();
  const [navLang, setNavLang] = useState<string | null>(null);
  useEffect(() => setNavLang(navigator.language), []);
  const dateLocale = viewerIntlLocale(locale, navLang);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [traders, setTraders] = useState<TraderOpt[]>([]);
  const [pickerHasMore, setPickerHasMore] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const tradersRef = useRef<TraderOpt[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [picked, setPicked] = useState(false);
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(CHAT_THREAD_PAGE);
  const [filtersReady, setFiltersReady] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const createDialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(createOpen, () => setCreateOpen(false), createDialogRef, "select");
  const [newUserId, setNewUserId] = useState("");
  const [profileDraft, setProfileeDraft] = useState<Profilee | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [livePresence, setLivePresence] = useState<ChatPresenceSnapshot | null>(null);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(false);
  // Staff-only canned replies (per browser) + "/" quick-pick in the composer
  const canned = useCannedReplies();
  const [cannedOpen, setCannedOpen] = useState(false);
  const [slash, setSlash] = useState<{ query: string; start: number } | null>(null);
  const [slashIdx, setSlashIdx] = useState(0);
  // Staff-only pinned threads (per browser, max 20, newest pin first)
  const [pins, setPins] = useState<string[]>([]);
  const threadsRef = useRef<Thread[]>([]);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;
  const listGen = useRef(0);
  const qRef = useRef("");
  const pickerSeen = useRef(false);
  useEffect(() => {
    setPins(loadPins());
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);
  const togglePin = useCallback((traderId: string) => {
    setPins((prev) => {
      const next = prev.includes(traderId) ? prev.filter((x) => x !== traderId) : [traderId, ...prev].slice(0, PIN_MAX);
      savePins(next);
      return next;
    });
  }, []);
  const slashMatches = useMemo(() => {
    if (!slash) return [] as { id: string; title: string; tag: string; body: string }[];
    const q = slug(slash.query);
    const rows: { id: string; title: string; tag: string; body: string }[] = [];
    // Built-in: "/documents" stays a plain token → customer sees a link to Evraklar
    if ("documents".startsWith(q)) {
      rows.push({ id: "__documents", title: i18n("crm.canned.docsLink"), tag: "documents", body: "/documents " });
    }
    for (const r of canned.items) {
      const tag = slug(r.title);
      if (!q || tag.includes(q) || slug(r.body).includes(q)) rows.push({ id: r.id, title: r.title, tag, body: r.body });
    }
    rows.sort((a, b) => Number(b.tag.startsWith(q)) - Number(a.tag.startsWith(q)));
    return rows.slice(0, 8);
  }, [slash, canned.items, i18n]);

  const chatQuery = chatListSearchString({
    q: qDebounced,
    tab,
    page,
    take,
    user: selected || "",
  });
  useListQueryUrl(filtersReady, chatQuery);
  const appliedChat = useRef("");

  const load = useCallback(async () => {
    if (!filtersReady) return;
    const gen = ++listGen.current;
    const sig = `${qDebounced}\u0001${take}`;
    let usePage = page;
    if (appliedChat.current && appliedChat.current !== sig) {
      usePage = 1;
      if (page !== 1) setPage(1);
    }
    appliedChat.current = sig;
    qRef.current = qDebounced;
    const p = new URLSearchParams();
    p.set("take", String(take));
    p.set("skip", String(listPageSkip(usePage, take)));
    if (qDebounced) p.set("q", qDebounced);
    if (pins.length) p.set("pins", pins.join(","));
    if (!pickerSeen.current) {
      p.set("picker", "1");
      p.set("pickerTake", "50");
      p.set("pickerSkip", "0");
    }
    try {
      const res = await fetch(`/api/admin/chat?${p}`);
      if (!res.ok || gen !== listGen.current) return;
      const data = await res.json();
      const incoming: Thread[] = data.threads || [];
      const next = mergeChatThreads(threadsRef.current, incoming, "replace", selectedRef.current);
      threadsRef.current = next;
      setThreads(next);
      setHasMore(Boolean(data.hasMore));
      if (Array.isArray(data.traders)) {
        tradersRef.current = data.traders;
        setTraders(data.traders);
        setPickerHasMore(Boolean(data.pickerHasMore));
        pickerSeen.current = true;
      }
    } catch {
      /* keep the inbox that is already on screen */
    }
  }, [filtersReady, page, qDebounced, pins, take]);

  useEffect(() => {
    const parsed = parseChatListQuery(window.location.search);
    setQuery(parsed.q);
    setQDebounced(parsed.q);
    setTab(parsed.tab);
    setPage(parsed.page);
    setTake(parsed.take);
    if (parsed.user) {
      setSelected(parsed.user);
      setPicked(true);
    }
    setFiltersReady(true);
  }, []);

  const loadMoreTraders = useCallback(async () => {
    if (pickerBusy) return;
    setPickerBusy(true);
    try {
      const p = new URLSearchParams();
      p.set("take", "20");
      p.set("skip", "0");
      p.set("picker", "1");
      p.set("pickerTake", "50");
      p.set("pickerSkip", String(tradersRef.current.length));
      const res = await fetch(`/api/admin/chat?${p}`);
      if (!res.ok) return;
      const data = await res.json();
      const incoming: TraderOpt[] = data.traders || [];
      const seen = new Set(tradersRef.current.map((row) => row.id));
      const next = tradersRef.current.concat(incoming.filter((row) => !seen.has(row.id)));
      tradersRef.current = next;
      setTraders(next);
      setPickerHasMore(Boolean(data.pickerHasMore));
    } finally {
      setPickerBusy(false);
    }
  }, [pickerBusy]);

  useEffect(() => {
    void load();
  }, [load]);
  useVisiblePoll(load, CRM_IDLE_POLL_MS);

  useEffect(() => {
    if (!selected) return;
    if (threadsRef.current.some((t) => t.traderId === selected)) return;
    let cancel = false;
    void (async () => {
      const res = await fetch(
        `/api/admin/chat?userId=${encodeURIComponent(selected)}&take=${CHAT_MESSAGE_PAGE}&skip=0`
      );
      if (!res.ok || cancel) return;
      const data = await res.json();
      const full = (data.threads || [])[0] as Thread | undefined;
      if (!full || cancel) return;
      setThreads((prev) => {
        if (prev.some((t) => t.traderId === full.traderId)) return prev;
        const next = [full, ...prev];
        threadsRef.current = next;
        return next;
      });
    })();
    return () => {
      cancel = true;
    };
  }, [selected]);

  async function loadOlder(traderId: string) {
    const known = threadsRef.current.find((t) => t.traderId === traderId);
    if (!known) return;
    const el = scrollerRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    setOlderBusy(true);
    try {
      const res = await fetch(
        `/api/admin/chat?userId=${encodeURIComponent(traderId)}&take=${CHAT_MESSAGE_PAGE}&skip=${known.messages.length}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const page = ((data.threads || [])[0] as Thread | undefined)?.messages || [];
      const count = Number((data.threads || [])[0]?.messageCount ?? data.messageCount);
      setThreads((prev) => {
        const next = prev.map((t) => {
          if (t.traderId !== traderId) return t;
          const messages = prependChatMessages(t.messages, page);
          const messageCount = Number.isFinite(count) ? count : t.messageCount;
          return {
            ...t,
            messages,
            messageCount: data.hasMore ? messageCount : messages.length,
          };
        });
        threadsRef.current = next;
        return next;
      });
      requestAnimationFrame(() => {
        if (!el) return;
        el.scrollTop += el.scrollHeight - prevHeight;
      });
    } finally {
      setOlderBusy(false);
    }
  }


  const unanswered = useMemo(
    () => threads.filter(isUnanswered).length,
    [threads],
  );

  const list = useMemo(() => {
    let rows = threads;
    if (tab === "new") rows = rows.filter(isNew);
    else if (tab === "unanswered") rows = rows.filter(isUnanswered);
    const byCustomer = (a: Thread, b: Thread) => compareByLatestCustomer(a, b);
    if (pins.length) {
      const rank = new Map(pins.map((id, i) => [id, i]));
      const pinned = rows.filter((t) => rank.has(t.traderId)).sort((a, b) => (rank.get(a.traderId) ?? 0) - (rank.get(b.traderId) ?? 0));
      const rest = rows.filter((t) => !rank.has(t.traderId)).sort(byCustomer);
      if (pinned.length) rows = [...pinned, ...rest];
      else rows = rest;
    } else {
      rows = [...rows].sort(byCustomer);
    }
    return rows;
  }, [threads, tab, pins]);
  const pinnedInList = useMemo(() => list.filter((t) => pins.includes(t.traderId)).length, [list, pins]);

  // Deep link from notifications: /izcrm/chat?user=<traderId>
  useEffect(() => {
    setSeen(loadSeen());
  }, []);

  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("user");
    if (u) {
      setSelected(u);
      setPicked(true);
    }
  }, []);

  const opened = threads.find((t) => t.traderId === selected) || null;
  const active = opened || (wide ? list[0] || null : null);

  useEffect(() => {
    if (wide && active && active.traderId !== selected) setSelected(active.traderId);
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
  }, [active, selected, wide]);

  const tailId = active?.messages[active.messages.length - 1]?.id;
  const threadOnScreen = wide || picked;
  useEffect(() => {
    if (!threadOnScreen || !active) return;
    const last = active.messages[active.messages.length - 1];
    if (!last) return;
    setSeen((prev) => {
      if (prev[active.traderId] === last.createdAt) return prev;
      const next = { ...prev, [active.traderId]: last.createdAt };
      saveSeen(next);
      return next;
    });
  }, [threadOnScreen, active]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.traderId, tailId]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function onFormat(action: FormatAction) {
    applyFormatAction(messageRef.current, message, setMessage, action);
  }

  const pingPresence = useCallback(
    async (userId: string, body: Record<string, unknown>) => {
      try {
        const res = await fetch("/api/admin/chat/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...body }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.presence) setLivePresence(data.presence);
      } catch {
        /* ignore */
      }
    },
    []
  );

  const pullPresence = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/chat/presence?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.presence) setLivePresence(data.presence);
    } catch {
      /* ignore */
    }
  }, []);
  // Active thread: mark in-chat + read, poll customer typing/online
  useEffect(() => {
    if (!active?.traderId) {
      setLivePresence(null);
      return;
    }
    const uid = active.traderId;
    setLivePresence(active.presence || null);
    void pingPresence(uid, { inChat: true, markRead: true });
    void pullPresence(uid);
    const tick = () => {
      if (document.hidden) return;
      void pingPresence(uid, { inChat: true, markRead: true });
      void pullPresence(uid);
    };
    const iv = window.setInterval(tick, 3000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", tick);
      void pingPresence(uid, { inChat: false, typing: false });
      lastTypingSent.current = false;
    };
  }, [active?.traderId, active?.presence, pingPresence, pullPresence]);


  function insertAtCaret(text: string) {
    const el = messageRef.current;
    const start = el?.selectionStart ?? message.length;
    const end = el?.selectionEnd ?? message.length;
    const next = message.slice(0, start) + text + message.slice(end);
    setMessage(next);
    setSlash(null);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function applySlash(body: string) {
    if (!slash) return;
    const el = messageRef.current;
    const caret = el?.selectionStart ?? message.length;
    const next = message.slice(0, slash.start) + body + message.slice(caret);
    setMessage(next);
    setSlash(null);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = slash.start + body.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function onComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (slash && slashMatches.length > 0 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const d = e.key === "ArrowDown" ? 1 : -1;
        setSlashIdx((i) => (i + d + slashMatches.length) % slashMatches.length);
        return;
      }
      if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
        e.preventDefault();
        applySlash(slashMatches[Math.min(slashIdx, slashMatches.length - 1)].body);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlash(null);
        return;
      }
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!busy && message.trim() && active) void send(active.traderId);
    }
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
      setSlash(null);
      lastTypingSent.current = false;
      if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
      void pingPresence(userId, { typing: false, inChat: true, markRead: true });
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
        blocks.push({ key, label: formatDateSep(m.createdAt, dateLocale), items: [m] });
      } else last.items.push(m);
    }
    return blocks;
  }, [active, dateLocale]);

  function onSend(e?: FormEvent) {
    e?.preventDefault();
    if (!active) return;
    void send(active.traderId);
  }

  return (
    <div className="-mx-1 flex h-[calc(100dvh-7.25rem)] min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg md:-mx-0 lg:h-[calc(100dvh-3.5rem)] lg:min-h-[560px]">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">
            CRM
          </span>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{i18n("crm.chat.title")}</p>
            <p className="text-[11px] text-neutral-500">
              7FX · {threads.length}{hasMore ? "+" : ""} {i18n("crm.chat.conversations")} · {unanswered} {i18n("crm.chat.awaiting")}
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
        <aside className={`${picked ? "max-lg:hidden" : "flex"} h-full min-h-0 flex-col border-b border-neutral-200 lg:flex lg:border-b-0 lg:border-r`}>
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
                data-fx-list-search=""
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
            {pinnedInList > 0 && (
              <li className="px-2.5 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                📌 {i18n("crm.chat.pinned")} · {pinnedInList}
              </li>
            )}
            {list.map((t) => {
              let last = t.messages[t.messages.length - 1];
              for (let i = t.messages.length - 1; i >= 0; i--) {
                if (isCustomerMessage(t.messages[i])) {
                  last = t.messages[i];
                  break;
                }
              }
              const isActive = active?.traderId === t.traderId;
              const unread = isUnanswered(t);
              const unreadN = unreadCustomerCount(t.messages, seen[t.traderId]);
              const customerAt = latestCustomerAt(t.messages);
              const previewAt = customerAt ? new Date(customerAt).toISOString() : t.lastAt;
              const isPinned = pins.includes(t.traderId);
              return (
                <li key={t.traderId} className="group relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      togglePin(t.traderId);
                    }}
                    aria-pressed={isPinned}
                    aria-label={isPinned ? i18n("crm.chat.unpin") : i18n("crm.chat.pin")}
                    title={isPinned ? i18n("crm.chat.unpin") : i18n("crm.chat.pin")}
                    className={`absolute bottom-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-md text-[12px] transition ${
                      isPinned
                        ? "opacity-100"
                        : "opacity-40 grayscale hover:bg-neutral-200 hover:opacity-100 group-hover:opacity-70"
                    }`}
                  >
                    {isPinned ? "📌" : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500" aria-hidden>
                        <path d="M12 17v5" />
                        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(t.traderId);
                      setPicked(true);
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
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
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              (selected === t.traderId ? livePresence : t.presence)?.customerTyping
                                ? "bg-[var(--accent)] animate-pulse"
                                : (selected === t.traderId ? livePresence : t.presence)?.customerInChat
                                  ? "bg-emerald-500"
                                  : presenceState((selected === t.traderId ? livePresence : t.presence)?.lastSeenAt) === "online"
                                    ? "bg-emerald-500"
                                    : presenceState((selected === t.traderId ? livePresence : t.presence)?.lastSeenAt) === "recent"
                                      ? "bg-amber-400"
                                      : "bg-neutral-300"
                            }`}
                          />
                          <span className="truncate text-[13px] font-semibold text-neutral-900">
                            {t.trader}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {unreadN > 0 && (
                            <span
                              data-unread={unreadN}
                              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-medium tabular-nums text-white"
                              aria-label={`${unreadN} ${i18n("crm.chat.unread")}`}
                            >
                              {unreadN > 99 ? "99+" : unreadN}
                            </span>
                          )}
                          <span className="text-[10px] font-medium tabular-nums text-neutral-500">
                            {relativeTimeTr(previewAt, dateLocale)}
                          </span>
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 pr-6">
                        <span
                          className={`truncate text-[11px] ${
                            unread ? "font-medium text-neutral-800" : "text-neutral-500"
                          }`}
                        >
                          {last?.body || t.traderEmail}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-neutral-200 px-2 py-2">
            <CrmListPager
              page={page}
              take={take}
              takes={CHAT_LIST_TAKES}
              hasMore={hasMore}
              from={listPageRange(page, take, threads.length).from}
              to={listPageRange(page, take, threads.length).to}
              total={null}
              onPage={setPage}
              onTake={(n) => {
                setTake(n);
                setPage(1);
              }}
              onClear={() => {
                setQuery("");
                setTab("all");
                setPage(1);
              }}
              clearDisabled={!query && tab === "all" && page === 1}
            />
          </div>
        </aside>

        {/* CENTER */}
        <section className={`${picked ? "flex" : "hidden"} h-full min-h-0 flex-col bg-white lg:flex`}>
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-neutral-500">
              <p>{i18n("crm.chat.emptyThread")}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-neutral-200 bg-white px-3 py-2.5 sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(false);
                      setSelected(null);
                    }}
                    className="fx-rtl-flip flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-sm font-medium text-neutral-800 lg:hidden"
                    aria-label={i18n("crm.chat.back")}
                  >
                    ←
                  </button>
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
                    <ChatStatusLine
                      className="mt-0.5"
                      lastSeenAt={(livePresence || active.presence)?.lastSeenAt}
                      inChat={(livePresence || active.presence)?.customerInChat}
                      typing={(livePresence || active.presence)?.customerTyping}
                      labels={{
                        typing: i18n("crm.chat.typing"),
                        inChat: i18n("crm.chat.inChat"),
                        online: i18n("crm.chat.onlineNow"),
                        offline: i18n("crm.chat.offline"),
                      }}
                    />
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

              <div ref={scrollerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {active && (active.messageCount ?? active.messages.length) > active.messages.length && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={olderBusy}
                      onClick={() => void loadOlder(active.traderId)}
                      className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {olderBusy ? i18n("crm.ui.loading") : i18n("crm.chat.loadOlder")}
                    </button>
                  </div>
                )}
                {messageBlocks.map((block, bi) => (
                  <div key={block.key} className="space-y-2.5">
                    {bi > 0 && (
                      <div className="flex items-center gap-3 py-1" role="separator" aria-label={i18n("crm.chat.dayEnd")}>
                        <div className="h-px flex-1 bg-neutral-200" />
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                          {i18n("crm.chat.dayEnd")}
                        </span>
                        <div className="h-px flex-1 bg-neutral-200" />
                      </div>
                    )}
                    <div className="flex justify-center">
                      <span className="rounded-full bg-neutral-50 px-3 py-1 text-[10px] font-medium text-neutral-600 ring-1 ring-neutral-200">
                        {block.label}
                      </span>
                    </div>
                    {block.items.map((m) => {
                      const automatic = isSystemAutoReply(m);
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
                                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--accent)]">
                                  <span>{automatic ? "7FX" : m.workerName || "7FX Support"}</span>
                                  {automatic && (
                                    <span className="rounded-full bg-neutral-900/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                                      {i18n("crm.chat.automatic")}
                                    </span>
                                  )}
                                </p>
                                {!isEditing && !automatic && (
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
                              <ChatFormattedBody
                                text={m.body}
                                className="break-words text-[13px] leading-relaxed"
                                renderAttachment={(id) => (
                                  <a href={`/api/admin/chat/attachments/${id}`} target="_blank" rel="noreferrer" className="rounded bg-black/5 px-2 py-0.5 text-[11px] font-semibold underline">
                                    ⬇ {i18n("crm.chat.attach")}
                                  </a>
                                )}
                              />
                            )}
                            <p className="mt-1 flex items-center justify-end gap-2 text-[10px] text-neutral-500">
                              {agent &&
                                messageReadByPeer(
                                  m.createdAt,
                                  (livePresence || active.presence)?.customerLastReadAt
                                ) && (
                                  <span className="font-medium text-emerald-600">
                                    {i18n("crm.chat.read")}
                                  </span>
                                )}
                              <span className="tabular-nums">{formatClock(m.createdAt, dateLocale)}</span>
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
                        aria-label={e}
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
                <CannedRepliesPanel
                  open={cannedOpen}
                  onClose={() => setCannedOpen(false)}
                  onInsert={insertAtCaret}
                  composerText={message}
                  canned={canned}
                  labels={{
                    button: i18n("crm.canned.button"),
                    title: i18n("crm.canned.title"),
                    empty: i18n("crm.canned.empty"),
                    add: i18n("crm.canned.add"),
                    fromComposer: i18n("crm.canned.fromComposer"),
                    name: i18n("crm.canned.name"),
                    body: i18n("crm.canned.body"),
                    save: i18n("crm.ui.save"),
                    cancel: i18n("crm.ui.cancel"),
                    edit: i18n("crm.ui.edit"),
                    del: i18n("crm.ui.delete"),
                    delConfirm: i18n("crm.canned.deleteConfirm"),
                    full: i18n("crm.canned.full"),
                    insert: i18n("crm.canned.insert"),
                    slashHint: i18n("crm.canned.slashHint"),
                  }}
                />
                {slash && slashMatches.length > 0 && !cannedOpen && (
                  <ul
                    className="absolute bottom-full left-3 right-3 z-30 mb-2 max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-xl sm:right-auto sm:w-[360px]"
                    role="listbox"
                    aria-label={i18n("crm.canned.title")}
                  >
                    {slashMatches.map((r, i) => (
                      <li key={r.id} role="option" aria-selected={i === slashIdx}>
                        <button
                          type="button"
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            applySlash(r.body);
                          }}
                          onMouseEnter={() => setSlashIdx(i)}
                          className={`block w-full rounded-lg px-2.5 py-1.5 text-left ${
                            i === slashIdx ? "bg-[var(--accent-tint)]" : "hover:bg-neutral-50"
                          }`}
                        >
                          <span className="block truncate text-[12px] font-semibold text-neutral-900">
                            /{r.tag} <span className="font-normal text-neutral-500">· {r.title}</span>
                          </span>
                          {r.id !== "__documents" && (
                            <span className="block truncate text-[11px] text-neutral-500">{r.body}</span>
                          )}
                        </button>
                      </li>
                    ))}
                    <li className="px-2.5 pb-1 pt-1.5 text-[10px] text-neutral-400">{i18n("crm.canned.pickHint")}</li>
                  </ul>
                )}
                <div
                  className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5"
                  aria-label={i18n("crm.chat.quickReplies")}
                >
                  {QUICK_REPLIES.map(([labelKey, bodyKey]) => (
                    <button
                      key={labelKey}
                      type="button"
                      onClick={() =>
                        setMessage((cur) => {
                          const body = i18n(bodyKey);
                          return cur.trim() ? `${cur.trim()}\n${body}` : body;
                        })
                      }
                      className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-800 hover:bg-neutral-50"
                    >
                      {i18n(labelKey)}
                    </button>
                  ))}
                </div>
                <div className="mb-2 flex flex-nowrap items-center gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEmojiOpen(false);
                      setCannedOpen((v) => !v);
                    }}
                    aria-expanded={cannedOpen}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 transition ${
                      cannedOpen
                        ? "bg-[var(--accent)] text-white ring-[var(--accent)]"
                        : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50"
                    }`}
                    title={i18n("crm.canned.slashHint")}
                  >
                    ⚡ {i18n("crm.canned.button")}
                    {canned.items.length > 0 && (
                      <span className="ml-1 text-neutral-400">{canned.items.length}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage(i18n("crm.chat.greetingBody"))}
                    className="rounded-full bg-[var(--accent-tint)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)] ring-1 ring-[var(--accent)]/20"
                  >
                    {i18n("crm.chat.welcome")}
                  </button>
                  <ChatFormatToolbar
                    disabled={busy}
                    onAction={onFormat}
                    labels={{
                      bold: i18n("crm.chat.fmtBold"),
                      italic: i18n("crm.chat.fmtItalic"),
                      underline: i18n("crm.chat.fmtUnderline"),
                      bullet: i18n("crm.chat.fmtBullet"),
                      newline: i18n("crm.chat.fmtNewline"),
                    }}
                  />
                  <span className="text-[10px] text-neutral-400">{i18n("crm.chat.sendHint")}</span>
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
                  <textarea
                    ref={messageRef}
                    value={message}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMessage(v);
                      const sq = slashQueryAt(v, e.target.selectionStart ?? v.length);
                      setSlash(sq);
                      if (sq && sq.query !== slash?.query) setSlashIdx(0);
                      if (!active?.traderId) return;
                      if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
                      if (v.trim()) {
                        if (!lastTypingSent.current) {
                          lastTypingSent.current = true;
                          void pingPresence(active.traderId, { typing: true });
                        }
                        typingIdleRef.current = setTimeout(() => {
                          lastTypingSent.current = false;
                          void pingPresence(active.traderId, { typing: false });
                        }, 2500);
                      } else if (lastTypingSent.current) {
                        lastTypingSent.current = false;
                        void pingPresence(active.traderId, { typing: false });
                      }
                    }}
                    onKeyDown={onComposerKeyDown}
                    onBlur={() => window.setTimeout(() => setSlash(null), 120)}
                    placeholder={i18n("crm.chat.enter")}
                    rows={2}
                    className="min-h-[2.75rem] max-h-40 min-w-0 flex-1 resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--accent)]/40"
                    aria-label={i18n("crm.ui.reply")}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCannedOpen(false);
                      setEmojiOpen((v) => !v);
                    }}
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
                        const traderId = active.traderId;
                        void (async () => {
                          const fd = new FormData();
                          fd.append("userId", traderId);
                          fd.append("file", f);
                          const r = await fetch("/api/admin/chat/attachments", { method: "POST", body: fd });
                          const d = await r.json().catch(() => ({}));
                          if (!r.ok || !d.attachment?.id) {
                            flash(d.error || i18n("crm.chat.sendFail"));
                            return;
                          }
                          await send(traderId, `📎 ${f.name} (${Math.round(f.size / 1024)} KB) [[att:${d.attachment.id}]]`);
                        })();
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
                    ? new Date(profileDraft.registrationDate).toLocaleString(dateLocale)
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
                    ? new Date(profileDraft.lastLoginAt).toLocaleString(dateLocale)
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
            ref={createDialogRef}
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
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
            {pickerHasMore && (
              <button
                type="button"
                disabled={pickerBusy}
                onClick={() => void loadMoreTraders()}
                className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                {pickerBusy ? i18n("crm.ui.loading") : i18n("crm.ui.loadMore")}
              </button>
            )}
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
                onClick={() => setMessage(i18n("crm.chat.greetingBody"))}
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
