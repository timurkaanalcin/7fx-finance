"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import PhonePreview from "./PhonePreview";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const NAV = [
  { id: "piyasalar", label: "Piyasalar" },
  { id: "platform", label: "Platform" },
  { id: "hakkinda", label: "Hakkında" },
  { id: "nasil", label: "Nasıl çalışır" },
  { id: "sss", label: "SSS" },
  { id: "mobil", label: "Mobil" },
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
          <span className="text-[12px] font-semibold tracking-wide text-[#0b1220]">{r.s}</span>
          <span className="text-[12px] tabular-nums text-[#5c657a]">{r.p}</span>
          <span
            className={`min-w-[52px] rounded-md px-1.5 py-0.5 text-right text-[11px] font-semibold tabular-nums ${
              r.up ? "bg-[#16c784]/15 text-[#16c784]" : "bg-[#ea3943]/15 text-[#ea3943]"
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
        <span className="rounded-full bg-[#68F848]/15 px-2 py-0.5 text-[10px] font-semibold text-[#8CFF6E]">
          Market
        </span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-[10px] bg-[#16c784] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_6px_16px_rgba(22,199,132,0.28)]">
          AL
        </div>
        <div className="rounded-[10px] bg-[#ea3943] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_6px_16px_rgba(234,57,67,0.28)]">
          SAT
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-[#8b97b0]">
          <span>Lot</span>
          <span className="font-semibold text-[#e8eef8]">0.10</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#1f1f1f]">
          <div className="h-full w-[42%] rounded-full bg-[#68F848]" />
        </div>
        <div className="flex justify-between text-[10px] text-[#8b97b0]">
          <span>Kaldıraç</span>
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
        <div className="fx-orbit absolute inset-0 rounded-full border border-dashed border-[#68F848]/30" />
        <div className="fx-orbit fx-orbit--slow absolute inset-3 rounded-full border border-[#68F848]/15" />
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#68F848] shadow-[0_12px_32px_rgba(104,248,72,0.4)]">
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
        <span className="fx-orbit-dot absolute left-2 top-8 h-2 w-2 rounded-full bg-[#68F848]" />
        <span className="fx-orbit-dot fx-orbit-dot--2 absolute bottom-4 right-3 h-1.5 w-1.5 rounded-full bg-[#8CFF6E]" />
      </div>
      <p className="mt-3 text-center text-[12px] font-medium text-[#5c657a]">
        Oturum korumalı · SSL
      </p>
    </div>
  );
}

function PortfolioBoard() {
  const bars = [
    { h: 42, c: "#2a3a6a" },
    { h: 58, c: "#3a5288" },
    { h: 48, c: "#4a6ab0" },
    { h: 72, c: "#68F848" },
    { h: 64, c: "#6a92ff" },
    { h: 88, c: "#68F848" },
    { h: 76, c: "#5a86f5" },
    { h: 94, c: "#68F848" },
  ];
  const alloc = [
    { name: "Döviz", pct: 34, color: "#68F848" },
    { name: "Emtia", pct: 22, color: "#8CFF6E" },
    { name: "Endeks", pct: 28, color: "#16c784" },
    { name: "Kripto", pct: 16, color: "#8b97b0" },
  ];
  return (
    <div className="fx-portfolio-board rounded-[16px] border border-[#2a2a2a] bg-[#0a0a0a] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b97b0]">
            Portföy özeti
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[#e8eef8] tabular-nums">
            ₺128.450
          </p>
        </div>
        <span className="rounded-full bg-[#16c784]/15 px-3 py-1 text-[12px] font-semibold text-[#16c784]">
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
      { s: "XAUUSD", name: "Altın Ons", p: "2.341,20", d: "+0.32%", up: true },
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
        title: "Canlı piyasa görünümü",
        body: "Döviz, emtia, endeks ve kripto araçlarını tek listede izleyin. Fiyat ve değişim net tablolarla.",
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
        title: "Hızlı emir paneli",
        body: "Al / Sat butonları, lot ve kaldıraç ayarları sade bir bilet arayüzünde bir arada.",
        visual: <OrderTicketVisual />,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3v18M8 8l4-4 4 4M8 16l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        key: "security",
        title: "Güvenli oturum",
        body: "Kimlik doğrulama oturum çerezleri ile çalışır. Hassas alanlar koruma altındadır.",
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
      { k: "7/24", v: "Platform erişimi", d: "Web üzerinden her an takip" },
      { k: "Tek ekran", v: "Birleşik terminal", d: "Fiyat, emir ve bakiye birlikte" },
      { k: "Çoklu varlık", v: "Geniş sembol seti", d: "Döviz · emtia · endeks · kripto" },
      { k: "PWA", v: "Mobil uyumlu", d: "Telefon ve tablet öncelikli" },
    ],
    []
  );

  const steps = useMemo(
    () => [
      {
        n: "01",
        t: "Hesap oluşturun",
        d: "Kayıt formunu doldurun, yönlendirme kodunuz varsa girin ve hesabınızı açın.",
      },
      {
        n: "02",
        t: "Piyasaları inceleyin",
        d: "İzleme listesi ve canlı fiyatlarla ilgilendiğiniz sembolleri takip edin.",
      },
      {
        n: "03",
        t: "İşlem terminaline geçin",
        d: "Giriş sonrası trade ekranında emir verin, bakiyenizi yönetin.",
      },
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        q: "7FX hangi varlıkları sunuyor?",
        a: "7FX üzerinden hisse / endeks, kripto, forex (döviz) ve emtia (altın, petrol vb.) araçlarını tek hesapta takip edebilirsiniz. Gösterilen fiyatlar örnek / bilgilendirme amaçlıdır.",
      },
      {
        q: "Nasıl hesap açabilirim?",
        a: "Hesap aç butonuyla kayıt sayfasına gidin. Gerekli alanları doldurun; yönlendirme kodu ayarı açıksa kod girmeniz istenir.",
      },
      {
        q: "Mobil cihazlarda çalışır mı?",
        a: "Evet. Landing, giriş ve işlem arayüzleri mobil öncelikli tasarlandı. Modern tarayıcılarda PWA benzeri bir deneyim sunulur.",
      },
      {
        q: "Oturum güvenliği nasıl sağlanır?",
        a: "Kimlik doğrulama oturum çerezleri ile yapılır. Hassas işlem ve yönetim sayfaları oturum kontrolü altındadır; demo şifre paylaşılmaz.",
      },
      {
        q: "Admin ve yatırımcı ekranları farklı mı?",
        a: "Evet. ADMIN rolü /admin paneline, diğer hesaplar /trade işlem terminaline yönlendirilir.",
      },
    ],
    []
  );

  return (
    <div className="fx-landing min-h-screen" data-fx-ui="landing-light">
      <a
        href="/login"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#68F848] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Giriş sayfasına geç
      </a>

      {/* ——— Header ——— */}
      <header className="fx-nav sticky top-0 z-50">
        <div className="fx-shell flex h-14 items-center justify-between gap-4 sm:h-[4.25rem]">
          <Link href="/" className="flex items-center no-underline" aria-label="7FX ana sayfa">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="7FX" className="fx-nav-logo h-9 w-auto object-contain sm:h-9" />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Ana menü">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#5c657a] transition hover:bg-[#f0f0f0] hover:text-[#0b1220]"
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
              Giriş
            </Link>
            <Link
              href="/register"
              className="fx-btn-primary rounded-full px-4 py-2 text-[13px] font-semibold"
            >
              Hesap aç
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(16,20,37,0.12)] bg-white text-[#0b1220] lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
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
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-[#0b1220] hover:bg-[#f0f0f0]"
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
                className="mt-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#68F848]"
                onClick={() => setMenuOpen(false)}
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#5c657a]"
                onClick={() => setMenuOpen(false)}
              >
                Hesap aç
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
              <Eyebrow>Çok varlık yatırım platformu</Eyebrow>

              <h1 id="hero-title" className="fx-h1 mt-5">
                Yatırıma 7FX ile
                <span className="fx-accent-line mt-1 block">daha net başlayın</span>
              </h1>

              <p className="fx-hero-body mt-6">
                7FX; hisse senedi, kripto, forex ve emtia piyasalarına tek hesaptan erişim sunan
                uluslararası bir ticaret platformudur. Kurumsal güvenlik standartları, sade arayüz ve
                mobil öncelikli deneyimle kararlarınızı net bir ekranda alın.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="fx-btn-primary inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-[14px] font-semibold sm:min-h-[52px] sm:px-8 sm:text-[15px]"
                >
                  Hesap aç
                </Link>
                <Link
                  href="/login"
                  className="fx-btn-secondary inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-[14px] font-semibold sm:min-h-[52px] sm:px-8 sm:text-[15px]"
                >
                  Giriş yap
                </Link>
              </div>

              <div className="fx-trust-row mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                {[
                  { label: "40+ sembol", icon: "◆" },
                  { label: "7/24 erişim", icon: "●" },
                  { label: "SSL oturum", icon: "▣" },
                  { label: "PWA uyumlu", icon: "◈" },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-[13px] text-[#5c657a]">
                    <span className="text-[10px] text-[#68F848]" aria-hidden>
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
          aria-label="Örnek piyasalar"
        >
          <div className="fx-shell flex items-center justify-between gap-4 pt-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c657a]">
              Piyasalar · örnek / gösterim amaçlı
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
                  <span className="font-semibold text-[#0b1220]">{m.s}</span>
                  <span className="fx-ticker-name text-[12px] text-[#5c657a]">{m.name}</span>
                  <span className="tabular-nums text-[#5c657a]">{m.p}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                      m.up
                        ? "bg-[#16c784]/15 text-[#16c784]"
                        : "bg-[#ea3943]/15 text-[#ea3943]"
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
                Yatırım araçları,
                <br className="hidden sm:block" /> tek bakışta
              </h2>
              <p className="fx-section-body mt-4 max-w-[560px]">
                7FX; canlı fiyat görünümü, sade emir paneli ve güvenli oturum ile bireysel ve
                kurumsal yatırımcılara net bir çok varlık deneyimi sunar. Forex, hisse, kripto ve
                emtia araçlarını tek terminalde izleyin; bakiyenizi ve pozisyonlarınızı aynı ekrandan yönetin.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {platformCards.map((card) => (
                <article
                  key={card.key}
                  className="fx-feature-card flex min-h-[320px] flex-col rounded-[16px] p-5 sm:min-h-[380px] sm:p-7"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#68F848]/12 text-[#68F848]">
                    {card.icon}
                  </div>
                  <h3 className="text-[20px] font-semibold tracking-tight text-[#0b1220]">
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


        {/* ——— Hakkında / kurumsal açıklama ——— */}
        <section id="hakkinda" className="fx-section fx-section--soft border-y border-[rgba(16,20,37,0.08)]" aria-labelledby="about-title">
          <div className="fx-shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
            <div>
              <Eyebrow>Hakkında</Eyebrow>
              <h2 id="about-title" className="fx-h2 mt-4">
                7FX nedir?
              </h2>
              <p className="fx-section-body mt-5 max-w-[540px]">
                7FX, küresel piyasalara web üzerinden erişim sağlayan uluslararası bir broker /
                ticaret platformudur. Amacımız; yatırımcıların hisse senedi, kripto para, forex ve
                emtia piyasalarını tek hesap altında, şeffaf ve kontrollü bir ortamda takip
                edebilmesidir.
              </p>
              <p className="fx-section-body mt-4 max-w-[540px]">
                Platform; güvenli oturum altyapısı, SSL korumalı bağlantı ve rol tabanlı erişim ile
                tasarlanmıştır. Destek ekibimiz hesap, para yatırma / çekme ve işlem süreçlerinde
                yanınızdadır — web üzerinden 7/24 platform erişimi sunulur.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  t: "Piyasalar",
                  d: "Forex çiftleri, hisse ve endeksler, kripto varlıklar ile altın / petrol gibi emtialar.",
                },
                {
                  t: "Güvenlik",
                  d: "Oturum çerezi ile kimlik doğrulama, korumalı yönetim alanları ve SSL bağlantı.",
                },
                {
                  t: "Destek",
                  d: "Hesap açılışı, bakiye işlemleri ve terminal kullanımı için platform içi destek.",
                },
                {
                  t: "Erişim",
                  d: "Masaüstü ve mobil tarayıcıda çalışan, PWA uyumlu çok varlık web terminali.",
                },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-[14px] border border-[rgba(16,20,37,0.08)] bg-white p-5 shadow-[0_8px_24px_rgba(16,20,37,0.04)]"
                >
                  <p className="text-[13px] font-semibold tracking-tight text-[#0b1220]">{c.t}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#5c657a]">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Detail band: 4 stats ——— */}
        <section className="border-y border-[rgba(16,20,37,0.08)] bg-[#ffffff]" aria-label="Öne çıkanlar">
          <div className="fx-shell grid grid-cols-2 gap-x-5 gap-y-8 py-12 sm:gap-8 sm:py-14 lg:grid-cols-4 lg:py-16">
            {stats.map((s) => (
              <div key={s.k} className="fx-stat">
                <p className="text-[22px] font-semibold tracking-tight text-[#0b1220] sm:text-[26px]">
                  {s.k}
                </p>
                <p className="mt-1 text-[14px] font-semibold text-[#3DB82A]">{s.v}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#5c657a]">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ——— How it works ——— */}
        <section id="nasil" className="fx-section">
          <div className="fx-shell">
            <div className="mb-12 max-w-2xl sm:mb-14">
              <Eyebrow>Nasıl çalışır</Eyebrow>
              <h2 className="fx-h2 mt-4">Üç adımda terminale</h2>
              <p className="fx-section-body mt-4 max-w-[520px]">
                Kayıttan canlı fiyatlara ve emir paneline kadar akış sade tutuldu.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step, i) => (
                <article
                  key={step.n}
                  className="fx-step relative rounded-[16px] border border-[rgba(16,20,37,0.08)] bg-white p-6 shadow-[0_12px_32px_rgba(16,20,37,0.06)] sm:p-7"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#68F848]/12 text-[13px] font-bold text-[#68F848]">
                    {step.n}
                  </span>
                  {i < steps.length - 1 && (
                    <span
                      className="absolute right-[-12px] top-12 z-10 hidden h-px w-6 bg-[rgba(16,20,37,0.12)] md:block"
                      aria-hidden
                    />
                  )}
                  <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-[#0b1220]">
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
              <Eyebrow>Portföy görünümü</Eyebrow>
              <h2 className="fx-h2 mt-4">
                Dağılımı ve
                <br className="hidden sm:block" /> trendi tek yerde görün
              </h2>
              <p className="fx-section-body mt-4 max-w-[480px]">
                Bakiye, varlık dağılımı ve örnek performans çubukları ile portföyünüzü sade bir
                panelde takip edin. Veriler gösterim amaçlıdır.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Varlık sınıflarına göre dağılım çubukları",
                  "Haftalık örnek performans görseli",
                  "Mobil ve masaüstünde tutarlı düzen",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-[#5c657a]">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#68F848]/12 text-[10px] font-bold text-[#68F848]"
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

        {/* ——— FAQ ——— */}
        <section id="sss" className="fx-section">
          <div className="fx-shell">
            <div className="mb-10 max-w-2xl sm:mb-12">
              <Eyebrow>SSS</Eyebrow>
              <h2 className="fx-h2 mt-4">Sık sorulan sorular</h2>
            </div>
            <div className="mx-auto max-w-3xl space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="fx-faq group rounded-[14px] border border-[rgba(16,20,37,0.08)] bg-white px-5 py-1 shadow-[0_8px_24px_rgba(16,20,37,0.05)]"
                >
                  <summary className="cursor-pointer list-none py-4 text-[15px] font-semibold text-[#0b1220] outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {f.q}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] text-[#68F848] transition group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="pb-4 text-[14px] leading-relaxed text-[#5c657a]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Mobile band ——— */}
        <section id="mobil" className="fx-mobile-band border-y border-[rgba(16,20,37,0.08)] bg-[#ffffff]">
          <div className="fx-shell grid gap-8 py-16 sm:gap-12 sm:py-[85px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-[110px]">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#68F848]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#68F848] shadow-[0_0_8px_rgba(104,248,72,0.45)]" aria-hidden />
                Mobil deneyim
              </p>
              <h2 className="mt-4 text-[clamp(30px,8vw,48px)] font-semibold leading-[1.08] tracking-[-0.05em] text-[#0b1220]">
                Her yerden takip edin
              </h2>
              <p className="mt-4 max-w-[480px] text-[14px] leading-relaxed text-[#5c657a]">
                Landing ve auth sayfaları mobil öncelikli tasarlandı. Terminal deneyimi web
                üzerinden erişilebilir; portföy bakiyesi ve izleme listesi tek bakışta.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Responsive header ve hamburger menü",
                  "Telefon önizlemesi ile portföy görünümü",
                  "Giriş / kayıt CTA’ları her ekranda erişilebilir",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-[#5c657a]">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#68F848]/12 text-[10px] font-bold text-[#68F848]"
                      aria-hidden
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="fx-btn-primary mt-9 inline-flex min-h-[48px] items-center rounded-full px-7 text-sm font-semibold"
              >
                Hesap aç
              </Link>
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
                  <span className="rounded-full bg-[#68F848]/12 px-3 py-1 text-[11px] font-semibold text-[#68F848]">
                    Web uygulama
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { t: "Canlı fiyatlar", d: "İzleme listesi" },
                    { t: "Emir paneli", d: "Al / Sat" },
                    { t: "Portföy", d: "Bakiye & P&L" },
                  ].map((row) => (
                    <div
                      key={row.t}
                      className="flex items-center justify-between rounded-2xl border border-[rgba(16,20,37,0.08)] bg-[#ffffff] px-4 py-3.5"
                    >
                      <div>
                        <p className="text-[14px] font-semibold text-[#0b1220]">{row.t}</p>
                        <p className="text-[12px] text-[#5c657a]">{row.d}</p>
                      </div>
                      <span className="text-[#68F848]" aria-hidden>
                        →
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#68F848] px-4 py-3.5 shadow-[0_10px_28px_rgba(104,248,72,0.35)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/7fx-mark.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
                  <div>
                    <p className="text-[13px] font-semibold text-white">7FX ile devam edin</p>
                    <p className="text-[11px] text-white/70">Giriş veya hesap oluşturun</p>
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
              <h2 className="fx-h2">Hazır olduğunuzda başlayın</h2>
              <p className="fx-section-body mt-3 max-w-lg">
                Hesap oluşturun veya mevcut hesabınızla giriş yapın. Destek için platform içi
                kanalları kullanın.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="fx-btn-primary inline-flex min-h-[48px] items-center rounded-full px-7 text-sm font-semibold"
              >
                Hesap aç
              </Link>
              <Link
                href="/login"
                className="fx-btn-secondary inline-flex min-h-[48px] items-center rounded-full px-7 text-sm font-semibold"
              >
                Giriş
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
              7FX — uluslararası çok varlık ticaret platformu. Hisse, kripto, forex ve emtia
              piyasalarına güvenli web erişimi. Fiyatlar örnek / gösterim amaçlıdır.
            </p>
            <p className="mt-3 text-[12px]">© {new Date().getFullYear()} 7FX</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-[13px]">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b1220]">
                Platform
              </span>
              <button type="button" className="text-left hover:text-[#0b1220]" onClick={() => scrollToId("piyasalar")}>
                Piyasalar
              </button>
              <button type="button" className="text-left hover:text-[#0b1220]" onClick={() => scrollToId("platform")}>
                Özellikler
              </button>
              <button type="button" className="text-left hover:text-[#0b1220]" onClick={() => scrollToId("hakkinda")}>
                Hakkında
              </button>
              <button type="button" className="text-left hover:text-[#0b1220]" onClick={() => scrollToId("sss")}>
                SSS
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b1220]">
                Hesap
              </span>
              <Link href="/login" className="hover:text-[#0b1220]">
                Giriş
              </Link>
              <Link href="/register" className="hover:text-[#0b1220]">
                Hesap aç
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
            Giriş
          </Link>
          <Link
            href="/register"
            tabIndex={showStickyCta ? 0 : -1}
            className="fx-btn-primary inline-flex h-9 flex-[1.2] items-center justify-center rounded-full text-[12.5px] font-semibold"
          >
            Hesap aç
          </Link>
        </div>
      </div>
    </div>
  );
}
