"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1;
  return iOS || iPadOs;
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mq || iosStandalone);
}

function isSafariLike() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Exclude Chromium-based browsers that include "Safari" in UA
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return false;
  return /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua);
}

const androidIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.6 9.48l1.84-3.18a.5.5 0 00-.86-.5l-1.86 3.22A7.9 7.9 0 0012 7.5c-1.62 0-3.12.48-4.36 1.3L5.78 5.8a.5.5 0 10-.86.5L6.76 9.48A7.96 7.96 0 004 15.5v.5h16v-.5a7.96 7.96 0 00-2.4-6.02zM8.5 13.25a.75.75 0 110-1.5.75.75 0 010 1.5zm7 0a.75.75 0 110-1.5.75.75 0 010 1.5zM7 17.5h10v1.25c0 .69-.56 1.25-1.25 1.25H8.25C7.56 20 7 19.44 7 18.75V17.5z" />
  </svg>
);

const appleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.22-1.98 1.08-3.13-1.05.04-2.31.7-3.06 1.58-.67.78-1.25 2.05-1.09 3.25 1.15.09 2.33-.66 3.07-1.7z" />
  </svg>
);

type Props = {
  /** hero = larger padding; mobile = slightly tighter */
  size?: "hero" | "mobile";
  className?: string;
};

export default function InstallAppButtons({ size = "hero", className = "" }: Props) {
  const { t } = useI18n();
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "installing" | "guide">("idle");
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    setAlreadyInstalled(isStandaloneDisplay());
    const onBip = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", () => {
      deferredRef.current = null;
      setAlreadyInstalled(true);
      setSheetOpen(false);
      setPhase("idle");
    });
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const openGuide = useCallback(() => {
    setSheetOpen(true);
    setPhase("installing");
    window.setTimeout(() => setPhase("guide"), 900);
  }, []);

  const onIosClick = useCallback(async () => {
    if (isStandaloneDisplay()) {
      setAlreadyInstalled(true);
      openGuide();
      return;
    }
    const bip = deferredRef.current;
    if (bip) {
      try {
        setSheetOpen(true);
        setPhase("installing");
        await bip.prompt();
        await bip.userChoice;
        deferredRef.current = null;
        setSheetOpen(false);
        setPhase("idle");
        return;
      } catch {
        /* fall through to guided sheet */
      }
    }
    openGuide();
  }, [openGuide]);

  const closeSheet = () => {
    setSheetOpen(false);
    setPhase("idle");
  };

  const pad =
    size === "hero"
      ? "min-h-[48px] px-5 text-[14px] sm:min-h-[52px] sm:px-6 sm:text-[15px]"
      : "min-h-[48px] px-6 text-sm";

  return (
    <>
      <div className={`flex flex-wrap gap-3 ${className}`}>
        <a
          href="/apk"
          className={`inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(16,20,37,0.14)] bg-[#111111] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-[#2a2a2a] ${pad}`}
        >
          {androidIcon}
          {t("landing.androidInstall")}
        </a>
        <button
          type="button"
          onClick={() => void onIosClick()}
          className={`inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(16,20,37,0.14)] bg-white font-semibold text-[#111111] shadow-[0_8px_20px_rgba(16,20,37,0.06)] transition hover:bg-[#f7f8fa] ${pad}`}
        >
          {appleIcon}
          {t("landing.iosInstall")}
        </button>
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fx-ios-install-title"
          onClick={closeSheet}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-[20px] border border-[rgba(16,20,37,0.08)] bg-white shadow-[0_24px_64px_rgba(16,20,37,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            {phase === "installing" ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-14">
                {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
                <img
                  src="/icons/v3/apple-touch-icon.png"
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 animate-pulse rounded-[16px] shadow"
                />
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[#eceef3]">
                  <div className="fx-ios-install-bar h-full w-1/2 rounded-full bg-[#111111]" />
                </div>
                <p className="text-sm font-medium text-[#5c657a]">{t("landing.ios.installing")}</p>
              </div>
            ) : (
              <div className="px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
                  <img src="/icons/v3/apple-touch-icon.png" alt="" width={48} height={48} className="h-12 w-12 rounded-[12px] shadow" />
                  <div className="min-w-0 flex-1">
                    <h2 id="fx-ios-install-title" className="text-[17px] font-semibold text-[#111111]">
                      {alreadyInstalled ? t("landing.ios.alreadyTitle") : t("landing.ios.sheetTitle")}
                    </h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#5c657a]">
                      {alreadyInstalled ? t("landing.ios.alreadyBody") : t("landing.ios.sheetBody")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSheet}
                    className="rounded-full px-2 py-1 text-[#5c657a] hover:bg-[#f0f2f5]"
                    aria-label={t("common.close")}
                  >
                    ✕
                  </button>
                </div>

                {!alreadyInstalled && (
                  <ol className="mt-5 space-y-3">
                    {[
                      { n: "1", title: t("landing.ios.step1Title"), body: t("landing.ios.step1Body") },
                      { n: "2", title: t("landing.ios.step2Title"), body: t("landing.ios.step2Body") },
                      { n: "3", title: t("landing.ios.step3Title"), body: t("landing.ios.step3Body") },
                    ].map((s) => (
                      <li
                        key={s.n}
                        className="flex gap-3 rounded-2xl border border-[rgba(16,20,37,0.08)] bg-[#f7f8fa] p-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[12px] font-semibold text-white">
                          {s.n}
                        </span>
                        <div>
                          <p className="text-[14px] font-semibold text-[#111111]">{s.title}</p>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-[#5c657a]">{s.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  {alreadyInstalled ? (
                    <a
                      href="/trade"
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-[#111111] px-4 text-[14px] font-semibold text-white"
                    >
                      {t("landing.ios.openApp")}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={closeSheet}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-[#111111] px-4 text-[14px] font-semibold text-white"
                    >
                      {t("landing.ios.gotIt")}
                    </button>
                  )}
                  {!isIosDevice() && (
                    <a
                      href="/ios"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[rgba(16,20,37,0.14)] px-4 text-[13px] font-semibold text-[#111111]"
                    >
                      {t("landing.ios.fullGuide")}
                    </a>
                  )}
                </div>

                {isIosDevice() && !isSafariLike() && !alreadyInstalled && (
                  <p className="mt-3 text-[11px] leading-relaxed text-amber-700">{t("landing.ios.safariHint")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
