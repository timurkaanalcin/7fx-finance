"use client";

import { calcPipDistance, formatPrice } from "@/lib/symbols";
import { fmtDateTime, fmtNum } from "@/lib/format";
import type { OrderRow, PositionRow } from "./types";

type Tab = "open" | "closed" | "pending";

type Props = {
  tab: Tab;
  onTab: (t: Tab) => void;
  openPositions: PositionRow[];
  closedPositions: PositionRow[];
  pendingOrders: OrderRow[];
  onClosePosition: (id: string) => void;
  onCancelOrder: (id: string) => void;
  className?: string;
};

function moneyCls(n: number) {
  if (n > 0) return "text-desk-buy";
  if (n < 0) return "text-desk-sell";
  return "text-desk-muted";
}

function OpenCard({
  p,
  onClose,
}: {
  p: PositionRow;
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
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Açılış</div>
          <div className="mt-0.5 font-medium tabular-nums text-desk-text">
            {formatPrice(p.symbol, p.openPrice)}
          </div>
        </div>
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Güncel</div>
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
        Pozisyonu Kapat
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
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Açılış</div>
          <div className="mt-0.5 font-medium tabular-nums">
            {formatPrice(p.symbol, p.openPrice)}
          </div>
        </div>
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Kapanış</div>
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
          <span className="text-desk-muted">Fiyat </span>
          <span className="font-medium tabular-nums">
            {o.price != null ? formatPrice(o.symbol, o.price) : "—"}
          </span>
        </div>
        <button
          onClick={() => onCancel(o.id)}
          className="rounded-[10px] border border-desk-border bg-desk-elev px-3 py-1.5 text-[11px] font-semibold text-desk-muted hover:bg-desk-hover hover:text-desk-text"
        >
          İptal
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
  className = "",
}: Props) {
  const tabs: { id: Tab; label: string; shortLabel: string; count?: number }[] = [
    { id: "open", label: "Açık İşlemler", shortLabel: "Açık", count: openPositions.length || undefined },
    { id: "closed", label: "Kapatılmış", shortLabel: "Kapalı", count: closedPositions.length || undefined },
    { id: "pending", label: "Bekleyen", shortLabel: "Bekleyen", count: pendingOrders.length || undefined },
  ];

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
        <div className="ml-auto hidden items-center gap-2 self-center pb-1.5 sm:flex">
          <button className="rounded-control border border-desk-border px-2.5 py-1 text-[11px] text-desk-muted hover:bg-desk-hover hover:text-desk-text">
            Filtre
          </button>
        </div>
      </div>

      {/* Mobile card list — elite dense cards */}
      <div className="flex-1 space-y-2 overflow-auto p-2.5 md:hidden">
        {tab === "open" && (
          <>
            {openPositions.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-desk-muted">Açık işlem yok</div>
            )}
            {openPositions.map((p) => (
              <OpenCard key={p.id} p={p} onClose={onClosePosition} />
            ))}
          </>
        )}
        {tab === "closed" && (
          <>
            {closedPositions.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-desk-muted">
                Kapatılmış pozisyon yok
              </div>
            )}
            {closedPositions.map((p) => (
              <ClosedCard key={p.id} p={p} />
            ))}
          </>
        )}
        {tab === "pending" && (
          <>
            {pendingOrders.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-desk-muted">Bekleyen emir yok</div>
            )}
            {pendingOrders.map((o) => (
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
                <th className="px-2 py-2">Tür</th>
                <th className="px-2 py-2">Varlık</th>
                <th className="px-2 py-2">Hacim</th>
                <th className="px-2 py-2">Pip</th>
                <th className="px-2 py-2">Açılış</th>
                <th className="px-2 py-2">Güncel</th>
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <th className="px-2 py-2">Takas</th>
                <th className="px-2 py-2">Komisyon</th>
                <th className="px-2 py-2">Tic. Kom.</th>
                <th className="px-2 py-2">Kar</th>
                <th className="px-2 py-2">Net Kar</th>
                <th className="px-2 py-2">Kapat</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-3 py-8 text-center text-desk-muted">
                    Açık işlem yok
                  </td>
                </tr>
              )}
              {openPositions.map((p, i) => {
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
                      {p.side === "BUY" ? "Alış" : "Satış"}
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
                        Kapat
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
                <th className="px-2 py-2">Tür</th>
                <th className="px-2 py-2">Varlık</th>
                <th className="px-2 py-2">Hacim</th>
                <th className="px-2 py-2">Açılış</th>
                <th className="px-2 py-2">Kapanış</th>
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <th className="px-2 py-2">Kar</th>
                <th className="px-2 py-2">Net Kar</th>
              </tr>
            </thead>
            <tbody>
              {closedPositions.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-desk-muted">
                    Kapatılmış pozisyon yok
                  </td>
                </tr>
              )}
              {closedPositions.map((p, i) => (
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
                    {p.side === "BUY" ? "Alış" : "Satış"}
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
                <th className="px-2 py-2">Tür</th>
                <th className="px-2 py-2">Emir</th>
                <th className="px-2 py-2">Varlık</th>
                <th className="px-2 py-2">Hacim</th>
                <th className="px-2 py-2">Fiyat</th>
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <th className="px-2 py-2">İptal</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-desk-muted">
                    Bekleyen emir yok
                  </td>
                </tr>
              )}
              {pendingOrders.map((o, i) => (
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
                    {o.side === "BUY" ? "Alış" : "Satış"}
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
                      İptal
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
