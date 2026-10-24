"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";
import { jobTitleOptions, jobTitleUi } from "@/lib/job-titles";

const inputClass =
  "fx-auth-input w-full rounded-xl border border-[rgba(16,20,37,0.12)] bg-[#ffffff] px-3.5 py-3 text-[15px] text-[#111111] outline-none transition placeholder:text-[#8b93a7] hover:border-[#111111]/40 focus:border-[#111111] focus:shadow-[0_0_0_3px_rgba(17,17,17,0.15)]";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#5c657a]";

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const { t, locale } = useI18n();
  const jt = jobTitleUi(locale);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expectedReferral, setExpectedReferral] = useState<string | null>(null);
  const [referralRequired, setReferralRequired] = useState(true);
  const [assignedAccountId, setAssignedAccountId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings/public", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setReferralRequired(data.referralRequired !== false);
        if (typeof data.referralCode === "string" && data.referralCode) {
          setExpectedReferral(data.referralCode);
        }
      } catch {
        /* keep defaults — server still enforces */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function emailOk(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (step === 1) {
      if (!emailOk(email)) {
        setError(t("auth.emailInvalid"));
        return;
      }
      if (password.length < 8) {
        setError(t("auth.passwordMin"));
        return;
      }
      if (password !== passwordConfirm) {
        setError(t("auth.passwordMismatch"));
        return;
      }
      setStep(2);
      return;
    }
    setLoading(true);
    if (password.length < 8) {
      setError(t("auth.passwordMin"));
      setLoading(false);
      return;
    }
    if (password !== passwordConfirm) {
      setError(t("auth.passwordMismatch"));
      setLoading(false);
      return;
    }
    const code = referralCode.trim();
    if (referralRequired) {
      if (!code) {
        setError(t("auth.referralRequired"));
        setLoading(false);
        return;
      }
      if (expectedReferral && code !== expectedReferral) {
        setError(t("auth.referralInvalid"));
        setLoading(false);
        return;
      }
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
          jobTitle: jobTitle || null,
          referralCode: referralCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("auth.registerFailed"));
        return;
      }
      const id = data.user?.accountLoginId ? String(data.user.accountLoginId) : null;
      if (id) {
        setAssignedAccountId(id);
      } else {
        window.location.assign("/trade");
      }
    } catch {
      setError(t("auth.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  async function copyAccountId() {
    if (!assignedAccountId) return;
    try {
      await navigator.clipboard.writeText(assignedAccountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (assignedAccountId) {
    return (
      <>
        <div className="mb-6">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-[#111111]">{t("auth.registerDone")}</h2>
            <LanguageSwitcher compact tone="dark" />
          </div>
          <p className="mt-1 text-sm text-[#5c657a]">{t("auth.registerDoneBody")}</p>
        </div>
        <div className="rounded-xl border border-[rgba(16,20,37,0.1)] bg-[#f7f8fa] p-4">
          <div className="text-[13px] font-medium text-[#5c657a]">{t("auth.accountId")}</div>
          <div className="mt-1 font-mono text-xl font-semibold tracking-wider text-[#111111]">
            {assignedAccountId}
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[#5c657a]">{t("auth.accountIdHint")}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={copyAccountId}
              className="flex-1 rounded-xl border border-[rgba(16,20,37,0.15)] bg-white py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#f0f1f4]"
            >
              {copied ? t("auth.copied") : t("auth.copyId")}
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/trade")}
              className="flex-1 rounded-xl bg-[#111111] py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(17,17,17,0.28)] transition hover:brightness-110"
            >
              {t("auth.goTerminal")}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-[#111111]">{t("auth.registerTitle")}</h2>
          <LanguageSwitcher compact tone="dark" />
        </div>
        <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8b93a7]">
          {step}/2 · {step === 1 ? t("auth.stepCredentials") : t("auth.stepProfile")}
        </p>
        <p className="mt-1 text-sm text-[#5c657a]">{t("auth.registerSubtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
        {step === 1 ? (
          <>
            <div>
              <label htmlFor="fx-reg-email" className={labelClass}>
                {t("common.email")}
              </label>
              <input
                id="fx-reg-email"
                className={inputClass}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                disabled={loading}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="fx-reg-password" className={labelClass}>
                {t("common.password")}
              </label>
              <input
                id="fx-reg-password"
                className={inputClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordMin")}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="fx-reg-password2" className={labelClass}>
                {t("auth.repeatPassword")}
              </label>
              <input
                id="fx-reg-password2"
                className={inputClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder={t("auth.repeatPassword")}
                disabled={loading}
              />
            </div>
          </>
        ) : (
          <>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="fx-reg-first" className={labelClass}>
              {t("auth.firstName")}
            </label>
            <input
              id="fx-reg-first"
              className={inputClass}
              required
              autoComplete="given-name"
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("auth.firstName")}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="fx-reg-last" className={labelClass}>
              {t("auth.lastName")}
            </label>
            <input
              id="fx-reg-last"
              className={inputClass}
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("auth.lastName")}
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="fx-reg-phone" className={labelClass}>
            {t("common.phone")} <span className="font-normal text-[#8b93a7]">({t("auth.optional")})</span>
          </label>
          <input
            id="fx-reg-phone"
            className={inputClass}
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("auth.phonePlaceholder")}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="fx-reg-jobtitle" className={labelClass}>
            {jt.register} <span className="font-normal text-[#8b93a7]">({t("auth.optional")})</span>
          </label>
          <select
            id="fx-reg-jobtitle"
            className={inputClass}
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            disabled={loading}
          >
            <option value="">{jt.placeholder}</option>
            {jobTitleOptions(locale).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Prominent required referral — light charcoal, not red */}
        <div className="rounded-xl border border-[rgba(16,20,37,0.1)] bg-[#ffffff] p-3.5 sm:p-4">
          <label htmlFor="fx-reg-referral" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#111111]">
            {t("auth.referralCode")}
            {referralRequired ? (
              <>
                <span className="text-[#111111]" aria-hidden>
                  *
                </span>
                <span className="sr-only">({t("auth.referralRequired")})</span>
              </>
            ) : (
              <span className="font-normal text-[#8b93a7]">({t("auth.optional")})</span>
            )}
          </label>
          <input
            id="fx-reg-referral"
            className={`${inputClass} border-[rgba(16,20,37,0.12)] bg-white focus:border-[#111111]`}
            required={referralRequired}
            aria-required={referralRequired}
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={t("auth.referralCode")}
            disabled={loading}
            inputMode="numeric"
            autoComplete="off"
          />
          {referralRequired && (
            <p className="mt-2 text-[12px] leading-relaxed text-[#5c657a]">{t("auth.referralHint")}</p>
          )}
        </div>
          </>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#ef5350]/40 bg-[#ef5350]/10 px-3.5 py-2.5 text-sm text-[#ef5350]"
          >
            {error}
          </div>
        )}

        {step === 1 ? (
          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-[#111111] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(17,17,17,0.28)] transition hover:brightness-110 active:scale-[0.99]"
          >
            {t("auth.continue")}
          </button>
        ) : (
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError("");
                setStep(1);
              }}
              className="rounded-xl border border-[rgba(16,20,37,0.15)] bg-white px-4 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-[#f0f1f4] disabled:opacity-60"
            >
              {t("common.back")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#111111] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(17,17,17,0.28)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("auth.creating") : t("common.signUp")}
            </button>
          </div>
        )}
      </form>

      <div className="mt-7 border-t border-[rgba(16,20,37,0.08)] pt-5 text-center text-sm text-[#5c657a]">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-[#111111] underline-offset-2 transition hover:underline">
          {t("common.signIn")}
        </Link>
      </div>
    </>
  );
}
