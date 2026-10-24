"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/symbols";
import { fmtMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { localizeTradeError } from "@/lib/trade-errors";
import { calcTradeProfit, calcVolumeForRisk } from "@/lib/pnl";
import SymbolIcon from "@/components/ui/SymbolIcon";
import type { PriceTick, SymbolDef } from "./types";

type Props = {
  symbol: string;
  symbols: SymbolDef[];
  price?: PriceTick;
  onPlaced: () => void;
  onClose?: () => void;
  /** When true, render as centered modal overlay */
  modal?: boolean;
  initialSide?: "BUY" | "SELL";
  className?: string;
  /** Account equity for optional % risk presets */
  equity?: number;
  /** Account currency label (default USD) */
  currency?: string;
  /** Prefill from closed-trade re-open (nonce forces re-apply on same values). */
  prefill?: { volume: string; side: "BUY" | "SELL"; nonce: number } | null;
};

function defaultSlTp(
  side: "BUY" | "SELL",
  mid: number,
  digits: number
): { sl: string; tp: string } {
  if (!mid || !Number.isFinite(mid)) return { sl: "", tp: "" };
  // ~0.5% buffer from mid as a sensible starter (user can edit)
  const pct = 0.005;
  const slRaw = side === "BUY" ? mid * (1 - pct) : mid * (1 + pct);
  const tpRaw = side === "BUY" ? mid * (1 + pct) : mid * (1 - pct);
  return {
    sl: slRaw.toFixed(digits),
    tp: tpRaw.toFixed(digits),
  };
}

const LOT_PRESETS = ["0.01", "0.10", "0.50", "1.00"];

// SL/TP quick pip-distance chips (input-only; nothing is sent until Submit)
const SLTP_PIP_PRESETS = [10, 20, 50, 100] as const;

// Reward:risk quick chips — set TP so its distance = SL distance × ratio (input-only)
const RR_PRESETS = [1, 1.5, 2, 3] as const;

/** Pip size for a symbol; falls back like BottomPanels (FX-style 0.0001, else 0.01). */
function ticketPipSize(def: SymbolDef | undefined): number {
  if (def && Number.isFinite(def.pipSize) && def.pipSize > 0) return def.pipSize;
  const digits = def?.digits ?? 5;
  return digits >= 3 ? Math.pow(10, -(digits - 1)) : Math.pow(10, -digits);
}

function fmtPips(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n >= 100 ? n.toFixed(0) : n.toFixed(1);
}

function fmtSignedMoney(n: number, currency: string): string {
  if (!Number.isFinite(n)) return "—";
  const body = fmtMoney(Math.abs(n), 2, currency);
  return `${n < 0 ? "−" : "+"}${body}`;
}

function fmtTicketMoney(n: number, currency: string, digits = 2): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return fmtMoney(n, digits, currency);
}

// Per-device memory of the last lot size, keyed by symbol (client-only, invisible)
const LAST_LOT_KEY = "fx-last-lot-by-symbol";
const LAST_LOT_MAX_ENTRIES = 50;
const LOT_MIN = 0.01;
const LOT_MAX = 1000;

/** Halve / double a lot value, snapped to the symbol step (default 0.01) and clamped. */
function scaleLot(v: string, factor: number, step?: number): string {
  const st = typeof step === "number" && Number.isFinite(step) && step > 0 ? step : 0.01;
  const n = Number(v);
  const base = Number.isFinite(n) && n > 0 ? n : 0.1;
  const min = Math.max(LOT_MIN, st);
  let next = Math.round((base * factor) / st) * st;
  if (!Number.isFinite(next)) next = base;
  next = Math.min(LOT_MAX, Math.max(min, next));
  const decimals = Math.max(2, Math.min(4, (String(st).split(".")[1] ?? "").length));
  return next.toFixed(decimals);
}

function sanitizeLot(v: unknown): string | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.trim()) : NaN;
  if (!Number.isFinite(n) || n < LOT_MIN || n > LOT_MAX) return null;
  return (Math.round(n * 100) / 100).toFixed(2);
}

function readLotMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LAST_LOT_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const lot = sanitizeLot(v);
      if (lot && k && k.length <= 32) out[k] = lot;
    }
    return out;
  } catch {
    return {};
  }
}

function loadLastLot(symbol: string): string | null {
  return readLotMap()[symbol] ?? null;
}

