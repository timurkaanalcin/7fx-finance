"use client";

import PriceAlerts from "./PriceAlerts";
import { useCallback, useEffect, useRef, useState } from "react";

const TERM_PREFS_KEY = "7fx_term_prefs_v1";
type TermPrefs = { symbol?: string; timeframe?: string; tab?: "open" | "closed" | "pending" };
function readTermPrefs(): TermPrefs {
  try {
    const v = JSON.parse(localStorage.getItem(TERM_PREFS_KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
function writeTermPrefs(patch: TermPrefs) {
  try {
    const next = { ...readTermPrefs(), ...patch };
    localStorage.setItem(TERM_PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import TopBar from "./TopBar";
import Watchlist from "./Watchlist";
import OrderTicket from "./OrderTicket";
import BottomPanels from "./BottomPanels";
import FooterTicker from "./FooterTicker";
import ToolRail from "./ToolRail";
import DepositModal from "./DepositModal";
import MarginCallModal, { type BalanceRequestRow } from "./MarginCallModal";
import ForcePasswordModal from "./ForcePasswordModal";
import ShortcutsHelp from "./ShortcutsHelp";
import { useI18n } from "@/lib/i18n/context";
import BrandLoader from "@/components/ui/BrandLoader";
import { normalizeLocale } from "@/lib/i18n/locales";
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
  loading: () => <BrandLoader variant="inline" className="flex min-h-0 flex-1" />,
});

export default function TerminalShell() {
  const router = useRouter();
  const { t, setLocale, locale } = useI18n();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [account, setAccount] = useState<AccountMetrics | null>(null);
  const [symbols, setSymbols] = useState<SymbolDef[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceTick>>({});
  const [symbol, setSymbol] = useState(() => {
    if (typeof window === "undefined") return "AAPL";
    const s = readTermPrefs().symbol;
    return typeof s === "string" && s.trim() ? s.trim() : "AAPL";
  });
  const [timeframe, setTimeframe] = useState(() => {
    if (typeof window === "undefined") return "1W";
    const tf = readTermPrefs().timeframe;
    const allowed = new Set(["1m", "5m", "15m", "1h", "4h", "1D", "1W"]);
    return typeof tf === "string" && allowed.has(tf) ? tf : "1W";
  });
  const [tab, setTab] = useState<"open" | "closed" | "pending">(() => {
    if (typeof window === "undefined") return "open";
    const t = readTermPrefs().tab;
    return t === "open" || t === "closed" || t === "pending" ? t : "open";
  });
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [pendingBalanceReq, setPendingBalanceReq] = useState<BalanceRequestRow | null>(null);
  const [balanceReqBanner, setBalanceReqBanner] = useState<BalanceRequestRow | null>(null);
  /** Once per margin-call episode: suppress re-open until call clears */
  const episodeShownRef = useRef(false);
  const wasInCallRef = useRef(false);

  // Keep margin-call / terminal UI in profile language (fx_lang EN|TR|RU|DE|AR)
  useEffect(() => {
    const lang = user?.language;
    if (!lang) return;
    const next = normalizeLocale(lang, "public");
    if (next !== locale) setLocale(next);
  }, [user?.language, locale, setLocale]);

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
    const data = await res.json().catch(() => ({}));
    if (res.status === 403 && data.code === "LOGIN_DISABLED") {
      try {
        sessionStorage.setItem("7fx_login_block_msg", String(data.message || ""));
      } catch {
        /* ignore */
      }
      router.push("/login?loginBlocked=1");
      return;
    }
    if (res.status === 401) {
      router.push("/login");
      return;
    }
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
      if (symRes.ok) {
        const list: SymbolDef[] = await symRes.json();
        setSymbols(list);
        setSymbol((prev) => {
          if (list.some((s) => s.symbol === prev)) return prev;
          const saved = readTermPrefs().symbol;
          if (typeof saved === "string" && list.some((s) => s.symbol === saved)) return saved;
          return list[0]?.symbol || prev || "AAPL";
        });
      }
      await refreshAll();
      setReady(true);
    }
    boot();
  }, [refreshAll]);

  useEffect(() => {
    writeTermPrefs({ symbol, timeframe, tab });
  }, [symbol, timeframe, tab]);

  // Watchlist batch (~3s) + active symbol fast path (≤1s) so forming candle tracks mid.
  useEffect(() => {
    let cancelled = false;
    async function pullBatch() {
      try {
        const res = await fetch("/api/market/quote");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok && !(data.prices || []).length) {
          setPriceError(data.error || "Could not fetch price");
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
        if (!cancelled) setPriceError("Price connection error");
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
    const inCall = !!account.marginCall && Number(account.margin) > 0;
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
    if (user && user.tradingEnabled === false) return;
    if (user && user.mustChangePassword) return;
    setOrderSide(side);
    setOrderOpen(true);
  }

  // Keyboard shortcuts (desktop): B/S order, / search, 1-3 tabs, ? help, Esc closes help.
  const kbRef = useRef({ orderOpen, depositOpen, marginModalOpen, helpOpen, user });
  kbRef.current = { orderOpen, depositOpen, marginModalOpen, helpOpen, user };
  const openOrderRef = useRef(openOrder);
  openOrderRef.current = openOrder;
  useEffect(() => {
    function isTyping(el: EventTarget | null) {
      const n = el as HTMLElement | null;
      if (!n || !n.tagName) return false;
      const tag = n.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (n.isContentEditable) return true;
      return !!n.closest?.("[contenteditable='true'],[contenteditable='']");
    }
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTyping(e.target) || isTyping(document.activeElement)) return;
      const st = kbRef.current;
      if (st.helpOpen) {
        if (e.key === "Escape" || e.key === "?") {
          e.preventDefault();
          setHelpOpen(false);
        }
        return;
      }
      // Other modals own the keyboard while open
      if (st.orderOpen || st.depositOpen || st.marginModalOpen) return;
      if (st.user?.mustChangePassword) return;
      switch (e.key) {
        case "?":
          e.preventDefault();
          setHelpOpen(true);
          return;
        case "b":
        case "B":
          e.preventDefault();
          openOrderRef.current("BUY");
          return;
        case "s":
        case "S":
          e.preventDefault();
          openOrderRef.current("SELL");
          return;
        case "/": {
          const inputs = Array.from(
            document.querySelectorAll<HTMLInputElement>("input[data-fx-watchlist-search]")
          );
          const el = inputs.find((i) => i.offsetParent !== null) || null;
          if (el) {
            e.preventDefault();
            el.focus();
            el.select();
          }
          return;
        }
        case "1":
          setTab("open");
          return;
        case "2":
          setTab("closed");
          return;
        case "3":
          setTab("pending");
          return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onClosePosition(id: string) {
    await fetch("/api/positions/close", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refreshAll();
  }

  async function onClosePositions(ids: string[]) {
    for (const id of ids) {
      try {
        await fetch("/api/positions/close", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch {
        /* continue remaining */
      }
    }
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

  async function onCancelOrders(ids: string[]) {
    for (const id of ids) {
      try {
        await fetch("/api/orders/cancel", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch {
        /* continue remaining */
      }
    }
    await refreshAll();
  }

  if (!ready || !user) {
    return <BrandLoader variant="desk" label={t("common.loading") || "Loading…"} />;
  }

  return (
    <div className="fx-desk flex h-screen h-[100dvh] flex-col overflow-hidden bg-desk-bg text-desk-text">
      <TopBar
        user={user}
        account={account}
        onDeposit={() => setDepositOpen(true)}
        onLogout={onLogout}
      />
      {user.impersonatedBy && (
        <div className="flex items-center justify-center gap-3 border-b border-sky-500/40 bg-sky-600/90 px-3 py-1.5 text-center text-[11px] font-medium text-white">
          <span>
            Viewing terminal as <strong>{user.name}</strong> ({user.email}) — admin impersonation
          </span>
          <button
            type="button"
            className="rounded bg-white/20 px-2 py-0.5 hover:bg-white/30"
            onClick={async () => {
              const res = await fetch("/api/admin/impersonate", { method: "DELETE" });
              const data = await res.json().catch(() => ({}));
              if (res.ok) window.location.href = data.redirect || "/izcrm";
              else alert(data.error || "Could not exit impersonation");
            }}
          >
            Back to admin
          </button>
        </div>
      )}
      {user.tradingEnabled === false && (
        <div className="border-b border-desk-sell/40 bg-desk-sell/90 px-3 py-1.5 text-center text-[11px] font-medium text-white">
          {t("term.tradingDisabledBanner")}
        </div>
      )}
      {priceError && (
        <div className="border-b border-desk-warn/30 bg-desk-warn/90 px-3 py-1.5 text-center text-[11px] font-medium text-black">
          Market data warning: {priceError} (showing last known prices)
        </div>
      )}
      {account?.marginCall && Number(account?.margin) > 0 && (
        <div className="flex items-center justify-center gap-3 border-b border-desk-sell/40 bg-desk-sell/90 px-3 py-1.5 text-center text-[11px] font-medium text-white">
          <span>{t("terminal.mc.banner")}</span>
          <button
            type="button"
            onClick={() => setMarginModalOpen(true)}
            className="rounded bg-white/20 px-2 py-0.5 hover:bg-white/30"
          >
            {t("terminal.mc.bannerAction")}
          </button>
        </div>
      )}
      {balanceReqBanner && balanceReqBanner.status === "PENDING" && (
        <div className="bg-desk-warn/80 px-3 py-1 text-center text-[11px] font-medium text-black">
          {t("terminal.mc.pendingBanner")}
          {balanceReqBanner.amount != null ? ` (${balanceReqBanner.amount} ${account?.currency || "USD"})` : ""}
        </div>
      )}
      {balanceReqBanner && balanceReqBanner.status === "REJECTED" && account?.marginCall && Number(account?.margin) > 0 && (
        <div className="bg-desk-elev/90 px-3 py-1 text-center text-[11px] font-medium text-desk-text">
          {t("terminal.mc.rejectedBanner")}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => {
              episodeShownRef.current = false;
              setMarginModalOpen(true);
            }}
          >
            {t("terminal.mc.bannerOpen")}
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
              {/* Chart canvas wrapper: TRADE overlays bottom-right ON the chart */}
              <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
                <TradingChart
                  symbol={symbol}
                  timeframe={timeframe}
                  onTimeframe={setTimeframe}
                  price={prices[symbol]}
                />
                <PriceAlerts symbol={symbol} prices={prices} />
                <div className="pointer-events-none absolute bottom-[calc(0.75rem+0.50cm)] right-[1.85cm] z-20 hidden md:block md:bottom-[calc(1rem+0.50cm)] md:right-[1.85cm]">
                  <button
                    type="button"
                    onClick={() => openOrder("BUY")}
                    disabled={user.tradingEnabled === false || !!user.mustChangePassword}
                    aria-label="Open trade order"
                    className="pointer-events-auto min-h-[22px] min-w-[52px] rounded-full bg-desk-accent px-3.5 py-[5px] text-[10px] font-bold tracking-[0.12em] text-desk-accent-ink shadow-accent-glow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 md:min-h-[26px] md:min-w-[60px] md:px-[18px] md:py-1.5 md:text-[11px]"
                  >
                    TRADE
                  </button>
                </div>
              </div>
              <ToolRail onHelp={() => setHelpOpen(true)} helpLabel={t("term.kb.button")} />
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
                onClosePositions={onClosePositions}
                onCancelOrder={onCancelOrder}
                onCancelOrders={onCancelOrders}
                onSelectSymbol={setSymbol}
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
                <p className="text-sm text-desk-muted">Tap TRADE to place an order.</p>
                <button
                  type="button"
                  onClick={() => openOrder("BUY")}
                  disabled={user.tradingEnabled === false || !!user.mustChangePassword}
                  className="min-h-[26px] min-w-[60px] rounded-full bg-desk-accent px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-desk-accent-ink shadow-accent-glow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  TRADE
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
                onClosePositions={onClosePositions}
                onCancelOrder={onCancelOrder}
                onCancelOrders={onCancelOrders}
                onSelectSymbol={setSymbol}
              />
            )}
            </div>
          </div>

          {/* Right Al/Sat panel removed — orders via TRADE modal */}
        </div>
      </div>

      {/* Mobile sticky trade bar */}
      <div className="fx-desk-tradebar shrink-0 border-t border-desk-border/80 bg-desk-panel md:hidden">
        <button
          type="button"
          onClick={() => openOrder("SELL")}
          disabled={user.tradingEnabled === false || !!user.mustChangePassword}
          className="bg-desk-sell text-white disabled:opacity-40"
        >
          SELL
        </button>
        <button
          type="button"
          onClick={() => openOrder("BUY")}
          disabled={user.tradingEnabled === false || !!user.mustChangePassword}
          className="bg-desk-buy text-white disabled:opacity-40"
        >
          BUY
        </button>
      </div>
      {/* Mobile bottom tab bar — elite segmented control + safe-area */}
      <nav className="fx-desk-mobile-nav shrink-0 bg-desk-panel px-3 pt-2 md:hidden">
        <div className="fx-desk-seg">
          {(
            [
              { id: "markets" as const, label: "Markets" },
              { id: "order" as const, label: "Order" },
              { id: "positions" as const, label: "Positions" },
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
          <a href="/profile" className="fx-desk-seg__btn flex items-center justify-center">
            Account
          </a>
        </div>
      </nav>

      <FooterTicker symbols={symbols} prices={prices} onSelect={setSymbol} />
      {user.mustChangePassword && !user.impersonatedBy && (
        <ForcePasswordModal onDone={() => void refreshAll()} />
      )}
      {orderOpen && (
        <OrderTicket
          modal
          symbol={symbol}
          symbols={symbols}
          price={prices[symbol]}
          initialSide={orderSide}
          equity={account?.equity}
          currency={account?.currency || "USD"}
          onPlaced={refreshAll}
          onClose={() => setOrderOpen(false)}
        />
      )}
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSubmitted={() => refreshAll()}
      />
      <MarginCallModal
        open={marginModalOpen}
        equity={account?.equity ?? 0}
        marginLevel={account?.marginLevel ?? 0}
        currency={account?.currency || "USD"}
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
