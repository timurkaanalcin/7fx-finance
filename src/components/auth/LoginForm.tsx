"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

const inputClass =
  "fx-auth-input w-full rounded-xl border border-[rgba(16,20,37,0.12)] bg-[#ffffff] px-3.5 py-3 text-[15px] text-[#111111] outline-none transition placeholder:text-[#8b93a7] hover:border-[#111111]/40 focus:border-[#111111] focus:shadow-[0_0_0_3px_rgba(17,17,17,0.15)]";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#5c657a]";

export default function LoginForm() {
  const { t } = useI18n();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("auth.loginFailed"));
        return;
      }
      window.location.assign(data.user?.role === "ADMIN" ? "/admin" : "/trade");
    } catch {
      setError(t("auth.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-[#111111]">{t("auth.loginTitle")}</h2>
          <LanguageSwitcher compact tone="light" />
        </div>
        <p className="mt-1 text-sm text-[#5c657a]">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="fx-login-identifier" className={labelClass}>
            {t("auth.identifier")}
          </label>
          <input
            id="fx-login-identifier"
            className={inputClass}
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("auth.identifierPh")}
            disabled={loading}
            inputMode="email"
          />
        </div>
        <div>
          <label htmlFor="fx-login-password" className={labelClass}>
            {t("common.password")}
          </label>
          <input
            id="fx-login-password"
            className={inputClass}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#ef5350]/40 bg-[#ef5350]/10 px-3.5 py-2.5 text-sm text-[#ef5350]"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-xl bg-[#111111] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(17,17,17,0.28)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t("auth.signingIn") : t("common.signIn")}
        </button>
      </form>

      <div className="mt-7 border-t border-[rgba(16,20,37,0.08)] pt-5 text-center text-sm text-[#5c657a]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-[#111111] underline-offset-2 transition hover:underline">
          Register
        </Link>
      </div>
    </>
  );
}
