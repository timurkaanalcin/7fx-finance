"use client";

import { useEffect, useState } from "react";
import { shouldCoverForCapture } from "@/lib/security/screenshot-cover";

/**
 * Customer-site screenshot deterrent (best effort; browsers cannot block OS screenshots).
 * Desktop: black overlay on PrintScreen / screenshot chords / print, and when the
 * tab is actually hidden. Phones and WebViews keep the terminal visible — blur
 * while the page is still shown must not cover it.
 */
export default function ScreenshotShield() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let t: number | null = null;
    const black = (ms?: number) => {
      setOn(true);
      if (t) window.clearTimeout(t);
      if (ms) t = window.setTimeout(() => { if (document.visibilityState === "visible" && document.hasFocus()) setOn(false); }, ms);
    };
    const clear = () => { if (document.visibilityState === "visible") setOn(false); };
    const key = (e: KeyboardEvent) => {
      const k = e.key;
      const mod = e.metaKey || e.ctrlKey;
      if (k === "PrintScreen" || (mod && e.shiftKey && /^[345s]$/i.test(k)) || (e.metaKey && e.shiftKey) || (mod && /^p$/i.test(k))) {
        if (shouldCoverForCapture({ reason: "key", visibilityState: document.visibilityState })) black(2000);
      }
    };
    const vis = () => {
      if (document.visibilityState === "visible") clear();
      else if (shouldCoverForCapture({ reason: "visibility", visibilityState: document.visibilityState })) black();
    };
    const blur = () => {
      window.setTimeout(() => {
        if (document.activeElement?.tagName === "IFRAME") return;
        if (shouldCoverForCapture({ reason: "blur", visibilityState: document.visibilityState })) black();
      }, 0);
    };
    const onPageHide = () => {
      if (shouldCoverForCapture({ reason: "pagehide", visibilityState: document.visibilityState })) black();
    };
    window.addEventListener("keydown", key, true);
    window.addEventListener("keyup", key, true);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", clear);
    const onBeforePrint = () => black();
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", clear);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", clear);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("keyup", key, true);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", clear);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", clear);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", clear);
      document.removeEventListener("visibilitychange", vis);
      if (t) window.clearTimeout(t);
    };
  }, []);
  return (
    <>
      <style>{`@media print { html, body { background: #000 !important; } body * { visibility: hidden !important; } }`}</style>
      {on && <div aria-hidden className="fixed inset-0 z-[2147483647] bg-black" style={{ background: "#000" }} />}
    </>
  );
}
