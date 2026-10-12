"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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

  // Landing has a mobile sticky CTA at the bottom; sit just above it there.
  const lift = pathname === "/" ? "bottom-[calc(76px+env(safe-area-inset-bottom,0px))] md:bottom-4" : "bottom-[calc(12px+env(safe-area-inset-bottom,0px))]";

  return (
    <div className={`fixed inset-x-3 z-[90] mx-auto max-w-sm ${lift}`} role="region" aria-label="Uygulamayı yükle">
      {steps && (
        <div className="mb-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] leading-relaxed text-[#111111] shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
          <p className="font-semibold">Ana ekrana ekleyin</p>
          <ol className="mt-1 list-decimal pl-4 text-[#5c657a]">
            <li>Safari&apos;de alttaki <b className="text-[#111111]">Paylaş</b> <span aria-hidden>⬆︎</span> simgesine dokunun</li>
            <li><b className="text-[#111111]">Ana Ekrana Ekle</b>&apos;yi seçin, sonra <b className="text-[#111111]">Ekle</b>&apos;ye dokunun</li>
          </ol>
        </div>
      )}
      <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/95 py-1.5 pl-2 pr-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/v3/icon-192.png" alt="" className="h-7 w-7 rounded-lg" />
        <button type="button" onClick={onClick} className="flex-1 text-left text-[12.5px] font-semibold text-[#111111]">
          Uygulamayı indirmek için tıklayınız
        </button>
        <button type="button" onClick={close} aria-label="Kapat" className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-black">
          ×
        </button>
      </div>
    </div>
  );
}
