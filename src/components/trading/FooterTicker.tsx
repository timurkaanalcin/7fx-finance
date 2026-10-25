"use client";

import { useLayoutEffect, useRef } from "react";
import { formatPrice } from "@/lib/symbols";
import type { PriceTick, SymbolDef } from "./types";
import SymbolIcon from "@/components/ui/SymbolIcon";
import MarketSessions from "./MarketSessions";
import { FeedDot, type FeedState } from "./FeedStatus";

type Props = {
  symbols: SymbolDef[];
  prices: Record<string, PriceTick>;
  onSelect: (symbol: string) => void;
  className?: string;
  feedState?: FeedState;
};

export default function FooterTicker({ symbols, prices, onSelect, className = "", feedState }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLDivElement>(null);
  // One logo per symbol. A short seam copy keeps the loop continuous
  // without mounting a second image for every symbol.
  const seam = symbols.slice(0, 16);
  useLayoutEffect(() => {
    const track = trackRef.current;
    const seq = seqRef.current;
    if (!track || !seq) return;
    const apply = () => {
      track.style.setProperty("--ticker-shift", `${seq.offsetWidth}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(seq);
    return () => observer.disconnect();
  }, [symbols]);

  const row = (list: SymbolDef[], hidden: boolean) =>
    list.map((s, idx) => {
      const p = prices[s.symbol];
      const up = (p?.change ?? 0) >= 0;
      return (
        <button
          key={`${s.symbol}-${idx}`}
          type="button"
          tabIndex={hidden ? -1 : undefined}
          onClick={() => onSelect(s.symbol)}
          className="mx-2.5 inline-flex items-center gap-1.5 text-[10px] text-desk-muted/80 transition-colors hover:text-desk-text"
        >
          <SymbolIcon symbol={s.symbol} fallback={s.flag || "•"} size={14} />
          <span className="font-medium text-desk-text/75">{s.symbol}</span>
          <span className={`tabular-nums ${up ? "text-desk-buy" : "text-desk-sell"}`}>
            {p ? formatPrice(s.symbol, p.mid) : "—"}
          </span>
          {p && (
            <span className={`tabular-nums ${up ? "text-desk-buy/70" : "text-desk-sell/70"}`}>
              {up ? "+" : ""}
              {p.changePct.toFixed(2)}%
            </span>
          )}
        </button>
      );
    });

  return (
    <footer
      className={`hidden h-7 shrink-0 items-center overflow-hidden border-t border-desk-border/80 bg-desk-panel/60 md:flex ${className}`}
    >
      {feedState && <FeedDot state={feedState} />}
      <MarketSessions className="relative z-[1] h-full bg-desk-panel" />
      <div className="min-w-0 flex-1 overflow-hidden">
        <div ref={trackRef} className="ticker-track flex whitespace-nowrap">
          <div ref={seqRef} className="ticker-seq">{row(symbols, false)}</div>
          <div className="ticker-seq" aria-hidden="true">{row(seam, true)}</div>
        </div>
      </div>
    </footer>
  );
}
