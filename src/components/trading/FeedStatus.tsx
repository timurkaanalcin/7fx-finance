"use client";

/**
 * Price-feed connection indicator (client-only).
 * - "offline": browser reports no network (navigator.onLine === false)
 * - "stale":   no successful quote for > STALE_MS while visible → "reconnecting…"
 * - "live":    quotes arriving normally
 * Background tabs are not judged (timers are throttled there); on return / on
 * "online" we kick an immediate re-pull and give a short grace period.
 * Shows a slim banner while offline/stale and a short "reconnected" toast.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { prefersReducedMotion } from "@/lib/motion";

export type FeedState = "live" | "stale" | "offline";
export const FEED_STALE_MS = 10_000;
const GRACE_MS = 5_000;

export function useFeedHealth(onKick: () => void) {
  const lastOkRef = useRef<number>(Date.now());
  const graceUntilRef = useRef<number>(Date.now() + GRACE_MS);
  const kickRef = useRef(onKick);
  kickRef.current = onKick;
  const [state, setState] = useState<FeedState>("live");
  const [ageSec, setAgeSec] = useState(0);
  const [recovered, setRecovered] = useState(false);
  const prevStateRef = useRef<FeedState>("live");

  const markOk = useCallback(() => {
    lastOkRef.current = Date.now();
  }, []);

  const kick = useCallback(() => {
    graceUntilRef.current = Date.now() + GRACE_MS;
    try {
      kickRef.current();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    function evaluate() {
      if (typeof document !== "undefined" && document.hidden) return;
      const now = Date.now();
      const online = typeof navigator === "undefined" ? true : navigator.onLine !== false;
      const age = now - lastOkRef.current;
      let next: FeedState = "live";
      if (!online) next = "offline";
      else if (age > FEED_STALE_MS && now > graceUntilRef.current) next = "stale";
      setState(next);
      setAgeSec(next === "live" ? 0 : Math.floor(age / 1000));
      const prev = prevStateRef.current;
      if (prev !== "live" && next === "live") {
        setRecovered(true);
      } else if (next !== "live") {
        setRecovered(false);
      }
      prevStateRef.current = next;
    }
    const id = window.setInterval(evaluate, 1000);
    const onOnline = () => {
      kick();
      evaluate();
    };
    const onOffline = () => evaluate();
    const onVis = () => {
      if (!document.hidden) {
        kick();
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [kick]);

  // Auto-hide the "reconnected" toast
  useEffect(() => {
    if (!recovered || prefersReducedMotion()) return;
    const t = window.setTimeout(() => setRecovered(false), 3500);
    return () => window.clearTimeout(t);
  }, [recovered]);

  return { state, ageSec, recovered, markOk, kick, dismissRecovered: () => setRecovered(false) };
}

export function FeedBanner({
  state,
  ageSec,
  onRetry,
}: {
  state: FeedState;
  ageSec: number;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  if (state === "live") return null;
  const offline = state === "offline";
  return (
    <div
      role="status"
      aria-live="polite"
      data-fx-feed={state}
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b px-3 py-1.5 text-center text-[11px] font-medium ${
        offline
          ? "border-desk-sell/40 bg-desk-sell/90 text-white"
          : "border-desk-warn/30 bg-desk-warn/90 text-black"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className={`inline-block h-1.5 w-1.5 rounded-full ${offline ? "bg-white" : "animate-pulse bg-black/70"}`}
        />
        {offline ? t("term.feed.offline") : t("term.feed.stale")}
      </span>
      {ageSec > 0 && (
        <span className="tabular-nums opacity-80">
          {t("term.feed.lastUpdate").replace("{s}", String(ageSec))}
        </span>
      )}
      <button
        type="button"
        onClick={onRetry}
        className={`rounded px-2 py-0.5 ${offline ? "bg-white/20 hover:bg-white/30" : "bg-black/10 hover:bg-black/20"}`}
      >
        {t("term.feed.retry")}
      </button>
    </div>
  );
}

export function FeedRecoveredToast({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { t } = useI18n();
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-fx-feed="recovered"
      className="fx-toast fixed left-1/2 top-16 z-[85] max-w-[92vw] -translate-x-1/2 rounded-[14px] border border-desk-buy/50 bg-desk-panel px-4 py-2.5 text-[12px] font-semibold text-desk-text shadow-desk-panel"
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-desk-buy align-middle" aria-hidden />
      {t("term.feed.recovered")}
      <button type="button" onClick={onClose} className="ml-3 text-desk-muted" aria-label={t("term.feed.dismiss")}>
        ✕
      </button>
    </div>
  );
}

/** Small persistent dot + label for the desktop footer. */
export function FeedDot({ state }: { state: FeedState }) {
  const { t } = useI18n();
  const color = state === "live" ? "bg-desk-buy" : state === "stale" ? "bg-desk-warn animate-pulse" : "bg-desk-sell";
  const label =
    state === "live" ? t("term.feed.live") : state === "stale" ? t("term.feed.short.stale") : t("term.feed.short.offline");
  return (
    <span
      className="relative z-[1] inline-flex h-full shrink-0 items-center gap-1.5 border-r border-desk-border/70 bg-desk-panel px-2.5 text-[10px] font-medium text-desk-muted"
      title={label}
      data-fx-feed-dot={state}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
