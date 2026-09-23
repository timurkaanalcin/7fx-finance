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
    <div className="fx-landing fx-auth-page min-h-screen" data-fx-ui="auth-pages-v2">
      <div className="relative isolate flex min-h-screen flex-col">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="fx-auth-grid absolute inset-0 opacity-[0.4]" />
          <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#f83b00]/12 blur-[120px]" />
          <div className="absolute bottom-0 left-[10%] h-72 w-72 rounded-full bg-[#00ffc2]/08 blur-[100px]" />
          <div className="absolute bottom-[15%] right-[8%] h-64 w-64 rounded-full bg-[#f83b00]/08 blur-[90px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07090d]/30 via-transparent to-[#07090d]" />
        </div>

        {/* Top bar */}
        <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between px-4 pb-2 pt-6 sm:max-w-xl sm:px-6 sm:pt-8">
          <Link href="/" className="inline-flex items-center no-underline" aria-label="7FX ana sayfa">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/7fx-logo.png"
              alt="7FX"
              className="h-11 w-auto object-contain sm:h-12"
            />
          </Link>
          <Link
            href="/"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#8b97a8] transition hover:bg-white/5 hover:text-[#e8eef6]"
          >
            ← Ana sayfa
          </Link>
        </header>

        {/* Centered card */}
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
          <div className="w-full max-w-[440px]">
            <div className="mb-7 text-center sm:mb-8">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#f83b00]/30 bg-[#0c1017]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f83b00] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00ffc2] shadow-[0_0_8px_#00ffc2]" />
                {isLogin ? "Güvenli giriş" : "Yeni hesap"}
              </p>
              <h1 className="mt-4 text-[1.65rem] font-semibold leading-tight tracking-tight text-[#e8eef6] sm:text-[1.85rem]">
                {isLogin ? (
                  <>
                    Hesabınıza{" "}
                    <span className="fx-accent-text">güvenle dönün</span>
                  </>
                ) : (
                  <>
                    Yatırıma{" "}
                    <span className="fx-accent-text">profesyonel başlangıç</span>
                  </>
                )}
              </h1>
              <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-[#8b97a8]">
                {isLogin
                  ? "Kimlik doğrulama sonrası işlem terminali açılır. Yönetici hesapları /admin’e yönlendirilir."
                  : "Bilgilerinizi girin; kayıt sonrası terminal erişimi otomatik açılır. Referans kodu zorunludur."}
              </p>
            </div>

            <div className="fx-auth-panel relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c1017]/92 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:rounded-[1.35rem] sm:p-8">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f83b00]/50 to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-20 -top-16 h-44 w-44 rounded-full bg-[#f83b00]/12 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-[#00ffc2]/07 blur-3xl"
                aria-hidden
              />
              <div className="relative">{children}</div>
            </div>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-[#8b97a8]/90">
              Devam ederek 7FX kullanım koşullarını kabul etmiş sayılırsınız.
              <br className="hidden sm:block" />
              Hassas işlem alanları oturum çerezi ile korunur.
            </p>
            <p className="mt-4 text-center text-[11px] text-[#8b97a8]/70">
              © {new Date().getFullYear()} 7FX · 7fx.customer.org.tr
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
