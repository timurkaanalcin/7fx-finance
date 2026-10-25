"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function listFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    if (el.getAttribute("aria-hidden") === "true") return false;
    if (el.tabIndex < 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  });
}

/**
 * Move focus into a dialog, keep Tab inside it, and run `onEscape` for Esc.
 * Restores the previously focused element when the dialog closes.
 */
export function useDialogFocus(
  active: boolean,
  onEscape: () => void,
  ref: RefObject<HTMLElement | null>,
  initialSelector?: string
) {
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const preferred = initialSelector
      ? root.querySelector<HTMLElement>(initialSelector)
      : null;
    const first = preferred && preferred.tabIndex >= 0 ? preferred : listFocusable(root)[0];
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        escapeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = listFocusable(root);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const start = items[0];
      const end = items[items.length - 1];
      const current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const inside = current ? root.contains(current) : false;
      if (e.shiftKey) {
        if (!inside || current === start) {
          e.preventDefault();
          end.focus();
        }
      } else if (!inside || current === end) {
        e.preventDefault();
        start.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      if (prev && document.contains(prev)) {
        try {
          prev.focus({ preventScroll: true });
        } catch {
          /* ignore */
        }
      }
    };
  }, [active, initialSelector, ref]);
}
