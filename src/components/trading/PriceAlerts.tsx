"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatPrice, getSymbol } from "@/lib/symbols";
import type { PriceTick } from "./types";

/**
 * repeat: false/undefined = fire once then remove (legacy behaviour).
 * repeat: true = keep after firing, disarm (armed:false) until mid moves back past the level by the hysteresis.
 */
type Alert = { id: string; symbol: string; price: number; dir: "above" | "below"; createdAt: number; repeat?: boolean; armed?: boolean };
const KEY = "fx-price-alerts";
const SOUND_KEY = "fx-price-alert-sound";

function loadSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

/** Shared AudioContext — created/resumed lazily (ideally inside a user gesture). */
let audioCtx: AudioContext | null = null;
function getAudio(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AC: typeof AudioContext | undefined =
        typeof window !== "undefined" ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume().catch(() => {});
    return audioCtx;
  } catch {
    return null;
  }
}

/** Short, soft two-tone chime (~0.35s). Fails silently if audio is unavailable/blocked. */
function beep() {
  try {
    const ctx = getAudio();
    if (!ctx) return;
    if (ctx.state !== "running") {
      // Autoplay policy: only plays if a prior user gesture unlocked audio; otherwise silently skipped.
      void ctx.resume().then(() => ctx.state === "running" && play(ctx)).catch(() => {});
      return;
    }
    play(ctx);
  } catch {}
}
function play(ctx: AudioContext) {
  try {
    const t0 = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = t0 + i * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  } catch {}
}

const PCT_CHIPS = [-1, -0.5, -0.1, 0.1, 0.5, 1] as const;

/** Re-arm band for repeat alerts: max(0.02% of level, one display tick). */
function hysteresis(symbol: string, price: number): number {
  let digits = 5;
  try {
    const d = getSymbol(symbol)?.digits;
    if (typeof d === "number" && Number.isFinite(d) && d >= 0) digits = d;
  } catch {}
  return Math.max(Math.abs(price) * 0.0002, Math.pow(10, -digits));
}

