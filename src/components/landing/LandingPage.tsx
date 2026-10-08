"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import PhonePreview from "./PhonePreview";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";
import SymbolIcon from "@/components/ui/SymbolIcon";
import InstallAppButtons from "@/components/landing/InstallAppButtons";
import { useLivePrices, type LiveState } from "./useLivePrices";

/* ——— Instruments shown on the landing page (all exist in the terminal catalog) ——— */
type Inst = { s: string; label: string; nameKey?: string; name?: string; dp: number };
const CLASSES: { id: "FX" | "COMMODITY" | "INDEX" | "CRYPTO" | "STOCK"; items: Inst[] }[] = [
  {
    id: "FX",
    items: [
      { s: "EURUSD", label: "EUR/USD", nameKey: "lp.n.EURUSD", dp: 4 },
      { s: "GBPUSD", label: "GBP/USD", nameKey: "lp.n.GBPUSD", dp: 4 },
      { s: "USDTRY", label: "USD/TRY", nameKey: "lp.n.USDTRY", dp: 3 },
    ],
  },
  {
    id: "COMMODITY",
    items: [
      { s: "XAUUSD", label: "XAU/USD", nameKey: "lp.n.XAUUSD", dp: 2 },
      { s: "XAGUSD", label: "XAG/USD", nameKey: "lp.n.XAGUSD", dp: 2 },
      { s: "UKOIL", label: "UKOIL", nameKey: "lp.n.UKOIL", dp: 2 },
    ],
  },
  {
    id: "INDEX",
    items: [
      { s: "NAS100", label: "NAS100", name: "Nasdaq 100", dp: 1 },
      { s: "US30", label: "US30", name: "Dow Jones 30", dp: 1 },
      { s: "GER40", label: "GER40", name: "DAX 40", dp: 1 },
    ],
  },
  {
    id: "CRYPTO",
    items: [
      { s: "BTCUSD", label: "BTC/USD", name: "Bitcoin", dp: 0 },
      { s: "ETHUSD", label: "ETH/USD", name: "Ethereum", dp: 2 },
      { s: "SOLUSD", label: "SOL/USD", name: "Solana", dp: 2 },
    ],
  },
  {
    id: "STOCK",
    items: [
      { s: "AAPL", label: "AAPL", name: "Apple", dp: 2 },
      { s: "NVDA", label: "NVDA", name: "NVIDIA", dp: 2 },
      { s: "TSLA", label: "TSLA", name: "Tesla", dp: 2 },
    ],
  },
];
const ALL = CLASSES.flatMap((c) => c.items);
const HERO = ["EURUSD", "XAUUSD", "NAS100", "BTCUSD", "USDTRY", "AAPL"]
  .map((s) => ALL.find((i) => i.s === s)!)
  .filter(Boolean);

const INTL: Record<string, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", ru: "ru-RU", ar: "ar-EG" };

function useFmt(locale: string) {
  return useMemo(() => {
    const tag = INTL[locale] ?? "en-US";
    return {
      price: (v: number, dp: number) =>
        new Intl.NumberFormat(tag, { minimumFractionDigits: dp, maximumFractionDigits: dp, numberingSystem: "latn" }).format(v),
      pct: (v: number) =>
        new Intl.NumberFormat(tag, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          signDisplay: "exceptZero",
          numberingSystem: "latn",
        }).format(v) + "%",
      time: (ts: number) =>
        new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit", second: "2-digit", numberingSystem: "latn" }).format(ts),
    };
  }, [locale]);
}

/* ——— Small building blocks ——— */
function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <p className={`lp-eyebrow ${tone === "dark" ? "lp-eyebrow--dark" : ""}`}>
      <span className="lp-eyebrow-dot" aria-hidden />
      {children}
    </p>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="lp-arrow">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`lp-logo ${className}`}>
      <picture>
        <source srcSet="/brand/7fx-logo-80.webp" type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/7fx-logo-80.png" alt="7FX" width={36} height={32} decoding="async" />
      </picture>
    </span>
  );
}

