"use client";

import { useEffect } from "react";

const INTERVAL_MS = 45_000;

/** Pings /api/presence while the tab is visible so the CRM can show the client as online. */
export default function PresenceHeartbeat() {
  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;

    const ping = () => {
      if (stopped || document.visibilityState !== "visible") return;
      fetch("/api/presence", { method: "POST", cache: "no-store", keepalive: true })
        .then((r) => {
          if (r.status === 401) stopped = true;
        })
        .catch(() => {});
    };

    const start = () => {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(ping, INTERVAL_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        ping();
        start();
      } else if (timer) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    ping();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