function load(): Alert[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((a) => a && typeof a.symbol === "string" && Number.isFinite(a.price)).slice(0, 100) : [];
  } catch {
    return [];
  }
}
function save(list: Alert[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Client-side price alerts (per device). Bell on the chart → set "above/below" level for the
 * current symbol; fires an in-app toast (+ system notification if the user allowed it).
 */
export default function PriceAlerts({ symbol, prices }: { symbol: string; prices: Record<string, PriceTick> }) {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [sound, setSound] = useState(true);
  const [repeatNew, setRepeatNew] = useState(false);
  const soundRef = useRef(true);

  useEffect(() => {
    setAlerts(load());
    const s = loadSound();
    setSound(s);
    soundRef.current = s;
  }, []);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    soundRef.current = next;
    try {
      localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    } catch {}
    if (next) {
      getAudio();
      beep();
    }
  }

  const mid = (t?: PriceTick) => (t ? (Number(t.bid) + Number(t.ask)) / 2 : NaN);

  useEffect(() => {
    if (!alerts.length) return;
    const hit: Alert[] = [];
    let changed = false;
    const keep: Alert[] = [];
    for (const a of alerts) {
      const m = mid(prices[a.symbol]);
      if (!Number.isFinite(m)) {
        keep.push(a);
        continue;
      }
      if (a.armed === false) {
        // Cooling: re-arm only once mid has moved back past the level (with hysteresis)
        const h = hysteresis(a.symbol, a.price);
        const rearm = a.dir === "above" ? m < a.price - h : m > a.price + h;
        if (rearm) {
          keep.push({ ...a, armed: true });
          changed = true;
        } else keep.push(a);
        continue;
      }
      const fired = a.dir === "above" ? m >= a.price : m <= a.price;
      if (!fired) {
        keep.push(a);
        continue;
      }
      hit.push(a);
      changed = true;
      if (a.repeat) keep.push({ ...a, armed: false });
    }
    if (!changed) return;
    setAlerts(keep);
    save(keep);
    if (!hit.length) return;
    const msg = hit.map((a) => `${a.symbol} ${a.dir === "above" ? "≥" : "≤"} ${formatPrice(a.symbol, a.price)}${a.repeat ? " ↻" : ""}`).join(" · ");
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 8000);
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("7FX price alert", { body: msg });
    } catch {}
    try {
      navigator.vibrate?.(120);
    } catch {}
    if (soundRef.current) beep();
  }, [prices, alerts]);

  const cur = mid(prices[symbol]);
  const mine = alerts.filter((a) => a.symbol === symbol);

  function add() {
    const p = Number(String(val).replace(",", "."));
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(cur)) return;
    const a: Alert = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, symbol, price: p, dir: p >= cur ? "above" : "below", createdAt: Date.now(), repeat: repeatNew, armed: true };
    const next = [...alerts, a].slice(-100);
    setAlerts(next);
    save(next);
    setVal("");
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
    } catch {}
  }
  function addAt(price: number) {
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(cur)) return;
    const a: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      symbol,
      price,
      dir: price >= cur ? "above" : "below",
      createdAt: Date.now(),
      repeat: repeatNew,
      armed: true,
    };
    const next = [...alerts, a].slice(-100);
    setAlerts(next);
    save(next);
    setVal("");
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
    } catch {}
  }

  function quickPct(pct: number) {
    if (!Number.isFinite(cur)) return;
    const target = cur * (1 + pct / 100);
    if (soundRef.current) getAudio();
    addAt(target);
  }

  function toggleRepeat(id: string) {
    const next = alerts.map((a) => (a.id === id ? { ...a, repeat: !a.repeat } : a));
    setAlerts(next);
    save(next);
  }

  function remove(id: string) {
    const next = alerts.filter((a) => a.id !== id);
    setAlerts(next);
    save(next);
  }

  return (
    <>
      <div className="absolute bottom-9 left-[52px] z-20">
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            if (soundRef.current) getAudio();
          }}
          aria-label={t("term.alert.title")}
          title={t("term.alert.title")}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-desk-border bg-desk-panel/90 text-desk-text shadow-desk-panel backdrop-blur"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {mine.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#c8a96a] px-1 text-[9px] font-bold text-black">
              {mine.length}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute bottom-11 left-0 w-[260px] rounded-[14px] border border-desk-border bg-desk-panel p-3 shadow-desk-panel">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-desk-text">{symbol} · alert</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[11px] tabular-nums text-desk-muted">{Number.isFinite(cur) ? formatPrice(symbol, cur) : "—"}</span>
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={sound ? "Mute alert sound" : "Unmute alert sound"}
                  aria-pressed={!sound}
                  title={sound ? "Sound on" : "Sound off"}
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${sound ? "text-desk-text" : "text-desk-muted/60"} hover:bg-desk-elev`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6 9H3v6h3l5 4V5z" />
                    {sound ? (
                      <>
                        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                      </>
                    ) : (
                      <>
                        <path d="m16 9 5 5" />
                        <path d="m21 9-5 5" />
                      </>
                    )}
                  </svg>
                </button>
              </span>
            </div>
            <div className="flex gap-2">
              <input
                inputMode="decimal"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (soundRef.current) getAudio();
                    add();
                  }
                }}
                placeholder={Number.isFinite(cur) ? formatPrice(symbol, cur) : t("term.pricePh")}
                className="min-w-0 flex-1 rounded-[10px] border border-desk-border bg-desk-bg px-2.5 py-2 text-sm tabular-nums text-desk-text outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (soundRef.current) getAudio();
                  add();
                }}
                className="min-h-[38px] rounded-[10px] bg-desk-accent px-3 text-xs font-semibold text-desk-accent-ink">
                {t("term.alert.add")}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRepeatNew((r) => !r)}
                aria-pressed={repeatNew}
                title={repeatNew ? t("term.alert.repeatTitle") : t("term.alert.onceTitle")}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${
                  repeatNew ? "border-[#c8a96a] bg-[#c8a96a]/15 text-desk-text" : "border-desk-border bg-desk-elev/80 text-desk-muted hover:text-desk-text"
                }`}
              >
                ↻ {t("term.alert.repeat")}
              </button>
              <span className="text-[10px] text-desk-muted">{repeatNew ? t("term.alert.repeating") : t("term.alert.once")}</span>
            </div>
            {Number.isFinite(cur) && (
              <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Quick percent offsets from mid">
                {PCT_CHIPS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => quickPct(pct)}
                    aria-label={`Alert at mid ${pct > 0 ? "+" : ""}${pct}%`}
                    title={`${pct > 0 ? "+" : ""}${pct}% from mid`}
                    className="rounded-[8px] border border-desk-border bg-desk-elev/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-desk-muted hover:border-desk-accent hover:text-desk-text"
                  >
                    {pct > 0 ? "+" : ""}
                    {pct}%
                  </button>
                ))}
              </div>
            )}
            {mine.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {mine.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-1 rounded-[8px] bg-desk-elev/80 px-2 py-1.5 text-xs text-desk-text">
                    <span className={`min-w-0 tabular-nums ${a.armed === false ? "text-desk-muted" : ""}`}>
                      {a.dir === "above" ? "▲ ≥" : "▼ ≤"} {formatPrice(symbol, a.price)}
                      {a.armed === false && (
                        <span className="ml-1.5 text-[10px] italic text-desk-muted/80" title={t("term.alert.rearm")}>
                          {t("term.alert.cooling")}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => toggleRepeat(a.id)}
                        aria-pressed={!!a.repeat}
                        aria-label={a.repeat ? t("term.alert.toOnce") : t("term.alert.toRepeat")}
                        title={a.repeat ? t("term.alert.toOnce") : t("term.alert.toRepeat")}
                        className={`rounded-[6px] px-1.5 text-[10px] font-semibold ${a.repeat ? "text-[#c8a96a]" : "text-desk-muted"} hover:text-desk-text`}
                      >
                        {a.repeat ? "↻" : "1×"}
                      </button>
                      <button type="button" onClick={() => remove(a.id)} className="px-1 text-desk-muted hover:text-desk-sell" aria-label={t("term.alert.remove")} title={t("term.alert.remove")}>
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[11px] text-desk-muted">{t("term.alert.empty")}</p>
            )}
          </div>
        )}
      </div>
      {toast && (
        <div role="status" className="fixed left-1/2 top-16 z-[90] max-w-[92vw] -translate-x-1/2 rounded-[14px] border border-[#c8a96a]/50 bg-desk-panel px-4 py-3 text-sm font-semibold text-desk-text shadow-desk-panel">
          🔔 {toast}
          <button type="button" onClick={() => setToast(null)} className="ml-3 text-desk-muted" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
