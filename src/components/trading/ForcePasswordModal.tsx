"use client";

import { FormEvent, useRef, useState } from "react";
import { useDialogFocus } from "@/components/a11y/useDialogFocus";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  onDone: () => void;
};

export default function ForcePasswordModal({ onDone }: Props) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(true, () => {}, panelRef, "input");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr(t("auth.passwordMin"));
      return;
    }
    if (password !== confirm) {
      setErr(t("auth.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, passwordConfirm: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error || t("auth.loginFailed")));
        return;
      }
      // Stay logged in (cookie re-issued by API); go to app main (/ → /trade for traders).
      const dest = typeof data.redirect === "string" && data.redirect.startsWith("/")
        ? data.redirect
        : "/";
      onDone();
      window.location.assign(dest);
    } catch {
      setErr(t("auth.connectionError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fx-force-pw-title"
    >
      <div ref={panelRef} className="w-full max-w-md rounded-2xl bg-desk-panel p-5 shadow-2xl ring-1 ring-desk-border">
        <h2 id="fx-force-pw-title" className="text-lg font-semibold text-desk-text">
          {t("auth.setNewPasswordTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-desk-muted">{t("auth.setNewPasswordBody")}</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-desk-muted">
              {t("auth.newPassword")}
            </label>
            <div className="flex gap-2">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border border-desk-border bg-desk-bg px-3 py-2.5 text-sm text-desk-text outline-none focus:border-desk-accent"
                disabled={busy}
              />
              <button
                type="button"
                className="shrink-0 rounded-lg border border-desk-border px-2 text-[11px] text-desk-muted"
                onClick={() => setShow((v) => !v)}
              >
                {show ? t("auth.hidePassword") : t("auth.showPassword")}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-desk-muted">
              {t("auth.repeatPassword")}
            </label>
            <div className="flex gap-2">
              <input
                type={show2 ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border border-desk-border bg-desk-bg px-3 py-2.5 text-sm text-desk-text outline-none focus:border-desk-accent"
                disabled={busy}
              />
              <button
                type="button"
                className="shrink-0 rounded-lg border border-desk-border px-2 text-[11px] text-desk-muted"
                onClick={() => setShow2((v) => !v)}
              >
                {show2 ? t("auth.hidePassword") : t("auth.showPassword")}
              </button>
            </div>
          </div>
          {err && (
            <div className="rounded-lg border border-desk-sell/40 bg-desk-sell/10 px-3 py-2 text-xs text-desk-sell">
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-desk-accent py-3 text-sm font-semibold text-desk-accent-ink disabled:opacity-60"
          >
            {busy ? t("common.loading") : t("auth.saveNewPassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
