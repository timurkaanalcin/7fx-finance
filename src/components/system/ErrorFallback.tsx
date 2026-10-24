"use client";
import { useEffect } from "react";

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
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, textAlign: "center", border: "1px solid rgba(128,128,128,.3)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Something went wrong</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>Part of the page failed to load. You can try again or refresh the page.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={() => reset()} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #888", background: "transparent", color: "inherit", cursor: "pointer" }}>Try again</button>
          <button onClick={() => location.reload()} style={{ padding: "8px 16px", borderRadius: 10, border: 0, background: "#c9a227", color: "#000", cursor: "pointer" }}>Refresh page</button>
        </div>
      </div>
    </div>
  );
}
