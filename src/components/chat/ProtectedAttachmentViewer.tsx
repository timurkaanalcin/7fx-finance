"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Customer view-only viewer for chat attachments.
 * Real controls: bytes only via session + 60 s token fetch (no URL / download link, inline, no-store);
 * content is drawn on <canvas> (no <img src>, no PDF toolbar).
 * Best effort (web cannot truly block screenshots): watermark, blackout on blur / visibility change /
 * PrintScreen / Cmd|Ctrl+Shift, hidden in print, no context menu / selection / drag / long-press.
 */
export default function ProtectedAttachmentViewer({
  attId,
  onClose,
  labels,
}: {
  attId: string;
  onClose: () => void;
  labels: { loading: string; failed: string; close: string; hold?: string };
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  /** Hold-to-reveal: content is black unless the customer is actively pressing (max 5s). */
  const [revealed, setRevealed] = useState(false);
  const revealTimer = useRef<number | null>(null);
  const conceal = () => {
    if (revealTimer.current) window.clearTimeout(revealTimer.current);
    revealTimer.current = null;
    setRevealed(false);
  };
  const reveal = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (document.visibilityState !== "visible" || !document.hasFocus()) return;
    setHidden(false);
    setRevealed(true);
    if (revealTimer.current) window.clearTimeout(revealTimer.current);
    revealTimer.current = window.setTimeout(conceal, 5000);
  };
  const [mark, setMark] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await fetch(`/api/support/attachments/${attId}/token`, { method: "POST", cache: "no-store", credentials: "include" });
        if (!t.ok) throw new Error();
        const meta = (await t.json()) as { token: string; kind: "pdf" | "image"; watermark: string };
        setMark(`${meta.watermark} · ${new Date().toLocaleString()}`);
        const r = await fetch(`/api/support/attachments/${attId}/view`, {
          cache: "no-store",
          credentials: "include",
          headers: { "X-View-Token": meta.token },
        });
        if (!r.ok) throw new Error();
        const buf = await r.arrayBuffer();
        if (cancelled || !holder.current) return;
        holder.current.innerHTML = "";
        if (meta.kind === "pdf") {
          const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
          const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
          for (let p = 1; p <= Math.min(doc.numPages, 50); p++) {
            const page = await doc.getPage(p);
            const vp = page.getViewport({ scale: 1.5 });
            const c = document.createElement("canvas");
            c.width = vp.width;
            c.height = vp.height;
            c.className = "mb-2 h-auto w-full";
            holder.current?.appendChild(c);
            await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
          }
          await doc.destroy();
        } else {
          const bmp = await createImageBitmap(new Blob([buf]));
          const c = document.createElement("canvas");
          c.width = bmp.width;
          c.height = bmp.height;
          c.className = "h-auto max-h-[75vh] w-full object-contain";
          c.getContext("2d")!.drawImage(bmp, 0, 0);
          bmp.close();
          holder.current.appendChild(c);
        }
      } catch {
        if (!cancelled) setErr(labels.failed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attId, labels.failed]);

  useEffect(() => {
    const hide = () => {
      setHidden(true);
      conceal();
    };
    const show = () => setHidden(false);
    const vis = () => {
      if (document.visibilityState !== "visible") hide();
    };
    const release = () => conceal();
    const key = (e: KeyboardEvent) => {
      const combo = (e.metaKey || e.ctrlKey) && (e.shiftKey || /^[ps]$/i.test(e.key));
      if (e.key === "PrintScreen" || combo) {
        if (combo) e.preventDefault();
        hide();
        window.setTimeout(() => setHidden(!document.hasFocus()), 1500);
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("keydown", key, true);
    window.addEventListener("keyup", key, true);
    window.addEventListener("pagehide", hide);
    window.addEventListener("resize", hide);
    window.addEventListener("pointerup", release, true);
    window.addEventListener("pointercancel", release, true);
    window.addEventListener("touchend", release, true);
    window.addEventListener("touchcancel", release, true);
    return () => {
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("resize", hide);
      window.removeEventListener("pointerup", release, true);
      window.removeEventListener("pointercancel", release, true);
      window.removeEventListener("touchend", release, true);
      window.removeEventListener("touchcancel", release, true);
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("keyup", key, true);
    };
  }, [onClose]);

  const block = (e: { preventDefault: () => void }) => e.preventDefault();
  const safe = mark.replace(/[<>&'"]/g, "");
  const wm = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='180'><text x='10' y='100' transform='rotate(-25 180 90)' fill='rgba(255,255,255,0.28)' stroke='rgba(0,0,0,0.25)' stroke-width='0.4' font-family='sans-serif' font-size='15'>${safe}</text></svg>`
  );

  return (
    <div
      className="fx-protected fixed inset-0 z-[200] flex flex-col bg-black/90 p-3"
      onContextMenu={block}
      onDragStart={block}
      onCopy={block}
      style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" } as CSSProperties}
    >
      <style>{`@media print { .fx-protected, .fx-protected * { display: none !important; } body { background: #000 !important; } }
.fx-protected canvas { -webkit-user-drag: none; pointer-events: none; }`}</style>
      <div className="mb-2 flex justify-end">
        <button type="button" onClick={onClose} className="min-h-[44px] rounded-lg bg-white/10 px-4 text-sm text-white">
          {labels.close}
        </button>
      </div>
      <div className="relative flex-1 overflow-auto">
        <div ref={holder} />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: `url("data:image/svg+xml,${wm}")` }} />
        {loading && <p className="p-6 text-center text-sm text-white/70">{labels.loading}</p>}
        {err && <p className="p-6 text-center text-sm text-red-300">{err}</p>}
        {(!revealed || hidden) && !loading && !err && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <p className="px-6 text-center text-sm text-white/70">{labels.hold ?? "Press and hold to view"}</p>
          </div>
        )}
        <div
          aria-label={labels.hold ?? "Press and hold to view"}
          className="absolute inset-0 z-20"
          style={{ touchAction: "none", WebkitTouchCallout: "none" } as CSSProperties}
          onPointerDown={reveal}
          onPointerUp={conceal}
          onPointerCancel={conceal}
          onPointerLeave={conceal}
          onTouchStart={reveal}
          onTouchEnd={conceal}
          onContextMenu={block}
        />
      </div>
      {hidden && <div className="absolute inset-0 z-30 bg-black" />}
    </div>
  );
}
