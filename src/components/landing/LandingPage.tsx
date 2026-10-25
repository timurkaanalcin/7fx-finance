"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";
import BrandLogo, { IngMark } from "@/components/landing/BrandLogo";

const InstallAppButtons = dynamic(() => import("@/components/landing/InstallAppButtons"));
const SponsorsSection = dynamic(() => import("@/components/landing/SponsorsSection"));
const LicensesSection = dynamic(() => import("@/components/landing/LicensesSection"));
const LiveHeroChart = dynamic(() => import("@/components/landing/LiveMarkets").then((m) => m.LiveHeroChart), {
  loading: () => <div className="fx-chart-slot" aria-hidden />,
});
const LiveTape = dynamic(() => import("@/components/landing/LiveMarkets").then((m) => m.LiveTape), {
  loading: () => <div className="fx-ticker fx-ticker--slot" aria-hidden />,
});
const MarketBoard = dynamic(() => import("@/components/landing/LiveMarkets").then((m) => m.MarketBoard), {
  loading: () => <div className="fx-market-slot" aria-hidden />,
});
const ProductStage = dynamic(() => import("@/components/landing/ProductStage"), {
  loading: () => <div className="fx-stage-slot" aria-hidden />,
});
const TerminalLoop = dynamic(() => import("@/components/landing/TerminalLoop"), {
  loading: () => <div className="fx-screen-slot" aria-hidden />,
});
const HeroAtmosphere = dynamic(() => import("@/components/landing/HeroAtmosphere"), {
  ssr: false,
  loading: () => null,
});
const FeatureDeck = dynamic(() => import("@/components/landing/LiveMarkets").then((m) => m.FeatureDeck), {
  loading: () => <div className="fx-feature-slot" aria-hidden />,
});

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="fx-eyebrow inline-flex items-center gap-2">
      <span className="fx-eyebrow-dot" aria-hidden />
      {children}
    </p>
  );
}

