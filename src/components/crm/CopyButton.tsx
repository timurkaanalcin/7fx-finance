"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

/** Small staff-only copy-to-clipboard control (e.g. account login ID). */
export default function CopyButton({
  value,
  title,
  className = "",
}: {
  value: string;
  title?: string;
  className?: string;
}) {
  const { i18n } = useCrmLabels();
  const label = title || i18n("gap.copy.action");
  const done = i18n("gap.copy.done");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const fallbackCopy = (text: string) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  };

  const onClick = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) ok = fallbackCopy(value);
    if (!ok) return;
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={copied ? done : label}
      aria-label={copied ? done : label}
      className={`inline-flex items-center gap-0.5 rounded border px-1 py-px align-middle text-[9px] font-sans font-medium leading-none transition-colors ${
        copied
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-sky-200 bg-white text-sky-600 hover:bg-sky-50"
      } ${className}`}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {done}
        </>
      ) : (
        <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
          <path d="M3 10.5V3.8C3 3.1 3.6 2.5 4.3 2.5H10.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
