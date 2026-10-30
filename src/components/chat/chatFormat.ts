/** Lightweight markdown helpers for CRM / live-support chat (no deps). */

export type FormatAction = "bold" | "italic" | "underline" | "bullet" | "newline";

export function wrapTextareaSelection(
  el: HTMLTextAreaElement | null,
  value: string,
  setValue: (next: string) => void,
  before: string,
  after: string,
  emptyPlaceholder = ""
): void {
  if (!el) {
    setValue(value + before + emptyPlaceholder + after);
    return;
  }
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const selected = value.slice(start, end) || emptyPlaceholder;
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  setValue(next);
  const selStart = start + before.length;
  const selEnd = selStart + selected.length;
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(selStart, selEnd);
  });
}

export type FormatSamples = { bold: string; italic: string; underline: string };

const ENGLISH_SAMPLES: FormatSamples = { bold: "bold", italic: "italic", underline: "underline" };

export function applyFormatAction(
  el: HTMLTextAreaElement | null,
  value: string,
  setValue: (next: string) => void,
  action: FormatAction,
  samples: FormatSamples = ENGLISH_SAMPLES
): void {
  switch (action) {
    case "bold":
      wrapTextareaSelection(el, value, setValue, "**", "**", samples.bold);
      break;
    case "italic":
      wrapTextareaSelection(el, value, setValue, "*", "*", samples.italic);
      break;
    case "underline":
      wrapTextareaSelection(el, value, setValue, "__", "__", samples.underline);
      break;
    case "bullet": {
      if (!el) {
        setValue(value + (value && !value.endsWith("\n") ? "\n" : "") + "- ");
        return;
      }
      const start = el.selectionStart ?? value.length;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const next = value.slice(0, lineStart) + "- " + value.slice(lineStart);
      setValue(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + 2;
        el.setSelectionRange(pos, pos);
      });
      break;
    }
    case "newline":
      wrapTextareaSelection(el, value, setValue, "\n", "", "");
      break;
  }
}
