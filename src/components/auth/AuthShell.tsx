"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import BrandLogo from "@/components/landing/BrandLogo";
import TerminalWindow from "@/components/public/TerminalWindow";
import { useI18n } from "@/lib/i18n/context";

type AuthShellProps = {
  mode: "login" | "register";
  children: ReactNode;
};

export default function AuthShell({ mode, children }: AuthShellProps) {
  const { t } = useI18n();
  const isLogin = mode === "login";
  const [host, setHost] = useState("");
  useEffect(() => {
    setHost(window.location.host);
  }, []);

  return (
    <div className="fx-auth-page min-h-screen" data-fx-ui="auth-dark">
      <div className="relative isolate flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="fx-auth-grid absolute inset-0 opacity-80" />
          <div className="absolute left-1/2 top-0 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-[#3ddc97]/10 blur-[120px]" />
        </div>

        <header
          className={`relative z-10 mx-auto flex w-full items-center justify-between px-4 pb-2 pt-6 sm:px-6 sm:pt-8 ${
            isLogin ? "max-w-lg sm:max-w-xl" : "fx-auth-wide"
          }`}
        >
          <Link href="/" className="inline-flex items-center no-underline" aria-label={t("landing.homeAria")}>
            <BrandLogo priority className="fx-nav-logo h-10 w-auto sm:h-11" height={44} />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-3 text-sm font-medium text-[#c5cedd] transition hover:bg-white/5 hover:text-white"
          >
            ← {t("common.home")}
          </Link>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
          <div className={isLogin ? "w-full max-w-[440px]" : "fx-auth-register w-full"}>
            <div className={isLogin ? "" : "fx-auth-register-grid"}>
              <div className="min-w-0">
                <div className="mb-6 text-center sm:mb-8">
                  <p
                    className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#d7ffe9] ${
                      isLogin ? "font-semibold" : "font-normal"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3ddc97] shadow-[0_0_8px_rgba(61,220,151,0.8)]" />
                    {isLogin ? t("auth.badge.login") : t("auth.badge.register")}
                  </p>
                  <h1
                    className={`mt-4 text-[1.7rem] leading-tight tracking-tight sm:text-[2rem] ${
                      isLogin ? "font-semibold" : "font-normal"
                    }`}
                  >
                    {isLogin ? (
                      <>
                        {t("auth.loginLead")}{" "}
                        <span className="fx-auth-accent-text">{t("auth.loginAccent")}</span>
                      </>
                    ) : (
                      <>
                        {t("auth.registerLead")}{" "}
                        <span className="fx-auth-accent-text">{t("auth.registerAccent")}</span>
                      </>
                    )}
                  </h1>
                  <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-[#9aa3b5]">
                    {isLogin ? t("auth.loginBody") : t("auth.registerBody")}
                  </p>
                </div>

                <div className="fx-auth-panel relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:rounded-[1.35rem] sm:p-8">
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3ddc97]/70 to-transparent"
                    aria-hidden
                  />
                  <div className="relative">{children}</div>
                </div>

                <p className="mt-6 text-center text-xs leading-relaxed text-[#b7c0d0]">
                  {t("auth.terms")}
                  <br />
                  {t("auth.sessionNote")}
                </p>
                <p className="mt-4 text-center text-xs text-[#b7c0d0]">
                  © {new Date().getFullYear()} 7FX{host ? ` · ${host}` : ""}
                </p>
              </div>
              {!isLogin ? <TerminalWindow /> : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
