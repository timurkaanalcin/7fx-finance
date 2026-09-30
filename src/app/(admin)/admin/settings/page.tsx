"use client";

import { useCallback, useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [referralCode, setReferralCode] = useState("");
  const [draft, setDraft] = useState("");
  const [referralRequired, setReferralRequired] = useState(true);
  const [draftRequired, setDraftRequired] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (!res.ok) {
      setErr("Ayarlar yüklenemedi");
      return;
    }
    const data = await res.json();
    const code = String(data.referralCode || "");
    const required = data.referralRequired !== false;
    setReferralCode(code);
    setDraft(code);
    setReferralRequired(required);
    setDraftRequired(required);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    draft.trim() !== referralCode || draftRequired !== referralRequired;

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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Kayıt başarısız");
        return;
      }
      setReferralCode(data.referralCode);
      setDraft(data.referralCode);
      setReferralRequired(data.referralRequired !== false);
      setDraftRequired(data.referralRequired !== false);
      setMsg("Sistem ayarları kaydedildi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Sistem Ayarları</h1>
        <p className="mt-1 text-sm text-slate-400">
          Kayıt için zorunlu referans kodunu buradan yönetin. Bu kod yalnızca 7FX
          platformu (7fx.customer.org.tr) içindir. Yanlış kodla kayıt oluşturulamaz.
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-[#0a1020] p-4 md:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Referans Kodu
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Yeni kullanıcılar kayıt formunda bu kodu girmek zorundadır (zorunluluk açıkken).
        </p>

        {!loaded ? (
          <p className="mt-4 text-sm text-slate-500">Yükleniyor…</p>
        ) : (
          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 bg-[#070b14] px-3 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500"
                checked={draftRequired}
                onChange={(e) => setDraftRequired(e.target.checked)}
                disabled={busy}
              />
              <span>
                <span className="block text-sm font-medium text-slate-200">
                  Referans kodu zorunlu
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Kapalıysa kayıt formu kod istemez; açıkken geçerli kod şarttır.
                </span>
              </span>
            </label>

            <div>
              <label htmlFor="admin-referral-code" className="mb-1.5 block text-sm text-slate-300">
                Aktif kod
              </label>
              <input
                id="admin-referral-code"
                className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2.5 font-mono text-slate-100 outline-none focus:border-sky-500"
                value={draft}
                onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="Örn. 213950812"
                disabled={busy}
                maxLength={64}
                inputMode="numeric"
                autoComplete="off"
              />
              <p className="mt-1.5 text-xs text-slate-500">Yalnızca rakam (digits).</p>
              {dirty && (
                <p className="mt-1.5 text-xs text-amber-400/90">Kaydedilmemiş değişiklik var</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !draft.trim() || !dirty}
                onClick={save}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Kaydediliyor…" : "Kaydet"}
              </button>
              <button
                type="button"
                disabled={busy || !dirty}
                onClick={() => {
                  setDraft(referralCode);
                  setDraftRequired(referralRequired);
                  setMsg("");
                  setErr("");
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                İptal
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
