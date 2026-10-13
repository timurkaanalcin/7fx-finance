"use client";

import { useMemo, useState, type ReactNode } from "react";
import { calcPipDistance, formatPrice } from "@/lib/symbols";
import { fmtDateTime, fmtNum } from "@/lib/format";
import type { OrderRow, PositionRow } from "./types";

type Tab = "open" | "closed" | "pending";
type SideFilter = "ALL" | "BUY" | "SELL";
type ResultFilter = "ALL" | "PROFIT" | "LOSS";
type PeriodFilter = "ALL" | "TODAY" | "7D" | "30D";

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function periodCutoff(period: PeriodFilter): Date | null {
  if (period === "ALL") return null;
  const today = startOfLocalDay();
  if (period === "TODAY") return today;
  const days = period === "7D" ? 7 : 30;
  const cut = new Date(today);
  cut.setDate(cut.getDate() - (days - 1));
  return cut;
}

function matchesPeriod(iso: string | null | undefined, period: PeriodFilter): boolean {
  const cut = periodCutoff(period);
  if (!cut) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= cut.getTime();
}

function matchesSymbol(
  symbol: string,
  chartSymbol: string | null | undefined,
  q: string
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (symbol.toLowerCase().includes(needle)) return true;
  if (chartSymbol && chartSymbol.toLowerCase().includes(needle)) return true;
  return false;
}

function matchesSide(side: string, filter: SideFilter): boolean {
  if (filter === "ALL") return true;
  return side.toUpperCase() === filter;
}

function filterPositions(
  rows: PositionRow[],
  opts: {
    side: SideFilter;
    symbolQ: string;
    period: PeriodFilter;
    result?: ResultFilter;
  }
): PositionRow[] {
  return rows.filter((p) => {
    if (!matchesSide(p.side, opts.side)) return false;
    if (!matchesSymbol(p.symbol, p.chartSymbol, opts.symbolQ)) return false;
    if (!matchesPeriod(p.openedAt, opts.period)) return false;
    if (opts.result && opts.result !== "ALL") {
      const pnl = p.closeProfit ?? p.profit;
      if (opts.result === "PROFIT" && !(pnl > 0)) return false;
      if (opts.result === "LOSS" && !(pnl < 0)) return false;
    }
    return true;
  });
}

function filterOrders(
  rows: OrderRow[],
  opts: { side: SideFilter; symbolQ: string; period: PeriodFilter }
): OrderRow[] {
  return rows.filter((o) => {
    if (!matchesSide(o.side, opts.side)) return false;
    if (!matchesSymbol(o.symbol, undefined, opts.symbolQ)) return false;
    if (!matchesPeriod(o.createdAt, opts.period)) return false;
    return true;
  });
}

