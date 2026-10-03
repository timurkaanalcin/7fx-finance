"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useCallback, useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const { i18n, code } = useCrmLabels();
  const [referralCode, setReferralCode] = useState("");
  const [draft, setDraft] = useState("");
  const [referralRequired, setReferralRequired] = useState(true);
  const [draftRequired, setDraftRequired] = useState(true);
  const [impersonation, setImpersonation] = useState(true);
  const [draftImpersonation, setDraftImpersonation] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (!res.ok) {
      setErr(i18n("crm.set.loadFail"));
      return;
    }
    const data = await res.json();
    const code = String(data.referralCode || "");
    const required = data.referralRequired !== false;
    setReferralCode(code);
    setDraft(code);
    setReferralRequired(required);
    setDraftRequired(required);
    const imp = data.terminalImpersonationEnabled !== false;
    setImpersonation(imp);
    setDraftImpersonation(imp);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    draft.trim() !== referralCode || draftRequired !== referralRequired || draftImpersonation !== impersonation;

  async function save() {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode: draft.trim(),
          referralRequired: draftRequired,
          terminalImpersonationEnabled: draftImpersonation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setReferralCode(data.referralCode);
      setDraft(data.referralCode);
      setReferralRequired(data.referralRequired !== false);
      setDraftRequired(data.referralRequired !== false);
      setImpersonation(data.terminalImpersonationEnabled !== false);
      setDraftImpersonation(data.terminalImpersonationEnabled !== false);
      setMsg(i18n("crm.set.saved"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{i18n("crm.nav.settings")}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {i18n("crm.set.intro")}
        </p>
      </div>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 md:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-800">
          {i18n("crm.set.liveTitle")}
        </h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          {i18n("crm.set.liveBody")}
        </p>
      </section>


      <section className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 md:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-800">
          {i18n("crm.set.impTitle")}
        </h2>
        <p className="mt-2 text-sm text-sky-900/80">
          {i18n("crm.set.impBody")}
        </p>
        {!loaded ? null : (
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-sky-200 bg-white px-3 py-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-neutral-400 bg-white text-black"
              checked={draftImpersonation}
              onChange={(e) => setDraftImpersonation(e.target.checked)}
              disabled={busy}
            />
            <span>
              <span className="block text-sm font-medium text-neutral-800">
                {i18n("crm.set.impEnable")}
              </span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                {i18n("crm.set.impHint")}
              </span>
            </span>
          </label>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-[#ffffff] p-4 md:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          {i18n("crm.set.refTitle")}
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          {i18n("crm.set.refBody")}
        </p>

        {!loaded ? (
          <p className="mt-4 text-sm text-neutral-500">{i18n("crm.ui.loading")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-[#f7f7f7] px-3 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-400 bg-white text-black"
                checked={draftRequired}
                onChange={(e) => setDraftRequired(e.target.checked)}
                disabled={busy}
              />
              <span>
                <span className="block text-sm font-medium text-neutral-800">
                  {i18n("crm.set.refRequired")}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  {i18n("crm.set.refHint")}
                </span>
              </span>
            </label>

            <div>
              <label htmlFor="admin-referral-code" className="mb-1.5 block text-sm text-neutral-600">
                {i18n("crm.set.activeCode")}
              </label>
              <input
                id="admin-referral-code"
                className="w-full rounded-lg border border-neutral-300 bg-[#f7f7f7] px-3 py-2.5 font-mono text-neutral-900 outline-none focus:border-sky-500"
                value={draft}
                onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
                placeholder={i18n("crm.set.example")}
                disabled={busy}
                maxLength={64}
                inputMode="numeric"
                autoComplete="off"
              />
              <p className="mt-1.5 text-xs text-neutral-500">{i18n("crm.set.digits")}</p>
              {dirty && (
                <p className="mt-1.5 text-xs text-amber-400/90">{i18n("crm.set.unsaved")}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !draft.trim() || !dirty}
                onClick={save}
                className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? i18n("crm.ui.saving") : i18n("crm.ui.save")}
              </button>
              <button
                type="button"
                disabled={busy || !dirty}
                onClick={() => {
                  setDraft(referralCode);
                  setDraftRequired(referralRequired);
                  setDraftImpersonation(impersonation);
                  setMsg("");
                  setErr("");
                }}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
              >
                {i18n("crm.ui.cancel")}
              </button>
            </div>
          </div>
        )}

        {msg && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {err}
          </div>
        )}
      </section>
    </div>
  );
}
