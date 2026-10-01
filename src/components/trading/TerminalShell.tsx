"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import TopBar from "./TopBar";
import Watchlist from "./Watchlist";
import OrderTicket from "./OrderTicket";
import BottomPanels from "./BottomPanels";
import FooterTicker from "./FooterTicker";
import ToolRail from "./ToolRail";
import DepositModal from "./DepositModal";
import MarginCallModal, { type BalanceRequestRow, STATUS_TR } from "./MarginCallModal";
import type {
  AccountMetrics,
  OrderRow,
  PositionRow,
  PriceTick,
  SymbolDef,
  UserInfo,
} from "./types";

const TradingChart = dynamic(() => import("./TradingChart"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-desk-bg text-[12px] text-desk-muted">
      Grafik yükleniyor…
    </div>
  ),
});

export default function TerminalShell() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [account, setAccount] = useState<AccountMetrics | null>(null);
  const [symbols, setSymbols] = useState<SymbolDef[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceTick>>({});
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState("1W");
  const [tab, setTab] = useState<"open" | "closed" | "pending">("open");
  const [mobileTab, setMobileTab] = useState<"markets" | "order" | "positions">("markets");
  const [openPositions, setOpenPositions] = useState<PositionRow[]>([]);
  const [closedPositions, setClosedPositions] = useState<PositionRow[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderRow[]>([]);
  const [ready, setReady] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [marginModalOpen, setMarginModalOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [pendingBalanceReq, setPendingBalanceReq] = useState<BalanceRequestRow | null>(null);
  const [balanceReqBanner, setBalanceReqBanner] = useState<BalanceRequestRow | null>(null);
  /** Once per margin-call episode: suppress re-open until call clears */
  const episodeShownRef = useRef(false);
  const wasInCallRef = useRef(false);

  const refreshBalanceRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/balance-requests", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const list: BalanceRequestRow[] = data.requests || [];
      const pending = list.find((r) => r.status === "PENDING") || null;
      setPendingBalanceReq(pending);
      const latest = list[0] || null;
      setBalanceReqBanner(latest && latest.status !== "APPROVED" ? latest : pending);
      if (latest?.status === "APPROVED") {
        setBalanceReqBanner(latest);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setUser(data.user);
    setAccount(data.account);
  }, [router]);

  const refreshPositions = useCallback(async () => {
    const [openRes, closedRes, ordersRes] = await Promise.all([
      fetch("/api/positions?status=OPEN", { credentials: "include" }),
      fetch("/api/positions?status=CLOSED", { credentials: "include" }),
      fetch("/api/orders", { credentials: "include" }),
    ]);
    if (openRes.ok) setOpenPositions(await openRes.json());
    if (closedRes.ok) setClosedPositions(await closedRes.json());
    if (ordersRes.ok) {
      const orders: OrderRow[] = await ordersRes.json();
      setPendingOrders(orders.filter((o) => o.status === "PENDING"));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshAccount(), refreshPositions(), refreshBalanceRequests()]);
  }, [refreshAccount, refreshPositions, refreshBalanceRequests]);

  useEffect(() => {
    async function boot() {
      const symRes = await fetch("/api/symbols");
      if (symRes.ok) setSymbols(await symRes.json());
      await refreshAll();
      setReady(true);
    }
    boot();
  }, [refreshAll]);

  // Watchlist batch (~3s) + active symbol fast path (≤1s) so forming candle tracks mid.
  useEffect(() => {
    let cancelled = false;
    async function pullBatch() {
      try {
        const res = await fetch("/api/market/quote");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok && !(data.prices || []).length) {
          setPriceError(data.error || "Fiyat alınamadı");
          return;
        }
        const map: Record<string, PriceTick> = {};
        for (const t of data.prices as PriceTick[]) map[t.symbol] = t;
        if (Object.keys(map).length) {
          setPrices((prev) => ({ ...prev, ...map }));
          setPriceError(data.error || null);
        } else if (data.error) {
          setPriceError(data.error);
        }
      } catch {
        if (!cancelled) setPriceError("Fiyat bağlantı hatası");
      }
    }
    pullBatch();
    const id = setInterval(pullBatch, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function pullActive() {
      try {
        const res = await fetch(
          `/api/market/quote?symbols=${encodeURIComponent(symbol)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (cancelled) return;
        const ticks = (data.prices || []) as PriceTick[];
        if (!ticks.length) return;
        const tick = { ...ticks[0], ts: Date.now() };
        setPrices((prev) => ({ ...prev, [tick.symbol]: tick }));
        if (data.error) setPriceError(data.error);
        else setPriceError(null);
      } catch {
        /* keep last good */
      }
    }
    pullActive();
    const id = setInterval(pullActive, 800);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  useEffect(() => {
    const id = setInterval(() => {
      refreshAll();
    }, 5000);
    return () => clearInterval(id);
  }, [refreshAll]);

  // Margin-call episode detection (once per episode)
  useEffect(() => {
    if (!account) return;
    const inCall = !!account.marginCall;
    if (inCall && !wasInCallRef.current) {
      episodeShownRef.current = false;
    }
    if (!inCall && wasInCallRef.current) {
      episodeShownRef.current = false;
      setMarginModalOpen(false);
    }
    wasInCallRef.current = inCall;

    if (inCall && !episodeShownRef.current) {
      episodeShownRef.current = true;
      setMarginModalOpen(true);
    }
  }, [account]);

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.assign("/login");
  }

  function openOrder(side: "BUY" | "SELL" = "BUY") {
    setOrderSide(side);
    setOrderOpen(true);
  }

  async function onClosePosition(id: string) {
    await fetch("/api/positions/close", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refreshAll();
  }

  async function onCancelOrder(id: string) {
    await fetch("/api/orders/cancel", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refreshAll();
  }

  if (!ready || !user) {
    return (
      <div className="fx-desk flex h-screen flex-col items-center justify-center gap-3 bg-desk-bg text-desk-muted">
        <div className="h-8 w-8 animate-pulse rounded-[8px] bg-desk-accent shadow-accent-glow-sm" />
        <span className="text-sm">Terminal yükleniyor…</span>
      </div>
    );
  }

  return (
    <div className="fx-desk flex h-screen flex-col overflow-hidden bg-desk-bg text-desk-text">
      <TopBar
        user={user}
        account={account}
        onDeposit={() => setDepositOpen(true)}
        onLogout={onLogout}
      />
      {priceError && (
        <div className="border-b border-desk-warn/30 bg-desk-warn/90 px-3 py-1.5 text-center text-[11px] font-medium text-black">
          Piyasa verisi uyarısı: {priceError} (son bilinen fiyatlar gösteriliyor)
        </div>
      )}
      {account?.marginCall && (
        <div className="flex items-center justify-center gap-3 border-b border-desk-sell/40 bg-desk-sell/90 px-3 py-1.5 text-center text-[11px] font-medium text-white">
          <span>Marjin çağrısı — özsermaye / marj seviyesi kritik</span>
          <button
            type="button"
            onClick={() => setMarginModalOpen(true)}
            className="rounded bg-white/20 px-2 py-0.5 hover:bg-white/30"
          >
            Seçenekler
          </button>
        </div>
      )}
      {balanceReqBanner && balanceReqBanner.status === "PENDING" && (
        <div className="bg-desk-warn/80 px-3 py-1 text-center text-[11px] font-medium text-black">
          Bakiye talebi {STATUS_TR[balanceReqBanner.status] || balanceReqBanner.status}:{" "}
          {balanceReqBanner.type === "RESET" ? "Bakiye Sıfırlama" : "Bakiye Ekle"}
          {balanceReqBanner.type === "ADD" && balanceReqBanner.amount != null
            ? ` (${balanceReqBanner.amount} USD)`
            : ""}{" "}
          — admin onayı bekleniyor
        </div>
      )}
      {balanceReqBanner && balanceReqBanner.status === "REJECTED" && account?.marginCall && (
        <div className="bg-desk-elev/90 px-3 py-1 text-center text-[11px] font-medium text-desk-text">
          Son bakiye talebi reddedildi — hesap değiştirilmedi. Tekrar seçenek seçebilirsiniz.
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => {
              episodeShownRef.current = false;
              setMarginModalOpen(true);
            }}
          >
            Aç
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* Desktop watchlist sidebar */}
        <div className="hidden h-full md:flex">
          <Watchlist
            symbols={symbols}
            prices={prices}
            selected={symbol}
            onSelect={setSymbol}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
          {/* Chart + history (desktop history sits under chart, flush with order ticket) */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {/* Chart fills main area; bottom history is fixed height (pre-elite proportions) */}
            <div className="relative flex min-h-[44vh] flex-1 md:min-h-0">
              {/* Chart canvas wrapper: İŞLEM overlays bottom-right ON the chart */}
              <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
                <TradingChart
                  symbol={symbol}
                  timeframe={timeframe}
                  onTimeframe={setTimeframe}
                  price={prices[symbol]}
                />
                <div className="pointer-events-none absolute bottom-[calc(0.75rem+2cm)] right-[calc(0.75rem+3.5cm)] z-20 md:bottom-[calc(1rem+2cm)] md:right-[calc(1rem+3.5cm)]">
                  <button
                    type="button"
                    onClick={() => openOrder("BUY")}
                    aria-label="İşlem emri aç"
                    className="pointer-events-auto rounded-full bg-desk-accent px-7 py-2.5 text-[13px] font-bold tracking-[0.14em] text-desk-accent-ink shadow-accent-glow-sm transition hover:brightness-110 active:scale-[0.98] md:px-9 md:py-3 md:text-sm"
                  >
                    İŞLEM
                  </button>
                </div>
              </div>
              <ToolRail />
            </div>

            {/* Desktop bottom panels — fixed height so chart keeps prior larger share */}
            <div className="hidden md:flex md:h-[220px] md:shrink-0 md:flex-col">
              <BottomPanels
                tab={tab}
                onTab={setTab}
                openPositions={openPositions}
                closedPositions={closedPositions}
                pendingOrders={pendingOrders}
                onClosePosition={onClosePosition}
                onCancelOrder={onCancelOrder}
              />
            </div>

            {/* Mobile tab panel */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-desk-border/70 bg-desk-panel md:hidden">
            {mobileTab === "markets" && (
              <Watchlist
                className="h-full border-r-0"
                symbols={symbols}
                prices={prices}
                selected={symbol}
                onSelect={(s) => {
                  setSymbol(s);
                  setMobileTab("order");
                  openOrder("BUY");
                }}
              />
            )}
            {mobileTab === "order" && (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-desk-panel px-6 text-center">
                <p className="text-sm text-desk-muted">Emir vermek için İŞLEM butonuna dokunun.</p>
                <button
                  type="button"
                  onClick={() => openOrder("BUY")}
                  className="rounded-full bg-desk-accent px-8 py-3 text-sm font-bold tracking-[0.12em] text-desk-accent-ink shadow-accent-glow-sm"
                >
                  İŞLEM
                </button>
              </div>
            )}
            {mobileTab === "positions" && (
              <BottomPanels
                className="h-full border-t-0"
                tab={tab}
                onTab={setTab}
                openPositions={openPositions}
                closedPositions={closedPositions}
                pendingOrders={pendingOrders}
                onClosePosition={onClosePosition}
                onCancelOrder={onCancelOrder}
              />
            )}
            </div>
          </div>

          {/* Right Al/Sat panel removed — orders via İŞLEM modal */}
        </div>
      </div>

      {/* Mobile bottom tab bar — elite segmented control + safe-area */}
      <nav className="fx-desk-mobile-nav shrink-0 border-t border-desk-border/80 bg-desk-panel/95 px-3 pt-2 md:hidden">
        <div className="fx-desk-seg">
          {(
            [
              { id: "markets" as const, label: "Piyasalar" },
              { id: "order" as const, label: "Emir" },
              { id: "positions" as const, label: "Pozisyonlar" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMobileTab(t.id);
                if (t.id === "order") openOrder("BUY");
              }}
              className={`fx-desk-seg__btn ${
                mobileTab === t.id ? "fx-desk-seg__btn--active" : ""
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <FooterTicker symbols={symbols} prices={prices} onSelect={setSymbol} />
      {orderOpen && (
        <OrderTicket
          modal
          symbol={symbol}
          symbols={symbols}
          price={prices[symbol]}
          initialSide={orderSide}
          onPlaced={refreshAll}
          onClose={() => setOrderOpen(false)}
        />
      )}
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSubmitted={() => refreshAll()}
      />
      <MarginCallModal
        open={marginModalOpen}
        equity={account?.equity ?? 0}
        marginLevel={account?.marginLevel ?? 0}
        pendingRequest={pendingBalanceReq}
        onClose={() => setMarginModalOpen(false)}
        onSubmitted={(req) => {
          setPendingBalanceReq(req.status === "PENDING" ? req : null);
          setBalanceReqBanner(req);
          setMarginModalOpen(req.status === "PENDING" ? false : true);
          refreshAll();
        }}
      />
    </div>
  );
}
