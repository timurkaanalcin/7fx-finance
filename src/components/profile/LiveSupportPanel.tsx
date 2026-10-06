"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Msg = {
  id: string;
  body: string;
  from: "customer" | "support" | string;
  createdAt: string;
};

export default function LiveSupportPanel() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/support", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || t("profile.support.sendFailed"));
        return;
      }
      setText("");
      await load();
    } catch {
      setErr(t("profile.support.connectionError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3.5 text-left transition hover:border-[#3a3a3a] hover:bg-[#111]"
      >
        <div>
          <div className="text-sm font-semibold text-slate-100">{t("profile.support.title")}</div>
          <div className="mt-0.5 text-xs text-slate-500">{t("profile.support.subtitle")}</div>
        </div>
        <span className="rounded-full bg-[#26a69a]/15 px-2.5 py-1 text-[11px] font-semibold text-[#26a69a]">
          {t("profile.support.open")}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
          <div
            className="flex h-[min(90vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[#2a2a2a] bg-[#0a0a0a] shadow-2xl sm:rounded-2xl"
            role="dialog"
            aria-label={t("profile.support.title")}
          >
            <div className="flex items-center justify-between border-b border-[#2a2a2a] px-4 py-3">
              <div>
                <div className="text-sm font-semibold">{t("profile.support.title")}</div>
                <div className="text-[11px] text-slate-500">{t("profile.support.hint")}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#2a2a2a] px-2.5 py-1 text-xs text-slate-400 hover:bg-[#1a1a1a]"
              >
                {t("profile.support.close")}
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {messages.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-slate-500">{t("profile.support.empty")}</p>
              )}
              {messages.map((m) => {
                const mine = m.from === "customer";
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? "bg-[#26a69a] text-white"
                          : "bg-[#1a1a1a] text-slate-100 ring-1 ring-[#2a2a2a]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-500"}`}>
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={onSend} className="border-t border-[#2a2a2a] p-3">
              {err && <p className="mb-2 text-xs text-[#ef5350]">{err}</p>}
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("profile.support.placeholder")}
                  className="min-w-0 flex-1 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#26a69a]"
                  maxLength={4000}
                />
                <button
                  type="submit"
                  disabled={busy || !text.trim()}
                  className="shrink-0 rounded-xl bg-[#26a69a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "…" : t("profile.support.send")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
