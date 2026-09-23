"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PhonePreview from "./PhonePreview";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const NAV = [
  { id: "piyasalar", label: "Piyasalar" },
  { id: "platform", label: "Platform" },
  { id: "guvenlik", label: "Güvenlik" },
  { id: "mobil", label: "Mobil" },
];

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
    ],
    []
  );

  const platformFeatures = useMemo(
    () => [
      {
        title: "Çok varlık erişimi",
        body: "Döviz, emtia, endeks ve kripto araçlarını tek hesapta izleyin.",
        icon: "◈",
      },
      {
        title: "Sade işlem terminali",
        body: "Emir, izleme listesi ve bakiye panelleri net bir düzenle.",
        icon: "▣",
      },
      {
        title: "Anlık fiyat görünümü",
        body: "Piyasa hareketlerini takip edin; kararlarınızı hızlı alın.",
        icon: "◉",
      },
      {
        title: "Rol bazlı yönlendirme",
        body: "Giriş sonrası ADMIN /admin, diğer hesaplar /trade’e gider.",
        icon: "◎",
      },
    ],
    []
  );

  const securityItems = useMemo(
    () => [
      {
        t: "Oturum tabanlı giriş",
        d: "Kimlik doğrulama güvenli oturum çerezleri ile çalışır.",
      },
      {
        t: "Korumalı alanlar",
        d: "Hassas işlem ve yönetim sayfaları oturum kontrolündedir.",
      },
      {
        t: "Ayrı auth sayfaları",
        d: "Giriş ve kayıt akışları landing’den bağımsız, sade arayüzle.",
      },
    ],
    []
  );

  return (
    <div className="fx-landing min-h-screen" data-fx-ui="landing-mobile-white-v1">
      <a
        href="/login"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#3558F4] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Giriş sayfasına geç
      </a>

      {/* ——— Header ——— */}
      <header className="fx-nav sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
          <Link href="/" className="flex items-center no-underline" aria-label="7FX ana sayfa">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="7FX" className="h-8 w-auto object-contain sm:h-9" />
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Ana menü">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#434b68] transition hover:bg-[#3558F4]/[0.06] hover:text-[#101425]"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8dce8] bg-white text-[#101425] md:hidden"
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
          <div className="border-t border-[#e6e9f2] bg-white/98 px-4 py-3 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-0.5">
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
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#434b68]"
                onClick={() => setMenuOpen(false)}
              >
                Hesap aç
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ——— Hero ——— */}
        <section className="fx-hero relative overflow-hidden" aria-labelledby="hero-title">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="fx-hero-veil absolute inset-0" />
          </div>

          <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-20">
            <div className="fx-reveal max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8dce8] bg-white px-3.5 py-1.5 text-xs font-medium text-[#434b68] shadow-[0_2px_8px_rgba(16,20,37,0.04)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3558F4] opacity-35" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3558F4]" />
                </span>
                Çok varlık yatırım · 7FX
              </div>

              <h1
                id="hero-title"
                className="text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-[#101425] sm:text-5xl lg:text-[3.15rem]"
              >
                Yatırıma 7FX ile
                <span className="fx-accent-line mt-1 block">daha net başlayın</span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-[#434b68] sm:text-lg">
                Döviz, altın, endeks ve kripto araçlarına tek platformdan erişin. Sade arayüz,
                güvenli oturum ve mobil öncelikli deneyim.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#3558F4] px-7 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(53,88,244,0.32)] transition hover:brightness-110"
                >
                  Hesap aç
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#d8dce8] bg-white px-7 text-sm font-semibold text-[#101425] transition hover:border-[#3558F4]/35 hover:bg-[#f8f9fc]"
                >
                  Giriş yap
                </Link>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3">
                {[
                  { k: "40+", v: "Sembol" },
                  { k: "7/24", v: "Erişim" },
                  { k: "SSL", v: "Oturum" },
                ].map((s) => (
                  <div
                    key={s.v}
                    className="rounded-2xl border border-[#e6e9f2] bg-white px-3 py-3.5 shadow-[0_4px_16px_rgba(16,20,37,0.04)]"
                  >
                    <dd className="text-xl font-semibold tracking-tight text-[#101425] sm:text-2xl">
                      {s.k}
                    </dd>
                    <dt className="mt-0.5 text-[11px] text-[#434b68]">{s.v}</dt>
                  </div>
                ))}
              </dl>
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
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#434b68]">
              Piyasalar · örnek / gösterim amaçlı
            </p>
          </div>
          <div className="fx-ticker overflow-hidden py-3.5">
            <div className="fx-ticker-track flex w-max gap-8 px-4">
              {[...markets, ...markets].map((m, i) => (
                <div key={`${m.s}-${i}`} className="flex items-center gap-3 text-sm whitespace-nowrap">
                  <span className="font-semibold text-[#101425]">{m.s}</span>
                  <span className="text-[12px] text-[#434b68]">{m.name}</span>
                  <span className="tabular-nums text-[#434b68]">{m.p}</span>
                  <span
                    className={`tabular-nums text-xs font-semibold ${
                      m.up ? "text-[#12a454]" : "text-[#e5484d]"
                    }`}
                  >
                    {m.d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Platform ——— */}
        <section id="platform" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3558F4]">
              Platform
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#101425] sm:text-4xl">
              Yatırım araçları, tek bakışta
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#434b68]">
              7FX; canlı fiyat görünümü, sade terminal ve hesap yönetimi ile bireysel yatırımcılara
              net bir deneyim sunar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {platformFeatures.map((f) => (
              <article
                key={f.title}
                className="fx-card group rounded-2xl border border-[#e6e9f2] bg-white p-6 shadow-[0_4px_20px_rgba(16,20,37,0.04)] transition duration-300 hover:border-[#3558F4]/35 hover:shadow-[0_16px_40px_rgba(53,88,244,0.1)] sm:p-7"
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#3558F4]/10 text-lg text-[#3558F4]"
                  aria-hidden
                >
                  {f.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#101425]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#434b68]">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ——— Security ——— */}
        <section id="guvenlik" className="border-y border-[#e6e9f2] bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3558F4]">
                Güvenlik
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#101425] sm:text-4xl">
                Oturum sizin kontrolünüzde
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#434b68]">
                Kimlik doğrulama oturum çerezleri ile çalışır. Demo şifre paylaşılmaz; hassas işlem
                alanları korumalıdır.
              </p>
              <ul className="mt-8 space-y-4">
                {securityItems.map((item) => (
                  <li key={item.t} className="flex gap-3">
                    <span
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3558F4]/12 text-[11px] font-bold text-[#3558F4]"
                      aria-hidden
                    >
                      ✓
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#101425]">{item.t}</p>
                      <p className="mt-0.5 text-sm text-[#434b68]">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-[#e6e9f2] bg-[#f8f9fc] p-8 sm:p-10">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { t: "Oturum auth", d: "Login & register API" },
                  { t: "Rol yönlendirme", d: "Admin → /admin · Trade" },
                  { t: "Ayrı auth UI", d: "/login · /register" },
                  { t: "7FX markası", d: "Özgün logo & arayüz" },
                ].map((c) => (
                  <div
                    key={c.t}
                    className="rounded-2xl border border-[#e6e9f2] bg-white p-4 shadow-[0_2px_10px_rgba(16,20,37,0.03)]"
                  >
                    <div className="text-sm font-semibold text-[#101425]">{c.t}</div>
                    <div className="mt-0.5 text-xs text-[#434b68]">{c.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ——— Mobile ——— */}
        <section id="mobil" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
            <div className="order-2 flex justify-center lg:order-1">
              <div className="w-full max-w-[280px] scale-[0.92] origin-top sm:max-w-[300px] sm:scale-100">
                <PhonePreview />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3558F4]">
                Mobil
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#101425] sm:text-4xl">
                Her yerden takip edin
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#434b68]">
                Landing ve auth sayfaları mobil öncelikli tasarlandı. Terminal deneyimi web üzerinden
                erişilebilir; portföy bakiyesi ve izleme listesi tek bakışta.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Responsive header ve hamburger menü",
                  "Telefon önizlemesi ile portföy görünümü",
                  "Giriş / kayıt CTA’ları her ekranda erişilebilir",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#434b68]">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3558F4]/12 text-[11px] font-bold text-[#3558F4]"
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
                className="mt-9 inline-flex min-h-[46px] items-center rounded-full bg-[#3558F4] px-6 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(53,88,244,0.28)] transition hover:brightness-110"
              >
                Hesap aç
              </Link>
            </div>
          </div>
        </section>

        {/* ——— Final CTA ——— */}
        <section className="border-t border-[#e6e9f2] bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:py-20">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-[#101425] sm:text-4xl">
                Hazır olduğunuzda başlayın
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#434b68]">
                Hesap oluşturun veya mevcut hesabınızla giriş yapın. Destek için platform içi
                kanalları kullanın.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-[48px] items-center rounded-full bg-[#3558F4] px-6 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(53,88,244,0.28)] transition hover:brightness-110"
              >
                Hesap aç
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center rounded-full border border-[#d8dce8] bg-white px-6 text-sm font-semibold text-[#101425] transition hover:border-[#3558F4]/35"
              >
                Giriş
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e6e9f2] bg-[#f8f9fc]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-[#434b68] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="7FX" className="h-7 w-auto object-contain" />
            <span>© {new Date().getFullYear()} 7FX</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link href="/login" className="hover:text-[#101425]">
              Giriş
            </Link>
            <Link href="/register" className="hover:text-[#101425]">
              Hesap aç
            </Link>
            <span>7fx.customer.org.tr</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
