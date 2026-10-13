"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/context";
import { formatPrice } from "@/lib/symbols";
import { fmtNum } from "@/lib/format";
import type { PositionRow } from "./types";
import { closedDayKey } from "./PnlCalendar";

/** "YYYY-MM" month a closed trade is booked on (close time, local). */
function monthKey(p: PositionRow): string {
  return closedDayKey(p).slice(0, 7);
}

function pnlOf(p: PositionRow): number {
  return Number(p.closeProfit ?? p.profit) || 0;
}

function signed(v: number): string {
  return `${v > 0 ? "+" : ""}${fmtNum(v, 2)}`;
}

function moneyCls(v: number) {
  return v > 0 ? "text-desk-buy" : v < 0 ? "text-desk-sell" : "text-desk-muted";
}

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = typeof v === "number" ? (Number.isFinite(v) ? String(v) : "") : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** The customer's own closed trades (same data as the Closed tab). */
  rows: PositionRow[];
  currency?: string;
};

/**
 * Monthly account statement ("Hesap özeti") built client-side from the customer's own
 * closed trades: month picker, totals, per-symbol breakdown, trade list, CSV of the month.
 * Read-only; no API calls. (Printing stays blocked by the screen-protection shield.)
 */
export default function AccountStatement({ open, onClose, rows, currency }: Props) {
  const { t, locale } = useI18n();
  const cur = currency || "USD";
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Months that have trades (newest first)
  const months = useMemo(() => {
    const s = new Set<string>();
    for (const p of rows) {
      const k = monthKey(p);
      if (k) s.add(k);
    }
    return Array.from(s).sort().reverse();
  }, [rows]);

  const [ym, setYm] = useState("");
  useEffect(() => {
    if (!open) return;
    if (!ym || !months.includes(ym)) setYm(months[0] || "");
  }, [open, months, ym]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      try {
        prev?.focus?.();
      } catch {
        /* ignore */
      }
    };
  }, [open, onClose]);

  const monthLabel = (k: string) => {
    const [y, m] = k.split("-").map(Number);
    if (!y || !m) return k;
    try {
      return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
    } catch {
      return k;
    }
  };

  const data = useMemo(() => {
    const list = rows
      .filter((p) => monthKey(p) === ym)
      .sort(
        (a, b) =>
          (Date.parse(String(a.closedAt ?? a.openedAt)) || 0) -
          (Date.parse(String(b.closedAt ?? b.openedAt)) || 0)
      );
    let net = 0, gp = 0, gl = 0, wins = 0, losses = 0, lots = 0;
    let best = -Infinity, worst = Infinity;
    const bySym = new Map<string, { n: number; lots: number; pnl: number }>();
    for (const p of list) {
      const v = pnlOf(p);
      net += v;
      if (v > 0) { gp += v; wins++; }
      else if (v < 0) { gl += v; losses++; }
      lots += Number(p.volume) || 0;
      best = Math.max(best, v);
      worst = Math.min(worst, v);
      const s = bySym.get(p.symbol) ?? { n: 0, lots: 0, pnl: 0 };
      s.n++;
      s.lots += Number(p.volume) || 0;
      s.pnl += v;
      bySym.set(p.symbol, s);
    }
    const symbols = Array.from(bySym.entries()).sort((a, b) => Math.abs(b[1].pnl) - Math.abs(a[1].pnl));
    return {
      list, net, gp, gl, wins, losses, lots, symbols,
      best: list.length ? best : 0,
      worst: list.length ? worst : 0,
      winRate: list.length ? (wins / list.length) * 100 : 0,
    };
  }, [rows, ym]);

  const idx = months.indexOf(ym);
  const fmtWhen = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  function downloadCsv() {
    if (!data.list.length) return;
    const header = ["id", "symbol", "side", "volume", "openPrice", "closePrice", "profit", "openedAt", "closedAt"];
    const body = data.list.map((p) => [
      p.id, p.symbol, p.side, p.volume, p.openPrice, p.closePrice ?? "", pnlOf(p), p.openedAt, p.closedAt ?? "",
    ]);
    const lines = [header, ...body].map((r) => r.map(csvCell).join(","));
    lines.push("");
    lines.push(["total", "", "", data.lots, "", "", data.net, "", ""].map(csvCell).join(","));
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `7fx-statement-${ym}.csv`;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
  }

  if (!open || !mounted) return null;

  const stat = (label: string, value: string, cls = "text-desk-text") => (
    <div className="min-w-0 rounded-[10px] border border-desk-border/70 bg-desk-elev/40 px-2.5 py-2">
      <div className="truncate text-[9px] font-semibold uppercase tracking-wider text-desk-muted">{label}</div>
      <div className={`mt-0.5 truncate text-[13px] font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
  const navBtn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-desk-border text-desk-muted transition-colors hover:bg-desk-hover hover:text-desk-text disabled:cursor-not-allowed disabled:opacity-30";

  return createPortal(
    <div
      className="fx-lx-overlay fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fx-stmt-title"
        onClick={(e) => e.stopPropagation()}
        className="fx-lx-modal fx-stmt max-h-[92vh] w-full overflow-y-auto overflow-x-hidden rounded-t-modal border border-desk-border bg-desk-panel text-desk-text shadow-desk-panel sm:max-w-2xl sm:rounded-modal"
      >
        <div className="flex items-center justify-between gap-2 border-b border-desk-border/80 px-4 py-3">
          <div className="min-w-0">
            <h2 id="fx-stmt-title" className="text-sm font-semibold tracking-wide">
              {t("term.stmt.title")}
            </h2>
            <p className="truncate text-[11px] text-desk-muted">{t("term.stmt.subtitle")}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-desk-muted transition-colors hover:bg-desk-elev hover:text-desk-text focus:outline-none focus-visible:ring-1 focus-visible:ring-desk-accent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {months.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-desk-muted">{t("term.stmt.empty")}</p>
        ) : (
          <div className="space-y-3 px-4 py-3">
            {/* Month picker */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={navBtn}
                onClick={() => idx < months.length - 1 && setYm(months[idx + 1])}
                disabled={idx < 0 || idx >= months.length - 1}
                aria-label={t("term.stmt.prev")}
              >
                ‹
              </button>
              <select
                value={ym}
                onChange={(e) => setYm(e.target.value)}
                aria-label={t("term.stmt.month")}
                className="min-w-0 flex-1 rounded-[8px] border border-desk-border bg-desk-bg px-2.5 py-1.5 text-[13px] capitalize text-desk-text outline-none focus:border-desk-accent"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={navBtn}
                onClick={() => idx > 0 && setYm(months[idx - 1])}
                disabled={idx <= 0}
                aria-label={t("term.stmt.next")}
              >
                ›
              </button>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stat(t("term.stmt.trades"), String(data.list.length))}
              {stat(`${t("term.stmt.net")} (${cur})`, signed(data.net), moneyCls(data.net))}
              {stat(t("term.stmt.winRate"), `${fmtNum(data.winRate, 0)}% (${data.wins}/${data.list.length})`)}
              {stat(t("term.stmt.volume"), fmtNum(data.lots, 2))}
              {stat(t("term.stmt.grossProfit"), signed(data.gp), moneyCls(data.gp))}
              {stat(t("term.stmt.grossLoss"), signed(data.gl), moneyCls(data.gl))}
              {stat(t("term.stmt.best"), signed(data.best), moneyCls(data.best))}
              {stat(t("term.stmt.worst"), signed(data.worst), moneyCls(data.worst))}
            </div>

            {/* By symbol */}
            {data.symbols.length > 0 && (
              <div>
                <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
                  {t("term.stmt.bySymbol")}
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {data.symbols.map(([sym, s]) => (
                    <li
                      key={sym}
                      className="rounded-[8px] border border-desk-border/70 px-2 py-1 text-[11px]"
                      title={`${sym}: ${s.n} · ${fmtNum(s.lots, 2)} lot · ${signed(s.pnl)}`}
                    >
                      <b className="text-desk-text">{sym}</b>{" "}
                      <span className="text-desk-muted">
                        {s.n}× · {fmtNum(s.lots, 2)}
                      </span>{" "}
                      <b className={`tabular-nums ${moneyCls(s.pnl)}`}>{signed(s.pnl)}</b>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trades — stacked rows (no horizontal scroll on phones) */}
            <div>
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
                {t("term.stmt.list")}
              </h3>
              <ul className="divide-y divide-desk-border/60 rounded-[10px] border border-desk-border/70">
                {data.list.map((p) => {
                  const v = pnlOf(p);
                  const buy = String(p.side).toUpperCase() === "BUY";
                  return (
                    <li key={p.id} className="flex items-center gap-2 px-2.5 py-2 text-[11px]">
                      <span
                        className={`w-9 shrink-0 text-[10px] font-bold ${buy ? "text-desk-buy" : "text-desk-sell"}`}
                      >
                        {buy ? "BUY" : "SELL"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-desk-text">
                          {p.symbol} <span className="font-normal text-desk-muted">· {fmtNum(Number(p.volume) || 0, 2)}</span>
                        </span>
                        <span className="block truncate font-mono text-[10px] text-desk-muted">
                          {formatPrice(p.symbol, Number(p.openPrice) || 0)} →{" "}
                          {p.closePrice != null ? formatPrice(p.symbol, Number(p.closePrice)) : "—"} ·{" "}
                          {fmtWhen(p.closedAt ?? p.openedAt)}
                        </span>
                      </span>
                      <span className={`shrink-0 text-right font-bold tabular-nums ${moneyCls(v)}`}>{signed(v)}</span>
                    </li>
                  );
                })}
                <li className="flex items-center justify-between gap-2 bg-desk-elev/40 px-2.5 py-2 text-[11px] font-semibold">
                  <span className="text-desk-muted">{t("term.stmt.total")}</span>
                  <span className={`tabular-nums ${moneyCls(data.net)}`}>
                    {signed(data.net)} {cur}
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <p className="min-w-0 flex-1 text-[10px] leading-snug text-desk-muted">{t("term.stmt.note")}</p>
              <button
                type="button"
                onClick={downloadCsv}
                disabled={!data.list.length}
                className="shrink-0 rounded-control border border-desk-border px-3 py-1.5 text-[11px] font-semibold text-desk-text transition-colors hover:bg-desk-hover disabled:opacity-40"
              >
                {t("term.stmt.csv")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
