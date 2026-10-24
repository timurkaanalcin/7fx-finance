"use client";

import { useEffect } from "react";

/** CRM screens that stay open while nobody is editing them. Hidden tabs still pause. */
export const CRM_IDLE_POLL_MS = 20_000;

/** Run `fn` on an interval only while the tab is visible, and once when it becomes visible again. */
export function useVisiblePoll(fn: () => void, ms: number, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.hidden) return;
      fn();
    };
    const id = window.setInterval(tick, ms);
    const onVis = () => {
      if (!document.hidden) fn();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fn, ms, enabled]);
}