function Change({ v, fmt }: { v: number; fmt: (n: number) => string }) {
  const up = v > 0;
  const flat = v === 0;
  return (
    <span className={`lp-chg ${flat ? "lp-chg--flat" : up ? "lp-chg--up" : "lp-chg--down"}`}>
      <span aria-hidden>{flat ? "•" : up ? "▲" : "▼"}</span>
      {fmt(v)}
    </span>
  );
}

function PriceCell({
  inst,
  live,
  fmt,
}: {
  inst: Inst;
  live: LiveState;
  fmt: ReturnType<typeof useFmt>;
}) {
  const q = live.quotes[inst.s];
  if (!q) {
    return (
      <>
        <span className={`lp-price ${live.status === "loading" ? "lp-skel" : ""}`}>{live.status === "loading" ? "" : "—"}</span>
        <span className={`lp-chg lp-chg--flat ${live.status === "loading" ? "lp-skel lp-skel--sm" : ""}`}>
          {live.status === "loading" ? "" : "—"}
        </span>
      </>
    );
  }
  return (
    <>
      <span className="lp-price">{fmt.price(q.mid, inst.dp)}</span>
      <Change v={q.changePct} fmt={fmt.pct} />
    </>
  );
}

const FEATURE_ICONS: ReactNode[] = [
  <path key="1" d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" />,
  <path key="2" d="M7 4v16M17 4v16M4 8h6M14 16h6" />,
  <path key="3" d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" />,
  <path key="4" d="M4 6h16v12H4zM4 10h16M8 15h3" />,
  <path key="5" d="M12 4v12M7 11l5 5 5-5M5 20h14" />,
  <path key="6" d="M5 5h14v10H9l-4 4V5zM9 9h6M9 12h4" />,
];