export default function LandingPage() {
  const { t } = useI18n();
  const NAV = [
    { id: "markets", label: t("landing.nav.markets") },
    { id: "platform", label: t("landing.nav.platform") },
    { id: "mobile", label: t("landing.nav.mobile") },
    { id: "security", label: t("landing.nav.security") },
    { id: "how", label: t("landing.nav.how") },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [siteHost, setSiteHost] = useState("");
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setSiteHost(window.location.host);
  }, []);

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

  const steps = useMemo(
    () => [
      { n: "01", title: t("landing.step1.t"), body: t("landing.step1.d") },
      { n: "02", title: t("landing.step2.t"), body: t("landing.step2.d") },
      { n: "03", title: t("landing.step3.t"), body: t("landing.step3.d") },
    ],
    [t]
  );

  return (
    <div className="fx-landing min-h-screen" data-fx-ui="landing-dark">
      <a href="/login" className="fx-skip">
        {t("landing.skipLogin")}
      </a>

      <header className="fx-nav sticky top-0 z-50">
        <div className="fx-shell flex h-14 items-center justify-between gap-3 sm:h-16">
          <Link href="/" className="fx-logo-lockup flex items-center no-underline" aria-label={t("landing.homeAria")}>
            <BrandLogo priority className="fx-nav-logo h-8 w-auto sm:h-9" height={36} />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t("landing.mainMenu")}>
            {NAV.map((item) => (
              <button key={item.id} type="button" className="fx-nav-link" onClick={() => scrollToId(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact tone="dark" />
            <Link href="/login" data-fx-cta="sign-in" className="fx-btn-secondary hidden min-h-10 items-center rounded-full px-4 py-2 text-[13px] font-medium sm:inline-flex">
              {t("landing.signIn")}
            </Link>
            <Link href="/register" data-fx-cta="open" className="fx-btn-primary inline-flex min-h-10 items-center rounded-full px-4 py-2 text-[13px] font-medium">
              {t("landing.openAccount")}
            </Link>
            <button
              type="button"
              className="fx-icon-btn lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t("landing.menu.close") : t("landing.menu.open")}
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

        {menuOpen ? (
          <div className="fx-mobile-menu lg:hidden">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  scrollToId(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
            <Link href="/login" data-fx-cta="sign-in" onClick={() => setMenuOpen(false)}>
              {t("landing.signIn")}
            </Link>
          </div>
        ) : null}
      </header>

      <main>
        <section ref={heroRef} className="fx-hero" aria-labelledby="hero-title">
          <HeroAtmosphere />
          <div className="fx-hero-glow" aria-hidden />
          <div className="fx-shell fx-hero-grid">
            <div className="fx-reveal max-w-[640px]">
              <div className="flex flex-wrap items-center gap-3">
                <Eyebrow>{t("landing.eyebrow.hero")}</Eyebrow>
                <p className="fx-ing-pill" aria-label={t("landing.trust.ing")}>
                  <IngMark className="h-4 w-auto object-contain" height={16} />
                  <span>{t("landing.partnership")}</span>
                </p>
              </div>
              <h1 id="hero-title" className="fx-h1 mt-5">
                {t("landing.heroTitle")}
              </h1>
              <p className="fx-hero-body mt-5">{t("landing.heroBody")}</p>
              <div className="fx-cta-row mt-8" data-fx-hero-cta="">
                <Link href="/register" data-fx-cta="open" className="fx-btn-primary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-[15px] font-medium">
                  {t("landing.openAccount")}
                </Link>
                <Link href="/login" data-fx-cta="sign-in" className="fx-btn-secondary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-[15px] font-medium">
                  {t("landing.signIn")}
                </Link>
              </div>
              <p className="fx-cta-hint">{t("landing.cta.hint")}</p>
            </div>
            <LiveHeroChart />
          </div>
        </section>

        <LiveTape />

        <section className="fx-trust-band" aria-label={t("landing.trust.label")} data-fx-trust="">
          <ul className="fx-shell">
            {[
              t("landing.trust.symbols"),
              t("landing.trust.access"),
              t("landing.trust.ssl"),
              t("landing.trust.pwa"),
            ].map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </section>

        <section id="markets" className="fx-section" aria-labelledby="markets-title">
          <div className="fx-shell">
            <Eyebrow>{t("landing.marketsTitle")}</Eyebrow>
            <h2 id="markets-title" className="fx-h2 mt-4">
              {t("landing.marketsTitle")}
            </h2>
            <p className="fx-section-body mt-4 max-w-[640px]">{t("landing.markets.lead")}</p>
            <div className="mt-8">
              <MarketBoard />
            </div>
            <div className="fx-mid-cta">
              <div>
                <p className="fx-mid-cta-title">{t("landing.ctaTitle")}</p>
                <p>{t("landing.ctaBody")}</p>
              </div>
              <div className="fx-cta-row">
                <Link href="/register" data-fx-cta="open" className="fx-btn-primary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-medium">
                  {t("landing.openAccount")}
                </Link>
                <Link href="/login" data-fx-cta="sign-in" className="fx-btn-secondary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-medium">
                  {t("landing.signIn")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <TerminalLoop />

        <section id="platform" className="fx-section fx-section--soft" aria-labelledby="platform-title">
          <div className="fx-shell">
            <Eyebrow>{t("landing.nav.platform")}</Eyebrow>
            <h2 id="platform-title" className="fx-h2 mt-4">
              {t("landing.aboutTitle")}
            </h2>
            <p className="fx-section-body mt-4 max-w-[680px]">{t("landing.aboutP1")}</p>
            <div className="fx-feature-grid" data-fx-feature="">
              <FeatureDeck />
            </div>
            <ProductStage />
          </div>
        </section>

        <section id="mobile" className="fx-section" aria-labelledby="mobile-title">
          <div className="fx-shell fx-split">
            <div>
              <Eyebrow>{t("landing.mobileEyebrow")}</Eyebrow>
              <h2 id="mobile-title" className="fx-h2 mt-4">
                {t("landing.mobileTitle")}
              </h2>
              <p className="fx-section-body mt-4">{t("landing.mobileBody")}</p>
              <ul className="fx-check-list">
                {[t("landing.mobile.b1"), t("landing.mobile.b2"), t("landing.mobile.b3"), t("landing.mobile.b4")].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <InstallAppButtons size="mobile" />
                <Link href="/ios" className="fx-btn-secondary inline-flex min-h-12 items-center rounded-full px-5 text-sm font-medium">
                  {t("landing.ios.pageTitle")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="fx-section fx-section--soft" aria-labelledby="security-title">
          <div className="fx-shell">
            <Eyebrow>{t("landing.security.eyebrow")}</Eyebrow>
            <h2 id="security-title" className="fx-h2 mt-4">
              {t("landing.securityTitle")}
            </h2>
            <p className="fx-section-body mt-4 max-w-[640px]">{t("landing.securityBody")}</p>
            <div className="fx-feature-grid">
              {[
                { title: t("landing.sec.ssl.t"), body: t("landing.sec.ssl.d") },
                { title: t("landing.sec.seg.t"), body: t("landing.sec.seg.d") },
                { title: t("landing.sec.kyc.t"), body: t("landing.sec.kyc.d") },
                { title: t("landing.sec.access.t"), body: t("landing.sec.access.d") },
              ].map((card) => (
                <article key={card.title} className="fx-feature-card" data-fx-feature="">
                  <h3 className="font-medium">{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="fx-section" aria-labelledby="how-title">
          <div className="fx-shell">
            <Eyebrow>{t("landing.nav.how")}</Eyebrow>
            <h2 id="how-title" className="fx-h2 mt-4">
              {t("landing.howTitle")}
            </h2>
            <ol className="fx-steps">
              {steps.map((step) => (
                <li key={step.n}>
                  <span>{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="infrastructure" className="fx-section fx-section--soft" aria-labelledby="infra-title">
          <div className="fx-shell">
            <Eyebrow>{t("landing.infra.eyebrow")}</Eyebrow>
            <h2 id="infra-title" className="fx-h2 mt-4">
              {t("landing.infraTitle")}
            </h2>
            <p className="fx-section-body mt-4 max-w-[640px]">{t("landing.infraBody")}</p>
            <ul className="fx-infra">
              {[
                { name: "Railway", role: t("landing.role.hosting") },
                { name: "Yahoo Finance", role: t("landing.role.data") },
                { name: "TradingView Lightweight Charts", role: t("landing.role.charts") },
                { name: "MySQL", role: t("landing.role.db") },
                { name: "Prisma", role: t("landing.role.orm") },
                { name: "Next.js", role: t("landing.webApp") },
              ].map((item) => (
                <li key={item.name}>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <LicensesSection />
        <SponsorsSection />

        <section className="fx-final" aria-labelledby="cta-title">
          <div className="fx-shell fx-final-inner">
            <div>
              <h2 id="cta-title" className="fx-h2">
                {t("landing.ctaTitle")}
              </h2>
              <p className="fx-section-body mt-3 max-w-lg">{t("landing.ctaBody")}</p>
            </div>
            <div className="fx-cta-row">
              <Link href="/register" data-fx-cta="open" className="fx-btn-primary inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-medium">
                {t("landing.openAccount")}
              </Link>
              <Link href="/login" data-fx-cta="sign-in" className="fx-btn-secondary inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-medium">
                {t("landing.signIn")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="fx-footer">
        <div className="fx-shell fx-footer-grid">
          <div>
            <BrandLogo className="fx-nav-logo h-7 w-auto" height={28} />
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed">{t("landing.footer.blurb")}</p>
            <p className="fx-ing-pill mt-4">
              <IngMark className="h-4 w-auto object-contain" height={16} />
              <span>{t("landing.partnership")}</span>
            </p>
            <p className="mt-3 text-[12px]">© {new Date().getFullYear()} 7FX</p>
          </div>
          <div className="fx-footer-links">
            <div>
              <span>{t("landing.nav.platform")}</span>
              <button type="button" onClick={() => scrollToId("markets")}>
                {t("landing.marketsTitle")}
              </button>
              <button type="button" onClick={() => scrollToId("platform")}>
                {t("landing.footer.features")}
              </button>
              <button type="button" onClick={() => scrollToId("security")}>
                {t("landing.nav.security")}
              </button>
            </div>
            <div>
              <span>{t("term.account")}</span>
              <Link href="/login" data-fx-cta="sign-in">{t("landing.signIn")}</Link>
              <Link href="/register" data-fx-cta="open">{t("landing.openAccount")}</Link>
              <Link href="/markets">{t("landing.nav.markets")}</Link>
              <Link href="/platform">{t("landing.nav.platform")}</Link>
              <Link href="/faq">{t("landing.nav.faq")}</Link>
              <Link href="/ios">{t("landing.ios.pageTitle")}</Link>
              {siteHost ? <span className="fx-host">{siteHost}</span> : null}
            </div>
          </div>
        </div>
        <div className="fx-shell">
          <p className="fx-risk" data-fx-risk="">
            {t("landing.footer.risk")}
          </p>
        </div>
      </footer>

      <div
        className={`fx-sticky-cta md:hidden ${showStickyCta ? "is-on" : ""}`}
        aria-hidden={!showStickyCta}
      >
        <Link href="/register" data-fx-cta="open" tabIndex={showStickyCta ? 0 : -1} className="fx-btn-primary">
          {t("landing.openAccount")}
        </Link>
        <Link href="/login" data-fx-cta="sign-in" tabIndex={showStickyCta ? 0 : -1} className="fx-btn-secondary">
          {t("landing.signIn")}
        </Link>
      </div>
    </div>
  );
}
