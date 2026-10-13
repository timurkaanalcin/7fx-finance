"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Customer document / chat-attachment viewer. Authorization stays server-side
 * (session + short-lived view token); display is unrestricted: shown directly,
 * scrollable (multi-page PDFs), zoomable (pinch or +/- buttons).
 */
export default function ProtectedAttachmentViewer({
  attId,
  apiBase = "/api/support/attachments",
  onClose,
  labels,
}: {
  attId: string;
  apiBase?: string;
  onClose: () => void;
  labels: { loading: string; failed: string; close: string; hold?: string };
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    let objUrl = "";
    (async () => {
      try {
        const t = await fetch(`${apiBase}/${attId}/token`, { method: "POST", cache: "no-store", credentials: "include" });
        if (!t.ok) throw new Error("token " + t.status);
        const meta = (await t.json()) as { token: string; kind: "pdf" | "image" };
        const r = await fetch(`${apiBase}/${attId}/view`, { cache: "no-store", credentials: "include", headers: { "X-View-Token": meta.token } });
        if (!r.ok) throw new Error("view " + r.status);
        const buf = await r.arrayBuffer();
        if (cancelled || !holder.current) return;
        holder.current.innerHTML = "";
        if (meta.kind === "pdf") {
          const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
          const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
          for (let p = 1; p <= Math.min(doc.numPages, 100); p++) {
            if (cancelled) break;
            const page = await doc.getPage(p);
            const vp = page.getViewport({ scale: 2 });
            const c = document.createElement("canvas");
            c.width = vp.width;
            c.height = vp.height;
            c.className = "mx-auto mb-3 block h-auto w-full bg-white shadow";
            holder.current?.appendChild(c);
            await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
            if (p === 1 && !cancelled) setLoading(false);
          }
        } else {
          objUrl = URL.createObjectURL(new Blob([buf], { type: r.headers.get("content-type") || "image/png" }));
          const img = document.createElement("img");
          img.src = objUrl;
          img.alt = "";
          img.className = "mx-auto block h-auto w-full";
          holder.current.appendChild(img);
        }
      } catch (e) {
        console.error("[doc-viewer]", e);
        if (!cancelled) setErr(labels.failed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [attId, apiBase, labels.failed]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  const btn = "min-h-[44px] min-w-[44px] rounded-lg bg-white/15 px-3 text-sm font-semibold text-white";
  return (
    <div className="fx-doc-viewer fixed inset-0 z-[200] flex flex-col bg-black/95" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-end gap-2 p-2">
        <button type="button" aria-label="Zoom out" className={btn} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>−</button>
        <span className="w-12 text-center text-xs text-white/70">{Math.round(zoom * 100)}%</span>
        <button type="button" aria-label="Zoom in" className={btn} onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}>+</button>
        <button type="button" onClick={onClose} className={`${btn} ml-2 px-4`}>{labels.close}</button>
      </div>
      <div className="flex-1 overflow-auto overscroll-contain px-2 pb-4" style={{ touchAction: "pan-x pan-y pinch-zoom", WebkitOverflowScrolling: "touch" }}>
        <div style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? "900px" : undefined, margin: "0 auto" }}>
          <div ref={holder} />
        </div>
        {loading && <p className="p-6 text-center text-sm text-white/70">{labels.loading}</p>}
        {err && <p className="p-6 text-center text-sm text-red-300">{err}</p>}
      </div>
    </div>
  );
}
