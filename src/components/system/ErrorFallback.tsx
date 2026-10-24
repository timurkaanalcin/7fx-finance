"use client";
import { useEffect } from "react";
import PlatformStatus from "@/components/system/PlatformStatus";

export function reportClientError(error: unknown, where: string) {
  try {
    const e = error as { message?: string; stack?: string; digest?: string };
    const body = JSON.stringify({
      where,
      message: String(e?.message || error).slice(0, 1000),
      stack: String(e?.stack || "").slice(0, 4000),
      digest: e?.digest,
      url: typeof location !== "undefined" ? location.href : "",
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
    else fetch("/api/client-error", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {}
}

export default function ErrorFallback({ error, reset, where }: { error: Error & { digest?: string }; reset: () => void; where: string }) {
  useEffect(() => {
    console.error("[7fx] render error in", where, error);
    reportClientError(error, where);
  }, [error, where]);
  const reference = error.digest ? ` Reference ${error.digest}.` : "";
  return (
    <PlatformStatus
      code="500"
      title="This screen did not load"
      body={`Something on this page failed. Your account and orders are unchanged.${reference} Try again, or go back to the terminal.`}
      primary={{ label: "Try again", onClick: () => reset() }}
      secondary={{ href: "/trade", label: "Open terminal" }}
    />
  );
}
