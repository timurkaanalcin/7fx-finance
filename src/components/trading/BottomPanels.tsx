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
};

function moneyCls(n: number) {
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-red-400";
  return "text-slate-300";
}

export default function BottomPanels({
  tab,
  onTab,
  openPositions,
  closedPositions,
  pendingOrders,
  onClosePosition,
  onCancelOrder,
}: Props) {
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "open", label: "AÇIK İŞLEMLER", count: openPositions.length || undefined },
    { id: "closed", label: "KAPATILMIŞ POZİSYONLAR", count: closedPositions.length || undefined },
    { id: "pending", label: "BEKLEYEN POZİSYONLAR", count: pendingOrders.length || undefined },
  ];

  return (
    <div className="flex h-[220px] shrink-0 flex-col border-t border-[#3a4658] bg-[#222d3d]">
      <div className="flex items-center gap-1 border-b border-[#3a4658] px-2 py-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={`flex items-center gap-2 rounded-t px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
              tab === t.id ? "bg-[#e2e8f0] text-slate-900" : "text-slate-300 hover:bg-[#334155]"
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`rounded-full px-1.5 text-[10px] ${tab === t.id ? "bg-blue-600 text-white" : "bg-blue-600 text-white"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button className="rounded border border-[#3a4658] px-2 py-1 text-[11px] text-slate-300 hover:bg-[#334155]">
            Filtre
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "open" && (
          <table className="min-w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-[#1e293b] text-[10px] uppercase text-slate-400">
              <tr>
                <th className="px-2 py-1.5">#</th>
                <th className="px-2 py-1.5">Oluşturulma Zamanı</th>
                <th className="px-2 py-1.5">Tür</th>
                <th className="px-2 py-1.5">Varlık</th>
                <th className="px-2 py-1.5">Hacim</th>
                <th className="px-2 py-1.5">Pip</th>
                <th className="px-2 py-1.5">Grev Oranı</th>
                <th className="px-2 py-1.5">Geçerli Oran</th>
                <th className="px-2 py-1.5">Stop Loss</th>
                <th className="px-2 py-1.5">Take Profit</th>
                <th className="px-2 py-1.5">Takas</th>
                <th className="px-2 py-1.5">Komisyon</th>
                <th className="px-2 py-1.5">Ticaret Komisyonu</th>
                <th className="px-2 py-1.5">Kar</th>
                <th className="px-2 py-1.5">Net Kar</th>
                <th className="px-2 py-1.5">Kapat</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-3 py-6 text-center text-slate-500">
                    Açık işlem yok
                  </td>
                </tr>
              )}
              {openPositions.map((p, i) => {
                const pip = calcPipDistance(p.symbol, p.openPrice, p.currentPrice) * (p.side === "BUY" ? 1 : -1);
                return (
                  <tr key={p.id} className="border-t border-[#2a3648] hover:bg-[#2a3648]/60">
                    <td className="px-2 py-1.5 text-slate-500">{i + 1}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{fmtDateTime(p.openedAt)}</td>
                    <td className={`px-2 py-1.5 font-semibold ${p.side === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                      {p.side === "BUY" ? "Alış" : "Satış"}
                    </td>
                    <td className="px-2 py-1.5 font-medium">{p.symbol}</td>
                    <td className="px-2 py-1.5 tabular-nums">{fmtNum(p.volume, 2)}</td>
                    <td className={`px-2 py-1.5 tabular-nums ${moneyCls(pip)}`}>{fmtNum(pip, 1)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{formatPrice(p.symbol, p.openPrice)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{formatPrice(p.symbol, p.currentPrice)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{p.stopLoss != null ? formatPrice(p.symbol, p.stopLoss) : "—"}</td>
                    <td className="px-2 py-1.5 tabular-nums">{p.takeProfit != null ? formatPrice(p.symbol, p.takeProfit) : "—"}</td>
                    <td className="px-2 py-1.5">0.00</td>
                    <td className="px-2 py-1.5">0.00</td>
                    <td className="px-2 py-1.5">0.00</td>
                    <td className={`px-2 py-1.5 tabular-nums font-medium ${moneyCls(p.profit)}`}>{fmtNum(p.profit, 2)}</td>
                    <td className={`px-2 py-1.5 tabular-nums font-medium ${moneyCls(p.profit)}`}>{fmtNum(p.profit, 2)}</td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => onClosePosition(p.id)}
                        className="rounded bg-red-600/80 px-2 py-0.5 text-[10px] font-semibold hover:bg-red-500"
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
            <thead className="sticky top-0 bg-[#1e293b] text-[10px] uppercase text-slate-400">
              <tr>
                <th className="px-2 py-1.5">#</th>
                <th className="px-2 py-1.5">Oluşturulma Zamanı</th>
                <th className="px-2 py-1.5">Tür</th>
                <th className="px-2 py-1.5">Varlık</th>
                <th className="px-2 py-1.5">Hacim</th>
                <th className="px-2 py-1.5">Grev Oranı</th>
                <th className="px-2 py-1.5">Kapanış</th>
                <th className="px-2 py-1.5">Stop Loss</th>
                <th className="px-2 py-1.5">Take Profit</th>
                <th className="px-2 py-1.5">Kar</th>
                <th className="px-2 py-1.5">Net Kar</th>
              </tr>
            </thead>
            <tbody>
              {closedPositions.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-6 text-center text-slate-500">
                    Kapatılmış pozisyon yok
                  </td>
                </tr>
              )}
              {closedPositions.map((p, i) => (
                <tr key={p.id} className="border-t border-[#2a3648]">
                  <td className="px-2 py-1.5 text-slate-500">{i + 1}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{fmtDateTime(p.openedAt)}</td>
                  <td className={`px-2 py-1.5 font-semibold ${p.side === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                    {p.side === "BUY" ? "Alış" : "Satış"}
                  </td>
                  <td className="px-2 py-1.5">{p.symbol}</td>
                  <td className="px-2 py-1.5 tabular-nums">{fmtNum(p.volume, 2)}</td>
                  <td className="px-2 py-1.5 tabular-nums">{formatPrice(p.symbol, p.openPrice)}</td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {p.closePrice != null ? formatPrice(p.symbol, p.closePrice) : "—"}
                  </td>
                  <td className="px-2 py-1.5">{p.stopLoss != null ? formatPrice(p.symbol, p.stopLoss) : "—"}</td>
                  <td className="px-2 py-1.5">{p.takeProfit != null ? formatPrice(p.symbol, p.takeProfit) : "—"}</td>
                  <td className={`px-2 py-1.5 tabular-nums ${moneyCls(p.closeProfit ?? p.profit)}`}>
                    {fmtNum(p.closeProfit ?? p.profit, 2)}
                  </td>
                  <td className={`px-2 py-1.5 tabular-nums ${moneyCls(p.closeProfit ?? p.profit)}`}>
                    {fmtNum(p.closeProfit ?? p.profit, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "pending" && (
          <table className="min-w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-[#1e293b] text-[10px] uppercase text-slate-400">
              <tr>
                <th className="px-2 py-1.5">#</th>
                <th className="px-2 py-1.5">Oluşturulma Zamanı</th>
                <th className="px-2 py-1.5">Tür</th>
                <th className="px-2 py-1.5">Emir</th>
                <th className="px-2 py-1.5">Varlık</th>
                <th className="px-2 py-1.5">Hacim</th>
                <th className="px-2 py-1.5">Fiyat</th>
                <th className="px-2 py-1.5">Stop Loss</th>
                <th className="px-2 py-1.5">Take Profit</th>
                <th className="px-2 py-1.5">İptal</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                    Bekleyen emir yok
                  </td>
                </tr>
              )}
              {pendingOrders.map((o, i) => (
                <tr key={o.id} className="border-t border-[#2a3648]">
                  <td className="px-2 py-1.5 text-slate-500">{i + 1}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{fmtDateTime(o.createdAt)}</td>
                  <td className={`px-2 py-1.5 font-semibold ${o.side === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                    {o.side === "BUY" ? "Alış" : "Satış"}
                  </td>
                  <td className="px-2 py-1.5">{o.type}</td>
                  <td className="px-2 py-1.5">{o.symbol}</td>
                  <td className="px-2 py-1.5 tabular-nums">{fmtNum(o.volume, 2)}</td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {o.price != null ? formatPrice(o.symbol, o.price) : "—"}
                  </td>
                  <td className="px-2 py-1.5">{o.stopLoss != null ? formatPrice(o.symbol, o.stopLoss) : "—"}</td>
                  <td className="px-2 py-1.5">{o.takeProfit != null ? formatPrice(o.symbol, o.takeProfit) : "—"}</td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => onCancelOrder(o.id)}
                      className="rounded bg-slate-600 px-2 py-0.5 text-[10px] hover:bg-slate-500"
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