function Chip({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "buy" | "sell" | "neutral";
}) {
  const activeCls =
    tone === "buy"
      ? "border-desk-buy/50 bg-desk-buy/15 text-desk-buy"
      : tone === "sell"
        ? "border-desk-sell/50 bg-desk-sell/15 text-desk-sell"
        : "border-desk-accent/50 bg-desk-accent/15 text-desk-text";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[7px] border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
        active
          ? activeCls
          : "border-desk-border bg-desk-elev/40 text-desk-muted hover:bg-desk-hover hover:text-desk-text"
      }`}
    >
      {children}
    </button>
  );
}

type Props = {
  tab: Tab;
  onTab: (t: Tab) => void;
  openPositions: PositionRow[];
  closedPositions: PositionRow[];
  pendingOrders: OrderRow[];
  onClosePosition: (id: string) => void;
  onCancelOrder: (id: string) => void;
  /** Switch chart to position chartSymbol || symbol */
  onSelectSymbol?: (symbol: string) => void;
  className?: string;
};

function moneyCls(n: number) {
  if (n > 0) return "text-desk-buy";
  if (n < 0) return "text-desk-sell";
  return "text-desk-muted";
}

function SummaryStat({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <span className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">
        {label}
      </span>
      <span className={`truncate text-[12px] font-bold tabular-nums ${className}`}>{children}</span>
    </div>
  );
}

function OpenCard({
  p,
  onClose,
  onSelectSymbol,
}: {
  p: PositionRow;
  onSelectSymbol?: (symbol: string) => void;
  onClose: (id: string) => void;
}) {
  const pip =
    calcPipDistance(p.symbol, p.openPrice, p.currentPrice) *
    (p.side === "BUY" ? 1 : -1);
  return (
    <div className="rounded-[14px] border border-desk-border/60 bg-desk-elev/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-[13px] font-bold tracking-tight text-desk-text hover:underline"
              onClick={() =>
                onSelectSymbol?.((p.chartSymbol || p.symbol).trim().toUpperCase())
              }
              title="Show chart"
            >
              {p.symbol}
              {p.chartSymbol && p.chartSymbol !== p.symbol ? (
                <span className="ml-1 text-[10px] font-normal text-desk-muted">
                  ({p.chartSymbol})
                </span>
              ) : null}
            </button>
            <span
              className={`rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold ${
                p.side === "BUY"
                  ? "bg-desk-buy/15 text-desk-buy"
                  : "bg-desk-sell/15 text-desk-sell"
              }`}
            >
              {p.side === "BUY" ? "AL" : "SAT"}
            </span>
            <span className="text-[11px] tabular-nums text-desk-muted">
              {fmtNum(p.volume, 2)} lot
            </span>
          </div>
          <div className="mt-1 text-[10px] text-desk-muted">{fmtDateTime(p.openedAt)}</div>
        </div>
        <div className="text-right">
          <div className={`text-[14px] font-bold tabular-nums ${moneyCls(p.profit)}`}>
            {fmtNum(p.profit, 2)}
          </div>
          <div className={`text-[10px] tabular-nums ${moneyCls(pip)}`}>
            {fmtNum(pip, 1)} pip
          </div>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Open</div>
          <div className="mt-0.5 font-medium tabular-nums text-desk-text">
            {formatPrice(p.symbol, p.openPrice)}
          </div>
        </div>
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Current</div>
          <div className="mt-0.5 font-medium tabular-nums text-desk-text">
            {formatPrice(p.symbol, p.currentPrice)}
          </div>
        </div>
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">SL / TP</div>
          <div className="mt-0.5 truncate font-medium tabular-nums text-desk-muted">
            {p.stopLoss != null ? formatPrice(p.symbol, p.stopLoss) : "—"}
            {" / "}
            {p.takeProfit != null ? formatPrice(p.symbol, p.takeProfit) : "—"}
          </div>
        </div>
      </div>
      <button
        onClick={() => onClose(p.id)}
        className="mt-2.5 w-full rounded-[10px] bg-desk-sell/90 py-2 text-[12px] font-bold text-white hover:bg-desk-sell"
      >
        Close Position
      </button>
    </div>
  );
}

function ClosedCard({ p }: { p: PositionRow }) {
  const profit = p.closeProfit ?? p.profit;
  return (
    <div className="rounded-[14px] border border-desk-border/60 bg-desk-elev/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tracking-tight text-desk-text">
              {p.symbol}
            </span>
            <span
              className={`rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold ${
                p.side === "BUY"
                  ? "bg-desk-buy/15 text-desk-buy"
                  : "bg-desk-sell/15 text-desk-sell"
              }`}
            >
              {p.side === "BUY" ? "AL" : "SAT"}
            </span>
            <span className="text-[11px] tabular-nums text-desk-muted">
              {fmtNum(p.volume, 2)} lot
            </span>
          </div>
          <div className="mt-1 text-[10px] text-desk-muted">{fmtDateTime(p.openedAt)}</div>
        </div>
        <div className={`text-[14px] font-bold tabular-nums ${moneyCls(profit)}`}>
          {fmtNum(profit, 2)}
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Open</div>
          <div className="mt-0.5 font-medium tabular-nums">
            {formatPrice(p.symbol, p.openPrice)}
          </div>
        </div>
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Close</div>
          <div className="mt-0.5 font-medium tabular-nums">
            {p.closePrice != null ? formatPrice(p.symbol, p.closePrice) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingCard({
  o,
  onCancel,
}: {
  o: OrderRow;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="rounded-[14px] border border-desk-border/60 bg-desk-elev/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tracking-tight text-desk-text">
              {o.symbol}
            </span>
            <span
              className={`rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold ${
                o.side === "BUY"
                  ? "bg-desk-buy/15 text-desk-buy"
                  : "bg-desk-sell/15 text-desk-sell"
              }`}
            >
              {o.side === "BUY" ? "AL" : "SAT"}
            </span>
            <span className="rounded-[6px] bg-desk-bg px-1.5 py-0.5 text-[10px] font-medium text-desk-muted">
              {o.type}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-desk-muted">{fmtDateTime(o.createdAt)}</div>
        </div>
        <div className="text-right text-[12px] font-semibold tabular-nums text-desk-text">
          {fmtNum(o.volume, 2)} lot
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px]">
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <span className="text-desk-muted">Price </span>
          <span className="font-medium tabular-nums">
            {o.price != null ? formatPrice(o.symbol, o.price) : "—"}
          </span>
        </div>
        <button
          onClick={() => onCancel(o.id)}
          className="rounded-[10px] border border-desk-border bg-desk-elev px-3 py-1.5 text-[11px] font-semibold text-desk-muted hover:bg-desk-hover hover:text-desk-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function BottomPanels({
  tab,
  onTab,
  openPositions,
  closedPositions,
  pendingOrders,
  onClosePosition,
  onCancelOrder,
  onSelectSymbol,
  className = "",
}: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("ALL");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("ALL");

  const tabs: { id: Tab; label: string; shortLabel: string; count?: number }[] = [
    { id: "open", label: "Open Trades", shortLabel: "Open", count: openPositions.length || undefined },
    { id: "closed", label: "Closed", shortLabel: "Closed", count: closedPositions.length || undefined },
    { id: "pending", label: "Pending", shortLabel: "Pending", count: pendingOrders.length || undefined },
  ];

  const filterOpts = useMemo(
    () => ({ side: sideFilter, symbolQ: symbolFilter, period: periodFilter }),
    [sideFilter, symbolFilter, periodFilter]
  );

  const filteredOpen = useMemo(
    () => filterPositions(openPositions, filterOpts),
    [openPositions, filterOpts]
  );
  const filteredClosed = useMemo(
    () => filterPositions(closedPositions, { ...filterOpts, result: resultFilter }),
    [closedPositions, filterOpts, resultFilter]
  );
  const filteredPending = useMemo(
    () => filterOrders(pendingOrders, filterOpts),
    [pendingOrders, filterOpts]
  );

  const filtersActive =
    sideFilter !== "ALL" ||
    symbolFilter.trim() !== "" ||
    periodFilter !== "ALL" ||
    (tab === "closed" && resultFilter !== "ALL");

  const openSummary = useMemo(() => {
    let pnl = 0;
    let buys = 0;
    let sells = 0;
    for (const p of filteredOpen) {
      pnl += Number(p.profit) || 0;
      if (p.side.toUpperCase() === "BUY") buys++;
      else sells++;
    }
    return { count: filteredOpen.length, pnl, buys, sells };
  }, [filteredOpen]);

  const closedSummary = useMemo(() => {
    let pnl = 0;
    let wins = 0;
    for (const p of filteredClosed) {
      const v = Number(p.closeProfit ?? p.profit) || 0;
      pnl += v;
      if (v > 0) wins++;
    }
    const count = filteredClosed.length;
    return { count, pnl, wins, winRate: count > 0 ? (wins / count) * 100 : 0 };
  }, [filteredClosed]);

  const summaryStrip =
    tab === "open" && openPositions.length > 0 ? (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-desk-border/60 bg-desk-elev/20 px-2.5 py-1.5">
        <SummaryStat label={filtersActive ? "Pozisyon (filtre)" : "Pozisyon"} className="text-desk-text">
          {openSummary.count}
        </SummaryStat>
        <SummaryStat label="Açık K/Z" className={moneyCls(openSummary.pnl)}>
          {openSummary.pnl > 0 ? "+" : ""}
          {fmtNum(openSummary.pnl, 2)}
        </SummaryStat>
        <SummaryStat label="AL / SAT" className="text-desk-muted">
          <span className="text-desk-buy">{openSummary.buys}</span>
          {" / "}
          <span className="text-desk-sell">{openSummary.sells}</span>
        </SummaryStat>
      </div>
    ) : tab === "closed" && closedPositions.length > 0 ? (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-desk-border/60 bg-desk-elev/20 px-2.5 py-1.5">
        <SummaryStat label={filtersActive ? "İşlem (filtre)" : "İşlem"} className="text-desk-text">
          {closedSummary.count}
        </SummaryStat>
        <SummaryStat label="Gerçekleşen K/Z" className={moneyCls(closedSummary.pnl)}>
          {closedSummary.pnl > 0 ? "+" : ""}
          {fmtNum(closedSummary.pnl, 2)}
        </SummaryStat>
        <SummaryStat
          label="Kazanma oranı"
          className={
            closedSummary.count === 0
              ? "text-desk-muted"
              : closedSummary.winRate >= 50
              ? "text-desk-buy"
              : "text-desk-sell"
          }
        >
          {closedSummary.count > 0
            ? `${fmtNum(closedSummary.winRate, 0)}% (${closedSummary.wins}/${closedSummary.count})`
            : "—"}
        </SummaryStat>
      </div>
    ) : null;

  const emptyFiltered = (
    <div className="px-3 py-10 text-center text-xs text-desk-muted">
      Filtreye uyan işlem yok
    </div>
  );

  return (
    <div
      className={`flex h-full min-h-0 flex-col border-t border-desk-border bg-desk-panel md:border-t md:border-r-0 ${className}`}
    >
      <div className="flex items-end gap-0 overflow-x-auto border-b border-desk-border/80 px-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold tracking-wide transition-colors ${
              tab === t.id
                ? "text-desk-text"
                : "text-desk-muted hover:text-desk-text"
            }`}
          >
            <span className="md:hidden">{t.shortLabel}</span>
            <span className="hidden md:inline">{t.label}</span>
            {t.count != null && t.count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  tab === t.id
                    ? "bg-desk-accent text-desk-accent-ink"
                    : "bg-desk-elev text-desk-muted"
                }`}
              >
                {t.count}
              </span>
            )}
            {tab === t.id && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-desk-accent" />
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 self-center pb-1.5">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`rounded-control border px-2.5 py-1 text-[11px] transition-colors ${
              showFilters || filtersActive
                ? "border-desk-accent/50 bg-desk-accent/10 text-desk-text"
                : "border-desk-border text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            }`}
          >
            Filtre
            {filtersActive ? (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-desk-accent align-middle" />
            ) : null}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 border-b border-desk-border/60 bg-desk-elev/30 px-2.5 py-2">
          <div className="flex items-center gap-1">
            <span className="mr-0.5 text-[9px] font-medium uppercase tracking-wider text-desk-muted">
              Side
            </span>
            <Chip active={sideFilter === "ALL"} onClick={() => setSideFilter("ALL")}>
              Tümü
            </Chip>
            <Chip
              active={sideFilter === "BUY"}
              onClick={() => setSideFilter("BUY")}
              tone="buy"
            >
              AL
            </Chip>
            <Chip
              active={sideFilter === "SELL"}
              onClick={() => setSideFilter("SELL")}
              tone="sell"
            >
              SAT
            </Chip>
          </div>
          <div className="flex min-w-[120px] flex-1 items-center gap-1 sm:max-w-[180px]">
            <span className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">
              Symbol
            </span>
            <input
              type="text"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              placeholder="EURUSD…"
              className="min-w-0 flex-1 rounded-[7px] border border-desk-border bg-desk-bg px-2 py-1 text-[11px] text-desk-text outline-none placeholder:text-desk-muted/60 focus:border-desk-accent/50"
            />
          </div>
          {tab === "closed" && (
            <div className="flex items-center gap-1">
              <span className="mr-0.5 text-[9px] font-medium uppercase tracking-wider text-desk-muted">
                Sonuç
              </span>
              <Chip active={resultFilter === "ALL"} onClick={() => setResultFilter("ALL")}>
                Tümü
              </Chip>
              <Chip
                active={resultFilter === "PROFIT"}
                onClick={() => setResultFilter("PROFIT")}
                tone="buy"
              >
                Kâr
              </Chip>
              <Chip
                active={resultFilter === "LOSS"}
                onClick={() => setResultFilter("LOSS")}
                tone="sell"
              >
                Zarar
              </Chip>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="mr-0.5 text-[9px] font-medium uppercase tracking-wider text-desk-muted">
              Period
            </span>
            <Chip active={periodFilter === "ALL"} onClick={() => setPeriodFilter("ALL")}>
              Tümü
            </Chip>
            <Chip active={periodFilter === "TODAY"} onClick={() => setPeriodFilter("TODAY")}>
              Bugün
            </Chip>
            <Chip active={periodFilter === "7D"} onClick={() => setPeriodFilter("7D")}>
              7 gün
            </Chip>
            <Chip active={periodFilter === "30D"} onClick={() => setPeriodFilter("30D")}>
              30 gün
            </Chip>
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setSideFilter("ALL");
                setSymbolFilter("");
                setResultFilter("ALL");
                setPeriodFilter("ALL");
              }}
              className="ml-auto rounded-[7px] border border-desk-border px-2 py-0.5 text-[10px] font-medium text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            >
              Temizle
            </button>
          )}
        </div>
      )}

      {/* P&L summary strip (filtered) — shared by mobile + desktop */}
      {summaryStrip}

      {/* Mobile card list — elite dense cards */}
      <div className="flex-1 space-y-2 overflow-auto p-2.5 md:hidden">
        {tab === "open" && (
          <>
            {openPositions.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-desk-muted">No open trades</div>
            )}
            {openPositions.length > 0 && filteredOpen.length === 0 && emptyFiltered}
            {filteredOpen.map((p) => (
              <OpenCard key={p.id} p={p} onClose={onClosePosition} onSelectSymbol={onSelectSymbol} />
            ))}
          </>
        )}
        {tab === "closed" && (
          <>
            {closedPositions.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-desk-muted">
                No closed positions
              </div>
            )}
            {closedPositions.length > 0 && filteredClosed.length === 0 && emptyFiltered}
            {filteredClosed.map((p) => (
              <ClosedCard key={p.id} p={p} />
            ))}
          </>
        )}
        {tab === "pending" && (
          <>
            {pendingOrders.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-desk-muted">Pending emir yok</div>
            )}
            {pendingOrders.length > 0 && filteredPending.length === 0 && emptyFiltered}
            {filteredPending.map((o) => (
              <PendingCard key={o.id} o={o} onCancel={onCancelOrder} />
            ))}
          </>
        )}
      </div>

      {/* Desktop tables — unchanged structure */}
      <div className="hidden flex-1 overflow-auto md:block">
        {tab === "open" && (
          <table className="min-w-full text-left text-[11px]">
            <thead className="sticky top-0 z-[1] bg-desk-bg/95 text-[9px] font-medium uppercase tracking-wider text-desk-muted backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Zaman</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Asset</th>
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Pip</th>
                <th className="px-2 py-2">Open</th>
                <th className="px-2 py-2">Current</th>
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <th className="px-2 py-2">Takas</th>
                <th className="px-2 py-2">Commission</th>
                <th className="px-2 py-2">Tic. Kom.</th>
                <th className="px-2 py-2">Profit</th>
                <th className="px-2 py-2">Net Profit</th>
                <th className="px-2 py-2">Close</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-3 py-8 text-center text-desk-muted">
                    No open trades
                  </td>
                </tr>
              )}
              {openPositions.length > 0 && filteredOpen.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-3 py-8 text-center text-desk-muted">
                    Filtreye uyan işlem yok
                  </td>
                </tr>
              )}
              {filteredOpen.map((p, i) => {
                const pip =
                  calcPipDistance(p.symbol, p.openPrice, p.currentPrice) *
                  (p.side === "BUY" ? 1 : -1);
                return (
                  <tr
                    key={p.id}
                    className="border-t border-desk-border/50 transition-colors hover:bg-desk-hover/50"
                  >
                    <td className="px-2 py-1.5 text-desk-muted">{i + 1}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-desk-muted">
                      {fmtDateTime(p.openedAt)}
                    </td>
                    <td
                      className={`px-2 py-1.5 font-semibold ${
                        p.side === "BUY" ? "text-desk-buy" : "text-desk-sell"
                      }`}
                    >
                      {p.side === "BUY" ? "Buy" : "Sell"}
                    </td>
                    <td className="px-2 py-1.5 font-medium text-desk-text">{p.symbol}</td>
                    <td className="px-2 py-1.5 tabular-nums">{fmtNum(p.volume, 2)}</td>
                    <td className={`px-2 py-1.5 tabular-nums ${moneyCls(pip)}`}>
                      {fmtNum(pip, 1)}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">
                      {formatPrice(p.symbol, p.openPrice)}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">
                      {formatPrice(p.symbol, p.currentPrice)}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums text-desk-muted">
                      {p.stopLoss != null ? formatPrice(p.symbol, p.stopLoss) : "—"}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums text-desk-muted">
                      {p.takeProfit != null ? formatPrice(p.symbol, p.takeProfit) : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-desk-muted">0.00</td>
                    <td className="px-2 py-1.5 text-desk-muted">0.00</td>
                    <td className="px-2 py-1.5 text-desk-muted">0.00</td>
                    <td className={`px-2 py-1.5 font-semibold tabular-nums ${moneyCls(p.profit)}`}>
                      {fmtNum(p.profit, 2)}
                    </td>
                    <td className={`px-2 py-1.5 font-semibold tabular-nums ${moneyCls(p.profit)}`}>
                      {fmtNum(p.profit, 2)}
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => onClosePosition(p.id)}
                        className="rounded-[7px] bg-desk-sell/85 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-desk-sell"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === "closed" && (
          <table className="min-w-full text-left text-[11px]">
            <thead className="sticky top-0 z-[1] bg-desk-bg/95 text-[9px] font-medium uppercase tracking-wider text-desk-muted backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Zaman</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Asset</th>
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Open</th>
                <th className="px-2 py-2">Close</th>
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <th className="px-2 py-2">Profit</th>
                <th className="px-2 py-2">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {closedPositions.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-desk-muted">
                    No closed positions
                  </td>
                </tr>
              )}
              {closedPositions.length > 0 && filteredClosed.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-desk-muted">
                    Filtreye uyan işlem yok
                  </td>
                </tr>
              )}
              {filteredClosed.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-t border-desk-border/50 transition-colors hover:bg-desk-hover/40"
                >
                  <td className="px-2 py-1.5 text-desk-muted">{i + 1}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-desk-muted">
                    {fmtDateTime(p.openedAt)}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-semibold ${
                      p.side === "BUY" ? "text-desk-buy" : "text-desk-sell"
                    }`}
                  >
                    {p.side === "BUY" ? "Buy" : "Sell"}
                  </td>
                  <td className="px-2 py-1.5 font-medium">{p.symbol}</td>
                  <td className="px-2 py-1.5 tabular-nums">{fmtNum(p.volume, 2)}</td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {formatPrice(p.symbol, p.openPrice)}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {p.closePrice != null ? formatPrice(p.symbol, p.closePrice) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-desk-muted">
                    {p.stopLoss != null ? formatPrice(p.symbol, p.stopLoss) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-desk-muted">
                    {p.takeProfit != null ? formatPrice(p.symbol, p.takeProfit) : "—"}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-semibold tabular-nums ${moneyCls(
                      p.closeProfit ?? p.profit
                    )}`}
                  >
                    {fmtNum(p.closeProfit ?? p.profit, 2)}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-semibold tabular-nums ${moneyCls(
                      p.closeProfit ?? p.profit
                    )}`}
                  >
                    {fmtNum(p.closeProfit ?? p.profit, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "pending" && (
          <table className="min-w-full text-left text-[11px]">
            <thead className="sticky top-0 z-[1] bg-desk-bg/95 text-[9px] font-medium uppercase tracking-wider text-desk-muted backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Zaman</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Order</th>
                <th className="px-2 py-2">Asset</th>
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <th className="px-2 py-2">Cancel</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-desk-muted">
                    Pending emir yok
                  </td>
                </tr>
              )}
              {pendingOrders.length > 0 && filteredPending.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-desk-muted">
                    Filtreye uyan işlem yok
                  </td>
                </tr>
              )}
              {filteredPending.map((o, i) => (
                <tr
                  key={o.id}
                  className="border-t border-desk-border/50 transition-colors hover:bg-desk-hover/40"
                >
                  <td className="px-2 py-1.5 text-desk-muted">{i + 1}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-desk-muted">
                    {fmtDateTime(o.createdAt)}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-semibold ${
                      o.side === "BUY" ? "text-desk-buy" : "text-desk-sell"
                    }`}
                  >
                    {o.side === "BUY" ? "Buy" : "Sell"}
                  </td>
                  <td className="px-2 py-1.5">{o.type}</td>
                  <td className="px-2 py-1.5 font-medium">{o.symbol}</td>
                  <td className="px-2 py-1.5 tabular-nums">{fmtNum(o.volume, 2)}</td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {o.price != null ? formatPrice(o.symbol, o.price) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-desk-muted">
                    {o.stopLoss != null ? formatPrice(o.symbol, o.stopLoss) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-desk-muted">
                    {o.takeProfit != null ? formatPrice(o.symbol, o.takeProfit) : "—"}
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => onCancelOrder(o.id)}
                      className="rounded-[7px] border border-desk-border bg-desk-elev px-2 py-0.5 text-[10px] font-medium text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