/* ——— Page ——— */
export default function LandingPage() {
  const { t, locale } = useI18n();
  const fmt = useFmt(locale);
  const live = useLivePrices(ALL.map((i) => i.s));
  const year = new Date().getFullYear();

  const NAV = [
    { id: "piyasalar", label: t("lp.nav.markets") },
    { id: "ozellikler", label: t("lp.nav.features") },
    { id: "nasil", label: t("lp.nav.how") },
    { id: "mobil", label: t("lp.nav.app") },
    { id: "sss", label: t("lp.nav.faq") },
  ];
  const instName = (i: Inst) => (i.nameKey ? t(i.nameKey) : i.name ?? i.label);

  return (
    <div className="fx-landing lp min-h-screen" data-fx-ui="landing-v2">
      <a href="#icerik" className="lp-skip">
        {t("lp.skip")}
      </a>

      {/* ——— Header ——— */}
      <header className="lp-header">
        <div className="fx-shell lp-header-row">
          <Link href="/" className="lp-brand" aria-label={t("landing.homeAria")}>
            <Logo />
          </Link>

          <nav className="lp-nav-desktop" aria-label={t("landing.mainMenu")}>
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="lp-nav-link">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="lp-header-actions">
            <LanguageSwitcher compact tone="light" className="lp-lang-desktop" />
            <Link href="/login" className="lp-btn lp-btn--ghost lp-btn--sm lp-hide-xs">
              {t("lp.cta.signin")}
            </Link>
            <Link href="/register" className="lp-btn lp-btn--primary lp-btn--sm">
              {t("lp.cta.open")}
            </Link>
          </div>
        </div>
        {/* Mobile navigation: an always-visible, horizontally scrollable link row (no dropdown menu). */}
        <nav className="lp-nav-mobile" aria-label={t("landing.mainMenu")}>
          <div className="lp-nav-mobile-track">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="lp-chip">
                {n.label}
              </a>
            ))}
            <LanguageSwitcher compact tone="light" />
          </div>
        </nav>
      </header>

      <main id="icerik" className="lp-main">
        {/* ——— Hero ——— */}
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="lp-hero-bg" aria-hidden />
          <div className="fx-shell lp-hero-grid">
            <div className="lp-hero-copy">
              <Eyebrow>{t("lp.hero.eyebrow")}</Eyebrow>

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

              <h1 id="hero-title" className="lp-h1">
                <span className="block">{t("lp.hero.title1")}</span>
                <span className="lp-h1-accent block">{t("lp.hero.title2")}</span>
              </h1>

              <p className="lp-lead">{t("lp.hero.sub")}</p>

              <div className="lp-cta-row">
                <Link href="/register" className="lp-btn lp-btn--primary lp-btn--lg">
                  {t("lp.cta.open")}
                  <Arrow />
                </Link>
                <Link href="/login" className="lp-btn lp-btn--ghost lp-btn--lg">
                  {t("lp.cta.signin")}
                </Link>
              </div>
              <p className="lp-hero-note">
                {t("lp.hero.note")}{" "}
                <a href="#piyasalar" className="lp-textlink">
                  {t("lp.cta.markets")}
                </a>
              </p>

              <div className="fx-trust-row mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                {[
                  { label: t("landing.trust.ing"), icon: "★" },
                  { label: t("landing.trust.symbols"), icon: "◆" },
                  { label: t("landing.trust.access"), icon: "●" },
                  { label: t("landing.trust.ssl"), icon: "▣" },
                  { label: t("landing.trust.pwa"), icon: "◈" },
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

            {/* Live market card: real quotes from the same feed as the terminal */}
            <div className="lp-hero-visual">
              <div className="lp-live-card" aria-labelledby="live-title">
                <div className="lp-live-head">
                  <p id="live-title" className="lp-live-title">
                    {t("lp.live.title")}
                  </p>
                  <span className="lp-live-badge">
                    <span className="lp-live-dot" aria-hidden />
                    {t("lp.live.badge")}
                  </span>
                </div>
                <div className="lp-live-cols" aria-hidden>
                  <span>{t("lp.live.col.symbol")}</span>
                  <span>{t("lp.live.col.price")}</span>
                  <span>{t("lp.live.col.change")}</span>
                </div>
                <ul className="lp-live-list">
                  {HERO.map((i) => (
                    <li key={i.s} className="lp-live-row">
                      <span className="lp-live-sym">
                        <SymbolIcon symbol={i.s} size={28} />
                        <span className="min-w-0">
                          <span className="lp-live-code">{i.label}</span>
                          <span className="lp-live-name">{instName(i)}</span>
                        </span>
                      </span>
                      <PriceCell inst={i} live={live} fmt={fmt} />
                    </li>
                  ))}
                </ul>
                <div className="lp-live-foot">
                  <span aria-live="polite">
                    {live.status === "error" && !live.updatedAt
                      ? t("lp.live.unavailable")
                      : live.updatedAt
                        ? `${t("lp.live.updated")} ${fmt.time(live.updatedAt)}`
                        : t("lp.live.loading")}
                  </span>
                  <Link href="/register" className="lp-live-cta">
                    {t("lp.live.trade")} <Arrow />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— Facts band ——— */}
        <section className="lp-facts" aria-label={t("lp.hero.eyebrow")}>
          <dl className="fx-shell lp-facts-grid">
            {(["classes", "symbols", "langs", "platforms"] as const).map((k) => (
              <div key={k} className="lp-fact">
                <dt className="lp-fact-v">{t(`lp.fact.${k}.v`)}</dt>
                <dd className="lp-fact-k">{t(`lp.fact.${k}.k`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ——— Markets overview ——— */}
        <section id="piyasalar" className="lp-section" aria-labelledby="markets-title">
          <div className="fx-shell">
            <div className="lp-section-head">
              <Eyebrow>{t("lp.markets.eyebrow")}</Eyebrow>
              <h2 id="markets-title" className="lp-h2">
                {t("lp.markets.title")}
              </h2>
              <p className="lp-body">{t("lp.markets.body")}</p>
            </div>

            <div className="lp-markets-grid">
              {CLASSES.map((c) => (
                <article key={c.id} className="lp-market-card" aria-labelledby={`mk-${c.id}`}>
                  <h3 id={`mk-${c.id}`} className="lp-market-title">
                    {t(`lp.class.${c.id}`)}
                  </h3>
                  <ul className="lp-market-list">
                    {c.items.map((i) => (
                      <li key={i.s} className="lp-market-row">
                        <span className="lp-market-sym">
                          <SymbolIcon symbol={i.s} size={24} />
                          <span className="min-w-0">
                            <span className="lp-market-code">{i.label}</span>
                            <span className="lp-market-name">{instName(i)}</span>
                          </span>
                        </span>
                        <span className="lp-market-q">
                          <PriceCell inst={i} live={live} fmt={fmt} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
              <div className="lp-market-card lp-market-card--cta">
                <p className="lp-market-cta-text">{t("lp.markets.body")}</p>
                <Link href="/register" className="lp-btn lp-btn--light lp-btn--md">
                  {t("lp.markets.cta")}
                  <Arrow />
                </Link>
              </div>
            </div>
            <p className="lp-fineprint">
              {live.status === "error" && !live.updatedAt ? t("lp.live.unavailable") : t("lp.live.disclaimer")}
            </p>
          </div>
        </section>

        {/* ——— Features ——— */}
        <section id="ozellikler" className="lp-section lp-section--soft" aria-labelledby="features-title">
          <div className="fx-shell">
            <div className="lp-section-head">
              <Eyebrow>{t("lp.features.eyebrow")}</Eyebrow>
              <h2 id="features-title" className="lp-h2">
                {t("lp.features.title")}
              </h2>
              <p className="lp-body">{t("lp.features.body")}</p>
            </div>
            <ul className="lp-features-grid">
              {FEATURE_ICONS.map((icon, idx) => (
                <li key={idx} className="lp-feature">
                  <span className="lp-feature-icon" aria-hidden>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      {icon}
                    </svg>
                  </span>
                  <h3 className="lp-h3">{t(`lp.f${idx + 1}.t`)}</h3>
                  <p className="lp-body-sm">{t(`lp.f${idx + 1}.d`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ——— How it works ——— */}
        <section id="nasil" className="lp-section" aria-labelledby="how-title">
          <div className="fx-shell">
            <div className="lp-section-head">
              <Eyebrow>{t("lp.how.eyebrow")}</Eyebrow>
              <h2 id="how-title" className="lp-h2">
                {t("lp.how.title")}
              </h2>
            </div>
            <ol className="lp-steps">
              {[1, 2, 3].map((n) => (
                <li key={n} className="lp-step">
                  <span className="lp-step-n" aria-hidden>
                    {String(n).padStart(2, "0")}
                  </span>
                  <h3 className="lp-h3">{t(`lp.s${n}.t`)}</h3>
                  <p className="lp-body-sm">{t(`lp.s${n}.d`)}</p>
                </li>
              ))}
            </ol>
            <div className="lp-cta-row lp-cta-row--center">
              <Link href="/register" className="lp-btn lp-btn--primary lp-btn--lg">
                {t("lp.cta.open")}
                <Arrow />
              </Link>
              <Link href="/login" className="lp-btn lp-btn--ghost lp-btn--lg">
                {t("lp.cta.signin")}
              </Link>
            </div>
          </div>
        </section>

        {/* ——— Mobile app ——— */}
        <section id="mobil" className="lp-section lp-app" aria-labelledby="app-title">
          <div className="fx-shell lp-app-grid">
            <div className="lp-app-copy">
              <Eyebrow tone="dark">{t("lp.app.eyebrow")}</Eyebrow>
              <h2 id="app-title" className="lp-h2 lp-h2--dark">
                {t("lp.app.title")}
              </h2>
              <p className="lp-body lp-body--dark">{t("lp.app.body")}</p>
              <ul className="lp-checks">
                {["b1", "b2", "b3"].map((b) => (
                  <li key={b}>
                    <span className="lp-check" aria-hidden>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </span>
                    {t(`lp.app.${b}`)}
                  </li>
                ))}
              </ul>
              <div className="lp-app-actions">
                <InstallAppButtons size="mobile" />
              </div>
            </div>
            <figure className="lp-app-visual">
              <PhonePreview />
              <figcaption className="lp-caption">{t("lp.app.sample")}</figcaption>
            </figure>
          </div>
        </section>

        {/* ——— FAQ: every question and answer is shown openly (no accordion) ——— */}
        <section id="sss" className="lp-section" aria-labelledby="faq-title">
          <div className="fx-shell">
            <div className="lp-section-head">
              <Eyebrow>{t("lp.faq.eyebrow")}</Eyebrow>
              <h2 id="faq-title" className="lp-h2">
                {t("lp.faq.title")}
              </h2>
            </div>
            <dl className="lp-faq">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="lp-faq-item">
                  <dt className="lp-faq-q">{t(`lp.q${n}`)}</dt>
                  <dd className="lp-faq-a">{t(`lp.a${n}`)}</dd>
                </div>
              ))}
            </dl>
            <p className="lp-fineprint lp-fineprint--center">{t("lp.faq.more")}</p>
          </div>
        </section>

        {/* ——— Final CTA ——— */}
        <section className="lp-final" aria-labelledby="final-title">
          <div className="fx-shell lp-final-inner">
            <div>
              <h2 id="final-title" className="lp-h2 lp-h2--dark">
                {t("lp.final.title")}
              </h2>
              <p className="lp-body lp-body--dark">{t("lp.final.body")}</p>
            </div>
            <div className="lp-cta-row">
              <Link href="/register" className="lp-btn lp-btn--light lp-btn--lg">
                {t("lp.cta.open")}
                <Arrow />
              </Link>
              <Link href="/login" className="lp-btn lp-btn--outline-dark lp-btn--lg">
                {t("lp.cta.signin")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ——— Footer ——— */}
      <footer className="lp-footer">
        <div className="fx-shell">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <Logo />
              <p className="lp-footer-tag">{t("lp.footer.tagline")}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-[12px] font-medium text-[#111111]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ing-logo.png" alt="ING" className="h-4 w-auto object-contain" />
              <span>in partnership with</span>
            </p>
            </div>
            <nav className="lp-footer-col" aria-label={t("lp.footer.platform")}>
              <p className="lp-footer-h">{t("lp.footer.platform")}</p>
              {NAV.map((n) => (
                <a key={n.id} href={`#${n.id}`}>
                  {n.label}
                </a>
              ))}
            </nav>
            <nav className="lp-footer-col" aria-label={t("lp.footer.account")}>
              <p className="lp-footer-h">{t("lp.footer.account")}</p>
              <Link href="/register">{t("lp.cta.open")}</Link>
              <Link href="/login">{t("lp.cta.signin")}</Link>
            </nav>
            <nav className="lp-footer-col" aria-label={t("lp.footer.apps")}>
              <p className="lp-footer-h">{t("lp.footer.apps")}</p>
              <a href="/downloads/7FX.apk">{t("lp.footer.android")}</a>
              <Link href="/ios">{t("lp.footer.ios")}</Link>
            </nav>
          </div>
          <p className="lp-risk">{t("lp.footer.risk")}</p>
          <div className="lp-footer-bottom">
            <p>
              © {year} 7FX · {t("lp.footer.rights")}
            </p>
            <LanguageSwitcher compact tone="light" />
          </div>
        </div>
      </footer>

      {/* Mobile CTA bar: always visible on small screens (no scroll-triggered slide-in). */}
      <div className="lp-sticky">
        <Link href="/login" className="lp-btn lp-btn--ghost lp-btn--md">
          {t("lp.cta.signin")}
        </Link>
        <Link href="/register" className="lp-btn lp-btn--primary lp-btn--md">
          {t("lp.cta.open")}
        </Link>
      </div>
    </div>
  );
}
