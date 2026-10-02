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
    <div className="fx-auth-page min-h-screen" data-fx-ui="auth-light">
      <div className="relative isolate flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="fx-auth-grid absolute inset-0 opacity-[0.45]" />
          <div className="absolute left-1/2 top-0 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-black/5 blur-[100px]" />
          <div className="absolute bottom-0 left-[12%] h-64 w-64 rounded-full bg-black/5 blur-[90px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-[#ffffff]" />
        </div>

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
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#5c657a] transition hover:bg-[#f0f0f0] hover:text-[#111111]"
          >
            ← Main sayfa
          </Link>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
          <div className="w-full max-w-[440px]">
            <div className="mb-7 text-center sm:mb-8">
              <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(16,20,37,0.08)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#111111] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#111111] shadow-[0_0_8px_rgba(17,17,17,0.45)]" />
                {isLogin ? "Secure sign-in" : "New account"}
              </p>
              <h1 className="mt-4 text-[1.65rem] font-semibold leading-tight tracking-tight text-[#111111] sm:text-[1.85rem]">
                {isLogin ? (
                  <>
                    Return to your account{" "}
                    <span className="fx-auth-accent-text">safely</span>
                  </>
                ) : (
                  <>
                    A professional start{" "}
                    <span className="fx-auth-accent-text">to investing</span>
                  </>
                )}
              </h1>
              <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-[#5c657a]">
                {isLogin
                  ? "After authentication the trading terminal opens. Admin accounts are redirected to /admin."
                  : "Enter your details; terminal access opens automatically after registration. Referral code is required."}
              </p>
            </div>

            <div className="fx-auth-panel relative overflow-hidden rounded-2xl border border-[rgba(16,20,37,0.08)] bg-white p-6 shadow-[0_16px_48px_rgba(16,20,37,0.08)] sm:rounded-[1.35rem] sm:p-8">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/30 to-transparent"
                aria-hidden
              />
              <div className="relative">{children}</div>
            </div>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-[#8b93a7]">
              By continuing you accept the 7FX terms of use.
              <br className="hidden sm:block" />
              Sensitive trading areas are protected with a session cookie.
            </p>
            <p className="mt-4 text-center text-[11px] text-[#8b93a7]">
              © {new Date().getFullYear()} 7FX · 7fx.customer.org.tr
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
