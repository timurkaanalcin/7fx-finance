"use client";

import { useEffect, useMemo, useState } from "react";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

type Props = {
  adminName: string;
  adminEmail?: string;
  adminId?: string;
  readOnly?: boolean;
  children: React.ReactNode;
};

function clientDeviceTag(): string {
  if (typeof navigator === "undefined") return "srv";
  const ua = navigator.userAgent || "";
  let h = 0;
  for (let i = 0; i < ua.length; i++) h = (h * 31 + ua.charCodeAt(i)) >>> 0;
  const screen = typeof window !== "undefined" ? `${window.screen?.width || 0}x${window.screen?.height || 0}` : "";
  const lang = navigator.language || "";
  let h2 = 0;
  const s2 = `${screen}|${lang}|${navigator.platform || ""}`;
  for (let i = 0; i < s2.length; i++) h2 = (h2 * 31 + s2.charCodeAt(i)) >>> 0;
  return `${h.toString(16).slice(0, 6)}-${h2.toString(16).slice(0, 6)}`;
}

/** Encode forensic id as zero-width chars (invisible in screenshots of text layers / paste). */
function zwMark(id: string): string {
  const bits = Array.from(new TextEncoder().encode(id.slice(0, 48)))
    .map((b) => b.toString(2).padStart(8, "0"))
    .join("");
  return bits.replace(/0/g, "\u200B").replace(/1/g, "\u200C");
}

/**
 * CRM anti-exfil chrome: watermark with admin id + device fingerprint,
 * invisible ZW mark, copy/print restrictions, export audit.
 */
export default function CrmSecurityShell({
  adminName,
  adminEmail,
  adminId,
  readOnly,
  children,
}: Props) {
  const { i18n } = useCrmLabels();
  const [now, setNow] = useState(() => new Date());
  const [deviceTag, setDeviceTag] = useState("…");

  useEffect(() => {
    setDeviceTag(clientDeviceTag());
  }, []);

  const label = useMemo(() => {
    const t = now.toISOString().replace("T", " ").slice(0, 19) + "Z";
    const idPart = adminId ? `ID:${adminId.slice(0, 10)}` : "";
    return [adminName, adminEmail, idPart, `DEV:${deviceTag}`, t].filter(Boolean).join(" · ");
  }, [adminName, adminEmail, adminId, deviceTag, now]);

  const invisible = useMemo(
    () => zwMark(`${adminId || "?"}|${deviceTag}|${adminEmail || ""}`),
    [adminId, deviceTag, adminEmail]
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const forensic = `\n\n— 7FX CRM · ${label} —`;
    const onCtx = (e: Event) => {
      if (readOnly) e.preventDefault();
    };
    const onCopy = (e: ClipboardEvent) => {
      const sel = window.getSelection()?.toString() || "";
      if (sel.length > 40) {
        e.clipboardData?.setData("text/plain", sel + forensic + invisible);
        e.preventDefault();
      } else if (readOnly && sel.length > 20) {
        e.preventDefault();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        void fetch("/api/admin/export-audit", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "print_attempt", path: location.pathname, adminId, deviceTag }),
        });
      }
      if (readOnly && (e.ctrlKey || e.metaKey) && ["c", "x", "s"].includes(e.key.toLowerCase())) {
        const sel = window.getSelection()?.toString() || "";
        if (sel.length > 20 || e.key.toLowerCase() === "s") e.preventDefault();
      }
    };
    const onBeforePrint = () => {
      void fetch("/api/admin/export-audit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "print", path: location.pathname, adminId, deviceTag }),
      });
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const a = t?.closest?.("a[download]") as HTMLAnchorElement | null;
      if (a) {
        void fetch("/api/admin/export-audit", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "download_link",
            path: location.pathname,
            note: a.getAttribute("download") || a.href,
            adminId,
            deviceTag,
          }),
        });
        if (readOnly) {
          e.preventDefault();
          alert(i18n("gap.crm.exportOff"));
        }
      }
    };

    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("copy", onCopy);
    document.addEventListener("keydown", onKey);
    window.addEventListener("beforeprint", onBeforePrint);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeprint", onBeforePrint);
      document.removeEventListener("click", onClick, true);
    };
  }, [readOnly, label, invisible, adminId, deviceTag, i18n]);

  return (
    <div className={`relative min-h-screen ${readOnly ? "select-none" : ""}`} data-fx-crm-mark={adminId || ""}>
      {/* Invisible forensic payload for text-layer / accessibility dumps */}
      <span aria-hidden className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        {invisible}
      </span>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[9990] overflow-hidden opacity-[0.055]"
        style={{
          backgroundImage: `repeating-linear-gradient(-24deg, transparent, transparent 110px, rgba(0,0,0,0.85) 110px, rgba(0,0,0,0.85) 111px)`,
        }}
      >
        <div className="flex h-full w-full flex-wrap content-around justify-around gap-14 p-6">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="rotate-[-24deg] whitespace-nowrap text-[10px] font-semibold tracking-wide text-black"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
