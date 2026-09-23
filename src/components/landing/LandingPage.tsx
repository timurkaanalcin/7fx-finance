"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TerminalMock from "./TerminalMock";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const features = useMemo(
    () => [
      {
        title: "Piyasa araçları",
        body: "Canlı fiyatlar, derinlik ve net panellerle piyasa hareketlerini takip edin.",
        image: "/landing/feat-liquidity.webp",
        alt: "7FX likidite görseli",
        tag: "Piyasa",
      },
      {
        title: "Temiz grafikler",
        body: "Mum grafikleri ve canlı akış ile kararlarınızı destekleyin.",
        image: "/landing/feat-charts.webp",
        alt: "7FX grafik görseli",
        tag: "Grafik",
      },
      {
        title: "Güvenli oturum",
        body: "Oturum tabanlı kimlik doğrulama ve korumalı işlem alanları.",
        image: "/landing/feat-security.webp",
        alt: "7FX güvenlik görseli",
        tag: "Güvenlik",
      },
      {
        title: "Masaüstü operasyon",
        body: "Emir, pozisyon ve bakiye panelleri tek ekranda; hızlı işlem deneyimi.",
        image: "/landing/feat-desk.webp",
        alt: "7FX masaüstü operasyon görseli",
        tag: "Terminal",
      },
    ],
    []
  );

  const stats = [
    { k: "40+", v: "Sembol (örnek)" },
    { k: "100x", v: "Kaldıraç seçenekleri" },
    { k: "7/24", v: "Terminal erişimi" },
    { k: "<50ms", v: "Fiyat yenileme hedefi" },
  ];

  const navItems = [
    { id: "ozellikler", label: "Özellikler" },
    { id: "platform", label: "Platform" },
    { id: "guven", label: "Güven" },
    { id: "destek", label: "Destek" },
  ];

  return (
    <div className="fx-landing min-h-screen" data-fx-ui="landing-light-v1">
      <a
        href="/login"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#0a0a0a] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Giriş sayfasına geç
      </a>

      <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center no-underline" aria-label="7FX">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="7FX" className="h-9 w-auto object-contain sm:h-10" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Ana menü">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-[#525252] transition hover:bg-black/[0.04] hover:text-[#0a0a0a]"
                onClick={() => scrollToId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl border border-black/12 px-3.5 py-2 text-sm font-semibold text-[#0a0a0a] transition hover:border-black/25 hover:bg-black/[0.03] sm:inline-flex"
            >
              Giriş
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#0a0a0a] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#171717]"
            >
              Kayıt ol
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/12 text-[#0a0a0a] md:hidden"
              aria-expanded={mobileNavOpen}
              aria-label="Menüyü aç"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <span className="sr-only">Menü</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d={mobileNavOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-black/[0.08] bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-[#0a0a0a] hover:bg-black/[0.04]"
                  onClick={() => {
                    setMobileNavOpen(false);
                    scrollToId(item.id);
                  }}
                >
                  {item.label}
                </button>
              ))}
              <Link
                href="/login"
                className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#0a0a0a]"
                onClick={() => setMobileNavOpen(false)}
              >
                Giriş yap
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#525252]"
                onClick={() => setMobileNavOpen(false)}
              >
                Kayıt ol
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="fx-hero-visual fx-grain relative overflow-hidden" data-fx-ui="hero-v1">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <video
              className="h-full w-full scale-105 object-cover opacity-25"
              autoPlay
              muted
              loop
              playsInline
              poster="/landing/7fx-hero-custom-v1.png"
              preload="metadata"
            >
              <source src="/landing/7fx-special-hero-v1.mp4" type="video/mp4" />
            </video>
            <div className="fx-hero-overlay absolute inset-0" />
          </div>

          <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12 lg:pb-24 lg:pt-16">
            <div className="fx-fade-up text-[#0a0a0a]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-xs font-medium text-[#111] shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0a0a0a]" />
                7FX · Piyasa &amp; işlem platformu
              </div>
              <h1 className="max-w-xl text-4xl leading-[1.05] tracking-tight text-[#0a0a0a] sm:text-5xl lg:text-[3.5rem]">
                Modern fintech.
                <span className="fx-accent-text mt-1 block">Keskin kararlar.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#525252] sm:text-lg">
                7FX; piyasa araçları, hesap yönetimi ve web işlem platformu ile bireysel yatırımcılar için
                sade, güçlü bir deneyim sunar.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-xl bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(15,23,42,0.18)] transition hover:bg-[#171717]"
                >
                  Hesap oluştur
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-black/15 bg-white/80 px-5 py-3 text-sm font-semibold text-[#0a0a0a] backdrop-blur transition hover:border-black/30 hover:bg-white"
                >
                  Giriş yapıp işleme başla
                </Link>
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {stats.map((s) => (
                  <div
                    key={s.v}
                    className="rounded-2xl border border-black/[0.08] bg-white/90 px-3 py-3 shadow-sm backdrop-blur"
                  >
                    <dt className="text-[11px] text-[#525252]">{s.v}</dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-[#0a0a0a]">{s.k}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="fx-fade-up fx-fade-up--delay lg:sticky lg:top-24">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-black/[0.08] bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.1)] sm:p-8">
                <div
                  className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-slate-200/50 blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-slate-100/80 blur-3xl"
                  aria-hidden
                />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/7fx-logo.png" alt="" className="h-9 w-auto object-contain" />
                    <div>
                      <p className="text-sm font-semibold text-[#0a0a0a]">İşlem terminali</p>
                      <p className="text-xs text-[#525252]">Giriş sonrası /trade</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-[#525252]">
                    Emir bileti, izleme listesi ve canlı grafikler tek ekranda. Hesabınız yoksa kayıt olun;
                    varsa giriş yaparak devam edin.
                  </p>
                  <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                    <Link
                      href="/register"
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#0a0a0a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#171717]"
                    >
                      Kayıt ol
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-black/12 px-4 py-3 text-sm font-semibold text-[#0a0a0a] transition hover:border-black/25 hover:bg-black/[0.03]"
                    >
                      Giriş
                    </Link>
                  </div>
                  <ul className="mt-6 space-y-2 text-xs text-[#525252]">
                    {[
                      "Oturum tabanlı güvenli kimlik doğrulama",
                      "ADMIN → /admin · diğer → /trade",
                      "Mobil uyumlu 7FX arayüzü",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <span className="mt-0.5 text-[#0a0a0a]">✓</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ozellikler" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#111]">Özellikler</p>
            <h2 className="mt-2 text-3xl text-[#0a0a0a] sm:text-4xl">7FX ile işlem deneyimi</h2>
            <p className="mt-3 text-base leading-relaxed text-[#525252]">
              Açık profesyonel arayüz, siyah vurgu ve sade gri tonlarla net bir pazarlama yüzü.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {features.map((f) => (
              <article
                key={f.title}
                className="group overflow-hidden rounded-[1.5rem] border border-black/[0.08] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-black/20"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#f8fafc]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.image}
                    alt={f.alt}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <span className="absolute left-4 top-4 rounded-full border border-black/10 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#0a0a0a] shadow-sm backdrop-blur">
                    {f.tag}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl text-[#0a0a0a]">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#525252]">{f.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="platform" className="border-y border-black/[0.08] bg-[#f8fafc]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#111]">Platform</p>
              <h2 className="mt-2 text-3xl text-[#0a0a0a] sm:text-4xl">Masaüstü terminal, tek bakışta</h2>
              <p className="mt-4 text-base leading-relaxed text-[#525252]">
                Emir bileti, izleme listesi ve canlı grafik panelleri aynı ekranda. Girişten sonra{" "}
                <strong className="font-semibold text-[#0a0a0a]">/trade</strong> adresinde açılır.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#525252]">
                {[
                  "Gerçek piyasa verisi akışı",
                  "Stop-loss / take-profit görünürlüğü",
                  "CRM / desk uyumlu hesap yapısı",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-[11px] font-bold text-[#0a0a0a]">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex rounded-xl bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#171717]"
              >
                Hemen başla
              </Link>
            </div>
            <TerminalMock />
          </div>
        </section>

        <section id="guven" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="overflow-hidden rounded-[1.75rem] border border-black/[0.08] bg-[#f8fafc]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/7fx-hero-custom-v1.png"
                alt="7FX hero görseli"
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#111]">Güven</p>
              <h2 className="mt-2 text-3xl text-[#0a0a0a] sm:text-4xl">Oturumunuz sizin kontrolünüzde</h2>
              <p className="mt-4 text-base leading-relaxed text-[#525252]">
                Kimlik doğrulama oturum çerezleri ile çalışır. Hassas işlem alanları korumalıdır; demo şifre
                paylaşılmaz.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { t: "Oturum tabanlı auth", d: "POST /api/auth/login & register" },
                  { t: "Rol yönlendirme", d: "ADMIN → /admin · diğer → /trade" },
                  { t: "Ayrı auth sayfaları", d: "/login ve /register profesyonel UI" },
                  { t: "7FX varlıkları", d: "Özgün logo, mark ve hero medyası" },
                ].map((card) => (
                  <div
                    key={card.t}
                    className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                  >
                    <div className="text-sm font-semibold text-[#0a0a0a]">{card.t}</div>
                    <div className="mt-1 text-xs leading-relaxed text-[#525252]">{card.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { src: "/landing/feat-desk.webp", alt: "Operasyon paneli" },
              { src: "/landing/feat-liquidity.webp", alt: "Likidite görseli" },
              { src: "/landing/7fx-hero-custom-v1.png", alt: "7FX hero banner" },
            ].map((img) => (
              <div
                key={img.src}
                className="overflow-hidden rounded-2xl border border-black/[0.08] bg-[#f8fafc]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </section>

        <section id="destek" className="border-t border-black/[0.08] bg-[#f8fafc] text-[#0a0a0a]">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl">Hazır olduğunuzda başlayın</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#525252]">
                Hesap oluşturun veya mevcut hesabınızla giriş yapın. Destek için platform içi kanalları kullanın.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-xl bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#171717]"
              >
                Kayıt ol
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition hover:border-black/30"
              >
                Giriş
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.08] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[#525252] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="7FX" className="h-8 w-auto object-contain" />
            <span>© {new Date().getFullYear()} 7FX</span>
          </div>
          <p className="text-xs">7fx.customer.org.tr · Özgün 7FX varlıkları</p>
        </div>
      </footer>
    </div>
  );
}
