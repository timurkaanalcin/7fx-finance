"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";

type AuthShellProps = {
  mode: "login" | "register";
  children: ReactNode;
};

export default function AuthShell({ mode, children }: AuthShellProps) {
  const isLogin = mode === "login";
  const { t } = useI18n();

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
          <Link href="/" className="inline-flex items-center no-underline" aria-label={t("landing.homeAria")}>
            <span className="inline-flex h-11 items-center rounded-xl bg-[#0b0b0c] px-3">
              <picture>
                <source srcSet="/brand/7fx-logo-80.webp" type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/7fx-logo-80.png" alt="7FX" width={32} height={28} className="h-7 w-auto" />
              </picture>
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#5c657a] transition hover:bg-[#f0f0f0] hover:text-[#111111]"
          >
            <span aria-hidden>←</span> {t("authx.backHome")}
          </Link>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
          <div className="w-full max-w-[440px]">
            <div className="mb-7 text-center sm:mb-8">
              <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(16,20,37,0.08)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#111111] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#111111] shadow-[0_0_8px_rgba(17,17,17,0.45)]" />
                {isLogin ? t("authx.badgeLogin") : t("authx.badgeRegister")}
              </p>
              <h1 className="mt-4 text-[1.65rem] font-semibold leading-tight tracking-tight text-[#111111] sm:text-[1.85rem]">
                {isLogin ? (
                  <>
                    {t("authx.loginTitle1")}{" "}
                    <span className="fx-auth-accent-text">{t("authx.loginTitle2")}</span>
                  </>
                ) : (
                  <>
                    {t("authx.registerTitle1")}{" "}
                    <span className="fx-auth-accent-text">{t("authx.registerTitle2")}</span>
                  </>
                )}
              </h1>
              <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-[#5c657a]">
                {isLogin ? t("authx.loginBody") : t("authx.registerBody")}
              </p>
            </div>

            <div className="fx-auth-panel relative overflow-hidden rounded-2xl border border-[rgba(16,20,37,0.08)] bg-white p-6 shadow-[0_16px_48px_rgba(16,20,37,0.08)] sm:rounded-[1.35rem] sm:p-8">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/30 to-transparent"
                aria-hidden
              />
              <div className="relative">{children}</div>
            </div>

            <p className="mt-6 text-center text-[12px] leading-relaxed text-[#5c657a]">
              {t("authx.terms")}
              <br className="hidden sm:block" /> {t("authx.secure")}
            </p>
            <p className="mt-4 text-center text-[12px] text-[#5c657a]">
              © {new Date().getFullYear()} 7FX · 7fx.control.org.tr
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
