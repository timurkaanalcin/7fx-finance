"use client";

import { useEffect, useState } from "react";
import "./install-banner.css";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const INSTALLED_KEY = "fx_pwa_installed";
const DISMISS_KEY = "fx_install_banner_dismissed_until";
const WEEK = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
function isIos() {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function ls(k: string, v?: string) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    localStorage.setItem(k, v);
  } catch {}
  return null;
}

export default function InstallBanner() {
  const { t } = useI18n();
  const pathname = usePathname() || "/";
  const [bip, setBip] = useState<BIP | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    if (isStandalone()) { ls(INSTALLED_KEY, "1"); return; }
    if (ls(INSTALLED_KEY) === "1") return;
    if (Number(ls(DISMISS_KEY) || 0) > Date.now()) return;
    const iosDev = isIos();
    setIos(iosDev);
    if (iosDev) setShow(true);
    const onBip = (e: Event) => { e.preventDefault(); setBip(e as BIP); setShow(true); };
    const onInstalled = () => { ls(INSTALLED_KEY, "1"); setShow(false); };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!show || pathname.startsWith("/izcrm")) return null;

  async function onClick() {
    if (bip) {
      await bip.prompt();
      const { outcome } = await bip.userChoice.catch(() => ({ outcome: "dismissed" as const }));
      if (outcome === "accepted") { ls(INSTALLED_KEY, "1"); setShow(false); }
      setBip(null);
      return;
    }
    if (ios) setSteps((s) => !s);
  }
  function close() {
    ls(DISMISS_KEY, String(Date.now() + WEEK));
    setShow(false);
  }

  // Landing has a mobile sticky CTA at the bottom; float just above it there.
  const lift = pathname === "/" ? "bottom-[calc(80px+env(safe-area-inset-bottom,0px))] md:bottom-5" : "bottom-[calc(14px+env(safe-area-inset-bottom,0px))]";

  return (
    <div className={`fx-install-in fixed inset-x-3 z-[90] mx-auto max-w-[380px] ${lift}`} role="region" aria-label={t("install.aria")}>
      {steps && (
        <div className="fx-install-steps mb-2 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-[12px] leading-relaxed text-[#111111] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.25)]">
          <p className="text-[12.5px] font-semibold">{t("install.iosTitle")}</p>
          <ol className="mt-1.5 space-y-1 text-[#5c657a]">
            <li className="flex gap-2"><span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[9px] font-bold text-white">1</span><span>{t("install.ios1")}</span></li>
            <li className="flex gap-2"><span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[9px] font-bold text-white">2</span><span>{t("install.ios2")}</span></li>
          </ol>
        </div>
      )}
      <div className="fx-install-card relative overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-3 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.06)]">
        <span className="fx-install-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/2" aria-hidden />
        <div className="flex items-center gap-2">
          <span className="fx-install-icon relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
            <img src="/icons/v3/icon-64.png" alt="" width={24} height={24} loading="lazy" decoding="async" className="h-6 w-6 rounded-[8px] shadow-[0_6px_14px_rgba(0,0,0,0.25)] ring-1 ring-black/5" />
          </span>
          <button type="button" onClick={onClick} className="inline-flex min-h-11 min-w-0 flex-1 items-center text-left">
            <span>
            <span className="block text-[13px] font-medium leading-tight tracking-tight text-[#111111]">{t("install.title")}</span>
            <span className="mt-0.5 block text-xs text-neutral-600">{t("install.subtitle")}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onClick}
            className="fx-install-cta inline-flex min-h-11 shrink-0 items-center rounded-full bg-[#111111] px-4 text-[12.5px] font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.3)] transition active:scale-95 hover:bg-black"
          >
            {t("install.action")}
          </button>
          <button type="button" onClick={close} aria-label={t("install.close")} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] leading-none text-neutral-400 transition hover:bg-neutral-100 hover:text-black">
            ×
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fxInstallIn { from { opacity: 0; transform: translateY(24px) scale(.98) } to { opacity: 1; transform: none } }
        @keyframes fxInstallShine { 0%, 70% { transform: translateX(0) } 100% { transform: translateX(400%) } }
        @keyframes fxInstallPulse { 0%, 100% { box-shadow: 0 6px 16px rgba(0,0,0,.3), 0 0 0 0 rgba(17,17,17,.35) } 50% { box-shadow: 0 6px 16px rgba(0,0,0,.3), 0 0 0 7px rgba(17,17,17,0) } }
        .fx-install-in { animation: fxInstallIn .55s cubic-bezier(.2,.8,.2,1) both }
        .fx-install-steps { animation: fxInstallIn .3s ease-out both }
        .fx-install-shine { background: linear-gradient(100deg, transparent, rgba(0,0,0,.045), transparent); animation: fxInstallShine 4.5s ease-in-out 1s infinite }
        .fx-install-cta { animation: fxInstallPulse 2.4s ease-in-out 1.2s infinite }
        @media (prefers-reduced-motion: reduce) { .fx-install-in, .fx-install-steps, .fx-install-shine, .fx-install-cta { animation: none } }
      `}</style>
    </div>
  );
}
