"use client";
import { useEffect, useState } from "react";

export type FxTheme = "light" | "dark";
export const FX_THEME_KEY = "fx-theme";

export function getFxTheme(): FxTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-fx-theme") === "dark" ? "dark" : "light";
}

export function useFxTheme(): FxTheme {
  const [t, setT] = useState<FxTheme>("light");
  useEffect(() => {
    setT(getFxTheme());
    const mo = new MutationObserver(() => setT(getFxTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-fx-theme"] });
    return () => mo.disconnect();
  }, []);
  return t;
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useFxTheme();
  const next: FxTheme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className={`fx-theme-toggle inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border ${className}`}
      aria-label={theme === "dark" ? "Switch to day theme" : "Switch to night theme"}
      title={theme === "dark" ? "Day" : "Night"}
      onClick={() => {
        document.documentElement.setAttribute("data-fx-theme", next);
        try { localStorage.setItem(FX_THEME_KEY, next); } catch {}
      }}
    >
      {theme === "dark" ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z" /></svg>
      )}
    </button>
  );
}
