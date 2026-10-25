"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { AI_T } from "@/components/ai/ai-i18n";
import { DeskRetry, DeskSkeleton } from "@/components/system/PanelState";

type Msg = { role: "user" | "assistant"; content: string };

export default function AssistantPage() {
  const { locale, t } = useI18n();
  const L = AI_T[locale] ?? AI_T.en;
  const [state, setState] = useState<{ active: boolean; unlimited: boolean } | null>(null);
  const [boot, setBoot] = useState<"loading" | "ready" | "error">("loading");
  const [cfg, setCfg] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);

  const loadAccess = useCallback(() => {
    setBoot("loading");
    fetch("/api/ai-membership", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d) => {
        if (!d) throw new Error("load");
        setState(d.state);
        setCfg(!!d.aiConfigured);
        setBoot("ready");
      })
      .catch(() => setBoot("error"));
  }, []);
  useEffect(() => {
    loadAccess();
  }, [loadAccess]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next); setText(""); setBusy(true); setErr("");
    try {
      const r = await fetch("/api/ai/chat", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const d = await r.json().catch(() => ({}));
      if (r.status === 402) setState({ active: false, unlimited: false });
      else if (r.status === 503) setCfg(false);
      else if (!r.ok || !d.reply) setErr(L.aiErr);
      else setMsgs([...next, { role: "assistant", content: d.reply }]);
    } catch { setErr(L.aiErr); } finally { setBusy(false); }
  }

  const locked = state && !state.active;
  return (
    <div className="fx-profile flex h-[100dvh] flex-col bg-[#000000] text-slate-100">
      <header className="flex min-h-12 shrink-0 items-center gap-3 border-b border-[#2a2a2a] bg-[#0a0a0a] px-4" style={{ paddingTop: "env(safe-area-inset-top)", minHeight: "calc(3rem + env(safe-area-inset-top))" }}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#b8923a] to-[#e0c27a] text-xs font-medium text-black">AI</span>
        <span className="text-sm font-medium">{L.aiTitle}</span>
        {state?.unlimited && <span className="rounded-full border border-[#c9a54a]/60 px-2 py-0.5 text-[10px] text-[#c9a54a]">∞</span>}
        <Link href="/membership" className="ml-auto rounded-md bg-[#2a2a2a] px-2.5 py-1.5 text-xs">{L.memTitle}</Link>
        <Link href="/trade" className="rounded-md bg-[#2a2a2a] px-2.5 py-1.5 text-xs"><span className="fx-rtl-flip" aria-hidden="true">←</span> {L.back}</Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-4">
        {boot === "loading" ? <DeskSkeleton label={t("state.loading")} /> : boot === "error" ? (
          <DeskRetry title={t("state.assistantFailed")} retry={t("state.retry")} onRetry={loadAccess} />
        ) : locked ? (
          <div className="mt-10 rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] p-6 text-center">
            <div className="mb-3 text-4xl">🔒</div>
            <p className="text-sm text-slate-300">{L.aiLocked}</p>
            <Link href="/membership" className="mt-4 inline-flex min-h-[48px] items-center rounded-xl bg-gradient-to-r from-[#b8923a] to-[#e0c27a] px-6 font-semibold text-black">{L.aiGoMem}</Link>
          </div>
        ) : !cfg ? (
          <div className="mt-10 rounded-2xl border border-amber-500/40 bg-[#0a0a0a] p-6 text-center text-sm text-amber-400">{L.aiNotCfg}</div>
        ) : (
          <div className="space-y-3">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2.5 text-sm">{L.aiHello}<div className="mt-1 text-[10px] text-slate-500">{L.aiRisk}</div></div>
            {msgs.map((m, i) => (
              <div key={i} className={`whitespace-pre-wrap max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "ml-auto rounded-tr-sm bg-gradient-to-r from-[#b8923a] to-[#e0c27a] text-black" : "rounded-tl-sm border border-[#2a2a2a] bg-[#0a0a0a]"}`}>{m.content}</div>
            ))}
            {busy && <div className="w-16 rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2.5 text-sm">…</div>}
            {err && <p className="text-xs text-red-400">{err}</p>}
            <div ref={end} />
          </div>
        )}
      </main>
      {state && !locked && cfg && (
        <form onSubmit={send} className="flex shrink-0 gap-2 border-t border-[#2a2a2a] bg-[#0a0a0a] p-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={L.aiPh} maxLength={2000}
            className="min-h-[46px] flex-1 rounded-xl border border-[#2a2a2a] bg-[#1f1f1f] px-4 text-base text-slate-100 outline-none focus:border-[#c9a54a]" />
          <button disabled={busy || !text.trim()} className="min-h-[46px] rounded-xl bg-gradient-to-r from-[#b8923a] to-[#e0c27a] px-5 text-sm font-medium text-black disabled:opacity-50">{L.aiSend}</button>
        </form>
      )}
    </div>
  );
}
