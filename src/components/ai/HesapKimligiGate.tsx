"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { AI_T } from "./ai-i18n";

const KEY = "fx_hid_ok";

/** Entry gate: asks for the 16-digit Hesap Kimliği (or creates one) once per app session. Admins are exempt. */
export default function HesapKimligiGate() {
  const { locale } = useI18n();
  const L = AI_T[locale] ?? AI_T.tr;
  const [show, setShow] = useState(false);
  const [hasId, setHasId] = useState(true);
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const [created, setCreated] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem(KEY) === "1") return; } catch {}
    fetch("/api/hesap-kimligi", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if (d.exempt) { try { sessionStorage.setItem(KEY, "1"); } catch {} return; }
        setHasId(!!d.hasId);
        setShow(true);
      })
      .catch(() => {});
  }, []);

  const done = () => { try { sessionStorage.setItem(KEY, "1"); } catch {} setShow(false); };

  async function post(body: object) {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/hesap-kimligi", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return await r.json().catch(() => ({}));
    } finally { setBusy(false); }
  }

  if (!show) return null;
  return (
    <div className="fx-hid-gate fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] p-6 text-slate-100 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/v3/icon-192.png" alt="" className="mx-auto mb-3 h-12 w-12 rounded-xl" />
        <h2 className="text-center text-lg font-semibold">{L.gateTitle}</h2>
        {created ? (
          <>
            <p className="mt-3 text-center text-sm text-slate-400">{L.gateCreated}</p>
            <p className="mt-3 select-all rounded-lg border border-[#c9a54a]/50 bg-[#1f1f1f] p-3 text-center font-mono text-lg tracking-widest text-[#e0c27a]">{created.replace(/(\d{4})(?=\d)/g, "$1 ")}</p>
            <p className="mt-2 text-center text-xs text-slate-500">{L.gateHint}</p>
            <button type="button" onClick={done} className="mt-5 min-h-[48px] w-full rounded-xl bg-gradient-to-r from-[#b8923a] to-[#e0c27a] font-semibold text-black">{L.gateGo}</button>
          </>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const d = await post({ action: "verify", id: val });
              if (d.ok) done(); else setErr(L.gateWrong);
            }}
          >
            <p className="mt-2 text-center text-sm text-slate-400">{L.gateSub}</p>
            <input
              inputMode="numeric" autoComplete="off" maxLength={19} value={val}
              onChange={(e) => setVal(e.target.value.replace(/[^\d ]/g, ""))}
              placeholder={L.gateInput}
              className="mt-4 min-h-[48px] w-full rounded-xl border border-[#2a2a2a] bg-[#1f1f1f] px-4 text-center font-mono text-base tracking-widest text-slate-100 outline-none focus:border-[#c9a54a]"
            />
            {err && <p className="mt-2 text-center text-xs text-red-400">{err}</p>}
            <button disabled={busy || val.replace(/\s/g, "").length !== 16} className="mt-4 min-h-[48px] w-full rounded-xl bg-gradient-to-r from-[#b8923a] to-[#e0c27a] font-semibold text-black disabled:opacity-50">{L.gateGo}</button>
            {!hasId && (
              <button type="button" disabled={busy} onClick={async () => { const d = await post({ action: "create" }); if (d.ok) setCreated(d.id); else setErr(L.aiErr); }}
                className="mt-3 min-h-[48px] w-full rounded-xl border border-[#c9a54a]/60 font-semibold text-[#c9a54a]">{L.gateCreate}</button>
            )}
            <p className="mt-3 text-center text-[11px] text-slate-500">{L.gateHint}</p>
          </form>
        )}
      </div>
    </div>
  );
}
