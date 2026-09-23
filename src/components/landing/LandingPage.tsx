"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TerminalMock from "./TerminalMock";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const NAV = [
  { id: "ozellikler", label: "Özellikler" },
  { id: "piyasalar", label: "Piyasalar" },
  { id: "nasil", label: "Nasıl çalışır" },
  { id: "sss", label: "SSS" },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const features = useMemo(
    () => [
      {
        title: "Hızlı karar paneli",
        body: "Fiyat, derinlik ve emir alanları tek bakışta. Gereksiz gürültü yok.",
        image: "/landing/v2/feat-speed.svg",
        tag: "Hız",
      },
      {
        title: "Net mum grafikleri",
        body: "Canlı mumlar ve izleme listesi ile hareketleri net okuyun.",
        image: "/landing/v2/feat-charts.svg",
        tag: "Grafik",
      },
      {
        title: "Güvenli oturum",
        body: "Oturum tabanlı kimlik doğrulama. Hassas alanlar korumalıdır.",
        image: "/landing/v2/feat-security.svg",
        tag: "Güvenlik",
      },
      {
        title: "Tek ekran terminal",
        body: "Emir, pozisyon ve bakiye panelleri masaüstü odaklı bir arayüzde.",
        image: "/landing/v2/feat-desk.svg",
        tag: "Terminal",
      },
    ],
    []
  );

  const markets = [
    { s: "EURUSD", p: "1.0842", d: "+0.14%" },
    { s: "XAUUSD", p: "2341.20", d: "+0.32%" },
    { s: "BTCUSD", p: "67420", d: "−0.81%" },
    { s: "GBPUSD", p: "1.2634", d: "+0.09%" },
    { s: "USDTRY", p: "34.12", d: "+0.05%" },
    { s: "ETHUSD", p: "3412", d: "+1.24%" },
    { s: "US100", p: "19840", d: "+0.41%" },
    { s: "JPYUSD", p: "0.0067", d: "−0.12%" },
  ];

  const steps = [
    {
      n: "01",
      t: "Hesap oluşturun",
      d: "Kayıt formunu doldurun. Varsa referans kodunuzu ekleyin.",
    },
    {
      n: "02",
      t: "Giriş yapın",
      d: "Oturumunuz açılır; yönlendirme rolünüze göre yapılır.",
    },
    {
      n: "03",
      t: "Terminalde işlem",
      d: "/trade üzerinde grafik, emir ve pozisyon panellerine erişin.",
    },
  ];

  const faqs = [
    {
      q: "7FX nedir?",
      a: "7FX; piyasa araçları, hesap yönetimi ve web işlem terminali sunan bir fintech platformudur. Bireysel yatırımcılar için sade ve güçlü bir deneyim hedefler.",
    },
    {
      q: "Nasıl başlarım?",
      a: "Kayıt olun, ardından giriş yapın. ADMIN hesaplar /admin’e, diğer hesaplar /trade’e yönlendirilir.",
    },
    {
      q: "Referans kodu zorunlu mu?",
      a: "Hayır. Kayıt sayfasında isteğe bağlıdır; varsa girmeniz yeterlidir.",
    },
    {
      q: "Veriler gerçek mi?",
      a: "Terminal gerçek piyasa veri akışı ile çalışacak şekilde tasarlanmıştır. Fiyatlar gösterim amaçlı sürekli güncellenir.",
    },
  ];

  return (
    <div className="fx-landing min-h-screen" data-fx-ui="landing-redesign-v2">
      <a
        href="/login"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#f83b00] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Giriş sayfasına geç
      </a>

      {/* ——— Nav ——— */}
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
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#8b97a8] transition hover:bg-white/[0.04] hover:text-[#eef2f7]"
                onClick={() => scrollToId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full border border-white/12 px-4 py-2 text-[13px] font-semibold text-[#eef2f7] transition hover:border-white/25 hover:bg-white/[0.04] sm:inline-flex"
            >
              Giriş
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[#f83b00] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_28px_rgba(248,59,0,0.28)] transition hover:brightness-110"
            >
              Kayıt
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-[#eef2f7] md:hidden"
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
          <div className="border-t border-white/[0.06] bg-[#0a0e14]/98 px-4 py-3 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-0.5">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-[#eef2f7] hover:bg-white/[0.04]"
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
                className="mt-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f83b00]"
                onClick={() => setMenuOpen(false)}
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#8b97a8]"
                onClick={() => setMenuOpen(false)}
              >
                Kayıt
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ——— Hero ——— */}
        <section className="fx-hero relative overflow-hidden" aria-labelledby="hero-title">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/v2/hero-mesh.svg"
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
            <div className="fx-hero-veil absolute inset-0" />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-24">
            <div className="fx-reveal mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-[#9aa6b8] backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ffc2] opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ffc2]" />
                </span>
                Web işlem platformu · Türkiye
              </div>

              <h1
                id="hero-title"
                className="text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-[#eef2f7] sm:text-5xl lg:text-[3.4rem]"
              >
                Piyasayı okuyun.
                <span className="fx-accent-line mt-1 block">Kesin adım atın.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#8b97a8] sm:text-lg">
                7FX; canlı fiyatlar, sade terminal ve güvenli oturum ile bireysel yatırımcılara
                profesyonel bir işlem deneyimi sunar.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#f83b00] px-7 text-sm font-semibold text-white shadow-[0_16px_48px_rgba(248,59,0,0.32)] transition hover:brightness-110"
                >
                  Ücretsiz kayıt ol
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 text-sm font-semibold text-[#eef2f7] backdrop-blur transition hover:border-white/30 hover:bg-white/[0.08]"
                >
                  Giriş yap
                </Link>
              </div>

              <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {[
                  { k: "40+", v: "Sembol" },
                  { k: "100x", v: "Kaldıraç" },
                  { k: "7/24", v: "Erişim" },
                  { k: "<50ms", v: "Hedef gecikme" },
                ].map((s) => (
                  <div
                    key={s.v}
                    className="rounded-2xl border border-white/[0.08] bg-[#06080c]/55 px-3 py-3.5 backdrop-blur-md"
                  >
                    <dd className="text-xl font-semibold tracking-tight text-[#eef2f7] sm:text-2xl">{s.k}</dd>
                    <dt className="mt-0.5 text-[11px] text-[#6b7789]">{s.v}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ——— Markets strip ——— */}
        <section
          id="piyasalar"
          className="border-y border-white/[0.06] bg-[#080b10]"
          aria-label="Örnek piyasalar"
        >
          <div className="fx-ticker overflow-hidden py-3.5">
            <div className="fx-ticker-track flex w-max gap-8 px-4">
              {[...markets, ...markets].map((m, i) => (
                <div key={`${m.s}-${i}`} className="flex items-center gap-3 text-sm whitespace-nowrap">
                  <span className="font-semibold text-[#eef2f7]">{m.s}</span>
                  <span className="tabular-nums text-[#8b97a8]">{m.p}</span>
                  <span
                    className={`tabular-nums text-xs font-medium ${
                      m.d.startsWith("+") ? "text-[#00ffc2]" : "text-[#f83b00]"
                    }`}
                  >
                    {m.d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Features ——— */}
        <section id="ozellikler" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f83b00]">Özellikler</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#eef2f7] sm:text-4xl">
              Temiz arayüz, güçlü araçlar
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#8b97a8]">
              Stok fotoğraf yok — soyut finans görselleri ve net kopya ile platformun özünü gösteriyoruz.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <article
                key={f.title}
                className="fx-card group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0e14] transition duration-300 hover:border-[#f83b00]/35 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#06080c]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#06080c]/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#eef2f7]">
                    {f.tag}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[#eef2f7]">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#8b97a8]">{f.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ——— Platform + Terminal ——— */}
        <section className="border-y border-white/[0.06] bg-[#080b10]">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00ffc2]">Platform</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#eef2f7] sm:text-4xl">
                Terminal, tek bakışta
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#8b97a8]">
                Emir bileti, izleme listesi ve canlı grafik aynı ekranda. Girişten sonra{" "}
                <strong className="font-semibold text-[#eef2f7]">/trade</strong> adresinde açılır.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Gerçek piyasa veri akışı",
                  "Alış / satış ve pozisyon görünürlüğü",
                  "Mobil uyumlu koyu arayüz",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#9aa6b8]">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00ffc2]/12 text-[11px] font-bold text-[#00ffc2]"
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
                className="mt-9 inline-flex min-h-[46px] items-center rounded-full bg-[#eef2f7] px-6 text-sm font-semibold text-[#06080c] transition hover:bg-white"
              >
                Hemen başla
              </Link>
            </div>
            <TerminalMock />
          </div>
        </section>

        {/* ——— How it works ——— */}
        <section id="nasil" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f83b00]">Nasıl çalışır</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#eef2f7] sm:text-4xl">
              Üç adımda terminal
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className="relative rounded-2xl border border-white/[0.07] bg-[#0a0e14] p-6 sm:p-7"
              >
                <span className="text-3xl font-semibold tabular-nums text-[#f83b00]/45">{s.n}</span>
                <h3 className="mt-4 text-lg font-semibold text-[#eef2f7]">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8b97a8]">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ——— Trust band ——— */}
        <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6" aria-labelledby="trust-title">
          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0e131b] to-[#0a0e14]">
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="relative min-h-[220px] border-b border-white/[0.06] lg:border-b-0 lg:border-r lg:border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/v2/feat-security.svg"
                  alt=""
                  className="h-full w-full object-cover opacity-90"
                  loading="lazy"
                />
              </div>
              <div className="p-8 sm:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00ffc2]">Güven</p>
                <h2 id="trust-title" className="mt-3 text-2xl font-semibold tracking-tight text-[#eef2f7] sm:text-3xl">
                  Oturum sizin kontrolünüzde
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#8b97a8]">
                  Kimlik doğrulama oturum çerezleri ile çalışır. Demo şifre paylaşılmaz; hassas işlem alanları
                  korumalıdır.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    { t: "Oturum auth", d: "Login & register API" },
                    { t: "Rol yönlendirme", d: "Admin → /admin · Trade" },
                    { t: "Ayrı auth UI", d: "/login · /register" },
                    { t: "7FX markası", d: "Özgün logo & görseller" },
                  ].map((c) => (
                    <div key={c.t} className="rounded-xl border border-white/[0.06] bg-[#06080c]/50 p-3.5">
                      <div className="text-sm font-semibold text-[#eef2f7]">{c.t}</div>
                      <div className="mt-0.5 text-xs text-[#6b7789]">{c.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— FAQ ——— */}
        <section id="sss" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f83b00]">SSS</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#eef2f7]">Sık sorulanlar</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={f.q}
                  className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0e14]"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#eef2f7] sm:px-6"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    {f.q}
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-[#8b97a8] transition ${
                        open ? "rotate-45 text-[#f83b00]" : ""
                      }`}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-white/[0.06] px-5 pb-5 pt-3 text-sm leading-relaxed text-[#8b97a8] sm:px-6">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ——— CTA ——— */}
        <section className="border-t border-white/[0.06] bg-[#05070a]">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:py-20">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-[#eef2f7] sm:text-4xl">
                Hazır olduğunuzda başlayın
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#8b97a8]">
                Hesap oluşturun veya mevcut hesabınızla giriş yapın. Destek için platform içi kanalları kullanın.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-[48px] items-center rounded-full bg-[#f83b00] px-6 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Kayıt ol
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center rounded-full border border-white/18 px-6 text-sm font-semibold text-[#eef2f7] transition hover:border-white/35"
              >
                Giriş
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#06080c]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-[#6b7789] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="7FX" className="h-7 w-auto object-contain opacity-90" />
            <span>© {new Date().getFullYear()} 7FX</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link href="/login" className="hover:text-[#eef2f7]">
              Giriş
            </Link>
            <Link href="/register" className="hover:text-[#eef2f7]">
              Kayıt
            </Link>
            <span>7fx.customer.org.tr</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
