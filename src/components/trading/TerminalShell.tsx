"use client";

import type { BalanceRequestRow } from "./MarginCallModal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TERM_PREFS_KEY = "7fx_term_prefs_v1";
type TermPrefs = { symbol?: string; timeframe?: string; tab?: "open" | "closed" | "pending" };
/** Chart timeframes in UI order (used by restore + [ / ] keyboard shortcuts). */
const CHART_TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D", "1W"] as const;
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

type TradeActionResult = { ok: true } | { ok: false; error: string };

async function postTrade(
  url: string,
  body: unknown,
  fallback: string,
  t: (key: string) => string
): Promise<TradeActionResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    const raw =
      data && typeof data.error === "string" && data.error.trim() ? data.error.trim() : fallback;
    return { ok: false, error: localizeTradeError(raw, t) };
  } catch {
    return { ok: false, error: fallback };
  }
}

function pageHidden(): boolean {
  return typeof document !== "undefined" && document.hidden;
}

type ClosedPayload = {
  positions: PositionRow[];
  hasMore: boolean;
  nextSkip: number;
  calendar: PositionRow[] | null;
  calendarHasMore: boolean;
  calendarNextSkip: number;
};

function asClosedRow(row: PositionRow): PositionRow {
  return {
    id: row.id,
    symbol: row.symbol,
    chartSymbol: row.chartSymbol ?? null,
    side: row.side,
    volume: Number(row.volume) || 0,
    openPrice: Number(row.openPrice) || 0,
    currentPrice: Number(row.currentPrice) || Number(row.closePrice) || 0,
    stopLoss: row.stopLoss ?? null,
    takeProfit: row.takeProfit ?? null,
    profit: Number(row.profit) || 0,
    margin: Number(row.margin) || 0,
    status: row.status || "CLOSED",
    openedAt: row.openedAt,
    closedAt: row.closedAt ?? null,
    closePrice: row.closePrice ?? null,
    closeProfit: row.closeProfit ?? null,
  };
}

function parseClosedPayload(data: unknown): ClosedPayload {
  if (Array.isArray(data)) {
    const positions = (data as PositionRow[]).map(asClosedRow);
    return { positions, hasMore: false, nextSkip: positions.length, calendar: null, calendarHasMore: false, calendarNextSkip: 0 };
  }
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const positions = Array.isArray(body.positions) ? (body.positions as PositionRow[]).map(asClosedRow) : [];
  const calendar = Array.isArray(body.calendar) ? (body.calendar as PositionRow[]).map(asClosedRow) : null;
  return {
    positions,
    hasMore: Boolean(body.hasMore),
    nextSkip: typeof body.nextSkip === "number" ? body.nextSkip : positions.length,
    calendar,
    calendarHasMore: Boolean(body.calendarHasMore),
    calendarNextSkip: typeof body.calendarNextSkip === "number" ? body.calendarNextSkip : 0,
  };
}

type OpenPayload = {
  positions: PositionRow[];
  account: AccountMetrics | null;
  hasMore: boolean;
  nextSkip: number;
};

function parseOpenPayload(data: unknown): OpenPayload | null {
  if (Array.isArray(data)) {
    return {
      positions: data as PositionRow[],
      account: null,
      hasMore: false,
      nextSkip: data.length,
    };
  }
  if (!data || typeof data !== "object") return null;
  const body = data as Record<string, unknown>;
  if (!Array.isArray(body.positions)) return null;
  const positions = body.positions as PositionRow[];
  const account =
    body.account && typeof body.account === "object" ? (body.account as AccountMetrics) : null;
  return {
    positions,
    account,
    hasMore: Boolean(body.hasMore),
    nextSkip: typeof body.nextSkip === "number" ? body.nextSkip : positions.length,
  };
}

