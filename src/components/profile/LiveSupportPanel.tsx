"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ChatFormattedBody } from "@/components/chat/ChatFormattedBody";
import { ChatStatusLine } from "@/components/chat/ChatStatusLine";
import ProtectedAttachmentViewer from "@/components/chat/ProtectedAttachmentViewer";
import {
  messageReadByPeer,
  type ChatPresenceSnapshot,
} from "@/lib/chat-presence-shared";

type Msg = {
  id: string;
  body: string;
  from: "customer" | "support" | string;
  createdAt: string;
};

export default function LiveSupportPanel() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [presence, setPresence] = useState<ChatPresenceSnapshot | null>(null);
  const [viewAtt, setViewAtt] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const olderSkipRef = useRef(0);
  const stickRef = useRef(true);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(false);

  const ping = useCallback(async (body: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/support/presence", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.presence) setPresence(data.presence);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async (mode: "refresh" | "older" = "refresh") => {
    const skip = mode === "older" ? olderSkipRef.current : 0;
    if (mode === "older") setOlderBusy(true);
    try {
      const res = await fetch(`/api/support?take=50&skip=${skip}`, { credentials: "include" });
      if (!res.ok) {
        if (mode === "refresh") setLoadFailed(true);
        return;
      }
      setLoadFailed(false);
      const data = await res.json();
      const incoming: Msg[] = data.messages || [];
      setMessages((prev) => {
        const map = new Map<string, Msg>();
        for (const row of prev) map.set(row.id, row);
        for (const row of incoming) map.set(row.id, row);
        return Array.from(map.values()).sort(
          (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
        );
      });
      if (data.presence) setPresence(data.presence);
      if (mode === "older") {
        stickRef.current = false;
        setHasOlder(Boolean(data.hasMore));
        olderSkipRef.current = typeof data.nextSkip === "number" ? data.nextSkip : skip;
      } else if (olderSkipRef.current <= 50) {
        setHasOlder(Boolean(data.hasMore));
        olderSkipRef.current = typeof data.nextSkip === "number" ? data.nextSkip : incoming.length;
      }
    } catch {
      if (mode === "refresh") setLoadFailed(true);
    } finally {
      if (mode === "older") setOlderBusy(false);
      else setBooting(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
    void ping({ inChat: true, markRead: true });
    const tick = () => {
      if (document.hidden) return;
      void load();
      void ping({ inChat: true, markRead: true });
    };
    const iv = window.setInterval(tick, 3000);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      void ping({ inChat: false, typing: false });
      lastTypingSent.current = false;
    };
  }, [open, load, ping]);

  useEffect(() => {
    if (stickRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, presence?.adminTyping]);

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
      stickRef.current = true;
      lastTypingSent.current = false;
      if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
      await load();
      void ping({ typing: false, inChat: true, markRead: true });
    } catch {
      setErr(t("profile.support.connectionError"));
    } finally {
      setBusy(false);
    }
  }

  function onTextChange(v: string) {
    setText(v);
    if (!open) return;
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    if (v.trim()) {
      if (!lastTypingSent.current) {
        lastTypingSent.current = true;
        void ping({ typing: true });
      }
      typingIdleRef.current = setTimeout(() => {
        lastTypingSent.current = false;
        void ping({ typing: false });
      }, 2500);
    } else if (lastTypingSent.current) {
      lastTypingSent.current = false;
      void ping({ typing: false });
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
        <div className="fx-lx-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
          <div
            className="flex h-[min(90vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[#2a2a2a] bg-[#0a0a0a] shadow-2xl sm:rounded-2xl"
            role="dialog"
            aria-label={t("profile.support.title")}
          >
            <div className="flex items-center justify-between border-b border-[#2a2a2a] px-4 py-3">
              <div>
                <div className="text-sm font-semibold">{t("profile.support.title")}</div>
                <div className="text-[11px] text-slate-500">{t("profile.support.hint")}</div>
                {(presence?.adminTyping || presence?.adminInChat) && (
                  <ChatStatusLine
                    className="mt-1 !text-[#26a69a]"
                    inChat={presence?.adminInChat}
                    typing={presence?.adminTyping}
                    lastSeenAt={null}
                    labels={{
                      typing: t("profile.support.typing"),
                      inChat: t("profile.support.inChat"),
                      online: t("profile.support.online"),
                      offline: t("profile.support.offline"),
                    }}
                  />
                )}
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
              {hasOlder && (
                <button
                  type="button"
                  disabled={olderBusy}
                  onClick={() => void load("older")}
                  className="w-full rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#1a1a1a] disabled:opacity-50"
                >
                  {olderBusy ? t("common.loading") : t("profile.support.older")}
                </button>
              )}
              {loadFailed && messages.length === 0 ? (
                <div className="px-2 py-6 text-center" data-fx-support-error="">
                  <p className="text-sm font-normal text-slate-300">{t("state.supportFailed")}</p>
                  <button
                    type="button"
                    data-fx-desk-retry=""
                    onClick={() => void load()}
                    className="mt-3 min-h-10 rounded-full bg-[#f4f5f7] px-4 text-xs font-medium text-[#111111]"
                  >
                    {t("state.retry")}
                  </button>
                </div>
              ) : booting && messages.length === 0 ? (
                <div data-fx-desk-skeleton="" aria-busy="true" className="space-y-2 px-2 py-4">
                  <span className="sr-only">{t("state.loading")}</span>
                  <span className="fx-skel h-10 w-2/3" />
                  <span className="fx-skel ml-auto h-10 w-1/2" />
                </div>
              ) : messages.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs font-normal text-slate-500" data-fx-support-empty="">{t("profile.support.empty")}</p>
              ) : null}
              {messages.map((m) => {
                const mine = m.from === "customer";
                const read =
                  mine && messageReadByPeer(m.createdAt, presence?.adminLastReadAt);
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
                      <ChatFormattedBody
                        text={m.body}
                        className="break-words text-sm leading-relaxed"
                        renderAttachment={(id) => (
                          <button
                            type="button"
                            onClick={() => setViewAtt(id)}
                            className="min-h-[36px] rounded-lg bg-white/10 px-2 text-xs font-semibold"
                          >
                            📎 {t("profile.support.viewAttachment")}
                          </button>
                        )}
                      />
                      <p className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${mine ? "text-white/70" : "text-slate-500"}`}>
                        {read && <span className="font-medium">{t("profile.support.read")}</span>}
                        <span>{new Date(m.createdAt).toLocaleString(locale)}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
              {presence?.adminTyping && (
                <p className="px-1 text-[11px] font-medium text-[#26a69a]">
                  {t("profile.support.typing")}
                </p>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={onSend} className="border-t border-[#2a2a2a] p-3">
              {err && <p className="mb-2 text-xs text-[#ef5350]">{err}</p>}
              <div className="flex gap-2">
                <textarea
                  value={text}
                  onChange={(e) => onTextChange(e.target.value)}
                  placeholder={t("profile.support.placeholder")}
                  rows={2}
                  className="min-h-[2.75rem] max-h-28 min-w-0 flex-1 resize-y rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#26a69a]"
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
      {viewAtt && (
        <ProtectedAttachmentViewer
          attId={viewAtt}
          onClose={() => setViewAtt(null)}
          labels={{
            loading: t("profile.support.attLoading"),
            failed: t("profile.support.attFailed"),
            close: t("profile.support.close"),
            hold: t("profile.support.holdToView"),
          }}
        />
      )}
    </>
  );
}
