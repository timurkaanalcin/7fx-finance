"use client";

import { useEffect, useRef, useState } from "react";
import { keyTargetFromNode, wantsClosePopover } from "@/lib/crm-shortcuts";

/** CSV <-> list helpers for multi-select filter state ("" = nothing selected). */
export function csvList(v: string): string[] {
  return v ? v.split(",").filter(Boolean) : [];
}
export function toggleCsv(v: string, item: string): string {
  const l = csvList(v);
  return (l.includes(item) ? l.filter((x) => x !== item) : [...l, item]).join(",");
}

type Opt = { value: string; label: string };

/** Compact dropdown with checkboxes. value is a comma-separated list of selected option values. */
export default function MultiSelect({
  placeholder,
  options,
  value,
  onChange,
  clearLabel = "Temizle",
  dataAttr,
}: {
  placeholder: string;
  options: Opt[];
  value: string;
  onChange: (v: string) => void;
  clearLabel?: string;
  dataAttr?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sel = csvList(value);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (
        !wantsClosePopover({
          key: e.key,
          repeat: e.repeat,
          target: keyTargetFromNode(e.target),
          popoverOpen: true,
        })
      ) {
        return;
      }
      setOpen(false);
    };
    const onClose = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("fx-crm-close-filters", onClose);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("fx-crm-close-filters", onClose);
    };
  }, [open]);
  const label =
    sel.length === 0
      ? placeholder
      : sel.length === 1
        ? options.find((o) => o.value === sel[0])?.label ?? sel[0]
        : `${placeholder} (${sel.length})`;
  return (
    <div className="relative" ref={ref} data-fx-multiselect={dataAttr || ""}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`rounded-lg border px-2 py-1.5 ${sel.length ? "border-black bg-black/5 font-medium" : "border-[#e5e5e5] bg-[#ffffff]"}`}
      >
        {label} ▾
      </button>
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          data-fx-filter-popover=""
          className="absolute left-0 z-30 mt-1 max-h-72 min-w-[180px] overflow-auto rounded-lg border border-[#e5e5e5] bg-white p-1 shadow-lg"
        >
          {options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-neutral-100">
              <input type="checkbox" checked={sel.includes(o.value)} onChange={() => onChange(toggleCsv(value, o.value))} />
              <span className="whitespace-nowrap">{o.label}</span>
            </label>
          ))}
          {sel.length > 0 && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="mt-1 w-full rounded px-2 py-1 text-left text-neutral-500 hover:bg-neutral-100"
            >
              ✕ {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
