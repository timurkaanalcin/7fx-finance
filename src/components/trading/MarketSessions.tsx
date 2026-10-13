"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

/**
 * Forex market-session indicator (Sydney / Tokyo / London / New York).
 * Pure client-side, DST-aware via Intl time zones. Informational only.
 */
type Session = { key: string; label: string; tz: string; open: number; close: number };

const SESSIONS: Session[] = [
  { key: "syd", label: "SYD", tz: "Australia/Sydney", open: 7, close: 16 },
  { key: "tyo", label: "TYO", tz: "Asia/Tokyo", open: 9, close: 18 },
  { key: "lon", label: "LON", tz: "Europe/London", open: 8, close: 17 },
  { key: "nyc", label: "NYC", tz: "America/New_York", open: 8, close: 17 },
];

function zoneParts(now: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hour: Number(get("hour")) % 24, minute: Number(get("minute")), weekday: get("weekday") };
}

/** FX week: Sunday 17:00 → Friday 17:00 New York time. */
export function isFxWeekend(now: Date): boolean {
  const { hour, weekday } = zoneParts(now, "America/New_York");
  if (weekday === "Sat") return true;
  if (weekday === "Sun" && hour < 17) return true;
  if (weekday === "Fri" && hour >= 17) return true;
  return false;
}

export function sessionOpen(now: Date, s: Session): boolean {
  const { hour, weekday } = zoneParts(now, s.tz);
  if (weekday === "Sat" || weekday === "Sun") return false;
  return hour >= s.open && hour < s.close;
}

export default function MarketSessions({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) return null;
  const weekend = isFxWeekend(now);
  const local = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={`flex shrink-0 items-center gap-2 border-r border-desk-border/80 px-2.5 text-[10px] ${className}`}
      aria-label={t("term.sessions.title")}
      title={t("term.sessions.hint")}
    >
      <span className="tabular-nums text-desk-text/75">{local}</span>
      {weekend ? (
        <span className="inline-flex items-center gap-1 text-desk-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-desk-muted/60" aria-hidden />
          {t("term.sessions.weekend")}
        </span>
      ) : (
        SESSIONS.map((s) => {
          const open = sessionOpen(now, s);
          return (
            <span
              key={s.key}
              className={`inline-flex items-center gap-1 ${open ? "text-desk-text/85" : "text-desk-muted/60"}`}
              title={`${t(`term.sessions.${s.key}`)} — ${open ? t("term.sessions.open") : t("term.sessions.closed")}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${open ? "bg-desk-buy shadow-[0_0_4px_rgba(34,197,94,0.7)]" : "bg-desk-muted/40"}`}
                aria-hidden
              />
              {s.label}
              <span className="sr-only">{open ? t("term.sessions.open") : t("term.sessions.closed")}</span>
            </span>
          );
        })
      )}
    </div>
  );
}
