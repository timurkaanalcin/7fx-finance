"use client";

/**
 * Keeps the browser-side symbol catalog (used by formatPrice / pip helpers) in sync with
 * the admin-editable server catalog (/api/symbols): digits, pip size, custom symbols.
 * Renders nothing.
 */
import { useEffect } from "react";
import { replaceSymbolCatalog, type SymbolDef } from "@/lib/symbols";

const REFRESH_MS = 60_000;

export default function SymbolCatalogSync() {
  useEffect(() => {
    let stop = false;
    async function sync() {
      try {
        const res = await fetch("/api/symbols", { cache: "no-store" });
        if (!res.ok) return;
        const list = (await res.json()) as SymbolDef[];
        if (!stop && Array.isArray(list) && list.length) replaceSymbolCatalog(list);
      } catch {
        /* keep built-ins */
      }
    }
    void sync();
    const tick = () => {
      if (document.hidden) return;
      void sync();
    };
    const t = setInterval(tick, REFRESH_MS);
    const onVis = () => {
      if (!document.hidden) void sync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return null;
}
