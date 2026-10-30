"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { playAlertSound, unlockAlertSound } from "@/lib/alert-sound";

const INTL_TAG: Record<string, string> = {
  en: "en",
  tr: "tr",
  de: "de",
  ru: "ru",
  ar: "ar",
};

type N = { id: string; kind: string; title: string; body: string; href: string | null; readAt: string | null; createdAt: string };
type PushState = "unsupported" | "default" | "granted" | "denied";

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function ago(iso: string, locale: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(INTL_TAG[locale] || "en", { numeric: "auto" });
  if (s < 60) return rtf.format(-s, "second");
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}

function iosNeedsHomeScreen(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

const SUPPORT_REPLY_TITLES = new Set([
  "New message from support",
  "Destek ekibinden yeni mesaj",
  "Neue Nachricht vom Support",
  "Новое сообщение от поддержки",
  "رسالة جديدة من الدعم",
]);

function isLiveAlert(n: N): boolean {
  return n.kind === "chat" || n.kind === "handoff" || n.title === "Live support: new message" || SUPPORT_REPLY_TITLES.has(n.title);
}

function notificationTitle(n: N, translate: (key: string) => string): string {
  if (SUPPORT_REPLY_TITLES.has(n.title)) return translate("term.notify.chatFromSupport");
  if (n.title === "Live support: new message") return translate("term.notify.liveSupport");
  return n.title;
}

export default function NotificationBell({
  tone = "light",
  enableButton = false,
  liveAlerts = false,
  pollMs = 20_000,
}: {
  tone?: "light" | "dark";
  /** Visible "Enable notifications" control (CRM). */
  enableButton?: boolean;
  /** Sound + toast while this CRM tab is open. */
  liveAlerts?: boolean;
  pollMs?: number;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [items, setItems] = useState<N[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const itemsRef = useRef<N[]>([]);
  const [vapid, setVapid] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushState>("default");
  const [hint, setHint] = useState("");
  const [toasts, setToasts] = useState<N[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const booted = useRef(false);

  const noticeNew = useCallback(
    (incoming: N[], mode: "replace" | "more") => {
      const fresh: N[] = [];
      const wasBooted = booted.current;
      for (const n of incoming) {
        if (knownIds.current.has(n.id)) continue;
        knownIds.current.add(n.id);
        if (wasBooted && liveAlerts && mode === "replace" && !n.readAt && isLiveAlert(n)) fresh.push(n);
      }
      booted.current = true;
      if (!fresh.length || document.visibilityState !== "visible") return;
      playAlertSound();
      setToasts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...fresh.filter((n) => !ids.has(n.id)), ...prev].slice(0, 3);
      });
    },
    [liveAlerts]
  );

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    try {
      const loaded = itemsRef.current.length;
      const skip = mode === "more" ? loaded : 0;
      const take = mode === "more" ? 30 : Math.min(100, Math.max(30, loaded));
      if (mode === "more") setMoreBusy(true);
      const r = await fetch(`/api/notifications?take=${take}&skip=${skip}`, { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      const incoming: N[] = d.items || [];
      noticeNew(incoming, mode);
      const next =
        mode === "more"
          ? itemsRef.current.concat(incoming.filter((row) => !itemsRef.current.some((old) => old.id === row.id)))
          : incoming;
      itemsRef.current = next;
      setItems(next);
      setHasMore(Boolean(d.hasMore));
      setUnread(d.unread || 0);
      if (mode === "replace") setVapid(d.vapidPublicKey || null);
    } catch {
      /* ignore */
    } finally {
      if (mode === "more") setMoreBusy(false);
    }
  }, [noticeNew]);

  useEffect(() => {
    load();
    const iv = window.setInterval(() => {
      if (!document.hidden) load();
    }, pollMs);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) setPushState("unsupported");
    else setPushState(Notification.permission as PushState);
    return () => { window.clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, [load, pollMs]);

  useEffect(() => {
    if (!liveAlerts) return;
    const unlock = () => unlockAlertSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [liveAlerts]);

  // Keep the server subscription fresh when permission was already granted.
  useEffect(() => {
    if (pushState === "granted" && vapid) subscribe(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh the push subscription when permission and the key arrive
  }, [pushState, vapid]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!toasts.length) return;
    const iv = window.setTimeout(() => setToasts((list) => list.slice(0, -1)), 8000);
    return () => window.clearTimeout(iv);
  }, [toasts]);

  async function subscribe(ask: boolean) {
    setHint("");
    if (iosNeedsHomeScreen()) {
      setHint(t("term.notify.iosInstall"));
      return;
    }
    if (!vapid) {
      setHint(t("term.notify.noPush"));
      return;
    }
    if (pushState === "unsupported") {
      setHint(t("term.notify.unsupported"));
      return;
    }
    try {
      unlockAlertSound();
      if (ask) {
        const p = await Notification.requestPermission();
        setPushState(p as PushState);
        if (p !== "granted") {
          if (p === "denied") setHint(t("term.notify.denied"));
          return;
        }
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(vapid) }));
      const res = await fetch("/api/notifications/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) {
        setHint(t("term.notify.saveFailed"));
        return;
      }
      if (ask) setHint(t("term.notify.enabledDevice"));
    } catch {
      if (ask) setHint(t("term.notify.enableFailed"));
    }
  }

  async function openItem(n: N) {
    setOpen(false);
    setToasts((list) => list.filter((x) => x.id !== n.id));
    if (!n.readAt) {
      setItems((l) => {
        const next = l.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
        itemsRef.current = next;
        return next;
      });
      setUnread((u) => Math.max(0, u - 1));
      fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) }).catch(() => {});
    }
    if (n.href) {
      const [path, hash] = n.href.split("#");
      if (path === window.location.pathname + window.location.search) {
        if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        else window.location.reload();
      } else router.push(n.href);
    }
  }

  async function markAll() {
    setItems((l) => {
      const next = l.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() }));
      itemsRef.current = next;
      return next;
    });
    setUnread(0);
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }).catch(() => {});
  }

  const dark = tone === "dark";
  const enableLabel =
    pushState === "granted" && vapid ? t("term.notify.on") : t("term.notify.enableBtn");

  return (
    <div className="flex items-center gap-2">
      {enableButton && (
        <button
          type="button"
          onClick={() => {
            if (iosNeedsHomeScreen()) {
              window.location.href = "/ios";
              return;
            }
            if (pushState === "granted" && vapid) return;
            void subscribe(true);
          }}
          className={`whitespace-nowrap rounded border px-2 py-1 text-[10px] font-semibold ${
            pushState === "granted" && vapid
              ? "border-[#26a69a]/40 bg-[#26a69a]/10 text-[#0f766e]"
              : "border-black/10 bg-white text-neutral-800 hover:bg-neutral-100"
          }`}
          aria-label={t("term.notify.enableBtn")}
        >
          {enableLabel}
        </button>
      )}
      <div className="relative" ref={ref}>
        <button
          type="button"
          aria-label={`${t("term.notify.title")}${unread ? ` (${t("term.notify.unread").replace("{n}", String(unread))})` : ""}`}
          onClick={() => setOpen((o) => !o)}
          className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full border ${dark ? "border-[#2a2a2a] bg-[#0a0a0a] text-slate-200 hover:border-white/30" : "border-black/10 bg-white text-[#111111] hover:bg-neutral-50"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9a6 6 0 1112 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-[#e5484d] px-1 text-center text-[9px] font-bold leading-4 text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 z-[70] mt-2 w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-xl border border-black/10 bg-white text-[#111111] shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
              <span className="text-[13px] font-semibold">{t("term.notify.title")}</span>
              {unread > 0 && <button type="button" onClick={markAll} className="text-[11px] text-neutral-500 hover:text-black">{t("term.notify.markAll")}</button>}
            </div>
            {pushState === "default" && vapid && (
              <button type="button" onClick={() => subscribe(true)} className="block w-full border-b border-black/5 bg-neutral-50 px-3 py-2 text-left text-[11px] text-neutral-600 hover:bg-neutral-100">
                🔔 {t("term.notify.enable")}
              </button>
            )}
            {pushState === "denied" && (
              <p className="border-b border-black/5 bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500">{t("term.notify.denied")}</p>
            )}
            {!vapid && enableButton && (
              <p className="border-b border-black/5 bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500">
                {t("term.notify.vapidOff")}
              </p>
            )}
            <ul className="max-h-[360px] overflow-auto">
              {items.length === 0 && <li className="px-3 py-6 text-center text-[12px] text-neutral-500">{t("term.notify.empty")}</li>}
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => openItem(n)} className={`flex w-full gap-2 px-3 py-2.5 text-left hover:bg-neutral-50 ${n.readAt ? "" : "bg-neutral-50/70"}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : n.kind === "handoff" ? "bg-[#e5484d]" : "bg-[#111111]"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12.5px] ${n.readAt ? "font-medium text-neutral-600" : "font-semibold"}`}>{notificationTitle(n, t)}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[11.5px] text-neutral-500">{n.body}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-neutral-400">{ago(n.createdAt, locale)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {hasMore && (
              <button
                type="button"
                disabled={moreBusy}
                onClick={() => void load("more")}
                className="block w-full border-t border-black/5 px-3 py-2 text-center text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                {moreBusy ? t("common.loading") : t("term.loadMore")}
              </button>
            )}
          </div>
        )}
      </div>
      {(hint || toasts.length > 0) && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2">
          {hint && (
            <div className="pointer-events-auto rounded-xl border border-black/10 bg-white p-3 text-[12px] text-neutral-800 shadow-xl" role="status">
              <div className="flex items-start justify-between gap-2">
                <p>{hint}</p>
                <button type="button" className="text-neutral-400" onClick={() => setHint("")} aria-label={t("term.notify.dismiss")}>×</button>
              </div>
            </div>
          )}
          {toasts.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openItem(n)}
              className="pointer-events-auto rounded-xl border border-black/10 bg-[#111111] p-3 text-left text-white shadow-xl"
            >
              <div className="text-[12px] font-semibold">{notificationTitle(n, t)}</div>
              <div className="mt-1 line-clamp-3 text-[11.5px] text-white/80">{n.body}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
