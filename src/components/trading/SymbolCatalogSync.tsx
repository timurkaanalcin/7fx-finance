"use client";

/**
 * Keeps the browser-side symbol catalog (used by formatPrice / pip helpers) in sync with
 * the admin-editable server catalog (/api/symbols): digits, pip size, custom symbols.
 * Renders nothing.
 */
import { useEffect } from "react";

const REFRESH_MS = 60_000;

export default function SymbolCatalogSync() {
  useEffect(() => {
    let stop = false;
    let timer = 0;
    let onVis = () => {};
    void import("@/lib/symbols").then(({ replaceSymbolCatalog }) => {
      if (stop) return;
      async function sync() {
        try {
          const res = await fetch("/api/symbols", { cache: "no-store" });
          if (!res.ok) return;
          const list = await res.json();
          if (!stop && Array.isArray(list) && list.length) {
            replaceSymbolCatalog(list as Parameters<typeof replaceSymbolCatalog>[0]);
          }
        } catch {
          /* keep built-ins */
        }
      }
      void sync();
      const tick = () => {
        if (document.hidden) return;
        void sync();
      };
      timer = window.setInterval(tick, REFRESH_MS);
      onVis = () => {
        if (!document.hidden) void sync();
      };
      document.addEventListener("visibilitychange", onVis);
    });
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return null;
}
