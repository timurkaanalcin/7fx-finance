"use client";

import { useEffect } from "react";

/** Publishes the on-screen keyboard height as `--fx-kb` and keeps the focused field in view. */
export default function KeyboardInset() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    const apply = () => {
      if (!vv) {
        root.style.setProperty("--fx-kb", "0px");
        return;
      }
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--fx-kb", `${Math.round(inset)}px`);
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    const onFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("input, textarea, select")) return;
      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", inline: "nearest" });
      }, 50);
    };
    document.addEventListener("focusin", onFocus);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      document.removeEventListener("focusin", onFocus);
      root.style.removeProperty("--fx-kb");
    };
  }, []);
  return null;
}
