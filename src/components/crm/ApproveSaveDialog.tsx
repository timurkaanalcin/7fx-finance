"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useDialogFocus } from "@/components/a11y/useDialogFocus";
import { approveConfirmOnEnter } from "@/lib/approve-dialog";

type DialogProps = {
  open: boolean;
  title: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function ApproveSaveDialog({
  open,
  title,
  detail,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(open, onCancel, ref, "[data-fx-approve-save]");

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing || busy) return;
    if (!approveConfirmOnEnter(e.target as HTMLElement)) return;
    e.preventDefault();
    onConfirm();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        data-fx-approve-dialog=""
        onKeyDown={onKeyDown}
        className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-4 text-neutral-900 shadow-lg"
      >
        <h2 className="mb-1 text-sm font-medium">{title}</h2>
        {detail ? <p className="mb-3 text-[11px] font-normal text-neutral-500">{detail}</p> : null}
        {children}
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-fx-approve-save=""
            disabled={busy}
            onClick={onConfirm}
            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Undo-free status line. It dismisses itself. */
export function useApproveToast(): { text: string; show: (line: string) => void } {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!text) return;
    const id = window.setTimeout(() => setText(""), 4000);
    return () => window.clearTimeout(id);
  }, [text]);
  return { text, show: setText };
}

export function ApproveToast({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div
      role="status"
      data-fx-approve-toast=""
      className="pointer-events-none fixed bottom-4 right-4 z-[70] max-w-xs rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-900 shadow-lg"
    >
      {text}
    </div>
  );
}
