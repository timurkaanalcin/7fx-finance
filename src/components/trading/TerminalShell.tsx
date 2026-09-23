"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "./TopBar";
import Watchlist from "./Watchlist";
import TradingChart from "./TradingChart";
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

export default function TerminalShell() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [account, setAccount] = useState<AccountMetrics | null>(null);
  const [symbols, setSymbols] = useState<SymbolDef[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceTick>>({});
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState("5m");
  const [tab, setTab] = useState<"open" | "closed" | "pending">("open");
  const [openPositions, setOpenPositions] = useState<PositionRow[]>([]);
  const [closedPositions, setClosedPositions] = useState<PositionRow[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderRow[]>([]);
  const [ready, setReady] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [marginModalOpen, setMarginModalOpen] = useState(false);
  const [pendingBalanceReq, setPendingBalanceReq] = useState<BalanceRequestRow | null>(null);
  const [balanceReqBanner, setBalanceReqBanner] = useState<BalanceRequestRow | null>(null);
  /** Once per margin-call episode: suppress re-open until call clears */
  const episodeShownRef = useRef(false);
  const wasInCallRef = useRef(false);

  const refreshBalanceRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/balance-requests");
      if (!res.ok) return;
      const data = await res.json();
      const list: BalanceRequestRow[] = data.requests || [];
      const pending = list.find((r) => r.status === "PENDING") || null;
      setPendingBalanceReq(pending);
      const latest = list[0] || null;
      setBalanceReqBanner(latest && latest.status !== "APPROVED" ? latest : pending);
      if (latest?.status === "APPROVED") {
        // keep brief status if just approved; clear after call ends
        setBalanceReqBanner(latest);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    const res = await fetch("/api/auth/me");
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
      fetch("/api/positions?status=OPEN"),
      fetch("/api/positions?status=CLOSED"),
      fetch("/api/orders"),
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

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/market/quote");
        const data = await res.json();
        if (!res.ok && !(data.prices || []).length) {
          setPriceError(data.error || "Fiyat alınamadı");
          return;
        }
        const map: Record<string, PriceTick> = {};
        for (const t of data.prices as PriceTick[]) map[t.symbol] = t;
        if (Object.keys(map).length) {
          setPrices(map);
          setPriceError(data.error || null);
        } else if (data.error) {
          setPriceError(data.error);
        }
      } catch {
        setPriceError("Fiyat bağlantı hatası");
      }
    }, 8000);
    return () => clearInterval(id);
  }, []);

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
      // entering new episode
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
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function onClosePosition(id: string) {
    await fetch("/api/positions/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refreshAll();
  }

  async function onCancelOrder(id: string) {
    await fetch("/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refreshAll();
  }

  if (!ready || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1a2332] text-slate-400">
        Terminal yükleniyor…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#1a2332]">
      <TopBar
        user={user}
        account={account}
        onDeposit={() => setDepositOpen(true)}
        onLogout={onLogout}
      />
      {priceError && (
        <div className="bg-amber-500/90 px-3 py-1 text-center text-[11px] font-medium text-black">
          Piyasa verisi uyarısı: {priceError} (son bilinen fiyatlar gösteriliyor)
        </div>
      )}
      {account?.marginCall && (
        <div className="flex items-center justify-center gap-3 bg-red-600/90 px-3 py-1 text-center text-[11px] font-medium text-white">
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
        <div className="bg-amber-600/80 px-3 py-1 text-center text-[11px] font-medium text-black">
          Bakiye talebi {STATUS_TR[balanceReqBanner.status] || balanceReqBanner.status}:{" "}
          {balanceReqBanner.type === "RESET" ? "Bakiye Sıfırlama" : "Bakiye Ekle"}
          {balanceReqBanner.type === "ADD" && balanceReqBanner.amount != null
            ? ` (${balanceReqBanner.amount} USD)`
            : ""}{" "}
          — admin onayı bekleniyor
        </div>
      )}
      {balanceReqBanner && balanceReqBanner.status === "REJECTED" && account?.marginCall && (
        <div className="bg-slate-600/80 px-3 py-1 text-center text-[11px] font-medium text-white">
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
      <div className="flex min-h-0 flex-1">
        <Watchlist
          symbols={symbols}
          prices={prices}
          selected={symbol}
          onSelect={setSymbol}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <TradingChart
              symbol={symbol}
              timeframe={timeframe}
              onTimeframe={setTimeframe}
              price={prices[symbol]}
            />
            <ToolRail />
            <OrderTicket
              symbol={symbol}
              symbols={symbols}
              price={prices[symbol]}
              onPlaced={refreshAll}
            />
          </div>
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
      </div>
      <FooterTicker symbols={symbols} prices={prices} onSelect={setSymbol} />
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