function mergeClosed(prev: PositionRow[], page: PositionRow[]): PositionRow[] {
  const map = new Map<string, PositionRow>();
  for (const p of prev) map.set(p.id, p);
  for (const p of page) map.set(p.id, p);
  return Array.from(map.values()).sort((a, b) => {
    const ta = new Date(a.closedAt ?? a.openedAt).getTime() || 0;
    const tb = new Date(b.closedAt ?? b.openedAt).getTime() || 0;
    if (tb !== ta) return tb - ta;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import TopBar from "./TopBar";
import FooterTicker from "./FooterTicker";
import ToolRail from "./ToolRail";
import { FeedBanner, FeedRecoveredToast, useFeedHealth } from "./FeedStatus";
import { useI18n } from "@/lib/i18n/context";
import { localizeTradeError } from "@/lib/trade-errors";
import { displayAccountChips, displayBookDelta } from "@/lib/display-profit";
import { positionMark } from "@/lib/mark-price";
import { CALENDAR_FOLLOW_CAP, concatUniqueById } from "@/lib/position-pages";
import { formatPrice, getSymbol } from "@/lib/symbols";
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
const Watchlist = dynamic(() => import("./Watchlist"));
const BottomPanels = dynamic(() => import("./BottomPanels"));
const OrderTicket = dynamic(() => import("./OrderTicket"));
const DepositModal = dynamic(() => import("./DepositModal"));
const MarginCallModal = dynamic(() => import("./MarginCallModal"));
const ForcePasswordModal = dynamic(() => import("./ForcePasswordModal"));
const ShortcutsHelp = dynamic(() => import("./ShortcutsHelp"));
const TradingCalculator = dynamic(() => import("./TradingCalculator"));
const PriceAlerts = dynamic(() => import("./PriceAlerts"));

export default function TerminalShell({
  initialUser = null,
  initialAccount = null,
}: {
  initialUser?: UserInfo | null;
  initialAccount?: AccountMetrics | null;
}) {
  const router = useRouter();
  const { t, setLocale, locale } = useI18n();
  const [user, setUser] = useState<UserInfo | null>(initialUser);
  const [account, setAccount] = useState<AccountMetrics | null>(initialAccount);
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
    const allowed = new Set<string>(CHART_TIMEFRAMES);
    return typeof tf === "string" && allowed.has(tf) ? tf : "1W";
  });
  const [tab, setTab] = useState<"open" | "closed" | "pending">(() => {
    if (typeof window === "undefined") return "open";
    const t = readTermPrefs().tab;
    return t === "open" || t === "closed" || t === "pending" ? t : "open";
  });
  const [mobileTab, setMobileTab] = useState<"chart" | "markets" | "positions">("chart");
  const [symbolsError, setSymbolsError] = useState(false);
  const [positionsError, setPositionsError] = useState(false);
  const [bootNonce, setBootNonce] = useState(0);
  const [openPositions, setOpenPositions] = useState<PositionRow[]>([]);
  const [openHasMore, setOpenHasMore] = useState(false);
  const [openLoading, setOpenLoading] = useState(false);
  const [closedPositions, setClosedPositions] = useState<PositionRow[]>([]);
  const [closedCalendar, setClosedCalendar] = useState<PositionRow[]>([]);
  const [calendarPartial, setCalendarPartial] = useState(false);
  const [closedHasMore, setClosedHasMore] = useState(false);
  const [closedLoading, setClosedLoading] = useState(false);
  const closedSkipRef = useRef(0);
  const closedHasMoreRef = useRef(false);
  const closedBusyRef = useRef(false);
  closedHasMoreRef.current = closedHasMore;
  const [pendingOrders, setPendingOrders] = useState<OrderRow[]>([]);
  const [ready, setReady] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [marginModalOpen, setMarginModalOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderPrefill, setOrderPrefill] = useState<
    { volume: string; side: "BUY" | "SELL"; nonce: number } | null
  >(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [pendingBalanceReq, setPendingBalanceReq] = useState<BalanceRequestRow | null>(null);
  const [balanceReqBanner, setBalanceReqBanner] = useState<BalanceRequestRow | null>(null);
  /** Once per margin-call episode: suppress re-open until call clears */
  const episodeShownRef = useRef(false);
  const wasInCallRef = useRef(false);
  /** Price-feed health: re-pull hook registered by the quote effect below. */
  const pullQuotesRef = useRef<() => void>(() => {});
  const mobileTabRef = useRef(mobileTab);
  mobileTabRef.current = mobileTab;
  const openPositionsRef = useRef(openPositions);
  openPositionsRef.current = openPositions;
  const openExpandedRef = useRef(false);
  const openHasMoreRef = useRef(false);
  openHasMoreRef.current = openHasMore;
  const openQueuedRef = useRef(0);
  const openQueueRef = useRef(Promise.resolve());
  const closedCountRef = useRef(0);
  closedCountRef.current = closedPositions.length;
  const pendingOrdersRef = useRef(pendingOrders);
  pendingOrdersRef.current = pendingOrders;
  const bookAtRef = useRef(0);
  const feed = useFeedHealth(() => {
    pullQuotesRef.current();
  });
  const markFeedOk = feed.markOk;

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
      const pending = (data.pending as BalanceRequestRow | null) || list.find((r) => r.status === "PENDING") || null;
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

  const posErrRef = useRef({ open: false, history: false });
  const publishPosErr = useCallback((part: "open" | "history", failed: boolean) => {
    posErrRef.current[part] = failed;
    const next = posErrRef.current.open || posErrRef.current.history;
    setPositionsError((prev) => (prev === next ? prev : next));
  }, []);

  const fetchOpenPage = useCallback(async (skip: number): Promise<OpenPayload | "auth" | null> => {
    const openRes = await fetch(`/api/positions?status=OPEN&skip=${skip}`, { credentials: "include" });
    if (openRes.status === 401) return "auth";
    if (!openRes.ok) return null;
    return parseOpenPayload(await openRes.json());
  }, []);

  const enqueueOpen = useCallback((task: () => Promise<void>, dropIfBusy = false) => {
    if (dropIfBusy && openQueuedRef.current > 0) return Promise.resolve();
    openQueuedRef.current += 1;
    const run = openQueueRef.current.then(async () => {
      try {
        await task();
      } finally {
        openQueuedRef.current -= 1;
      }
    });
    openQueueRef.current = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }, []);

  const refreshOpenPositions = useCallback(async () => {
    await enqueueOpen(async () => {
      try {
        const first = await fetchOpenPage(0);
        if (first === "auth") {
          router.push("/login");
          return;
        }
        if (!first) {
          publishPosErr("open", true);
          return;
        }
        const pages: PositionRow[][] = [first.positions];
        let hasMore = first.hasMore;
        let skip = first.nextSkip;
        if (openExpandedRef.current && hasMore) {
          const target = Math.max(openPositionsRef.current.length, first.positions.length);
          while (hasMore && pages.reduce((n, page) => n + page.length, 0) < target) {
            const page = await fetchOpenPage(skip);
            if (page === "auth") {
              router.push("/login");
              return;
            }
            if (!page || page.positions.length === 0) break;
            pages.push(page.positions);
            skip = page.nextSkip;
            hasMore = page.hasMore;
          }
        }
        setOpenPositions(concatUniqueById(pages));
        setOpenHasMore(hasMore);
        if (first.account) setAccount(first.account);
        publishPosErr("open", false);
      } catch {
        publishPosErr("open", true);
      }
    }, true);
  }, [enqueueOpen, fetchOpenPage, publishPosErr, router]);

  const loadMoreOpen = useCallback(async () => {
    if (!openHasMoreRef.current) return;
    await enqueueOpen(async () => {
      if (!openHasMoreRef.current) return;
      openExpandedRef.current = true;
      setOpenLoading(true);
      try {
        const page = await fetchOpenPage(openPositionsRef.current.length);
        if (page === "auth") {
          router.push("/login");
          return;
        }
        if (!page) {
          publishPosErr("open", true);
          return;
        }
        setOpenPositions((prev) => concatUniqueById([prev, page.positions]));
        setOpenHasMore(page.hasMore);
        publishPosErr("open", false);
      } catch {
        publishPosErr("open", true);
      } finally {
        setOpenLoading(false);
      }
    });
  }, [enqueueOpen, fetchOpenPage, publishPosErr, router]);

  const applyClosedPage = useCallback((parsed: ClosedPayload, mode: "refresh" | "append") => {
    setClosedPositions((prev) => mergeClosed(prev, parsed.positions));
    if (parsed.calendar) {
      setClosedCalendar((prev) => (mode === "append" ? mergeClosed(prev, parsed.calendar || []) : parsed.calendar || []));
    } else if (mode === "refresh") {
      setClosedCalendar((prev) => (prev.length ? mergeClosed(prev, parsed.positions) : prev));
    }
    if (mode === "append" || closedSkipRef.current <= parsed.nextSkip) {
      closedSkipRef.current = parsed.nextSkip;
      setClosedHasMore(parsed.hasMore);
    }
  }, []);

  const refreshHistory = useCallback(async (withCalendar = true) => {
    try {
      const tz = new Date().getTimezoneOffset();
      const calendar = withCalendar ? "1" : "0";
      const loaded = withCalendar ? "" : `&loaded=${Math.max(0, closedCountRef.current)}`;
      const [closedRes, ordersRes] = await Promise.all([
        fetch(`/api/positions?status=CLOSED&skip=0&tzOffset=${tz}&calendar=${calendar}${loaded}`, { credentials: "include" }),
        fetch("/api/orders?status=PENDING", { credentials: "include" }),
      ]);
      if (closedRes.status === 401 || ordersRes.status === 401) {
        router.push("/login");
        return;
      }
      if (!closedRes.ok || !ordersRes.ok) {
        publishPosErr("history", true);
        return;
      }
      const firstClosed = parseClosedPayload(await closedRes.json());
      applyClosedPage(firstClosed, "refresh");
      if (withCalendar) {
        let partial = Boolean(firstClosed.calendarHasMore);
        if (partial) {
          let calendarSkip = firstClosed.calendarNextSkip;
          for (let page = 0; page < CALENDAR_FOLLOW_CAP; page++) {
            const moreRes = await fetch(
              `/api/positions?status=CLOSED&skip=0&tzOffset=${tz}&calendar=1&calendarSkip=${calendarSkip}`,
              { credentials: "include" }
            );
            if (!moreRes.ok) break;
            const more = parseClosedPayload(await moreRes.json());
            if (more.calendar) setClosedCalendar((prev) => mergeClosed(prev, more.calendar || []));
            if (!more.calendarHasMore || more.calendarNextSkip <= calendarSkip) {
              partial = false;
              break;
            }
            calendarSkip = more.calendarNextSkip;
          }
        }
        setCalendarPartial(partial);
      }
      const orders: OrderRow[] = await ordersRes.json();
      setPendingOrders(Array.isArray(orders) ? orders.filter((o) => o.status === "PENDING") : []);
      publishPosErr("history", false);
    } catch {
      publishPosErr("history", true);
    }
  }, [applyClosedPage, publishPosErr, router]);

  const loadMoreClosed = useCallback(async () => {
    if (!closedHasMoreRef.current || closedBusyRef.current) return;
    closedBusyRef.current = true;
    setClosedLoading(true);
    try {
      const tz = new Date().getTimezoneOffset();
      const res = await fetch(
        `/api/positions?status=CLOSED&skip=${closedSkipRef.current}&tzOffset=${tz}`,
        { credentials: "include" }
      );
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        publishPosErr("history", true);
        return;
      }
      applyClosedPage(parseClosedPayload(await res.json()), "append");
      publishPosErr("history", false);
    } catch {
      publishPosErr("history", true);
    } finally {
      closedBusyRef.current = false;
      setClosedLoading(false);
    }
  }, [applyClosedPage, publishPosErr, router]);

  const loadClosedDay = useCallback(async (day: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    try {
      const tz = new Date().getTimezoneOffset();
      let skip = 0;
      for (let page = 0; page < 20; page++) {
        const res = await fetch(
          `/api/positions?status=CLOSED&day=${day}&tzOffset=${tz}&skip=${skip}`,
          { credentials: "include" }
        );
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) return;
        const parsed = parseClosedPayload(await res.json());
        setClosedPositions((prev) => mergeClosed(prev, parsed.positions));
        if (!parsed.hasMore || parsed.nextSkip <= skip) return;
        skip = parsed.nextSkip;
      }
    } catch {
      /* keep the rows already loaded */
    }
  }, [router]);

  const refreshPositions = useCallback(async () => {
    await Promise.all([refreshOpenPositions(), refreshHistory()]);
  }, [refreshOpenPositions, refreshHistory]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshAccount(),
      refreshOpenPositions(),
      refreshHistory(),
      refreshBalanceRequests(),
    ]);
  }, [refreshAccount, refreshOpenPositions, refreshHistory, refreshBalanceRequests]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const symRes = await fetch("/api/symbols");
        if (!symRes.ok) throw new Error("symbols");
        const list: SymbolDef[] = await symRes.json();
        if (cancelled) return;
        if (!Array.isArray(list)) throw new Error("symbols");
        setSymbols(list);
        setSymbol((prev) => {
          if (list.some((s) => s.symbol === prev)) return prev;
          const saved = readTermPrefs().symbol;
          if (typeof saved === "string" && list.some((s) => s.symbol === saved)) return saved;
          return list[0]?.symbol || prev || "AAPL";
        });
        setSymbolsError(false);
      } catch {
        if (!cancelled) setSymbolsError(true);
      }
      try {
        await refreshAll();
      } catch {
        if (!cancelled) setPositionsError(true);
      }
      if (!cancelled) setReady(true);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [refreshAll, bootNonce]);

  useEffect(() => {
    writeTermPrefs({ symbol, timeframe, tab });
  }, [symbol, timeframe, tab]);

  // One quote scheduler: active symbol every 800ms. Full book every 3s only while the
  // watchlist is mounted (desktop, or the phone Markets tab). The book tick already
  // includes the active symbol, so that tick does not fire a second quote.
  useEffect(() => {
    let cancelled = false;
    const BOOK_MS = 3000;

    const watchlistMounted = () => {
      if (typeof window === "undefined") return true;
      if (window.matchMedia("(min-width: 768px)").matches) return true;
      return mobileTabRef.current === "markets";
    };

    const applyTicks = (ticks: PriceTick[], error: string | null, ok: boolean) => {
      if (cancelled) return;
      if (ok || ticks.length) markFeedOk();
      if (!ticks.length) {
        if (error) setPriceError(error);
        return;
      }
      const now = Date.now();
      const active = symbol.toUpperCase();
      const map: Record<string, PriceTick> = {};
      for (const t of ticks) {
        map[t.symbol] = t.symbol.toUpperCase() === active ? { ...t, ts: now } : t;
      }
      setPrices((prev) => ({ ...prev, ...map }));
      setPriceError(error);
    };

    async function pullBook() {
      const res = await fetch("/api/market/quote", { cache: "no-store" });
      const data = await res.json();
      const ticks = (data.prices || []) as PriceTick[];
      if (!res.ok && !ticks.length) {
        if (!cancelled) setPriceError(data.error || t("term.err.priceFetch"));
        return;
      }
      applyTicks(ticks, data.error || null, res.ok);
    }

    async function pullFast() {
      const wanted = new Set<string>();
      if (symbol) wanted.add(symbol.toUpperCase());
      if (!watchlistMounted()) {
        for (const p of openPositionsRef.current) {
          if (p.symbol) wanted.add(p.symbol.toUpperCase());
        }
        for (const o of pendingOrdersRef.current) {
          if (o.symbol) wanted.add(o.symbol.toUpperCase());
        }
      }
      const list = Array.from(wanted);
      if (!list.length) return;
      const res = await fetch(
        `/api/market/quote?symbols=${encodeURIComponent(list.join(","))}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      const ticks = (data.prices || []) as PriceTick[];
      if (!ticks.length) return;
      applyTicks(ticks, data.error || null, res.ok);
    }

    async function tick() {
      if (pageHidden() || cancelled) return;
      const now = Date.now();
      if (watchlistMounted() && now - bookAtRef.current >= BOOK_MS) {
        bookAtRef.current = now;
        try {
          await pullBook();
        } catch {
          if (!cancelled) setPriceError(t("term.err.priceConn"));
        }
        return;
      }
      try {
        await pullFast();
      } catch {
        /* keep last good */
      }
    }

    pullQuotesRef.current = () => void tick();
    void tick();
    const id = setInterval(() => void tick(), 800);
    return () => {
      cancelled = true;
      pullQuotesRef.current = () => {};
      clearInterval(id);
    };
  }, [symbol, markFeedOk, t]);

  // Open positions stay on a 5s tick. Account, the closed page, orders, and balance
  // requests refresh every 30s. The full closed ledger is loaded on boot and when
  // the tab becomes visible, not on that 30s tick.
  useEffect(() => {
    const SLOW_MS = 30_000;
    let slowAt = Date.now();
    const slow = (withCalendar: boolean) => {
      slowAt = Date.now();
      void refreshAccount();
      void refreshHistory(withCalendar);
      void refreshBalanceRequests();
    };
    const tick = () => {
      if (pageHidden()) return;
      void refreshOpenPositions();
      if (Date.now() - slowAt >= SLOW_MS) slow(false);
    };
    const id = setInterval(tick, 5000);
    const onVis = () => {
      if (pageHidden()) return;
      void refreshOpenPositions();
      slow(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshAccount, refreshOpenPositions, refreshHistory, refreshBalanceRequests]);

  // A fill or close changes the open-position set. Pull closed trades and working
  // orders then, so a filled pending order does not sit in the blotter until the slow poll.
  const openSigRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const sig = openPositions
      .map((p) => p.id)
      .sort()
      .join(",");
    if (openSigRef.current === null) {
      openSigRef.current = sig;
      return;
    }
    if (openSigRef.current === sig) return;
    openSigRef.current = sig;
    void refreshAccount();
    void refreshHistory(false);
  }, [openPositions, ready, refreshAccount, refreshHistory]);

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
    setOrderPrefill(null);
    setOrderSide(side);
    setOrderOpen(true);
  }

  const headerChips = useMemo(() => {
    if (!account) return null;
    const delta = displayBookDelta(
      openPositions,
      (position) => positionMark(position, prices),
      (symbol) => getSymbol(symbol)?.contractSize
    );
    return displayAccountChips(account, delta);
  }, [account, openPositions, prices]);

  const chartLevels = useMemo(() => {
    const cur = symbol.trim().toUpperCase();
    return openPositions
      .filter((p) => {
        const a = (p.symbol || "").trim().toUpperCase();
        const b = (p.chartSymbol || "").trim().toUpperCase();
        return a === cur || b === cur;
      })
      .map((p) => ({
        id: p.id,
        side: (p.side === "SELL" ? "SELL" : "BUY") as "BUY" | "SELL",
        openPrice: Number(p.openPrice),
        stopLoss: p.stopLoss != null ? Number(p.stopLoss) : null,
        takeProfit: p.takeProfit != null ? Number(p.takeProfit) : null,
      }));
  }, [openPositions, symbol]);

  const onReopenTrade = useCallback(
    (draft: { symbol: string; side: "BUY" | "SELL"; volume: number }) => {
      if (user && user.tradingEnabled === false) return;
      if (user && user.mustChangePassword) return;
      const sym = (draft.symbol || "").trim().toUpperCase();
      if (sym) setSymbol(sym);
      setOrderSide(draft.side);
      const vol = Number(draft.volume);
      const volume =
        Number.isFinite(vol) && vol > 0
          ? (Math.round(vol * 100) / 100).toFixed(2)
          : "0.10";
      setOrderPrefill({ volume, side: draft.side, nonce: Date.now() });
      setOrderOpen(true);
      setMobileTab("chart");
    },
    [user]
  );

  // Keyboard shortcuts (desktop): B/S order, / search, 1-3 tabs, [ ] timeframe, ? help, Esc closes help.
  const kbRef = useRef({ orderOpen, depositOpen, marginModalOpen, helpOpen, calcOpen, user });
  kbRef.current = { orderOpen, depositOpen, marginModalOpen, helpOpen, calcOpen, user };
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
      if (st.orderOpen || st.depositOpen || st.marginModalOpen || st.calcOpen) return;
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
        case "c":
        case "C":
          e.preventDefault();
          setCalcOpen(true);
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
        case "[":
        case "]": {
          e.preventDefault();
          const dir = e.key === "]" ? 1 : -1;
          setTimeframe((cur) => {
            const i = CHART_TIMEFRAMES.indexOf(cur as (typeof CHART_TIMEFRAMES)[number]);
            if (i < 0) return cur;
            const j = Math.min(CHART_TIMEFRAMES.length - 1, Math.max(0, i + dir));
            return CHART_TIMEFRAMES[j];
          });
          return;
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onClosePosition(id: string, volume?: number): Promise<TradeActionResult> {
    const body: { id: string; volume?: number } = { id };
    if (volume != null && Number.isFinite(volume)) body.volume = volume;
    const result = await postTrade("/api/positions/close", body, t("common.error"), t);
    if (result.ok) {
      setActionError(null);
      await refreshAll();
    }
    return result;
  }

  async function onModifySlTp(
    id: string,
    levels: { stopLoss: number | null; takeProfit: number | null }
  ): Promise<TradeActionResult> {
    const result = await postTrade("/api/positions/modify", { id, ...levels }, t("common.error"), t);
    if (result.ok) {
      setActionError(null);
      await refreshAll();
    }
    return result;
  }

  async function onClosePositions(ids: string[]) {
    let firstError = "";
    for (const id of ids) {
      const result = await postTrade("/api/positions/close", { id }, t("common.error"), t);
      if (!result.ok && !firstError) firstError = result.error;
    }
    await refreshAll();
    setActionError(firstError || null);
  }

  async function onCancelOrder(id: string): Promise<TradeActionResult> {
    const result = await postTrade("/api/orders/cancel", { id }, t("common.error"), t);
    if (result.ok) {
      setActionError(null);
      await refreshAll();
    } else {
      setActionError(result.error);
    }
    return result;
  }

  async function onCancelOrders(ids: string[]) {
    let firstError = "";
    for (const id of ids) {
      const result = await postTrade("/api/orders/cancel", { id }, t("common.error"), t);
      if (!result.ok && !firstError) firstError = result.error;
    }
    await refreshAll();
    setActionError(firstError || null);
  }

  if (!user) {
    return <BrandLoader variant="desk" label={t("common.loading") || "Loading…"} />;
  }

  if (symbolsError && symbols.length === 0) {
    return (
      <div className="fx-desk flex h-[100dvh] flex-col items-center justify-center gap-3 bg-desk-bg px-6 text-center text-desk-text">
        <p className="text-sm text-desk-muted">{t("term.symbolsError")}</p>
        <button type="button" className="rounded-full bg-desk-accent px-4 py-2 text-sm font-semibold text-desk-accent-ink" onClick={() => { setReady(false); setBootNonce((n) => n + 1); }}>
          {t("term.retry")}
        </button>
      </div>
    );
  }

  const chartSymbol = symbols.find((s) => s.symbol === symbol);

  return (
    <div className="fx-desk flex h-screen h-[100dvh] flex-col overflow-hidden bg-desk-bg text-desk-text">
      <TopBar
        user={user}
        account={account}
        displayEquity={headerChips?.equity}
        displayProfitLoss={headerChips?.profitLoss}
        displayFreeMargin={headerChips?.freeMargin}
        displayMarginLevel={headerChips?.marginLevel}
        onDeposit={() => setDepositOpen(true)}
        onLogout={onLogout}
      />
      {user.impersonatedBy && (
        <div className="flex items-center justify-center gap-3 border-b border-sky-500/40 bg-sky-600/90 px-3 py-1.5 text-center text-[11px] font-medium text-white">
          <span>
            {t("term.impersonationBanner")
              .replace("{name}", user.name || "")
              .replace("{email}", user.email || "")}
          </span>
          <button
            type="button"
            className="rounded bg-white/20 px-2 py-0.5 hover:bg-white/30"
            onClick={async () => {
              const res = await fetch("/api/admin/impersonate", { method: "DELETE" });
              const data = await res.json().catch(() => ({}));
              if (res.ok) window.location.href = data.redirect || "/izcrm";
              else alert(data.error || t("term.impersonationExitFailed"));
            }}
          >
            {t("term.impersonationBack")}
          </button>
        </div>
      )}
      {user.tradingEnabled === false && (
        <div className="border-b border-desk-sell/40 bg-desk-sell/90 px-3 py-1.5 text-center text-[11px] font-medium text-white">
          {t("term.tradingDisabledBanner")}
        </div>
      )}
      <FeedBanner
        state={feed.state}
        ageSec={feed.ageSec}
        onRetry={() => {
          feed.kick();
          void refreshAll();
        }}
      />
      {priceError && feed.state === "live" && (
        <div className="border-b border-desk-warn/30 bg-desk-warn/90 px-3 py-1.5 text-center text-[11px] font-medium text-black">
          Market data warning: {priceError} (showing last known prices)
        </div>
      )}
      {positionsError && (
        <div role="alert" className="flex items-center justify-center gap-3 border-b border-desk-sell/40 bg-desk-sell/90 px-3 py-1.5 text-center text-[11px] font-medium text-white">
          <span>{t("term.positionsError")}</span>
          <button type="button" className="rounded bg-white/20 px-2 py-0.5 hover:bg-white/30" onClick={() => void refreshPositions()}>{t("term.retry")}</button>
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-center gap-3 border-b border-desk-sell/40 bg-desk-sell/90 px-3 py-1.5 text-center text-[11px] font-medium text-white"
        >
          <span>{actionError}</span>
          <button
            type="button"
            className="rounded bg-white/20 px-2 py-0.5 hover:bg-white/30"
            onClick={() => setActionError(null)}
          >
            {t("common.close")}
          </button>
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
            openPositions={openPositions}
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
                {/* First-paint poster. It stays mounted so the later chart canvas does not replace LCP. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/terminal-desktop.avif"
                  alt=""
                  width={640}
                  height={400}
                  fetchPriority="high"
                  decoding="sync"
                  className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
                />
                <TradingChart
                  symbol={symbol}
                  symbolName={chartSymbol?.name}
                  symbolFlag={chartSymbol?.flag}
                  timeframe={timeframe}
                  onTimeframe={setTimeframe}
                  price={prices[symbol]}
                  levels={chartLevels}
                />
                <PriceAlerts symbol={symbol} prices={prices} />
                <div className="pointer-events-none absolute bottom-[calc(0.75rem+0.50cm)] right-[1.85cm] z-20 md:bottom-[calc(1rem+0.50cm)] md:right-[1.85cm]">
                  <button
                    type="button"
                    onClick={() => setCalcOpen(true)}
                    aria-label={t("term.calc.button")}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-desk-border/80 bg-desk-panel/95 text-desk-muted md:hidden"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="5" y="3" width="14" height="18" rx="2" />
                      <path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M16 14v4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => openOrder("BUY")}
                    disabled={user.tradingEnabled === false || !!user.mustChangePassword}
                    aria-label={t("term.trade.open")}
                    className="pointer-events-auto hidden min-h-[22px] min-w-[52px] rounded-full bg-desk-accent px-3.5 py-[5px] text-[10px] font-bold tracking-[0.12em] text-desk-accent-ink shadow-accent-glow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 md:inline-flex md:min-h-[26px] md:min-w-[60px] md:px-[18px] md:py-1.5 md:text-[11px]"
                  >
                    {t("term.trade.button")}
                  </button>
                </div>
              </div>
              <ToolRail
                onHelp={() => setHelpOpen(true)}
                helpLabel={t("term.kb.button")}
                onCalc={() => setCalcOpen(true)}
                calcLabel={t("term.calc.button")}
              />
            </div>

            {/* Desktop bottom panels — fixed height so chart keeps prior larger share */}
            <div className="hidden md:flex md:h-[220px] md:shrink-0 md:flex-col">
              <BottomPanels
                tab={tab}
                onTab={setTab}
                openPositions={openPositions}
                closedPositions={closedPositions}
                closedCalendar={closedCalendar}
                calendarPartial={calendarPartial}
                closedHasMore={closedHasMore}
                closedLoading={closedLoading}
                onLoadMoreClosed={() => void loadMoreClosed()}
                openHasMore={openHasMore}
                openLoading={openLoading}
                onLoadMoreOpen={() => void loadMoreOpen()}
                onLoadClosedDay={(day) => void loadClosedDay(day)}
                currency={account?.currency || "USD"}
                prices={prices}
                pendingOrders={pendingOrders}
                onClosePosition={onClosePosition}
                onClosePositions={onClosePositions}
                onModifySlTp={onModifySlTp}
                onCancelOrder={onCancelOrder}
                onCancelOrders={onCancelOrders}
                onSelectSymbol={setSymbol}
                onReopenTrade={onReopenTrade}
              />
            </div>

            {/* Mobile markets / positions. Chart tab keeps this panel unmounted so the chart uses the height. */}
            {mobileTab !== "chart" && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-desk-border/70 bg-desk-panel md:hidden">
            {mobileTab === "markets" && (
              <Watchlist
                className="h-full border-r-0"
                symbols={symbols}
                prices={prices}
                openPositions={openPositions}
                selected={symbol}
                onSelect={setSymbol}
              />
            )}
            {mobileTab === "positions" && (
              <BottomPanels
                className="h-full border-t-0"
                tab={tab}
                onTab={setTab}
                openPositions={openPositions}
                closedPositions={closedPositions}
                closedCalendar={closedCalendar}
                calendarPartial={calendarPartial}
                closedHasMore={closedHasMore}
                closedLoading={closedLoading}
                onLoadMoreClosed={() => void loadMoreClosed()}
                openHasMore={openHasMore}
                openLoading={openLoading}
                onLoadMoreOpen={() => void loadMoreOpen()}
                onLoadClosedDay={(day) => void loadClosedDay(day)}
                currency={account?.currency || "USD"}
                prices={prices}
                pendingOrders={pendingOrders}
                onClosePosition={onClosePosition}
                onClosePositions={onClosePositions}
                onModifySlTp={onModifySlTp}
                onCancelOrder={onCancelOrder}
                onCancelOrders={onCancelOrders}
                onSelectSymbol={setSymbol}
                onReopenTrade={onReopenTrade}
              />
            )}
            </div>
            )}
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
          className="flex flex-col items-center justify-center bg-desk-sell text-white disabled:opacity-40"
        >
          <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.12em] opacity-90">{t("term.sell")}</span>
          <span className="mt-0.5 text-[15px] font-semibold leading-none tabular-nums tracking-normal">
            {prices[symbol] && Number.isFinite(prices[symbol].bid) ? formatPrice(symbol, prices[symbol].bid) : "—"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => openOrder("BUY")}
          disabled={user.tradingEnabled === false || !!user.mustChangePassword}
          className="flex flex-col items-center justify-center bg-desk-buy text-white disabled:opacity-40"
        >
          <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.12em] opacity-90">{t("term.buy")}</span>
          <span className="mt-0.5 text-[15px] font-semibold leading-none tabular-nums tracking-normal">
            {prices[symbol] && Number.isFinite(prices[symbol].ask) ? formatPrice(symbol, prices[symbol].ask) : "—"}
          </span>
        </button>
      </div>
      {/* Mobile bottom tab bar — elite segmented control + safe-area */}
      <nav className="fx-desk-mobile-nav shrink-0 bg-desk-panel px-3 pt-2 md:hidden">
        <div className="fx-desk-seg">
          {(
            [
              { id: "chart" as const, label: t("term.chart") },
              { id: "markets" as const, label: t("term.markets") },
              { id: "positions" as const, label: t("term.positions") },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMobileTab(item.id)}
              aria-current={mobileTab === item.id ? "page" : undefined}
              className={`fx-desk-seg__btn ${
                mobileTab === item.id ? "fx-desk-seg__btn--active" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
          <a href="/profile" className="fx-desk-seg__btn flex items-center justify-center">
            {t("term.account")}
          </a>
        </div>
      </nav>

      <FooterTicker symbols={symbols} prices={prices} onSelect={setSymbol} feedState={feed.state} />
      <FeedRecoveredToast show={feed.recovered} onClose={feed.dismissRecovered} />
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
          prefill={orderPrefill}
          onPlaced={refreshAll}
          onClose={() => {
            setOrderOpen(false);
            setOrderPrefill(null);
          }}
        />
      )}
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <TradingCalculator
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        symbol={symbol}
        symbols={symbols}
        prices={prices}
        leverage={account?.leverage}
        currency={account?.currency || "USD"}
      />
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSubmitted={() => refreshAll()}
      />
      <MarginCallModal
        open={marginModalOpen}
        equity={headerChips?.equity ?? account?.equity ?? 0}
        marginLevel={headerChips?.marginLevel ?? account?.marginLevel ?? 0}
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
