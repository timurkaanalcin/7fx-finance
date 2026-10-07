"use client";

import type { FormatAction } from "./chatFormat";

type Props = {
  onAction: (action: FormatAction) => void;
  disabled?: boolean;
  labels: {
    bold: string;
    italic: string;
    underline: string;
    bullet: string;
    newline: string;
  };
  className?: string;
};

const BTN =
  "inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-neutral-200 bg-white px-1.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-40";

export function ChatFormatToolbar({ onAction, disabled, labels, className }: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className || ""}`}>
      <button type="button" className={BTN} disabled={disabled} title={labels.bold} aria-label={labels.bold} onClick={() => onAction("bold")}>
        <span className="font-bold">B</span>
      </button>
      <button type="button" className={BTN} disabled={disabled} title={labels.italic} aria-label={labels.italic} onClick={() => onAction("italic")}>
        <span className="italic font-serif">I</span>
      </button>
      <button type="button" className={BTN} disabled={disabled} title={labels.underline} aria-label={labels.underline} onClick={() => onAction("underline")}>
        <span className="underline">U</span>
      </button>
      <button type="button" className={BTN} disabled={disabled} title={labels.bullet} aria-label={labels.bullet} onClick={() => onAction("bullet")}>
        •≡
      </button>
      <button type="button" className={BTN} disabled={disabled} title={labels.newline} aria-label={labels.newline} onClick={() => onAction("newline")}>
        ↵
      </button>
    </div>
  );
}
