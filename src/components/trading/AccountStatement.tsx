"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/context";
import { formatPrice } from "@/lib/symbols";
import { fmtNum } from "@/lib/format";
import {
  buildStatement,
  type StatementCash,
  type StatementTrade,
} from "@/lib/account-statement";
import type { PositionRow } from "./types";

type CashRequest = {
  id: string;
  amount: number;
  currency?: string | null;
  status?: string | null;
  note?: string | null;
  createdAt?: string | null;
  method?: { label?: string; type?: string } | string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Closed trades already loaded for this customer. */
  rows: PositionRow[];
  currency?: string;
  /** The terminal has not loaded every closed trade. */
  partial?: boolean;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function money(amount: number, currency: string, locale: string): string {
  const code = /^[A-Za-z]{3}$/.test(currency || "") ? currency.toUpperCase() : "USD";
  if (!Number.isFinite(amount)) return "—";
  try {
    const formatted = new Intl.NumberFormat(locale || "en", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return amount > 0 ? `+${formatted}` : formatted;
  } catch {
    const formatted = `${fmtNum(amount, 2)} ${code}`;
    return amount > 0 ? `+${formatted}` : formatted;
  }
}

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function loadRequests(path: string): Promise<CashRequest[]> {
  const all: CashRequest[] = [];
  let skip = 0;
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${path}?take=100&skip=${skip}`, { cache: "no-store", credentials: "include" });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const rows = Array.isArray(data.requests) ? (data.requests as CashRequest[]) : [];
    all.push(...rows);
    if (!data.hasMore) break;
    const next = typeof data.nextSkip === "number" ? data.nextSkip : skip + rows.length;
    if (next <= skip) break;
    skip = next;
  }
  return all;
}

function cashLabel(row: CashRequest): string {
  if (row.method && typeof row.method === "object") {
    return [row.method.type, row.method.label].filter(Boolean).join(" · ");
  }
  if (typeof row.method === "string" && row.method) return row.method;
  return row.note || "";
}

const PRINT_CSS = `
@media print {
  html, body { background: #fff !important; }
  body .fx-stmt-overlay, body .fx-stmt-overlay * { visibility: visible !important; }
  body .fx-stmt-overlay {
    position: static !important;
    inset: auto !important;
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    background: #fff !important;
    padding: 0 !important;
  }
  body .fx-stmt {
    position: static !important;
    max-height: none !important;
    overflow: visible !important;
    width: auto !important;
    max-width: none !important;
    box-shadow: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #fff !important;
    color: #111 !important;
  }
  .fx-stmt-noprint { display: none !important; }
  .fx-stmt-scroll { overflow: visible !important; }
  .fx-stmt table { width: 100%; border-collapse: collapse; }
  .fx-stmt th, .fx-stmt td { border-bottom: 1px solid #ddd; color: #111; }
  .fx-stmt .fx-stmt-pos { color: #067647 !important; }
  .fx-stmt .fx-stmt-neg { color: #b42318 !important; }
}
`;

export default function AccountStatement({ open, onClose, rows, currency, partial }: Props) {
  const { t, locale } = useI18n();
  const cur = currency || "USD";
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(() => localDate(new Date()));
  const [deposits, setDeposits] = useState<CashRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<CashRequest[]>([]);
  const [cashState, setCashState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setCashState("loading");
    Promise.all([loadRequests("/api/deposit"), loadRequests("/api/withdraw")])
      .then(([depositRows, withdrawalRows]) => {
        if (cancel) return;
        setDeposits(depositRows);
        setWithdrawals(withdrawalRows);
        setCashState("idle");
      })
      .catch(() => {
        if (!cancel) setCashState("error");
      });
    return () => {
      cancel = true;
    };
  }, [open]);

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

  const trades = useMemo<StatementTrade[]>(
    () =>
      rows.map((p) => ({
        id: p.id,
        symbol: p.symbol,
        side: p.side,
        volume: Number(p.volume) || 0,
        profit: Number(p.closeProfit ?? p.profit) || 0,
        at: p.closedAt || p.openedAt,
      })),
    [rows]
  );

  const cash = useMemo<StatementCash[]>(() => {
    const next: StatementCash[] = [];
    for (const row of deposits) {
      next.push({
        id: row.id,
        kind: "deposit",
        amount: Number(row.amount),
        currency: row.currency || cur,
        status: String(row.status || ""),
        at: row.createdAt || "",
        label: cashLabel(row) || t("term.stmt.deposit"),
      });
    }
    for (const row of withdrawals) {
      next.push({
        id: row.id,
        kind: "withdrawal",
        amount: Number(row.amount),
        currency: row.currency || cur,
        status: String(row.status || ""),
        at: row.createdAt || "",
        label: cashLabel(row) || t("term.stmt.withdrawal"),
      });
    }
    return next;
  }, [deposits, withdrawals, cur, t]);

  const statement = useMemo(
    () => buildStatement({ trades, cash, accountCurrency: cur, from, to }),
    [trades, cash, cur, from, to]
  );

  function kindLabel(kind: StatementLineKind): string {
    if (kind === "deposit") return t("term.stmt.deposit");
    if (kind === "withdrawal") return t("term.stmt.withdrawal");
    return t("term.stmt.trade");
  }

  function statusLabel(status: string): string {
    const key = `term.stmt.${status.toLowerCase()}`;
    const label = t(key);
    return label === key ? status : label;
  }

  function when(iso: string): string {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function rangeLabel(): string {
    if (!from && !to) return t("term.stmt.allDates");
    return `${from || "…"} – ${to || "…"}`;
  }

  function downloadCsv() {
    if (!statement.lines.length) return;
    const header = ["date", "type", "details", "status", "currency", "amount", "running"];
    const body = statement.lines.map((line) => [
      line.at,
      line.kind,
      line.kind === "trade" ? line.title : line.title,
      line.status,
      line.currency,
      line.signed.toFixed(2),
      line.running == null ? "" : line.running.toFixed(2),
    ]);
    const lines = [header, ...body].map((row) => row.map(csvCell).join(","));
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `7fx-statement-${from || "all"}-${to || "all"}.csv`;
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

  const tone = (n: number) => (n > 0 ? "fx-stmt-pos text-desk-buy" : n < 0 ? "fx-stmt-neg text-desk-sell" : "text-desk-muted");

  return createPortal(
    <div
      className="fx-stmt-overlay fx-lx-overlay fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <style>{PRINT_CSS}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fx-stmt-title"
        onClick={(e) => e.stopPropagation()}
        className="fx-stmt fx-lx-modal max-h-[92vh] w-full overflow-y-auto overflow-x-hidden rounded-t-modal border border-desk-border bg-desk-panel text-desk-text shadow-desk-panel sm:max-w-3xl sm:rounded-modal"
      >
        <div className="flex items-center justify-between gap-2 border-b border-desk-border/80 px-4 py-3">
          <div className="min-w-0">
            <h2 id="fx-stmt-title" className="text-sm font-medium tracking-wide">
              {t("term.stmt.title")}
            </h2>
            <p className="text-[11px] text-desk-muted">{t("term.stmt.subtitle")}</p>
            <p className="mt-1 text-[11px] font-medium tabular-nums text-desk-text" data-fx-stmt-range="">
              {rangeLabel()}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="fx-stmt-noprint flex h-10 w-10 shrink-0 items-center justify-center rounded-[7px] text-desk-muted hover:bg-desk-elev hover:text-desk-text focus:outline-none focus-visible:ring-1 focus-visible:ring-desk-accent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="fx-stmt-noprint flex flex-wrap items-end gap-2">
            <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-[11px] font-medium text-desk-muted">
              {t("term.stmt.from")}
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                data-fx-stmt-from=""
                className="min-h-10 rounded-[8px] border border-desk-border bg-desk-bg px-2 text-base text-desk-text outline-none focus:border-desk-accent"
              />
            </label>
            <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-[11px] font-medium text-desk-muted">
              {t("term.stmt.to")}
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                data-fx-stmt-to=""
                className="min-h-10 rounded-[8px] border border-desk-border bg-desk-bg px-2 text-base text-desk-text outline-none focus:border-desk-accent"
              />
            </label>
            <button
              type="button"
              onClick={() => window.print()}
              data-fx-stmt-print=""
              className="min-h-10 rounded-control border border-desk-border px-3 text-[11px] font-medium text-desk-text hover:bg-desk-hover"
            >
              {t("term.stmt.print")}
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!statement.lines.length}
              className="min-h-10 rounded-control border border-desk-border px-3 text-[11px] font-medium text-desk-text hover:bg-desk-hover disabled:opacity-40"
            >
              {t("term.stmt.csv")}
            </button>
          </div>

          {cashState === "loading" ? <p className="text-[11px] text-desk-muted">{t("term.stmt.loading")}</p> : null}
          {cashState === "error" ? <p className="text-[11px] text-desk-sell">{t("term.stmt.cashFailed")}</p> : null}
          {partial ? <p className="text-[11px] text-desk-muted">{t("term.stmt.partial")}</p> : null}

          {statement.totals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {statement.totals.map((row) => (
                <div key={row.currency} className="min-w-0 rounded-[10px] border border-desk-border/70 px-2.5 py-2">
                  <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">
                    {t("term.stmt.running")} · {row.currency}
                  </div>
                  <div className={`mt-0.5 text-[13px] font-medium tabular-nums ${tone(row.total)}`} data-fx-stmt-total={row.currency}>
                    {money(row.total, row.currency, locale)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {statement.lines.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-desk-muted">{t("term.stmt.empty")}</p>
          ) : (
            <div className="fx-stmt-scroll overflow-x-auto rounded-[10px] border border-desk-border/70">
              <table className="w-full min-w-[36rem] text-left text-[11px]" data-fx-stmt-table="">
                <thead className="bg-desk-elev/40 text-[10px] font-medium uppercase tracking-wider text-desk-muted">
                  <tr>
                    <th className="px-2 py-2 font-medium">{t("term.stmt.date")}</th>
                    <th className="px-2 py-2 font-medium">{t("term.stmt.type")}</th>
                    <th className="px-2 py-2 font-medium">{t("term.stmt.details")}</th>
                    <th className="px-2 py-2 font-medium">{t("term.stmt.status")}</th>
                    <th className="px-2 py-2 text-right font-medium">{t("term.stmt.amount")}</th>
                    <th className="px-2 py-2 text-right font-medium">{t("term.stmt.running")}</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.lines.map((line) => (
                    <tr key={line.id} className="border-t border-desk-border/60" data-fx-stmt-kind={line.kind}>
                      <td className="whitespace-nowrap px-2 py-2 tabular-nums">{when(line.at)}</td>
                      <td className="px-2 py-2 font-medium">{kindLabel(line.kind)}</td>
                      <td className="max-w-[14rem] truncate px-2 py-2">
                        {line.kind === "trade" ? (
                          <TradeDetail row={rows.find((p) => `trade:${p.id}` === line.id)} title={line.title} volume={line.detail} />
                        ) : (
                          line.title
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <span className="inline-flex rounded-full border border-desk-border px-2 py-0.5 font-medium">
                          {statusLabel(line.status)}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums ${tone(line.signed)}`}>
                        {money(line.signed, line.currency, locale)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums ${line.running == null ? "text-desk-muted" : tone(line.running)}`}
                        data-fx-stmt-running={line.running == null ? "" : line.currency}
                      >
                        {line.running == null ? "—" : money(line.running, line.currency, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[10px] leading-snug text-desk-muted">{t("term.stmt.note")}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

type StatementLineKind = "trade" | "deposit" | "withdrawal";

function TradeDetail({ row, title, volume }: { row?: PositionRow; title: string; volume: string }) {
  return (
    <span>
      {title}
      {volume ? <span className="text-desk-muted"> · {fmtNum(Number(volume) || 0, 2)}</span> : null}
      {row ? (
        <span className="block font-mono text-[10px] text-desk-muted">
          {formatPrice(row.symbol, Number(row.openPrice) || 0)} →{" "}
          {row.closePrice != null ? formatPrice(row.symbol, Number(row.closePrice)) : "—"}
        </span>
      ) : null}
    </span>
  );
}
