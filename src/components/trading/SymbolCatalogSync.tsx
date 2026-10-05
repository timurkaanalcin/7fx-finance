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
    sync();
    const t = setInterval(sync, REFRESH_MS);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);
  return null;
}
