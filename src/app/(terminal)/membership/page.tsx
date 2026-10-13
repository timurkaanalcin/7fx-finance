"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { AI_T } from "@/components/ai/ai-i18n";

type Plan = { id: string; days: number; priceUsd: number };
type State = { active: boolean; unlimited: boolean; expiresAt: string | null; plan: string | null; pending: boolean; pendingPlan?: string | null };

export default function MembershipPage() {
  const { locale } = useI18n();
  const L = AI_T[locale] ?? AI_T.tr;
  const [d, setD] = useState<{ state: State; plans: Plan[]; accountLoginId: string | null } | null>(null);
  const [busy, setBusy] = useState("");
  const load = useCallback(() => {
    fetch("/api/ai-membership", { cache: "no-store", credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function buy(plan: string) {
    setBusy(plan);
    await fetch("/api/ai-membership", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) }).catch(() => {});
    setBusy(""); load();
  }
  const s = d?.state;
  return (
    <div className="fx-profile min-h-screen bg-[#000000] text-slate-100">
      <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-[#2a2a2a] bg-[#0a0a0a] px-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <span className="text-sm font-semibold">{L.memTitle}</span>
        <Link href="/assistant" className="ml-auto rounded-md bg-[#2a2a2a] px-2.5 py-1.5 text-xs">{L.aiTitle}</Link>
        <Link href="/profile" className="rounded-md bg-[#2a2a2a] px-2.5 py-1.5 text-xs">← {L.back}</Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-2xl p-4 pb-10 md:p-6">
        <p className="mb-4 text-sm text-slate-400">{L.memSub}</p>
        {d?.accountLoginId && (
          <p className="mb-3 text-xs text-slate-500">{L.idLabel}: <span className="font-mono tracking-wider text-slate-200">{d.accountLoginId}</span></p>
        )}
        <div className="mb-5 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          {!s ? "…" : s.unlimited ? (
            <p className="font-semibold text-[#c9a54a]">∞ {L.memUnlimited}</p>
          ) : s.active ? (
            <p className="font-semibold text-emerald-400">✓ {L.memActive} · {L[s.plan || ""] || s.plan} · {L.memUntil}: {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString(locale) : "—"}</p>
          ) : (
            <p className="text-slate-300">{L.memNone}</p>
          )}
          {s?.pending && <p className="mt-2 text-sm text-amber-400">⏳ {L.memPending} ({L[s.pendingPlan || ""] || s.pendingPlan})</p>}
        </div>
        {!s?.unlimited && (
          <div className="grid gap-3 sm:grid-cols-3">
            {(d?.plans || []).map((p) => (
              <div key={p.id} className={`rounded-2xl border p-4 ${p.id === "QUARTERLY" ? "border-[#c9a54a]/70" : "border-[#2a2a2a]"} bg-[#0a0a0a]`}>
                <div className="text-sm font-semibold">{L[p.id]}</div>
                <div className="mt-1 text-2xl font-bold text-[#c9a54a]">${p.priceUsd}</div>
                <div className="text-xs text-slate-500">{p.days} {L.days}</div>
                <button type="button" disabled={!!busy} onClick={() => buy(p.id)} className="mt-3 min-h-[44px] w-full rounded-xl bg-gradient-to-r from-[#b8923a] to-[#e0c27a] text-sm font-semibold text-black disabled:opacity-50">
                  {busy === p.id ? "…" : L.buy}
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-slate-500">{L.payNote}</p>
      </main>
    </div>
  );
}
