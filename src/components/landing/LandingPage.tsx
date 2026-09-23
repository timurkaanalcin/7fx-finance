"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import PhonePreview from "./PhonePreview";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const NAV = [
  { id: "piyasalar", label: "Piyasalar" },
  { id: "platform", label: "Platform" },
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
          <span className="text-[12px] font-semibold tracking-wide text-white/90">{r.s}</span>
          <span className="text-[12px] tabular-nums text-white/55">{r.p}</span>
          <span
            className={`min-w-[52px] rounded-md px-1.5 py-0.5 text-right text-[11px] font-semibold tabular-nums ${
              r.up ? "bg-[#12a454]/20 text-[#5dff9a]" : "bg-[#e5484d]/20 text-[#ff8a8f]"
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
    <div className="fx-viz-order mt-auto rounded-[16px] border border-[#e6e9f2] bg-[#f8f9fc] p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-[#687087]">EURUSD</p>
          <p className="text-[15px] font-semibold tabular-nums text-[#101425]">1.0842</p>
        </div>
        <span className="rounded-full bg-[#3558F4]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3558F4]">
          Market
        </span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#12a454] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_6px_16px_rgba(18,164,84,0.28)]">
          AL
        </div>
        <div className="rounded-xl bg-[#e5484d] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_6px_16px_rgba(229,72,77,0.28)]">
          SAT
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-[#687087]">
          <span>Lot</span>
          <span className="font-semibold text-[#101425]">0.10</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e6e9f2]">
          <div className="h-full w-[42%] rounded-full bg-[#3558F4]" />
        </div>
        <div className="flex justify-between text-[10px] text-[#687087]">
          <span>Kaldıraç</span>
          <span className="font-semibold text-[#101425]">1:100</span>
        </div>
      </div>
    </div>
  );
}

function SecurityBadgeVisual() {
  return (
    <div className="fx-viz-security mt-auto flex flex-col items-center justify-center py-2">
      <div className="relative flex h-[120px] w-[120px] items-center justify-center">
        <div className="fx-orbit absolute inset-0 rounded-full border border-dashed border-[#3558F4]/25" />
        <div className="fx-orbit fx-orbit--slow absolute inset-3 rounded-full border border-[#3558F4]/15" />
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3558F4] shadow-[0_12px_32px_rgba(53,88,244,0.35)]">
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
        <span className="fx-orbit-dot absolute left-2 top-8 h-2 w-2 rounded-full bg-[#3558F4]" />
        <span className="fx-orbit-dot fx-orbit-dot--2 absolute bottom-4 right-3 h-1.5 w-1.5 rounded-full bg-[#5b7bff]" />
      </div>
      <p className="mt-3 text-center text-[12px] font-medium text-[#687087]">
        Oturum korumalı · SSL
      </p>
    </div>
  );
}

function PortfolioBoard() {
  const bars = [
    { h: 42, c: "#c5d0ff" },
    { h: 58, c: "#9aafff" },
    { h: 48, c: "#7a95ff" },
    { h: 72, c: "#3558F4" },
    { h: 64, c: "#5b7bff" },
    { h: 88, c: "#3558F4" },
    { h: 76, c: "#4a6af5" },
    { h: 94, c: "#3558F4" },
  ];
  const alloc = [
    { name: "Döviz", pct: 34, color: "#3558F4" },
    { name: "Emtia", pct: 22, color: "#5b7bff" },
    { name: "Endeks", pct: 28, color: "#12a454" },
    { name: "Kripto", pct: 16, color: "#687087" },
  ];
  return (
    <div className="fx-portfolio-board rounded-[23px] border border-[#e6e9f2] bg-white p-6 shadow-[0_20px_60px_rgba(16,20,37,0.08)] sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#687087]">
            Portföy özeti
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[#101425] tabular-nums">
            ₺128.450
          </p>
        </div>
        <span className="rounded-full bg-[#12a454]/12 px-3 py-1 text-[12px] font-semibold text-[#12a454]">
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
              <span className="font-medium text-[#101425]">{a.name}</span>
              <span className="tabular-nums text-[#687087]">%{a.pct}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eef0f6]">
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
        dark: true,
        title: "Canlı piyasa görünümü",
        body: "Döviz, emtia, endeks ve kripto araçlarını tek listede izleyin. Fiyat ve değişim net tablolarla.",
        visual: <MarketMiniRows />,
      },
      {
        key: "orders",
        dark: false,
        title: "Hızlı emir paneli",
        body: "Al / Sat butonları, lot ve kaldıraç ayarları sade bir bilet arayüzünde bir arada.",
        visual: <OrderTicketVisual />,
      },
      {
        key: "security",
        dark: false,
        title: "Güvenli oturum",
        body: "Kimlik doğrulama oturum çerezleri ile çalışır. Hassas alanlar koruma altındadır.",
        visual: <SecurityBadgeVisual />,
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
        a: "Platform üzerinden döviz çiftleri, altın gibi emtialar, endeksler ve seçili kripto araçlarını tek hesapta takip edebilirsiniz. Gösterilen fiyatlar örnek / bilgilendirme amaçlıdır.",
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
    <div className="fx-landing min-h-screen" data-fx-ui="landing-mobile-white-v2">
      <a
        href="/login"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#3558F4] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Giriş sayfasına geç
      </a>

      {/* ——— Header ——— */}
      <header className="fx-nav sticky top-0 z-50">
        <div className="fx-shell flex h-16 items-center justify-between gap-4 sm:h-[4.25rem]">
          <Link href="/" className="flex items-center no-underline" aria-label="7FX ana sayfa">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="7FX" className="h-8 w-auto object-contain sm:h-9" />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Ana menü">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#5e657d] transition hover:bg-[#3558F4]/[0.06] hover:text-[#101425]"
                onClick={() => scrollToId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full border border-[#d8dce8] bg-white px-4 py-2 text-[13px] font-semibold text-[#101425] transition hover:border-[#3558F4]/40 hover:bg-[#f8f9fc] sm:inline-flex"
            >
              Giriş
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[#3558F4] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(53,88,244,0.28)] transition hover:brightness-110"
            >
              Hesap aç
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8dce8] bg-white text-[#101425] lg:hidden"
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
          <div className="border-t border-[#e6e9f2] bg-white/98 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="fx-shell flex flex-col gap-0.5 !px-0">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-[#101425] hover:bg-[#f8f9fc]"
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
                className="mt-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#3558F4]"
                onClick={() => setMenuOpen(false)}
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#5e657d]"
                onClick={() => setMenuOpen(false)}
              >
                Hesap aç
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="pb-[72px] md:pb-0">
        {/* ——— Hero ——— */}
        <section className="fx-hero relative overflow-hidden" aria-labelledby="hero-title">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="fx-hero-veil absolute inset-0" />
            <div className="fx-hero-mesh absolute inset-0 opacity-[0.45]" />
          </div>

          <div className="fx-shell relative z-10 grid gap-12 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12 lg:pb-28 lg:pt-20">
            <div className="fx-reveal max-w-[640px]">
              <Eyebrow>Çok varlık yatırım platformu</Eyebrow>

              <h1 id="hero-title" className="fx-h1 mt-5">
                Yatırıma 7FX ile
                <span className="fx-accent-line mt-1 block">daha net başlayın</span>
              </h1>

              <p className="fx-hero-body mt-6">
                Döviz, altın, endeks ve kripto araçlarına tek platformdan erişin. Sade arayüz,
                güvenli oturum ve mobil öncelikli deneyim — kararlarınızı net bir ekranda alın.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#3558F4] px-8 text-[15px] font-semibold text-white shadow-[0_14px_40px_rgba(53,88,244,0.32)] transition hover:brightness-110"
                >
                  Hesap aç
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#d8dce8] bg-white px-8 text-[15px] font-semibold text-[#101425] transition hover:border-[#3558F4]/35 hover:bg-[#f8f9fc]"
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
                  <div key={t.label} className="flex items-center gap-2 text-[13px] text-[#5e657d]">
                    <span className="text-[10px] text-[#3558F4]" aria-hidden>
                      {t.icon}
                    </span>
                    <span className="font-medium">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fx-reveal fx-fade-up--delay flex justify-center lg:justify-end">
              <PhonePreview />
            </div>
          </div>
        </section>

        {/* ——— Market strip ——— */}
        <section
          id="piyasalar"
          className="border-y border-[#e6e9f2] bg-white"
          aria-label="Örnek piyasalar"
        >
          <div className="fx-shell flex items-center justify-between gap-4 pt-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#687087]">
              Piyasalar · örnek / gösterim amaçlı
            </p>
          </div>
          <div className="fx-ticker overflow-hidden py-4">
            <div className="fx-ticker-track flex w-max gap-10 px-4">
              {[...markets, ...markets].map((m, i) => (
                <div key={`${m.s}-${i}`} className="flex items-center gap-3 text-sm whitespace-nowrap">
                  <span className="font-semibold text-[#101425]">{m.s}</span>
                  <span className="text-[12px] text-[#687087]">{m.name}</span>
                  <span className="tabular-nums text-[#5e657d]">{m.p}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                      m.up
                        ? "bg-[#12a454]/10 text-[#12a454]"
                        : "bg-[#e5484d]/10 text-[#e5484d]"
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
            <div className="mb-12 max-w-2xl sm:mb-14">
              <Eyebrow>Platform</Eyebrow>
              <h2 className="fx-h2 mt-4">
                Yatırım araçları,
                <br className="hidden sm:block" /> tek bakışta
              </h2>
              <p className="fx-section-body mt-4 max-w-[520px]">
                7FX; canlı fiyat görünümü, sade emir paneli ve güvenli oturum ile bireysel
                yatırımcılara net bir çok varlık deneyimi sunar.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {platformCards.map((card) => (
                <article
                  key={card.key}
                  className={`fx-feature-card flex min-h-[380px] flex-col rounded-[23px] p-6 sm:p-7 ${
                    card.dark
                      ? "bg-[#111a3a] text-white shadow-[0_24px_60px_rgba(17,26,58,0.28)]"
                      : "border border-[#e6e9f2] bg-white shadow-[0_12px_40px_rgba(16,20,37,0.06)]"
                  }`}
                >
                  <h3
                    className={`text-[20px] font-semibold tracking-tight ${
                      card.dark ? "text-white" : "text-[#101425]"
                    }`}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={`mt-2.5 text-[14px] leading-relaxed ${
                      card.dark ? "text-white/65" : "text-[#687087]"
                    }`}
                  >
                    {card.body}
                  </p>
                  <div className="mt-8 flex flex-1 flex-col">{card.visual}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Detail band: 4 stats ——— */}
        <section className="border-y border-[#e6e9f2] bg-white" aria-label="Öne çıkanlar">
          <div className="fx-shell grid grid-cols-2 gap-6 py-14 sm:gap-8 lg:grid-cols-4 lg:py-16">
            {stats.map((s) => (
              <div key={s.k} className="fx-stat">
                <p className="text-[22px] font-semibold tracking-tight text-[#101425] sm:text-[26px]">
                  {s.k}
                </p>
                <p className="mt-1 text-[14px] font-semibold text-[#3558F4]">{s.v}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#687087]">{s.d}</p>
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
                  className="fx-step relative rounded-[23px] border border-[#e6e9f2] bg-white p-6 shadow-[0_8px_28px_rgba(16,20,37,0.04)] sm:p-7"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3558F4]/10 text-[13px] font-bold text-[#3558F4]">
                    {step.n}
                  </span>
                  {i < steps.length - 1 && (
                    <span
                      className="absolute right-[-12px] top-12 z-10 hidden h-px w-6 bg-[#d8dce8] md:block"
                      aria-hidden
                    />
                  )}
                  <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-[#101425]">
                    {step.t}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#687087]">{step.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Insight + portfolio board ——— */}
        <section className="fx-section fx-section--soft border-y border-[#e6e9f2]">
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
                  <li key={item} className="flex items-start gap-3 text-[14px] text-[#5e657d]">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3558F4]/12 text-[10px] font-bold text-[#3558F4]"
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
                <details key={f.q} className="fx-faq group rounded-[18px] border border-[#e6e9f2] bg-white px-5 py-1 shadow-[0_4px_16px_rgba(16,20,37,0.03)]">
                  <summary className="cursor-pointer list-none py-4 text-[15px] font-semibold text-[#101425] outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {f.q}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0f2f8] text-[#3558F4] transition group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="pb-4 text-[14px] leading-relaxed text-[#687087]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Mobile dark band ——— */}
        <section id="mobil" className="fx-mobile-band bg-[#111a3a] text-white">
          <div className="fx-shell grid gap-12 py-[85px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-[125px]">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8fa3ff]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8fa3ff]" aria-hidden />
                Mobil deneyim
              </p>
              <h2 className="mt-4 text-[clamp(32px,4vw,48px)] font-semibold leading-[1.08] tracking-[-0.05em] text-white">
                Her yerden takip edin
              </h2>
              <p className="mt-4 max-w-[480px] text-[14px] leading-relaxed text-white/65">
                Landing ve auth sayfaları mobil öncelikli tasarlandı. Terminal deneyimi web
                üzerinden erişilebilir; portföy bakiyesi ve izleme listesi tek bakışta.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Responsive header ve hamburger menü",
                  "Telefon önizlemesi ile portföy görünümü",
                  "Giriş / kayıt CTA’ları her ekranda erişilebilir",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-white/70">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-[#8fa3ff]"
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
                className="mt-9 inline-flex min-h-[48px] items-center rounded-full bg-[#3558F4] px-7 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(53,88,244,0.4)] transition hover:brightness-110"
              >
                Hesap aç
              </Link>
            </div>

            <div className="fx-app-panel relative mx-auto w-full max-w-[380px]">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="mb-6 flex items-center justify-between">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/7fx-logo.png"
                    alt="7FX"
                    className="h-9 w-auto object-contain brightness-0 invert"
                  />
                  <span className="rounded-full bg-[#3558F4]/30 px-3 py-1 text-[11px] font-semibold text-[#c5d0ff]">
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
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5"
                    >
                      <div>
                        <p className="text-[14px] font-semibold text-white">{row.t}</p>
                        <p className="text-[12px] text-white/50">{row.d}</p>
                      </div>
                      <span className="text-[#8fa3ff]" aria-hidden>
                        →
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#3558F4] px-4 py-3.5">
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
        <section className="border-t border-[#e6e9f2] bg-white">
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
                className="inline-flex min-h-[48px] items-center rounded-full bg-[#3558F4] px-7 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(53,88,244,0.28)] transition hover:brightness-110"
              >
                Hesap aç
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center rounded-full border border-[#d8dce8] bg-white px-7 text-sm font-semibold text-[#101425] transition hover:border-[#3558F4]/35"
              >
                Giriş
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e6e9f2] bg-[#f8f9fc]">
        <div className="fx-shell flex flex-col gap-6 py-12 text-sm text-[#687087] sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/7fx-logo.png" alt="7FX" className="h-7 w-auto object-contain" />
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed">
              Çok varlık web yatırım platformu. Fiyatlar örnek / gösterim amaçlıdır.
            </p>
            <p className="mt-3 text-[12px]">© {new Date().getFullYear()} 7FX</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-[13px]">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#101425]">
                Platform
              </span>
              <button type="button" className="text-left hover:text-[#101425]" onClick={() => scrollToId("piyasalar")}>
                Piyasalar
              </button>
              <button type="button" className="text-left hover:text-[#101425]" onClick={() => scrollToId("platform")}>
                Özellikler
              </button>
              <button type="button" className="text-left hover:text-[#101425]" onClick={() => scrollToId("sss")}>
                SSS
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#101425]">
                Hesap
              </span>
              <Link href="/login" className="hover:text-[#101425]">
                Giriş
              </Link>
              <Link href="/register" className="hover:text-[#101425]">
                Hesap aç
              </Link>
              <span>7fx.customer.org.tr</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fx-sticky-cta fixed inset-x-0 bottom-0 z-50 border-t border-[#e6e9f2] bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Link
            href="/login"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-[#d8dce8] text-[13px] font-semibold text-[#101425]"
          >
            Giriş
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 flex-[1.2] items-center justify-center rounded-full bg-[#3558F4] text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(53,88,244,0.3)]"
          >
            Hesap aç
          </Link>
        </div>
      </div>
    </div>
  );
}