function saveLastLot(symbol: string, volume: string) {
  if (typeof window === "undefined" || !symbol) return;
  const lot = sanitizeLot(volume);
  if (!lot) return;
  try {
    const map = readLotMap();
    // Re-insert so most recent is last; cap to the newest N symbols
    delete map[symbol];
    map[symbol] = lot;
    const keys = Object.keys(map);
    if (keys.length > LAST_LOT_MAX_ENTRIES) {
      for (const k of keys.slice(0, keys.length - LAST_LOT_MAX_ENTRIES)) delete map[k];
    }
    window.localStorage.setItem(LAST_LOT_KEY, JSON.stringify(map));
  } catch {
    /* storage full / disabled — ignore */
  }
}

// Per-device opt-in: show a review step before the order is sent
const CONFIRM_KEY = "fx-order-confirm";

function loadConfirmPref(): boolean {
  try {
    return window.localStorage.getItem(CONFIRM_KEY) === "1";
  } catch {
    return false;
  }
}

function saveConfirmPref(on: boolean) {
  try {
    if (on) window.localStorage.setItem(CONFIRM_KEY, "1");
    else window.localStorage.removeItem(CONFIRM_KEY);
  } catch {
    /* ignore */
  }
}

export default function OrderTicket({
  symbol,
  symbols,
  price,
  onPlaced,
  onClose,
  modal = false,
  initialSide = "BUY",
  className = "",
  equity,
  currency = "USD",
  prefill = null,
}: Props) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [side, setSide] = useState<"BUY" | "SELL">(initialSide);
  const [type, setType] = useState<"MARKET" | "LIMIT" | "STOP">("MARKET");
  const [volume, setVolumeRaw] = useState("0.10");
  // Only persist volumes the user chose (not resets / restores)
  const volumeDirtyRef = useRef(false);
  const setVolume = useCallback((v: string | ((prev: string) => string)) => {
    volumeDirtyRef.current = true;
    setVolumeRaw(v);
  }, []);
  const [limitPrice, setLimitPrice] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [showSl, setShowSl] = useState(false);
  const [showTp, setShowTp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [riskAmount, setRiskAmount] = useState("");
  const [riskError, setRiskError] = useState("");
  const [confirmOn, setConfirmOn] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Guards against a double-click opening the review and confirming at once
  const confirmOpenedAtRef = useRef(0);

  useEffect(() => {
    setConfirmOn(loadConfirmPref());
  }, []);

  // Any change to the order invalidates a pending review
  useEffect(() => {
    setConfirming(false);
  }, [symbol, side, type, volume, limitPrice, sl, tp, showSl, showTp]);

  const def = symbols.find((s) => s.symbol === symbol);
  const digits = def?.digits ?? 5;

  // Reset form only when symbol (or initial side) changes — NOT on every live tick
  useEffect(() => {
    setSide(initialSide);
    setType("MARKET");
    volumeDirtyRef.current = false;
    setVolumeRaw(loadLastLot(symbol) ?? "0.10");
    setSl("");
    setTp("");
    setShowSl(false);
    setShowTp(false);
    setMsg("");
    setRiskAmount("");
    setRiskError("");
    if (price?.mid) setLimitPrice(formatPrice(symbol, price.mid));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally ignore live price ticks
  }, [symbol, initialSide]);

  // Re-open from a closed trade: apply side + volume once per nonce (do not auto-submit).
  useEffect(() => {
    if (!prefill) return;
    setSide(prefill.side);
    setType("MARKET");
    setVolume(prefill.volume);
    setSl("");
    setTp("");
    setShowSl(false);
    setShowTp(false);
    setMsg("");
    setRiskAmount("");
    setRiskError("");
    setConfirming(false);
    // Brief focus / scroll into view when modal is open
    try {
      const el = rootRef.current;
      el?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
      const focusable = el?.querySelector<HTMLElement>("button, input, select, textarea");
      focusable?.focus?.({ preventScroll: true });
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- volume setter + prefill nonce drive this
  }, [prefill?.nonce, prefill?.side, prefill?.volume, setVolume]);

  // Remember the user's last lot for this symbol (debounced, valid values only)
  useEffect(() => {
    if (!volumeDirtyRef.current) return;
    const t = window.setTimeout(() => saveLastLot(symbol, volume), 400);
    return () => window.clearTimeout(t);
  }, [volume, symbol]);

  // Keep limit field roughly synced while editing MARKET→LIMIT without wiping SL/TP
  useEffect(() => {
    if (type !== "MARKET" && price?.mid && !limitPrice) {
      setLimitPrice(formatPrice(symbol, price.mid));
    }
  }, [type, price?.mid, symbol, limitPrice]);

  const notional = useMemo(() => {
    const vol = Number(volume);
    const mid = price?.mid ?? 0;
    const contract = def?.contractSize ?? 1;
    if (!Number.isFinite(vol) || vol <= 0 || !mid) return 0;
    return vol * contract * mid;
  }, [volume, price?.mid, def?.contractSize]);

  // Estimated entry: ask for BUY / bid for SELL on market, else the entered price
  const entry = useMemo(() => {
    if (type !== "MARKET") {
      const p = Number(limitPrice);
      return Number.isFinite(p) && p > 0 ? p : 0;
    }
    return (side === "BUY" ? price?.ask : price?.bid) ?? price?.mid ?? 0;
  }, [type, limitPrice, side, price?.ask, price?.bid, price?.mid]);

  const pipSize = ticketPipSize(def);
  const entryOk = Number.isFinite(entry) && entry > 0;

  /** SL/TP price `pips` away from entry, on the correct side for the current direction. */
  function pipLevel(kind: "sl" | "tp", pips: number): string | null {
    if (!entryOk || !(pipSize > 0)) return null;
    const dist = pips * pipSize;
    const down = (kind === "sl") === (side === "BUY");
    const lvl = down ? entry - dist : entry + dist;
    if (!Number.isFinite(lvl) || lvl <= 0) return null;
    return lvl.toFixed(digits);
  }

  /** Distance in pips from entry to an entered level + whether it is on the correct side. */
  function levelInfo(kind: "sl" | "tp", raw: string): { pips: number; wrongSide: boolean } | null {
    if (!entryOk || !(pipSize > 0) || raw.trim() === "") return null;
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) return null;
    const below = v < entry;
    const shouldBeBelow = (kind === "sl") === (side === "BUY");
    return { pips: Math.abs(entry - v) / pipSize, wrongSide: v !== entry && below !== shouldBeBelow };
  }

  const slInfo = showSl ? levelInfo("sl", sl) : null;
  const tpInfo = showTp ? levelInfo("tp", tp) : null;

  // R:R chips are usable only with a valid SL on the correct side of a known entry
  const rrSlOk = showSl && slInfo != null && !slInfo.wrongSide && slInfo.pips > 0;
  const rrDisabledTitle = !showSl
    ? t("term.ot.slFirst")
    : !entryOk
      ? t("term.ot.noEntry")
      : slInfo?.wrongSide
        ? t("term.ot.slWrong")
        : t("term.ot.badSl");

  /** TP price giving reward/risk ≈ ratio (same pip math as the SL/TP pip chips). */
  function rrTpLevel(ratio: number): string | null {
    if (!rrSlOk || !slInfo) return null;
    return pipLevel("tp", slInfo.pips * ratio);
  }

  function applyRr(ratio: number) {
    const lvl = rrTpLevel(ratio);
    if (lvl == null) return;
    setShowTp(true);
    setTp(lvl);
  }

  const preview = useMemo(() => {
    const vol = Number(volume);
    const cs = def?.contractSize ?? 1;
    if (!entry || !Number.isFinite(vol) || vol <= 0) return { sl: null, tp: null, rr: null };
    const slN = Number(sl);
    const tpN = Number(tp);
    const slPnl =
      showSl && sl.trim() !== "" && Number.isFinite(slN) && slN > 0
        ? calcTradeProfit(side, vol, entry, slN, cs)
        : null;
    const tpPnl =
      showTp && tp.trim() !== "" && Number.isFinite(tpN) && tpN > 0
        ? calcTradeProfit(side, vol, entry, tpN, cs)
        : null;
    const rr =
      slPnl != null && tpPnl != null && slPnl < 0 && tpPnl > 0 ? tpPnl / Math.abs(slPnl) : null;
    return { sl: slPnl, tp: tpPnl, rr };
  }, [entry, volume, def?.contractSize, side, sl, tp, showSl, showTp]);

  // Escape closes the ticket (modal / mobile sheet)
  useEffect(() => {
    if (!onClose || !modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirming) {
        setConfirming(false);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, modal, confirming]);

  // Inline (desktop) ticket: Esc cancels a pending review
  useEffect(() => {
    if (!confirming || modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirming(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming, modal]);

  function enableSl() {
    setShowSl((v) => {
      if (v) {
        setSl("");
        return false;
      }
      const mid = (price?.mid ?? Number(limitPrice)) || 0;
      const d = defaultSlTp(side, mid, digits);
      setSl(d.sl);
      return true;
    });
  }

  function enableTp() {
    setShowTp((v) => {
      if (v) {
        setTp("");
        return false;
      }
      const mid = (price?.mid ?? Number(limitPrice)) || 0;
      const d = defaultSlTp(side, mid, digits);
      setTp(d.tp);
      return true;
    });
  }

  function applyRiskLot() {
    setRiskError("");
    const risk = Number(riskAmount);
    const slN = Number(sl);
    const cs = def?.contractSize ?? 1;
    const vol = calcVolumeForRisk(risk, entry, slN, cs);
    if (vol == null) {
      setRiskError(t("term.ot.badRisk"));
      return;
    }
    setVolume(vol.toFixed(2));
  }

  function requestSubmit() {
    if (busy) return;
    if (!confirmOn) {
      void submit();
      return;
    }
    if (confirming) {
      if (Date.now() - confirmOpenedAtRef.current < 450) return;
      setConfirming(false);
      void submit();
      return;
    }
    setMsg("");
    const vol = Number(volume);
    if (!Number.isFinite(vol) || vol < LOT_MIN || vol > LOT_MAX) {
      setMsg(t("term.err.badVolume"));
      return;
    }
    if (type !== "MARKET" && !(Number(limitPrice) > 0)) {
      setMsg(t("term.ot.badPrice"));
      return;
    }
    if (showSl && !(sl.trim() !== "" && Number.isFinite(Number(sl)))) {
      setMsg(t("term.ot.needSl"));
      return;
    }
    if (showTp && !(tp.trim() !== "" && Number.isFinite(Number(tp)))) {
      setMsg(t("term.ot.needTp"));
      return;
    }
    confirmOpenedAtRef.current = Date.now();
    setConfirming(true);
  }

  function toggleConfirmPref() {
    setConfirmOn((v) => {
      saveConfirmPref(!v);
      return !v;
    });
    setConfirming(false);
  }

  async function submit() {
    setBusy(true);
    setMsg("");
    try {
      const stopLoss =
        showSl && sl.trim() !== "" && Number.isFinite(Number(sl)) ? Number(sl) : undefined;
      const takeProfit =
        showTp && tp.trim() !== "" && Number.isFinite(Number(tp)) ? Number(tp) : undefined;

      if (showSl && stopLoss == null) {
        setMsg(t("term.ot.needSl"));
        setBusy(false);
        return;
      }
      if (showTp && takeProfit == null) {
        setMsg(t("term.ot.needTp"));
        setBusy(false);
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side,
          type,
          volume: Number(volume),
          price: type === "MARKET" ? undefined : Number(limitPrice),
          stopLoss,
          takeProfit,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const raw = data && typeof data.error === "string" ? data.error : "";
        setMsg(res.status === 401 ? t("term.ot.noSession") : raw ? localizeTradeError(raw, t) : t("common.error"));
        return;
      }
      setMsg(type === "MARKET" ? t("term.ot.opened") : t("term.ot.pendingOk"));
      onPlaced();
      if (onClose) {
        window.setTimeout(() => onClose(), 650);
      }
    } catch {
      setMsg(t("term.ot.conn"));
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-[12px] border border-desk-border/80 bg-desk-bg px-3 py-2.5 text-sm text-desk-text outline-none transition-colors focus:border-desk-accent md:rounded-control md:px-2.5 md:py-2";

  const body = (
    <>
      <div className="flex items-center justify-between border-b border-desk-border/80 px-3.5 py-3 md:px-3 md:py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-desk-muted">
          {t("term.order")}
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex max-w-[min(68vw,280px)] items-center gap-1.5 rounded-full border border-desk-border/60 bg-desk-elev/80 px-2.5 py-0.5 text-[10px] font-semibold text-desk-text">
            <SymbolIcon symbol={symbol} fallback={def?.flag || "•"} size={16} />
            <span className="shrink-0">{symbol}</span>
            {def?.name && def.name.toUpperCase() !== symbol.toUpperCase() && (
              <span className="truncate font-medium text-desk-muted" title={def.name}>
                {def.name}
              </span>
            )}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-desk-border/60 text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-3.5 md:space-y-3 md:p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[12px] border border-desk-border/60 bg-desk-bg/80 px-2.5 py-2.5 text-center md:rounded-control md:py-2">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-desk-muted">{t("term.buy")}</div>
            <div className="mt-0.5 text-[15px] font-bold tabular-nums text-desk-buy md:text-sm md:font-semibold">
              {price ? formatPrice(symbol, price.ask) : "—"}
            </div>
          </div>
          <div className="rounded-[12px] border border-desk-border/60 bg-desk-bg/80 px-2.5 py-2.5 text-center md:rounded-control md:py-2">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-desk-muted">{t("term.sell")}</div>
            <div className="mt-0.5 text-[15px] font-bold tabular-nums text-desk-sell md:text-sm md:font-semibold">
              {price ? formatPrice(symbol, price.bid) : "—"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 md:gap-2">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            className={`rounded-[12px] py-3.5 text-[15px] font-bold tracking-wide transition md:rounded-control md:py-3 md:text-sm ${
              side === "BUY"
                ? "bg-desk-buy text-white shadow-buy-glow"
                : "border border-desk-border bg-desk-elev text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            }`}
          >
            {t("term.buy")}
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            className={`rounded-[12px] py-3.5 text-[15px] font-bold tracking-wide transition md:rounded-control md:py-3 md:text-sm ${
              side === "SELL"
                ? "bg-desk-sell text-white shadow-sell-glow"
                : "border border-desk-border bg-desk-elev text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            }`}
          >
            {t("term.sell")}
          </button>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
            {t("term.ot.orderType")}
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "MARKET" | "LIMIT" | "STOP")}
            className={inputCls}
            aria-label={t("term.ot.orderType")}
          >
            <option value="MARKET">{t("term.ot.market")}</option>
            <option value="LIMIT">{t("term.ot.limit")}</option>
            <option value="STOP">{t("term.ot.stop")}</option>
          </select>
        </div>

        <div>
          <div className="mb-1.5 flex items-end justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
              {t("term.col.volume")}
            </span>
            <span
              className="text-[10px] font-semibold tabular-nums text-desk-muted"
              title={t("term.ticket.size")}
            >
              ≈ {fmtTicketMoney(notional, currency)}
            </span>
          </div>
          <div className="relative flex items-center gap-2 md:gap-1.5">
            <button
              type="button"
              onClick={() =>
                setVolume((v) => {
                  const n = Number(v);
                  const base = Number.isFinite(n) ? n : 0.1;
                  return Math.max(0.01, Math.round((base - 0.01) * 100) / 100).toFixed(2);
                })
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-desk-border/80 bg-desk-elev text-base font-semibold text-desk-muted hover:bg-desk-hover hover:text-desk-text md:h-9 md:w-9 md:rounded-control md:text-sm"
            >
              −
            </button>
            <input
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className={`${inputCls} text-center text-base font-semibold tabular-nums md:text-sm`}
            />
            <button
              type="button"
              onClick={() =>
                setVolume((v) => {
                  const n = Number(v);
                  const base = Number.isFinite(n) ? n : 0.1;
                  return (Math.round((base + 0.01) * 100) / 100).toFixed(2);
                })
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-desk-border/80 bg-desk-elev text-base font-semibold text-desk-muted hover:bg-desk-hover hover:text-desk-text md:h-9 md:w-9 md:rounded-control md:text-sm"
            >
              +
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t("term.ot.quickLots")}>
              {LOT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setVolume(p)}
                  aria-pressed={Number(volume) === Number(p)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums transition ${
                    Number(volume) === Number(p)
                      ? "border-desk-accent/60 bg-desk-accent/15 text-desk-accent"
                      : "border-desk-border/70 bg-desk-elev text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                  }`}
                >
                  {Number(p)}
                </button>
              ))}
              <span className="mx-0.5 w-px self-stretch bg-desk-border/60" aria-hidden />
              <button
                type="button"
                onClick={() => setVolume((v) => scaleLot(v, 0.5, (def as { volumeStep?: number } | undefined)?.volumeStep))}
                aria-label={t("term.ot.halve")}
                title={t("term.ot.halve")}
                className="rounded-full border border-desk-border/70 bg-desk-elev px-2 py-0.5 text-[10px] font-semibold tabular-nums text-desk-muted transition hover:bg-desk-hover hover:text-desk-text"
              >
                ÷2
              </button>
              <button
                type="button"
                onClick={() => setVolume((v) => scaleLot(v, 2, (def as { volumeStep?: number } | undefined)?.volumeStep))}
                aria-label={t("term.ot.double")}
                title={t("term.ot.double")}
                className="rounded-full border border-desk-border/70 bg-desk-elev px-2 py-0.5 text-[10px] font-semibold tabular-nums text-desk-muted transition hover:bg-desk-hover hover:text-desk-text"
              >
                ×2
              </button>
            </div>
            <span className="text-[10px] tabular-nums text-desk-muted/80">
              {t("term.ot.notional")} {fmtTicketMoney(notional, currency)}
            </span>
          </div>
        </div>

        {type !== "MARKET" && (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
              {t("term.col.price")}
            </div>
            <input
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className={`${inputCls} tabular-nums`}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={enableSl}
            className={`rounded-[12px] border py-2.5 text-xs font-semibold transition md:rounded-control md:py-2 ${
              showSl
                ? "border-desk-sell/50 bg-desk-sell/90 text-white"
                : "border-desk-border bg-desk-elev text-desk-muted hover:bg-desk-hover"
            }`}
          >
            SL {showSl ? "✓" : ""}
          </button>
          <button
            type="button"
            onClick={enableTp}
            className={`rounded-[12px] border py-2.5 text-xs font-semibold transition md:rounded-control md:py-2 ${
              showTp
                ? "border-desk-buy/50 bg-desk-buy/90 text-white"
                : "border-desk-border bg-desk-elev text-desk-muted hover:bg-desk-hover"
            }`}
          >
            TP {showTp ? "✓" : ""}
          </button>
        </div>

        {showSl && (
          <div>
            <div className="mb-1.5 flex items-end justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
                {t("term.ot.stopLoss")}
              </span>
              {slInfo && (
                <span
                  className={`text-[10px] font-semibold tabular-nums ${
                    slInfo.wrongSide ? "text-amber-500" : "text-desk-muted"
                  }`}
                  title={
                    slInfo.wrongSide
                      ? t("term.ot.wrongSide")
                      : t("term.col.distance")
                  }
                >
                  ≈ {fmtPips(slInfo.pips)} pip{slInfo.wrongSide ? " ⚠" : ""}
                </span>
              )}
            </div>
            <input
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              placeholder={t("term.pricePh")}
              autoFocus
              className="w-full rounded-[12px] border border-desk-sell/40 bg-desk-bg px-3 py-2.5 text-sm tabular-nums text-desk-text outline-none focus:border-desk-sell md:rounded-control md:px-2.5 md:py-2"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-1" role="group" aria-label={t("term.col.distance")}>
              {SLTP_PIP_PRESETS.map((pips) => {
                const lvl = pipLevel("sl", pips);
                return (
                  <button
                    key={pips}
                    type="button"
                    disabled={lvl == null}
                    onClick={() => {
                      if (lvl != null) setSl(lvl);
                    }}
                    title={t("term.col.distance")}
                    aria-label={t("term.col.distance")}
                    className="rounded-full border border-desk-border/70 bg-desk-elev px-2 py-0.5 text-[10px] font-semibold tabular-nums text-desk-muted hover:bg-desk-hover hover:text-desk-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-desk-elev disabled:hover:text-desk-muted"
                  >
                    {pips}p
                  </button>
                );
              })}
            </div>
            {preview.sl != null && (
              <div
                className={`mt-1 text-right text-[10px] font-semibold tabular-nums ${
                  preview.sl < 0 ? "text-desk-sell" : "text-desk-buy"
                }`}
                title={t("term.ticket.slPnl")}
              >
                ≈ {fmtSignedMoney(preview.sl, currency)}
              </div>
            )}
          </div>
        )}

        {showSl &&
          Number(sl) > 0 &&
          entry > 0 &&
          (def?.contractSize ?? 0) > 0 &&
          Number.isFinite(Number(sl)) && (
            <div className="space-y-2 rounded-[12px] border border-desk-border/60 bg-desk-bg/70 p-2.5 md:rounded-control md:p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
                  {t("term.ot.riskSizing")}
                </span>
                <span
                  className="text-[10px] font-semibold tabular-nums text-desk-muted"
                  title={t("term.ot.riskNow")}
                >
                  {t("term.ot.risk")}{" "}
                  {preview.sl != null
                    ? fmtTicketMoney(Math.abs(preview.sl), currency)
                    : "—"}
                </span>
              </div>
              <input
                type="number"
                min={0}
                step="1"
                value={riskAmount}
                onChange={(e) => {
                  setRiskAmount(e.target.value);
                  setRiskError("");
                }}
                placeholder={t("term.ot.maxRisk").replace("{currency}", (currency || "USD").trim().toUpperCase() || "USD")}
                className={inputCls + " tabular-nums"}
              />
              <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t("term.ot.riskPresets")}>
                {[25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setRiskAmount(String(amt));
                      setRiskError("");
                    }}
                    className="rounded-full border border-desk-border/70 bg-desk-elev px-2 py-0.5 text-[10px] font-semibold tabular-nums text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                  >
                    {fmtTicketMoney(amt, currency, 0)}
                  </button>
                ))}
                {typeof equity === "number" && equity > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRiskAmount((Math.round(equity * 0.01 * 100) / 100).toFixed(2));
                        setRiskError("");
                      }}
                      className="rounded-full border border-desk-border/70 bg-desk-elev px-2 py-0.5 text-[10px] font-semibold tabular-nums text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                      title={t("term.ot.equity1").replace("{amount}", fmtTicketMoney(equity, currency))}
                    >
                      1%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRiskAmount((Math.round(equity * 0.02 * 100) / 100).toFixed(2));
                        setRiskError("");
                      }}
                      className="rounded-full border border-desk-border/70 bg-desk-elev px-2 py-0.5 text-[10px] font-semibold tabular-nums text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                      title={t("term.ot.equity2").replace("{amount}", fmtTicketMoney(equity, currency))}
                    >
                      2%
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={applyRiskLot}
                  className="ml-auto rounded-full border border-desk-accent/50 bg-desk-accent/15 px-2.5 py-0.5 text-[10px] font-semibold text-desk-accent hover:bg-desk-accent/25"
                >
                  {t("term.ot.applyLot")}
                </button>
              </div>
              {riskError && (
                <div className="text-[10px] font-medium text-desk-sell">{riskError}</div>
              )}
            </div>
          )}

        {showTp && (
          <div>
            <div className="mb-1.5 flex items-end justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
                {t("term.ot.takeProfit")}
              </span>
              {tpInfo && (
                <span
                  className={`text-[10px] font-semibold tabular-nums ${
                    tpInfo.wrongSide ? "text-amber-500" : "text-desk-muted"
                  }`}
                  title={
                    tpInfo.wrongSide
                      ? t("term.ot.wrongSide")
                      : t("term.col.distance")
                  }
                >
                  ≈ {fmtPips(tpInfo.pips)} pip{tpInfo.wrongSide ? " ⚠" : ""}
                </span>
              )}
            </div>
            <input
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              placeholder={t("term.pricePh")}
              className="w-full rounded-[12px] border border-desk-buy/40 bg-desk-bg px-3 py-2.5 text-sm tabular-nums text-desk-text outline-none focus:border-desk-buy md:rounded-control md:px-2.5 md:py-2"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-1" role="group" aria-label={t("term.col.distance")}>
              {SLTP_PIP_PRESETS.map((pips) => {
                const lvl = pipLevel("tp", pips);
                return (
                  <button
                    key={pips}
                    type="button"
                    disabled={lvl == null}
                    onClick={() => {
                      if (lvl != null) setTp(lvl);
                    }}
                    title={t("term.col.distance")}
                    aria-label={t("term.col.distance")}
                    className="rounded-full border border-desk-border/70 bg-desk-elev px-2 py-0.5 text-[10px] font-semibold tabular-nums text-desk-muted hover:bg-desk-hover hover:text-desk-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-desk-elev disabled:hover:text-desk-muted"
                  >
                    {pips}p
                  </button>
                );
              })}
            </div>
            {preview.tp != null && (
              <div
                className={`mt-1 text-right text-[10px] font-semibold tabular-nums ${
                  preview.tp < 0 ? "text-desk-sell" : "text-desk-buy"
                }`}
                title={t("term.ticket.tpPnl")}
              >
                ≈ {fmtSignedMoney(preview.tp, currency)}
              </div>
            )}
          </div>
        )}

        {(showSl || showTp) && (
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="R:R">
            <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
              R:R
            </span>
            {RR_PRESETS.map((ratio) => {
              const lvl = rrTpLevel(ratio);
              const label = `1:${ratio}`;
              const active = lvl != null && preview.rr != null && Math.abs(preview.rr - ratio) < 0.05;
              return (
                <button
                  key={ratio}
                  type="button"
                  disabled={lvl == null}
                  onClick={() => applyRr(ratio)}
                  aria-pressed={active}
                  title={lvl != null ? `${label} (${lvl})` : rrDisabledTitle}
                  aria-label={label}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-desk-elev disabled:hover:text-desk-muted ${
                    active
                      ? "border-desk-buy/60 bg-desk-buy/15 text-desk-buy"
                      : "border-desk-border/70 bg-desk-elev text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {preview.rr != null && (
          <div className="flex items-center justify-between rounded-[12px] border border-desk-border/60 bg-desk-bg/70 px-3 py-2 text-[11px] md:rounded-control md:px-2.5 md:py-1.5">
            <span className="font-semibold uppercase tracking-wider text-desk-muted">
              Risk / Reward
              {slInfo && tpInfo && slInfo.pips > 0 && tpInfo.pips > 0 && (
                <span className="ml-1.5 font-medium normal-case tracking-normal text-desk-muted/80">
                  ({fmtPips(slInfo.pips)} / {fmtPips(tpInfo.pips)} pip)
                </span>
              )}
            </span>
            <span
              className={`font-bold tabular-nums ${preview.rr >= 1 ? "text-desk-buy" : "text-desk-text"}`}
            >
              1 : {preview.rr.toFixed(2)}
            </span>
          </div>
        )}

        {confirming && (
          <div
            role="alertdialog"
            aria-label={t("term.ot.review")}
            className="space-y-1.5 rounded-[12px] border border-desk-accent/50 bg-desk-accent/10 px-3 py-2.5 text-[11px] md:rounded-control md:px-2.5 md:py-2"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-desk-accent">
              {t("term.ot.review")}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-desk-muted">{t("term.ot.trade")}</span>
              <span className={`font-bold ${side === "BUY" ? "text-desk-buy" : "text-desk-sell"}`}>
                {side === "BUY" ? t("term.buy") : t("term.sell")} {symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-desk-muted">{t("term.ot.typeLot")}</span>
              <span className="font-semibold tabular-nums text-desk-text">
                {type === "MARKET" ? t("term.ot.market") : type === "LIMIT" ? t("term.ot.limit") : t("term.ot.stop")} · {Number(volume).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-desk-muted">{type === "MARKET" ? t("term.ot.estEntry") : t("term.ot.orderPrice")}</span>
              <span className="font-semibold tabular-nums text-desk-text">
                {entry ? formatPrice(symbol, entry) : "—"}
              </span>
            </div>
            {showSl && sl.trim() !== "" && (
              <div className="flex items-center justify-between">
                <span className="text-desk-muted">{t("term.ot.stopLoss")}</span>
                <span className="font-semibold tabular-nums text-desk-text">
                  {sl}
                  {preview.sl != null && (
                    <span className="ml-1 text-desk-sell">({fmtSignedMoney(preview.sl, currency)})</span>
                  )}
                </span>
              </div>
            )}
            {showTp && tp.trim() !== "" && (
              <div className="flex items-center justify-between">
                <span className="text-desk-muted">{t("term.ot.takeProfit")}</span>
                <span className="font-semibold tabular-nums text-desk-text">
                  {tp}
                  {preview.tp != null && (
                    <span className="ml-1 text-desk-buy">({fmtSignedMoney(preview.tp, currency)})</span>
                  )}
                </span>
              </div>
            )}
            {preview.rr != null && (
              <div className="flex items-center justify-between">
                <span className="text-desk-muted">R:R</span>
                <span className={`font-semibold tabular-nums ${preview.rr >= 1 ? "text-desk-buy" : "text-desk-text"}`}>
                  1 : {preview.rr.toFixed(2)}
                </span>
              </div>
            )}
            {notional > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-desk-muted">{t("term.ot.posValue")}</span>
                <span className="font-semibold tabular-nums text-desk-text">{fmtTicketMoney(notional, currency)}</span>
              </div>
            )}
            {type === "MARKET" && (
              <div className="text-[10px] text-desk-muted">
                {t("term.ot.marketNote")}
              </div>
            )}
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="w-full rounded-full border border-desk-border/70 bg-desk-elev py-1.5 text-[11px] font-semibold text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            >
              {t("common.cancel")} (Esc)
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={requestSubmit}
          className={`w-full rounded-[14px] py-3.5 text-[15px] font-bold tracking-wide text-white disabled:opacity-60 md:rounded-control md:py-3 md:text-sm ${
            side === "BUY"
              ? "bg-desk-buy shadow-buy-glow hover:brightness-110"
              : "bg-desk-sell shadow-sell-glow hover:brightness-110"
          }`}
        >
          {busy
            ? t("term.ot.submitting")
            : confirming
              ? side === "BUY"
                ? t("term.ot.confirmBuy")
                : t("term.ot.confirmSell")
              : side === "BUY"
                ? t("term.ot.submitBuy")
                : t("term.ot.submitSell")}
        </button>
        <label className="flex cursor-pointer select-none items-center justify-center gap-1.5 text-[10px] font-medium text-desk-muted">
          <input
            type="checkbox"
            checked={confirmOn}
            onChange={toggleConfirmPref}
            className="h-3 w-3 accent-current"
          />
          {t("term.ot.askConfirm")}
        </label>
        {msg && (
          <div className="rounded-[12px] bg-desk-accent/10 px-2.5 py-2 text-center text-xs font-medium text-desk-accent md:rounded-control md:px-2 md:py-1.5">
            {msg}
          </div>
        )}
      </div>
    </>
  );

  if (modal) {
    return (
      <div
        className="fx-lx-overlay fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={t("term.ot.aria")}
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div
          ref={rootRef}
          className={`flex max-h-[92vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[20px] border border-desk-border bg-desk-panel shadow-2xl sm:rounded-[16px] ${className}`}
        >
          {body}
        </div>
      </div>
    );
  }

  return (
    <aside
      ref={rootRef}
      className={`flex w-full shrink-0 flex-col border-l border-desk-border bg-desk-panel md:w-[268px] ${className}`}
    >
      {body}
    </aside>
  );
}
