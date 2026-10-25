"use client";

import { useEffect, useRef } from "react";

/**
 * Best-effort screenshot / capture heuristics.
 * Honest limitation: browsers cannot reliably detect OS-level screenshots
 * (PrintScreen on many desktop OSes, iOS/Android system capture). We report
 * strong signals when available and soft signals (tab hide after PrintScreen key)
 * with reason tags for CRM.
 */
export default function ScreenshotGuard() {
  const lastSent = useRef(0);

  useEffect(() => {
    function report(reason: string, meta?: Record<string, unknown>) {
      const now = Date.now();
      if (now - lastSent.current < 8000) return;
      lastSent.current = now;
      const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
      void fetch("/api/activity/screenshot", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          reason,
          meta: {
            ...meta,
            visibility: typeof document !== "undefined" ? document.visibilityState : null,
            ts: now,
          },
        }),
      }).catch(() => {});
    }

    let printScreenArmed = false;
    let armTimer: ReturnType<typeof setTimeout> | null = null;

    function onKeyDown(e: KeyboardEvent) {
      const key = e.key || "";
      const code = e.code || "";
      // PrintScreen / dedicated screenshot chords where browsers expose them
      if (key === "PrintScreen" || code === "PrintScreen") {
        printScreenArmed = true;
        report("keydown_printscreen");
        if (armTimer) clearTimeout(armTimer);
        armTimer = setTimeout(() => {
          printScreenArmed = false;
        }, 4000);
      }
      // macOS Cmd+Shift+3/4/5 — browsers usually do NOT see these; still listen
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (key === "3" || key === "4" || key === "5")) {
        report("keydown_screenshot_chord", { key });
      }
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        if (printScreenArmed) {
          report("visibility_after_printscreen");
          printScreenArmed = false;
        } else {
          // Soft mobile signal: app backgrounded (may be screenshot OR just app switch)
          const coarse =
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(pointer: coarse)").matches;
          if (coarse) {
            report("visibility_hidden_mobile_best_effort");
          }
        }
      }
    }

    function onBlur() {
      if (printScreenArmed) {
        report("blur_after_printscreen");
      }
    }

    // Clipboard API: some environments put a bitmap after PrintScreen (rare / permissioned)
    async function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          report("clipboard_image_paste");
          break;
        }
      }
    }

    // Screen Capture API / getDisplayMedia — if page ever uses it (defensive)
    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : null;
    let origGetDisplay: typeof navigator.mediaDevices.getDisplayMedia | null = null;
    if (mediaDevices?.getDisplayMedia) {
      const capture = mediaDevices.getDisplayMedia.bind(mediaDevices);
      origGetDisplay = capture;
      mediaDevices.getDisplayMedia = async (...args: Parameters<typeof capture>) => {
        report("getDisplayMedia");
        return capture(...args);
      };
    }

    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("paste", onPaste);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("paste", onPaste);
      if (armTimer) clearTimeout(armTimer);
      if (mediaDevices && origGetDisplay) {
        mediaDevices.getDisplayMedia = origGetDisplay;
      }
    };
  }, []);

  return null;
}
