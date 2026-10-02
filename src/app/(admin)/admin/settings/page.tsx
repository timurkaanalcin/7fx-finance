"use client";

import { useCallback, useEffect, useState } from "react";

export default function AdminSettingsPage() {
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
      setErr("Could not load settings");
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
        setErr(data.error || "Registration failed");
        return;
      }
      setReferralCode(data.referralCode);
      setDraft(data.referralCode);
      setReferralRequired(data.referralRequired !== false);
      setDraftRequired(data.referralRequired !== false);
      setImpersonation(data.terminalImpersonationEnabled !== false);
      setDraftImpersonation(data.terminalImpersonationEnabled !== false);
      setMsg("System settings saved");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">System Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage the required referral code for registration here. This code is for the 7FX
          platform (7fx.customer.org.tr) only. Registration cannot complete with an invalid code.
        </p>
      </div>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 md:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-800">
          Live CRM aktivitesi
        </h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          Order and position open/close actions from the trader terminal write to the same database.
          The admin <strong>Positions</strong> page and dashboard refresh every few seconds
          to show live trade activity. The Positions tab on the trader detail
          is also live.
        </p>
      </section>


      <section className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 md:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-800">
          Terminal impersonation
        </h2>
        <p className="mt-2 text-sm text-sky-900/80">
          When enabled, admins can open the trader terminal as that user and create
          time-limited auto-login links. Default is <strong>ON</strong> for everyone.
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
                Enable terminal impersonation
              </span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                Shows &quot;Open terminal&quot; and auto-login link tools on trader pages.
              </span>
            </span>
          </label>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-[#ffffff] p-4 md:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Referans Kodu
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          New users must enter this code on the registration form (when required).
        </p>

        {!loaded ? (
          <p className="mt-4 text-sm text-neutral-500">Loading…</p>
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
                  Referral code zorunlu
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  When closed, the registration form does not ask for a code; when open, a valid code is required.
                </span>
              </span>
            </label>

            <div>
              <label htmlFor="admin-referral-code" className="mb-1.5 block text-sm text-neutral-600">
                Active kod
              </label>
              <input
                id="admin-referral-code"
                className="w-full rounded-lg border border-neutral-300 bg-[#f7f7f7] px-3 py-2.5 font-mono text-neutral-900 outline-none focus:border-sky-500"
                value={draft}
                onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="e.g. 213950812"
                disabled={busy}
                maxLength={64}
                inputMode="numeric"
                autoComplete="off"
              />
              <p className="mt-1.5 text-xs text-neutral-500">Digits only.</p>
              {dirty && (
                <p className="mt-1.5 text-xs text-amber-400/90">You have unsaved changes</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !draft.trim() || !dirty}
                onClick={save}
                className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
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
                Cancel
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
