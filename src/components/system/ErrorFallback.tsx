"use client";
import { useEffect } from "react";
import PlatformStatus from "@/components/system/PlatformStatus";
import { useT } from "@/lib/i18n/context";

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
  const t = useT();
  const reference = error.digest ? ` ${t("gap.err.reference").replace("{digest}", error.digest)}` : "";
  return (
    <PlatformStatus
      code="500"
      title={t("gap.err.title")}
      body={`${t("gap.err.body")}${reference} ${t("gap.err.after")}`}
      primary={{ label: t("gap.err.retry"), onClick: () => reset() }}
      secondary={{ href: "/trade", label: t("gap.err.terminal") }}
    />
  );
}
