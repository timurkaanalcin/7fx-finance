"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  open: boolean;
  onClose: () => void;
};

const ROWS: { keys: string[]; label: string }[] = [
  { keys: ["B"], label: "term.kb.buy" },
  { keys: ["S"], label: "term.kb.sell" },
  { keys: ["/"], label: "term.kb.search" },
  { keys: ["C"], label: "term.kb.calc" },
  { keys: ["1"], label: "term.kb.tabOpen" },
  { keys: ["2"], label: "term.kb.tabClosed" },
  { keys: ["3"], label: "term.kb.tabPending" },
  { keys: ["["], label: "term.kb.tfPrev" },
  { keys: ["]"], label: "term.kb.tfNext" },
  { keys: ["?"], label: "term.kb.help" },
  { keys: ["Esc"], label: "term.kb.esc" },
];

/** Terminal keyboard-shortcut cheat sheet (theme-aware via desk-* tokens). */
export default function ShortcutsHelp({ open, onClose }: Props) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      try {
        prev?.focus?.();
      } catch {
        /* ignore */
      }
    };
  }, [open]);

  if (!open) return null;

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Simple focus trap: dialog only has one focusable (close button)
    if (e.key === "Tab") {
      e.preventDefault();
      closeRef.current?.focus();
    }
  }

  return (
    <div
      className="fx-lx-overlay fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fx-kb-title"
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="fx-lx-modal w-full max-w-sm rounded-modal border border-desk-border bg-desk-panel text-desk-text shadow-desk-panel"
      >
        <div className="flex items-center justify-between border-b border-desk-border/80 px-4 py-3">
          <h2 id="fx-kb-title" className="text-sm font-semibold tracking-wide">
            {t("term.kb.title")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-7 w-7 items-center justify-center rounded-[7px] text-desk-muted transition-colors hover:bg-desk-elev hover:text-desk-text focus:outline-none focus-visible:ring-1 focus-visible:ring-desk-accent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <ul className="divide-y divide-desk-border/50 px-4 py-1">
          {ROWS.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 py-2 text-xs">
              <span className="text-desk-muted">{t(r.label)}</span>
              <span className="flex gap-1">
                {r.keys.map((k) => (
                  <kbd
                    key={k}
                    className="min-w-[26px] rounded-[6px] border border-desk-border bg-desk-bg px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold text-desk-text"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-desk-border/80 px-4 py-2.5 text-[10px] text-desk-muted">
          {t("term.kb.note")}
        </p>
      </div>
    </div>
  );
}
