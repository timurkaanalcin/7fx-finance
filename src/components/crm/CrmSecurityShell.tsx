"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  adminName: string;
  adminEmail?: string;
  readOnly?: boolean;
  children: React.ReactNode;
};

/**
 * CRM anti-exfil chrome: subtle watermark, block copy/print for RO (and discourage for all),
 * audit download/export attempts. Honest: determined users can bypass client controls.
 */
export default function CrmSecurityShell({ adminName, adminEmail, readOnly, children }: Props) {
  const [now, setNow] = useState(() => new Date());
  const label = useMemo(() => {
    const t = now.toISOString().replace("T", " ").slice(0, 19) + "Z";
    return `${adminName}${adminEmail ? ` · ${adminEmail}` : ""} · ${t}`;
  }, [adminName, adminEmail, now]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onCtx = (e: Event) => {
      if (readOnly) e.preventDefault();
    };
    const onCopy = (e: ClipboardEvent) => {
      if (!readOnly) return;
      const sel = window.getSelection()?.toString() || "";
      if (sel.length > 20) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        void fetch("/api/admin/export-audit", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "print_attempt", path: location.pathname }),
        });
      }
      if (readOnly && (e.ctrlKey || e.metaKey) && ["c", "x", "s"].includes(e.key.toLowerCase())) {
        // allow small copies; block bulk
        const sel = window.getSelection()?.toString() || "";
        if (sel.length > 20 || e.key.toLowerCase() === "s") e.preventDefault();
      }
    };
    const onBeforePrint = () => {
      void fetch("/api/admin/export-audit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "print", path: location.pathname }),
      });
    };

    // Intercept <a download> and programmatic Blob downloads
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
          }),
        });
        if (readOnly) {
          e.preventDefault();
          alert("Exports are disabled for read-only CRM users.");
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
  }, [readOnly]);

  return (
    <div className={`relative min-h-screen ${readOnly ? "select-none" : ""}`}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[9990] overflow-hidden opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(-24deg, transparent, transparent 120px, rgba(0,0,0,0.9) 120px, rgba(0,0,0,0.9) 121px)`,
        }}
      >
        <div className="flex h-full w-full flex-wrap content-around justify-around gap-16 p-8">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="rotate-[-24deg] whitespace-nowrap text-[11px] font-semibold tracking-wide text-black"
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
