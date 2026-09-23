"use client";

import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  mode: "login" | "register";
  children: ReactNode;
};

export default function AuthShell({ mode, children }: AuthShellProps) {
  const isLogin = mode === "login";

  return (
    <div className="fx-landing fx-auth-page min-h-screen" data-fx-ui="auth-pages-v1">
      <div className="relative isolate flex min-h-screen flex-col lg:flex-row">
        {/* Brand panel */}
        <aside className="fx-auth-brand relative flex flex-col justify-between overflow-hidden border-b border-white/8 px-6 py-8 sm:px-10 sm:py-10 lg:w-[46%] lg:border-b-0 lg:border-r lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="fx-auth-grid absolute inset-0 opacity-[0.35]" />
            <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#f83b00]/20 blur-[100px]" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#00ffc2]/12 blur-[110px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#07090d]/40 via-transparent to-[#0c1017]/80" />
          </div>

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/7fx-mark.png" alt="" className="h-10 w-10 object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/7fx-logo-header.png" alt="7FX" className="h-7" />
            </Link>

            <div className="mt-10 max-w-md lg:mt-16">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#f83b00]/35 bg-[#07090d]/55 px-3 py-1.5 text-xs font-medium text-[#f83b00] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00ffc2] shadow-[0_0_8px_#00ffc2]" />
                Güvenli oturum · 7FX
              </p>
              <h1 className="mt-5 text-3xl leading-[1.1] tracking-tight text-[#e8eef6] sm:text-4xl lg:text-[2.75rem]">
                {isLogin ? (
                  <>
                    Hesabınıza
                    <span className="fx-accent-text mt-1 block">güvenle dönün.</span>
                  </>
                ) : (
                  <>
                    Yatırıma
                    <span className="fx-accent-text mt-1 block">profesyonel başlangıç.</span>
                  </>
                )}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-[#8b97a8] sm:text-base">
                {isLogin
                  ? "Kimlik doğrulama tamamlandığında işlem terminali /trade adresinde açılır. Yönetici hesapları /admin’e yönlendirilir."
                  : "Ad, soyad ve e-posta ile dakikalar içinde hesap oluşturun. Kayıt sonrası terminal erişimi otomatik açılır."}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-10 hidden lg:block">
            <ul className="space-y-3 text-sm text-[#8b97a8]">
              {[
                "Oturum tabanlı kimlik doğrulama",
                "Korumalı işlem ve profil alanları",
                "Türkçe arayüz · 7FX marka deneyimi",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00ffc2]/15 text-[11px] font-bold text-[#00ffc2]">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs text-[#8b97a8]/80">
              © {new Date().getFullYear()} 7FX · 7fx.customer.org.tr
            </p>
          </div>
        </aside>

        {/* Form panel */}
        <main className="relative flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_70%_0%,rgba(248,59,0,0.08),transparent)]" aria-hidden />
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
              <Link href="/" className="text-sm font-medium text-[#8b97a8] transition hover:text-[#e8eef6]">
                ← Ana sayfa
              </Link>
            </div>

            <div className="fx-auth-panel relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c1017]/95 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
              <div
                className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-[#f83b00]/15 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-[#00ffc2]/08 blur-3xl"
                aria-hidden
              />
              <div className="relative">{children}</div>
            </div>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-[#8b97a8]">
              Devam ederek 7FX kullanım koşullarını kabul etmiş sayılırsınız. Hassas işlem alanları oturum
              çerezi ile korunur.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
