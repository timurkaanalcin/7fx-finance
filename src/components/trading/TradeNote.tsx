"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDialogFocus } from "@/components/a11y/useDialogFocus";
import { useI18n } from "@/lib/i18n/context";

/**
 * Per-device trade journal note for closed trades.
 * Stored only in this browser's localStorage (never sent to the server).
 */
const KEY = "fx.tradeNotes.v1";
const EVT = "fx-trade-notes";
const MAX_NOTES = 300;
const MAX_LEN = 280;

type NoteMap = Record<string, { t: string; at: number }>;

function readNotes(): NoteMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? (v as NoteMap) : {};
  } catch {
    return {};
  }
}

function writeNotes(m: NoteMap) {
  try {
    const entries = Object.entries(m).sort((a, b) => b[1].at - a[1].at).slice(0, MAX_NOTES);
    window.localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries)));
    window.dispatchEvent(new Event(EVT));
  } catch {
    /* storage full / disabled */
  }
}

function useTradeNote(id: string): [string, (text: string) => void] {
  const [text, setText] = useState("");
  useEffect(() => {
    const sync = () => setText(readNotes()[id]?.t || "");
    sync();
    const onStorage = (e: StorageEvent) => e.key === KEY && sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [id]);
  const save = useCallback(
    (next: string) => {
      const m = readNotes();
      const v = next.trim().slice(0, MAX_LEN);
      if (v) m[id] = { t: v, at: Date.now() };
      else delete m[id];
      writeNotes(m);
    },
    [id]
  );
  return [text, save];
}

export default function TradeNote({ id, symbol, variant = "card" }: { id: string; symbol: string; variant?: "card" | "table" }) {
  const { t } = useI18n();
  const [note, save] = useTradeNote(id);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, () => setOpen(false), dialogRef, "textarea");

  const start = () => {
    setDraft(note);
    setOpen(true);
  };
  const has = note.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={start}
        title={has ? note : t("term.note.add")}
        aria-label={has ? `${t("term.note.title")}: ${note}` : t("term.note.add")}
        data-fx-trade-note={has ? "1" : "0"}
        className={
          variant === "table"
            ? `rounded-[8px] border px-1.5 py-1 text-[10px] font-semibold ${
                has ? "border-[#c9a54a]/60 text-[#c9a54a]" : "border-desk-border text-desk-muted hover:text-desk-text"
              }`
            : `inline-flex min-w-0 max-w-full items-center gap-1 rounded-[10px] border px-2.5 py-1.5 text-[11px] font-semibold ${
                has ? "border-[#c9a54a]/60 text-[#c9a54a]" : "border-desk-border text-desk-muted hover:text-desk-text"
              }`
        }
      >
        <span aria-hidden>📝</span>
        {variant === "card" && <span className="truncate">{has ? note : t("term.note.add")}</span>}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={t("term.note.title")}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div ref={dialogRef} className="w-full max-w-sm rounded-[14px] border border-desk-border bg-desk-panel p-4 text-desk-text shadow-xl">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[13px] font-bold">
                {t("term.note.title")} · {symbol}
              </div>
              <span className="text-[10px] tabular-nums text-desk-muted">
                {draft.length}/{MAX_LEN}
              </span>
            </div>
            <textarea
              autoFocus
              value={draft}
              maxLength={MAX_LEN}
              rows={4}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  save(draft);
                  setOpen(false);
                }
              }}
              placeholder={t("term.note.placeholder")}
              className="w-full resize-none rounded-[10px] border border-desk-border bg-desk-bg px-3 py-2 text-[13px] text-desk-text placeholder:text-desk-muted focus:outline-none focus:ring-1 focus:ring-[#c9a54a]"
            />
            <p className="mt-1.5 text-[10px] text-desk-muted">{t("term.note.hint")}</p>
            <div className="mt-3 flex items-center justify-end gap-2">
              {has && (
                <button
                  type="button"
                  onClick={() => {
                    save("");
                    setOpen(false);
                  }}
                  className="mr-auto rounded-[10px] px-3 py-2 text-[12px] font-semibold text-desk-sell hover:bg-desk-hover"
                >
                  {t("term.note.delete")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-[10px] border border-desk-border px-3 py-2 text-[12px] font-semibold text-desk-muted hover:bg-desk-hover"
              >
                {t("term.note.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  save(draft);
                  setOpen(false);
                }}
                className="rounded-[10px] bg-[#c9a54a] px-3 py-2 text-[12px] font-bold text-black hover:brightness-110"
              >
                {t("term.note.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
