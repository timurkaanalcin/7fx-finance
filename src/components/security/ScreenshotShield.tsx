"use client";

import { useEffect, useState } from "react";

/**
 * Customer-site screenshot deterrent (best effort; browsers cannot block OS screenshots).
 * Instant full-screen black overlay on PrintScreen / Cmd|Ctrl+Shift(+3/4/5/S) / blur / hidden / pagehide,
 * and black output when printing. Content is otherwise shown normally.
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
        black(2000);
      }
    };
    const vis = () => (document.visibilityState === "visible" ? clear() : black());
    const blur = () => { window.setTimeout(() => { if (document.activeElement?.tagName === "IFRAME") return; black(); }, 0); };
    window.addEventListener("keydown", key, true);
    window.addEventListener("keyup", key, true);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", clear);
    window.addEventListener("pagehide", () => black());
    window.addEventListener("pageshow", clear);
    window.addEventListener("beforeprint", () => black());
    window.addEventListener("afterprint", clear);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("keyup", key, true);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", clear);
      window.removeEventListener("pagehide", blur);
      window.removeEventListener("pageshow", clear);
      window.removeEventListener("beforeprint", blur);
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
