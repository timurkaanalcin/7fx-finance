"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Staff-side "Hazır yanıtlar" (canned replies) for CRM live support.
 * Stored per browser in localStorage only — no API, no schema. Inserting a template only
 * fills the staff composer; what the customer sees is unchanged (sender stays "7FX Support").
 */
export type CannedReply = { id: string; title: string; body: string };

const KEY = "7fx.crm.cannedReplies.v1";
export const CANNED_MAX = 30;
const TITLE_MAX = 40;
const BODY_MAX = 2000;

function readStore(): CannedReply[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((r) => r && typeof r.title === "string" && typeof r.body === "string")
      .slice(0, CANNED_MAX)
      .map((r) => ({
        id: String(r.id || Math.random().toString(36).slice(2)),
        title: r.title.slice(0, TITLE_MAX),
        body: r.body.slice(0, BODY_MAX),
      }));
  } catch {
    return [];
  }
}

export function useCannedReplies() {
  const [items, setItems] = useState<CannedReply[]>([]);
  useEffect(() => {
    setItems(readStore());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(readStore());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const persist = useCallback((next: CannedReply[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode — keep in memory */
    }
  }, []);
  const save = useCallback(
    (entry: { id?: string; title: string; body: string }) => {
      const title = entry.title.trim().slice(0, TITLE_MAX);
      const body = entry.body.trim().slice(0, BODY_MAX);
      if (!title || !body) return false;
      const cur = readStore();
      if (entry.id) {
        persist(cur.map((r) => (r.id === entry.id ? { ...r, title, body } : r)));
        return true;
      }
      if (cur.length >= CANNED_MAX) return false;
      persist([...cur, { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, title, body }]);
      return true;
    },
    [persist]
  );
  const remove = useCallback((id: string) => persist(readStore().filter((r) => r.id !== id)), [persist]);
  return { items, save, remove };
}

/** Slash token right before the caret: "/abc" at start or after whitespace → "abc" (else null). */
export function slashQueryAt(text: string, caret: number): { query: string; start: number } | null {
  const before = text.slice(0, caret);
  const m = /(^|\s)\/([^\s/]{0,40})$/.exec(before);
  if (!m) return null;
  return { query: m[2], start: before.length - m[2].length - 1 };
}

export function slug(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Labels = {
  button: string;
  title: string;
  empty: string;
  add: string;
  fromComposer: string;
  name: string;
  body: string;
  save: string;
  cancel: string;
  edit: string;
  del: string;
  delConfirm: string;
  full: string;
  insert: string;
  slashHint: string;
};

export function CannedRepliesPanel({
  open,
  onClose,
  onInsert,
  composerText,
  labels,
  canned,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (body: string) => void;
  composerText: string;
  labels: Labels;
  canned: ReturnType<typeof useCannedReplies>;
}) {
  const { items, save, remove } = canned;
  const [draft, setDraft] = useState<{ id?: string; title: string; body: string } | null>(null);
  const [filter, setFilter] = useState("");
  useEffect(() => {
    if (!open) {
      setDraft(null);
      setFilter("");
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (draft) setDraft(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, draft, onClose]);

  const shown = useMemo(() => {
    const q = filter.trim().toLocaleLowerCase("tr");
    if (!q) return items;
    return items.filter(
      (r) => r.title.toLocaleLowerCase("tr").includes(q) || r.body.toLocaleLowerCase("tr").includes(q)
    );
  }, [items, filter]);

  if (!open) return null;
  const full = items.length >= CANNED_MAX;
  const inputCls =
    "w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] text-neutral-900 outline-none focus:border-[var(--accent)]/40";

  return (
    <div
      className="absolute bottom-full left-3 right-3 z-30 mb-2 max-h-[min(420px,60vh)] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2.5 shadow-xl sm:left-3 sm:right-auto sm:w-[380px]"
      role="dialog"
      aria-label={labels.title}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-neutral-900">
          {labels.title} <span className="font-normal text-neutral-400">({items.length}/{CANNED_MAX})</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-1.5 py-0.5 text-[12px] text-neutral-500 hover:bg-neutral-100"
          aria-label={labels.cancel}
        >
          ✕
        </button>
      </div>

      {draft ? (
        <div className="space-y-2">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder={labels.name}
            maxLength={TITLE_MAX}
            className={inputCls}
            aria-label={labels.name}
            autoFocus
          />
          <textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder={labels.body}
            maxLength={BODY_MAX}
            rows={5}
            className={`${inputCls} resize-y`}
            aria-label={labels.body}
          />
          {draft.title.trim() && (
            <p className="text-[10px] text-neutral-400">
              {labels.slashHint} <code className="rounded bg-neutral-100 px-1">/{slug(draft.title) || "…"}</code>
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100"
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              disabled={!draft.title.trim() || !draft.body.trim()}
              onClick={() => {
                if (save(draft)) setDraft(null);
              }}
              className="rounded-lg bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
            >
              {labels.save}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={full}
              onClick={() => setDraft({ title: "", body: "" })}
              className="rounded-full bg-[var(--accent-tint)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)] ring-1 ring-[var(--accent)]/20 disabled:opacity-40"
              title={full ? labels.full : undefined}
            >
              + {labels.add}
            </button>
            {composerText.trim() && (
              <button
                type="button"
                disabled={full}
                onClick={() => setDraft({ title: "", body: composerText })}
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
                title={full ? labels.full : undefined}
              >
                {labels.fromComposer}
              </button>
            )}
          </div>
          {items.length > 6 && (
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="…"
              className={`${inputCls} mb-2`}
              aria-label={labels.title}
            />
          )}
          {items.length === 0 ? (
            <p className="px-1 py-3 text-[11px] leading-snug text-neutral-500">{labels.empty}</p>
          ) : (
            <ul className="space-y-1">
              {shown.map((r) => (
                <li key={r.id} className="group flex items-start gap-1 rounded-lg hover:bg-neutral-50">
                  <button
                    type="button"
                    onClick={() => {
                      onInsert(r.body);
                      onClose();
                    }}
                    className="min-w-0 flex-1 px-2 py-1.5 text-left"
                    title={labels.insert}
                  >
                    <span className="block truncate text-[12px] font-semibold text-neutral-900">
                      {r.title} <span className="font-normal text-neutral-400">/{slug(r.title)}</span>
                    </span>
                    <span className="block truncate text-[11px] text-neutral-500">{r.body}</span>
                  </button>
                  <span className="flex shrink-0 gap-0.5 py-1 pr-1 opacity-60 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setDraft({ ...r })}
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10"
                    >
                      {labels.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`${labels.delConfirm}: ${r.title}?`)) remove(r.id);
                      }}
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-red-500 hover:bg-red-500/10"
                    >
                      {labels.del}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 border-t border-neutral-100 pt-2 text-[10px] text-neutral-400">{labels.slashHint}</p>
        </>
      )}
    </div>
  );
}
