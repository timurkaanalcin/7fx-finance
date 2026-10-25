"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { AI_T } from "@/components/ai/ai-i18n";
import { DeskRetry, DeskSkeleton } from "@/components/system/PanelState";

type Plan = { id: string; days: number; priceUsd: number };
type State = { active: boolean; unlimited: boolean; expiresAt: string | null; plan: string | null; pending: boolean; pendingPlan?: string | null };

export default function MembershipPage() {
  const { locale, t } = useI18n();
  const L = AI_T[locale] ?? AI_T.en;
  const [d, setD] = useState<{ state: State; plans: Plan[]; accountLoginId: string | null } | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [buyErr, setBuyErr] = useState("");
  const load = useCallback(() => {
    setPhase("loading");
    fetch("/api/ai-membership", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((data) => {
        setD(data);
        setPhase("ready");
      })
      .catch(() => setPhase("error"));
  }, []);
  useEffect(load, [load]);

  async function buy(plan: string) {
    setBusy(plan);
    setBuyErr("");
    try {
      const res = await fetch("/api/ai-membership", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      if (!res.ok) setBuyErr(t("state.loadFailed"));
    } catch {
      setBuyErr(t("state.loadFailed"));
    }
    setBusy("");
    load();
  }
  const s = d?.state;
  return (
    <div className="fx-profile min-h-screen bg-[#000000] text-slate-100">
      <header className="sticky top-0 z-30 flex min-h-12 items-center gap-3 border-b border-[#2a2a2a] bg-[#0a0a0a] px-4" style={{ paddingTop: "env(safe-area-inset-top)", minHeight: "calc(3rem + env(safe-area-inset-top))" }}>
        <span className="min-w-0 truncate text-sm font-medium">{L.memTitle}</span>
        <Link href="/assistant" className="ml-auto rounded-md bg-[#2a2a2a] px-2.5 py-1.5 text-xs">{L.aiTitle}</Link>
        <Link href="/profile" className="rounded-md bg-[#2a2a2a] px-2.5 py-1.5 text-xs">← {L.back}</Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-2xl p-4 pb-10 md:p-6">
        <p className="mb-4 text-sm text-slate-400">{L.memSub}</p>
        {d?.accountLoginId && (
          <p className="mb-3 text-xs text-slate-500">{L.idLabel}: <span className="font-mono tracking-wider text-slate-200">{d.accountLoginId}</span></p>
        )}
        {phase === "loading" && <DeskSkeleton label={t("state.loading")} />}
        {phase === "error" && (
          <DeskRetry title={t("state.membershipFailed")} retry={t("state.retry")} onRetry={load} />
        )}
        {buyErr && <p className="mb-3 text-center text-sm font-normal text-red-400" role="alert">{buyErr}</p>}
        {phase === "ready" && (
          <>
            <div className="mb-5 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
              {!s ? "…" : s.unlimited ? (
                <p className="font-medium text-[#c9a54a]">∞ {L.memUnlimited}</p>
              ) : s.active ? (
                <p className="font-medium text-emerald-400">✓ {L.memActive} · {L[s.plan || ""] || s.plan} · {L.memUntil}: {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString(locale) : "—"}</p>
              ) : (
                <p className="text-slate-300">{L.memNone}</p>
              )}
              {s?.pending && <p className="mt-2 text-sm text-amber-400">⏳ {L.memPending} ({L[s.pendingPlan || ""] || s.pendingPlan})</p>}
            </div>
            {!s?.unlimited && (d?.plans || []).length === 0 && (
              <p className="text-center text-sm font-normal text-slate-400" data-fx-membership-empty="">{t("state.membershipEmpty")}</p>
            )}
            {!s?.unlimited && (
              <div className="grid gap-3">
                {(d?.plans || []).map((p) => (
                  <div key={p.id} className="rounded-2xl border border-[#c9a54a]/70 bg-[#0a0a0a] p-4">
                    <div className="text-sm font-medium">{L[p.id]}</div>
                    <div className="mt-1 text-3xl font-medium text-[#c9a54a]">${p.priceUsd.toLocaleString("en-US")} <span className="text-sm font-normal text-slate-400">/ {p.days} {L.days}</span></div>
                    <div className="text-xs text-slate-500">{p.days} {L.days}</div>
                    <button type="button" disabled={!!busy} onClick={() => buy(p.id)} className="mt-3 min-h-[44px] w-full rounded-xl bg-gradient-to-r from-[#b8923a] to-[#e0c27a] text-sm font-medium text-black disabled:opacity-50">
                      {busy === p.id ? "…" : L.buy}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-slate-500">{L.payNote}</p>
          </>
        )}
      </main>
    </div>
  );
}
