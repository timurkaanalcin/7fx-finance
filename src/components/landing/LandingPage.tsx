"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import PhonePreview from "./PhonePreview";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const NAV = [
  { id: "piyasalar", label: "Markets" },
  { id: "platform", label: "Platform" },
  { id: "hakkinda", label: "About" },
  { id: "nasil", label: "How it works" },
  { id: "mobil", label: "Mobile" },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="fx-eyebrow inline-flex items-center gap-2">
      <span className="fx-eyebrow-dot" aria-hidden />
      {children}
    </p>
  );
}

function MarketMiniRows() {
  const rows = [
    { s: "EURUSD", p: "1.0842", d: "+0.14%", up: true },
    { s: "XAUUSD", p: "2.341", d: "+0.32%", up: true },
    { s: "US100", p: "19.840", d: "+0.41%", up: true },
    { s: "BTCUSD", p: "67.420", d: "−0.81%", up: false },
    { s: "GBPUSD", p: "1.2634", d: "+0.09%", up: true },
  ];
  return (
    <div className="fx-viz-market mt-auto space-y-2">
      {rows.map((r) => (
        <div key={r.s} className="fx-viz-market-row flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold tracking-wide text-[#111111]">{r.s}</span>
          <span className="text-[12px] tabular-nums text-[#5c657a]">{r.p}</span>
          <span
            className={`min-w-[52px] rounded-md px-1.5 py-0.5 text-right text-[11px] font-semibold tabular-nums ${
              r.up ? "bg-[#26a69a]/15 text-[#26a69a]" : "bg-[#ef5350]/15 text-[#ef5350]"
            }`}
          >
            {r.d}
          </span>
        </div>
      ))}
    </div>
  );
}

