"use client";

import { useEffect, useRef, useState } from "react";

export type LiveQuote = { symbol: string; mid: number; changePct: number };
export type LiveState = {
  status: "loading" | "ok" | "error";
  quotes: Record<string, LiveQuote>;
  updatedAt: number | null;
};

/**
 * Polls the public /api/market/quote endpoint (same data the terminal uses).
 * Pauses while the tab is hidden; keeps the last good quotes on a failed refresh.
 */
export function useLivePrices(symbols: string[], intervalMs = 20000): LiveState {
  const [state, setState] = useState<LiveState>({ status: "loading", quotes: {}, updatedAt: null });
  const key = symbols.join(",");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function load() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        schedule();
        return;
      }
      try {
        const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(key)}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { prices?: LiveQuote[] };
        const quotes: Record<string, LiveQuote> = {};
        for (const p of data.prices ?? []) {
          if (p && Number.isFinite(p.mid)) quotes[p.symbol] = { symbol: p.symbol, mid: p.mid, changePct: p.changePct ?? 0 };
        }
        if (!alive) return;
        if (Object.keys(quotes).length === 0) throw new Error("empty");
        setState({ status: "ok", quotes, updatedAt: Date.now() });
      } catch {
        if (!alive) return;
        setState((prev) => (prev.status === "ok" ? prev : { ...prev, status: "error" }));
      }
      schedule();
    }

    function schedule() {
      if (!alive) return;
      timer.current = setTimeout(load, intervalMs);
    }

    void load();
    return () => {
      alive = false;
      ctrl.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key, intervalMs]);

  return state;
}
