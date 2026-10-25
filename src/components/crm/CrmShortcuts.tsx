"use client";

import { useEffect, useRef, useState } from "react";
import { useDialogFocus } from "@/components/a11y/useDialogFocus";
import { useI18n } from "@/lib/i18n/context";
import { keyTargetFromNode, wantsClosePopover, wantsSearchFocus, wantsShortcutHelp } from "@/lib/crm-shortcuts";

const SEARCH = "[data-fx-trader-search], [data-fx-queue-search], [data-fx-list-search]";

const ROWS: { keys: string; label: string }[] = [
  { keys: "/", label: "crm.kb.search" },
  { keys: "Enter", label: "crm.kb.open" },
  { keys: "Esc", label: "crm.kb.esc" },
  { keys: "?", label: "crm.kb.help" },
  { keys: "⌘K", label: "crm.kb.jump" },
];

/** Header ? button, shortcut sheet, and the document-level CRM keys. */
export default function CrmShortcuts() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, () => setOpen(false), dialogRef);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      const info = {
        key: e.key,
        repeat: e.repeat,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        target: keyTargetFromNode(e.target),
      };
      if (wantsSearchFocus(info)) {
        const field = document.querySelector<HTMLElement>(SEARCH);
        if (!field) return;
        e.preventDefault();
        field.focus();
        if (field instanceof HTMLInputElement) field.select();
        return;
      }
      if (wantsShortcutHelp(info)) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      const popover = document.querySelector("[data-fx-filter-popover]");
      if (wantsClosePopover({ ...info, popoverOpen: Boolean(popover) })) {
        e.preventDefault();
        window.dispatchEvent(new Event("fx-crm-close-filters"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("crm.kb.title")}
        title={t("crm.kb.title")}
        data-fx-shortcuts=""
        className="flex h-7 w-7 items-center justify-center rounded border border-black/10 font-medium text-neutral-600 hover:bg-neutral-100 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
      >
        ?
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fx-crm-kb-title"
            data-fx-shortcuts-dialog=""
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 id="fx-crm-kb-title" className="text-sm font-medium">
                {t("crm.kb.title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="flex h-8 w-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
              >
                ×
              </button>
            </div>
            <ul className="divide-y divide-neutral-100 px-4">
              {ROWS.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3 py-2 text-xs">
                  <span className="text-neutral-600">{t(row.label)}</span>
                  <kbd className="min-w-[28px] rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-center font-mono text-[11px] font-medium text-neutral-800">
                    {row.keys}
                  </kbd>
                </li>
              ))}
            </ul>
            <p className="border-t border-neutral-200 px-4 py-2.5 text-[11px] font-normal text-neutral-500">
              {t("crm.kb.safe")}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