function OrderTicketVisual() {
  return (
    <div className="fx-viz-order mt-auto rounded-[14px] border border-[#2a2a2a] bg-[#0a0a0a] p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-[#8b97b0]">EURUSD</p>
          <p className="text-[15px] font-semibold tabular-nums text-[#e8eef8]">1.0842</p>
        </div>
        <span className="rounded-full bg-[#111111]/15 px-2 py-0.5 text-[10px] font-semibold text-[#2a2a2a]">
          Market
        </span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-[10px] bg-[#26a69a] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_6px_16px_rgba(22,199,132,0.28)]">
          AL
        </div>
        <div className="rounded-[10px] bg-[#ef5350] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_6px_16px_rgba(234,57,67,0.28)]">
          SAT
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-[#8b97b0]">
          <span>Lot</span>
          <span className="font-semibold text-[#e8eef8]">0.10</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#1f1f1f]">
          <div className="h-full w-[42%] rounded-full bg-[#111111]" />
        </div>
        <div className="flex justify-between text-[10px] text-[#8b97b0]">
          <span>Leverage</span>
          <span className="font-semibold text-[#e8eef8]">1:100</span>
        </div>
      </div>
    </div>
  );
}

function SecurityBadgeVisual() {
  return (
    <div className="fx-viz-security mt-auto flex flex-col items-center justify-center py-2">
      <div className="relative flex h-[120px] w-[120px] items-center justify-center">
        <div className="fx-orbit absolute inset-0 rounded-full border border-dashed border-[#111111]/30" />
        <div className="fx-orbit fx-orbit--slow absolute inset-3 rounded-full border border-[#111111]/15" />
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111111] shadow-[0_12px_32px_rgba(17,17,17,0.4)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3l7 3v5c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V6l7-3z"
              stroke="white"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 12.2l1.8 1.8 3.4-3.6"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="fx-orbit-dot absolute left-2 top-8 h-2 w-2 rounded-full bg-[#111111]" />
        <span className="fx-orbit-dot fx-orbit-dot--2 absolute bottom-4 right-3 h-1.5 w-1.5 rounded-full bg-[#2a2a2a]" />
      </div>
      <p className="mt-3 text-center text-[12px] font-medium text-[#5c657a]">
        Session protected · SSL
      </p>
    </div>
  );
}

function PortfolioBoard() {
  const bars = [
    { h: 42, c: "#2a3a6a" },
    { h: 58, c: "#3a5288" },
    { h: 48, c: "#4a6ab0" },
    { h: 72, c: "#111111" },
    { h: 64, c: "#6a92ff" },
    { h: 88, c: "#111111" },
    { h: 76, c: "#5a86f5" },
    { h: 94, c: "#111111" },
  ];
  const alloc = [
    { name: "FX", pct: 34, color: "#111111" },
    { name: "Commodities", pct: 22, color: "#2a2a2a" },
    { name: "Indices", pct: 28, color: "#26a69a" },
    { name: "Crypto", pct: 16, color: "#8b97b0" },
  ];
  return (
    <div className="fx-portfolio-board rounded-[16px] border border-[#2a2a2a] bg-[#0a0a0a] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b97b0]">
            Portfolio summary
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[#e8eef8] tabular-nums">
            ₺128.450
          </p>
        </div>
        <span className="rounded-full bg-[#26a69a]/15 px-3 py-1 text-[12px] font-semibold text-[#26a69a]">
          +1,8%
        </span>
      </div>

      <div className="mb-7 flex h-[110px] items-end gap-2 sm:gap-2.5">
        {bars.map((b, i) => (
          <div
            key={i}
            className="fx-bar flex-1 rounded-t-md"
            style={{ height: `${b.h}%`, background: b.c }}
          />
        ))}
      </div>

      <div className="space-y-3">
        {alloc.map((a) => (
          <div key={a.name}>
            <div className="mb-1 flex justify-between text-[12px]">
              <span className="font-medium text-[#e8eef8]">{a.name}</span>
              <span className="tabular-nums text-[#8b97b0]">%{a.pct}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1f1f1f]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${a.pct}%`, background: a.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setShowStickyCta(!(entry.isIntersecting && entry.intersectionRatio >= 0.28));
      },
      { threshold: [0, 0.15, 0.28, 0.45, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const markets = useMemo(
    () => [
      { s: "EURUSD", name: "Euro / Dolar", p: "1.0842", d: "+0.14%", up: true },
      { s: "XAUUSD", name: "Gold ounce", p: "2.341,20", d: "+0.32%", up: true },
      { s: "US100", name: "NASDAQ 100", p: "19.840", d: "+0.41%", up: true },
      { s: "BTCUSD", name: "Bitcoin", p: "67.420", d: "−0.81%", up: false },
      { s: "GBPUSD", name: "Sterlin / Dolar", p: "1.2634", d: "+0.09%", up: true },
      { s: "USDTRY", name: "Dolar / TL", p: "34,12", d: "+0.05%", up: true },
      { s: "UKOIL", name: "Brent Petrol", p: "82,40", d: "−0.22%", up: false },
      { s: "ETHUSD", name: "Ethereum", p: "3.420", d: "+1.12%", up: true },
    ],
    []
  );

  const platformCards = useMemo(
    () => [
      {
        key: "markets",
        title: "Live market view",
        body: "Watch FX, commodities, indices and crypto instruments in one list. Clear price and change tables.",
        visual: <MarketMiniRows />,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M8 15l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        key: "orders",
        title: "Quick order panel",
        body: "Buy / Sell buttons, lot and leverage settings together in a clean order ticket.",
        visual: <OrderTicketVisual />,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3v18M8 8l4-4 4 4M8 16l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        key: "security",
        title: "Secure session",
        body: "Authentication works with session cookies. Sensitive areas are protected.",
        visual: <SecurityBadgeVisual />,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3l7 3v5c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        ),
      },
    ],
    []
  );

  const stats = useMemo(
    () => [
      { k: "7/24", v: "Platform access", d: "Track anytime via the web" },
      { k: "Tek ekran", v: "Unified terminal", d: "Price, emir ve bakiye birlikte" },
      { k: "Multi-asset", v: "Broad symbol set", d: "FX · commodities · indices · crypto" },
      { k: "PWA", v: "Mobile ready", d: "Phone and tablet first" },
    ],
    []
  );

  const steps = useMemo(
    () => [
      {
        n: "01",
        t: "Create an account",
        d: "Fill in the registration form, enter your referral code if you have one, and open your account.",
      },
      {
        n: "02",
        t: "Explore the markets",
        d: "Follow the symbols you care about with a watchlist and live prices.",
      },
      {
        n: "03",
        t: "Go to the trading terminal",
        d: "After login, place orders on the trade screen and manage your balance.",
      },
    ],
    []
  );


  return (
    <div className="fx-landing min-h-screen" data-fx-ui="landing-light">
      <a
        href="/login"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#111111] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Go to Sign In
      </a>

      {/* ——— Header ——— */}
      <header className="fx-nav sticky top-0 z-50">
        <div className="fx-shell flex h-14 items-center justify-between gap-4 sm:h-[4.25rem]">
          <Link href="/" className="flex items-center no-underline" aria-label="7FX ana sayfa">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="7FX" className="fx-nav-logo h-9 w-auto object-contain sm:h-9" />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main menu">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#5c657a] transition hover:bg-[#f0f0f0] hover:text-[#111111]"
                onClick={() => scrollToId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="fx-btn-secondary hidden rounded-full px-4 py-2 text-[13px] font-semibold sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="fx-btn-primary rounded-full px-4 py-2 text-[13px] font-semibold"
            >
              Open account
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(16,20,37,0.12)] bg-white text-[#111111] lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[rgba(16,20,37,0.08)] bg-white/98 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="fx-shell flex flex-col gap-0.5 !px-0">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-[#111111] hover:bg-[#f0f0f0]"
                  onClick={() => {
                    setMenuOpen(false);
                    scrollToId(item.id);
                  }}
                >
                  {item.label}
                </button>
              ))}
              <Link
                href="/login"
                className="mt-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#111111]"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#5c657a]"
                onClick={() => setMenuOpen(false)}
              >
                Open account
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="fx-main-pad pb-[calc(108px+env(safe-area-inset-bottom,0px))] md:pb-0">
        {/* ——— Hero ——— */}
        <section ref={heroRef} className="fx-hero relative overflow-hidden" aria-labelledby="hero-title">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="fx-hero-veil absolute inset-0" />
            <div className="fx-hero-mesh absolute inset-0" />
          </div>

          <div className="fx-shell relative z-10 grid gap-7 pb-10 pt-8 sm:gap-12 sm:pb-20 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12 lg:pb-28 lg:pt-20">
            <div className="fx-reveal max-w-[640px]">
              <Eyebrow>Multi-asset investment platform</Eyebrow>

              <p
                className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-[rgba(16,20,37,0.10)] bg-white/90 px-3.5 py-1.5 text-[12.5px] font-semibold tracking-tight text-[#111111] shadow-[0_6px_18px_rgba(16,20,37,0.06)]"
                aria-label="In partnership with ING Bank"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ing-logo.png"
                  alt="ING"
                  className="h-5 w-auto object-contain"
                />
                <span className="text-[#5c657a]">in partnership with</span>
              </p>

              <h1 id="hero-title" className="fx-h1 mt-5">
                Invest 7FX ile
                <span className="fx-accent-line mt-1 block">start with more clarity</span>
              </h1>

              <p className="fx-hero-body mt-6">
                7FX offers access to stocks, crypto, forex and commodity markets from a single account — an
                international trading platform. Corporate-grade security, a clean interface and a
                mobile-first experience help you decide on a clear screen.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="fx-btn-primary inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-[14px] font-semibold sm:min-h-[52px] sm:px-8 sm:text-[15px]"
                >
                  Open account
                </Link>
                <Link
                  href="/login"
                  className="fx-btn-secondary inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-[14px] font-semibold sm:min-h-[52px] sm:px-8 sm:text-[15px]"
                >
                  Sign In yap
                </Link>
                <a
                  href="/apk"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[rgba(16,20,37,0.14)] bg-[#111111] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-[#2a2a2a] sm:min-h-[52px] sm:px-6 sm:text-[15px]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.6 9.48l1.84-3.18a.5.5 0 00-.86-.5l-1.86 3.22A7.9 7.9 0 0012 7.5c-1.62 0-3.12.48-4.36 1.3L5.78 5.8a.5.5 0 10-.86.5L6.76 9.48A7.96 7.96 0 004 15.5v.5h16v-.5a7.96 7.96 0 00-2.4-6.02zM8.5 13.25a.75.75 0 110-1.5.75.75 0 010 1.5zm7 0a.75.75 0 110-1.5.75.75 0 010 1.5zM7 17.5h10v1.25c0 .69-.56 1.25-1.25 1.25H8.25C7.56 20 7 19.44 7 18.75V17.5z" />
                  </svg>
                  Download the app
                </a>
              </div>

              <div className="fx-trust-row mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                {[
                  { label: "In partnership with ING Bank", icon: "★" },
                  { label: "40+ sembol", icon: "◆" },
                  { label: "24/7 access", icon: "●" },
                  { label: "SSL session", icon: "▣" },
                  { label: "PWA uyumlu", icon: "◈" },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-[13px] text-[#5c657a]">
                    <span className="text-[10px] text-[#111111]" aria-hidden>
                      {t.icon}
                    </span>
                    <span className="font-medium">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fx-reveal fx-fade-up--delay flex w-full justify-center overflow-x-clip px-1 lg:justify-end">
              <PhonePreview />
            </div>
          </div>
        </section>

        {/* ——— Market strip ——— */}
        <section
          id="piyasalar"
          className="border-y border-[rgba(16,20,37,0.08)] bg-[#ffffff]"
          aria-label="Sample markets"
        >
          <div className="fx-shell flex items-center justify-between gap-4 pt-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c657a]">
              Markets
            </p>
          </div>
          <div className="fx-ticker relative overflow-hidden py-3.5 sm:py-4">
            <div className="fx-ticker-fade fx-ticker-fade--l" aria-hidden />
            <div className="fx-ticker-fade fx-ticker-fade--r" aria-hidden />
            <div className="fx-ticker-track flex w-max gap-3 px-4 sm:gap-4">
              {[...markets, ...markets].map((m, i) => (
                <div
                  key={`${m.s}-${i}`}
                  className="fx-ticker-item flex items-center gap-2.5 whitespace-nowrap rounded-full border border-[rgba(16,20,37,0.08)] bg-white px-3 py-1.5 text-sm shadow-[0_4px_12px_rgba(16,20,37,0.04)] sm:gap-3"
                >
                  <span className="font-semibold text-[#111111]">{m.s}</span>
                  <span className="fx-ticker-name text-[12px] text-[#5c657a]">{m.name}</span>
                  <span className="tabular-nums text-[#5c657a]">{m.p}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                      m.up
                        ? "bg-[#26a69a]/15 text-[#26a69a]"
                        : "bg-[#ef5350]/15 text-[#ef5350]"
                    }`}
                  >
                    {m.d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Platform: 3 feature cards ——— */}
        <section id="platform" className="fx-section">
          <div className="fx-shell">
            <div className="mb-9 max-w-2xl sm:mb-14">
              <Eyebrow>Platform</Eyebrow>
              <h2 className="fx-h2 mt-4">
                Investment instruments,
                <br className="hidden sm:block" /> at a glance
              </h2>
              <p className="fx-section-body mt-4 max-w-[560px]">
                7FX delivers a clear multi-asset experience for retail and
                institutional investors with live prices, a simple order panel and secure sessions. Watch forex, stocks, crypto and
                commodity instruments in one terminal; manage balance and positions from the same screen.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {platformCards.map((card) => (
                <article
                  key={card.key}
                  className="fx-feature-card flex min-h-[320px] flex-col rounded-[16px] p-5 sm:min-h-[380px] sm:p-7"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#111111]/12 text-[#111111]">
                    {card.icon}
                  </div>
                  <h3 className="text-[20px] font-semibold tracking-tight text-[#111111]">
                    {card.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-[#5c657a]">
                    {card.body}
                  </p>
                  <div className="mt-8 flex flex-1 flex-col">{card.visual}</div>
                </article>
              ))}
            </div>
          </div>
        </section>


        {/* ——— About / corporate blurb ——— */}
        <section id="hakkinda" className="fx-section fx-section--soft border-y border-[rgba(16,20,37,0.08)]" aria-labelledby="about-title">
          <div className="fx-shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
            <div>
              <Eyebrow>About</Eyebrow>
              <h2 id="about-title" className="fx-h2 mt-4">
                7FX nedir?
              </h2>
              <p className="fx-section-body mt-5 max-w-[540px]">
                7FX is an international broker / trading platform providing web access to global markets.
                Our goal is for investors to follow stocks, crypto, forex and
                commodity markets under one account in a transparent, controlled
                environment.
              </p>
              <p className="fx-section-body mt-4 max-w-[540px]">
                The platform is built with secure session infrastructure, SSL-protected connections and role-based access.
                Our support team is with you for account, deposit / withdrawal and trading processes
                — 24/7 platform access is available via the web.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  t: "Markets",
                  d: "Forex pairs, stocks and indices, crypto assets, and commodities such as gold / oil.",
                },
                {
                  t: "Security",
                  d: "Session-cookie authentication, protected admin areas and SSL connection.",
                },
                {
                  t: "Support",
                  d: "In-platform support for account opening, balance operations and terminal use.",
                },
                {
                  t: "Access",
                  d: "Multi-asset web terminal that works in desktop and mobile browsers, PWA-ready.",
                },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-[14px] border border-[rgba(16,20,37,0.08)] bg-white p-5 shadow-[0_8px_24px_rgba(16,20,37,0.04)]"
                >
                  <p className="text-[13px] font-semibold tracking-tight text-[#111111]">{c.t}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#5c657a]">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Detail band: 4 stats ——— */}
        <section className="border-y border-[rgba(16,20,37,0.08)] bg-[#ffffff]" aria-label="Highlights">
          <div className="fx-shell grid grid-cols-2 gap-x-5 gap-y-8 py-12 sm:gap-8 sm:py-14 lg:grid-cols-4 lg:py-16">
            {stats.map((s) => (
              <div key={s.k} className="fx-stat">
                <p className="text-[22px] font-semibold tracking-tight text-[#111111] sm:text-[26px]">
                  {s.k}
                </p>
                <p className="mt-1 text-[14px] font-semibold text-[#111111]">{s.v}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#5c657a]">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ——— How it works ——— */}
        <section id="nasil" className="fx-section">
          <div className="fx-shell">
            <div className="mb-12 max-w-2xl sm:mb-14">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="fx-h2 mt-4">To the terminal in three steps</h2>
              <p className="fx-section-body mt-4 max-w-[520px]">
                From registration to live prices and the order panel, the flow stays simple.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step, i) => (
                <article
                  key={step.n}
                  className="fx-step relative rounded-[16px] border border-[rgba(16,20,37,0.08)] bg-white p-6 shadow-[0_12px_32px_rgba(16,20,37,0.06)] sm:p-7"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#111111]/12 text-[13px] font-bold text-[#111111]">
                    {step.n}
                  </span>
                  {i < steps.length - 1 && (
                    <span
                      className="absolute right-[-12px] top-12 z-10 hidden h-px w-6 bg-[rgba(16,20,37,0.12)] md:block"
                      aria-hidden
                    />
                  )}
                  <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-[#111111]">
                    {step.t}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#5c657a]">{step.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Insight + portfolio board ——— */}
        <section className="fx-section fx-section--soft border-y border-[rgba(16,20,37,0.08)]">
          <div className="fx-shell grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
            <div>
              <Eyebrow>Portfolio view</Eyebrow>
              <h2 className="fx-h2 mt-4">
                See allocation and
                <br className="hidden sm:block" /> trend in one place
              </h2>
              <p className="fx-section-body mt-4 max-w-[480px]">
                See your portfolio clearly with balance, asset allocation and performance bars
                panelde takip edin.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Allocation bars by asset class",
                  "Weekly performance chart",
                  "Consistent layout on mobile and desktop",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-[#5c657a]">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111111]/12 text-[10px] font-bold text-[#111111]"
                      aria-hidden
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <PortfolioBoard />
          </div>
        </section>


        {/* ——— Mobile band ——— */}
        <section id="mobil" className="fx-mobile-band border-y border-[rgba(16,20,37,0.08)] bg-[#ffffff]">
          <div className="fx-shell grid gap-8 py-16 sm:gap-12 sm:py-[85px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-[110px]">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#111111]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#111111] shadow-[0_0_8px_rgba(17,17,17,0.45)]" aria-hidden />
                Mobile experience
              </p>
              <h2 className="mt-4 text-[clamp(30px,8vw,48px)] font-semibold leading-[1.08] tracking-[-0.05em] text-[#111111]">
                Her yerden takip edin
              </h2>
              <p className="mt-4 max-w-[480px] text-[14px] leading-relaxed text-[#5c657a]">
                Landing and auth pages are mobile-first. The terminal experience is available on the web;
                portfolio balance and watchlist at a glance.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Responsive header and hamburger menu",
                  "Portfolio view with phone preview",
                  "Login / register CTAs reachable on every screen",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-[#5c657a]">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111111]/12 text-[10px] font-bold text-[#111111]"
                      aria-hidden
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="fx-btn-primary inline-flex min-h-[48px] items-center rounded-full px-7 text-sm font-semibold"
                >
                  Open account
                </Link>
                <a
                  href="/apk"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#111111] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-[#2a2a2a]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.6 9.48l1.84-3.18a.5.5 0 00-.86-.5l-1.86 3.22A7.9 7.9 0 0012 7.5c-1.62 0-3.12.48-4.36 1.3L5.78 5.8a.5.5 0 10-.86.5L6.76 9.48A7.96 7.96 0 004 15.5v.5h16v-.5a7.96 7.96 0 00-2.4-6.02zM8.5 13.25a.75.75 0 110-1.5.75.75 0 010 1.5zm7 0a.75.75 0 110-1.5.75.75 0 010 1.5zM7 17.5h10v1.25c0 .69-.56 1.25-1.25 1.25H8.25C7.56 20 7 19.44 7 18.75V17.5z" />
                  </svg>
                  Download the app
                </a>
              </div>
            </div>

            <div className="fx-app-panel relative mx-auto w-full max-w-[380px]">
              <div className="rounded-[20px] border border-[rgba(16,20,37,0.08)] bg-white p-8 shadow-[0_24px_64px_rgba(16,20,37,0.1)]">
                <div className="mb-6 flex items-center justify-between">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/7fx-logo.png"
                    alt="7FX"
                    className="h-9 w-auto object-contain"
                  />
                  <span className="rounded-full bg-[#111111]/12 px-3 py-1 text-[11px] font-semibold text-[#111111]">
                    Web uygulama
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { t: "Live prices", d: "Watchlist" },
                    { t: "Order paneli", d: "Al / Sat" },
                    { t: "Portfolio", d: "Balance & P&L" },
                  ].map((row) => (
                    <div
                      key={row.t}
                      className="flex items-center justify-between rounded-2xl border border-[rgba(16,20,37,0.08)] bg-[#ffffff] px-4 py-3.5"
                    >
                      <div>
                        <p className="text-[14px] font-semibold text-[#111111]">{row.t}</p>
                        <p className="text-[12px] text-[#5c657a]">{row.d}</p>
                      </div>
                      <span className="text-[#111111]" aria-hidden>
                        →
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#111111] px-4 py-3.5 text-white shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/7fx-mark.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
                  <div>
                    <p className="text-[13px] font-semibold text-white">7FX ile devam edin</p>
                    <p className="text-[11px] text-white/70">Sign in or create an account</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— Final CTA ——— */}
        <section className="border-t border-[rgba(16,20,37,0.08)] bg-white">
          <div className="fx-shell flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center md:py-20">
            <div>
              <h2 className="fx-h2">Start when you are ready</h2>
              <p className="fx-section-body mt-3 max-w-lg">
                Create an account or sign in with your existing one. Use in-platform
                channels for support.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="fx-btn-primary inline-flex min-h-[48px] items-center rounded-full px-7 text-sm font-semibold"
              >
                Open account
              </Link>
              <Link
                href="/login"
                className="fx-btn-secondary inline-flex min-h-[48px] items-center rounded-full px-7 text-sm font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="fx-footer-pad border-t border-[rgba(16,20,37,0.08)] bg-[#ffffff] pb-[calc(116px+env(safe-area-inset-bottom,0px))] md:pb-0">
        <div className="fx-shell flex flex-col gap-6 py-12 text-sm text-[#5c657a] sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/7fx-logo.png" alt="7FX" className="h-7 w-auto object-contain" />
            </div>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed">
              7FX — international multi-asset trading platform. Secure web access to stocks, crypto, forex and
              commodity markets.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-[12px] font-medium text-[#111111]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ing-logo.png" alt="ING" className="h-4 w-auto object-contain" />
              <span>in partnership with</span>
            </p>
            <p className="mt-2 text-[12px]">© {new Date().getFullYear()} 7FX</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-[13px]">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111111]">
                Platform
              </span>
              <button type="button" className="text-left hover:text-[#111111]" onClick={() => scrollToId("piyasalar")}>
                Markets
              </button>
              <button type="button" className="text-left hover:text-[#111111]" onClick={() => scrollToId("platform")}>
                Features
              </button>
              <button type="button" className="text-left hover:text-[#111111]" onClick={() => scrollToId("hakkinda")}>
                About
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111111]">
                Account
              </span>
              <Link href="/login" className="hover:text-[#111111]">
                Sign In
              </Link>
              <Link href="/register" className="hover:text-[#111111]">
                Open account
              </Link>
              <span>7fx.customer.org.tr</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA — hidden while hero is on screen */}
      <div
        className={`fx-sticky-cta fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(16,20,37,0.08)] bg-white/95 px-3 pt-2 backdrop-blur-xl transition-transform duration-200 md:hidden ${
          showStickyCta ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!showStickyCta}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Link
            href="/login"
            tabIndex={showStickyCta ? 0 : -1}
            className="fx-btn-secondary inline-flex h-9 flex-1 items-center justify-center rounded-full text-[12.5px] font-semibold"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            tabIndex={showStickyCta ? 0 : -1}
            className="fx-btn-primary inline-flex h-9 flex-[1.2] items-center justify-center rounded-full text-[12.5px] font-semibold"
          >
            Open account
          </Link>
        </div>
      </div>
    </div>
  );
}
