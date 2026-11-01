"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";
import { jobTitleOptions, jobTitleUi } from "@/lib/job-titles";
import {
  PHONE_COUNTRIES,
  composePhone,
  defaultPhoneCountry,
  digitsOnly,
  emailOk,
  formatNational,
  passwordHintKey,
  passwordStrength,
  phoneCountry,
  phoneTooShort,
  registerErrorKey,
} from "@/lib/auth-fields";
import { AuthAlert, FieldMessage, PasswordMeter, PasswordToggle } from "@/components/auth/AuthBits";

function browserOrigin() {
  if (typeof window === "undefined") return undefined;
  const q = new URLSearchParams(window.location.search);
  const g = (key: string) => q.get(key) || "";
  return {
    referrer: document.referrer || "",
    landingUrl: window.location.href.slice(0, 2000),
    utmSource: g("utm_source"),
    utmMedium: g("utm_medium"),
    utmCampaign: g("utm_campaign"),
    utmContent: g("utm_content"),
    utmTerm: g("utm_term"),
    fbclid: g("fbclid"),
    gclid: g("gclid"),
    ttclid: g("ttclid"),
    msclkid: g("msclkid"),
    wbraid: g("wbraid"),
    gbraid: g("gbraid"),
    source: g("source"),
    aff: g("aff") || g("affiliate"),
    stream: g("stream"),
    userAgent: (navigator.userAgent || "").slice(0, 512),
  };
}

const inputClass =
  "fx-auth-input w-full rounded-xl border border-[rgba(16,20,37,0.12)] bg-[#ffffff] px-3.5 py-3 text-base text-[#111111] outline-none transition placeholder:text-[#8b93a7] hover:border-[#111111]/40 focus:border-[#111111] focus:shadow-[0_0_0_3px_rgba(17,17,17,0.15)]";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#5c657a]";

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [countryIso, setCountryIso] = useState("");
  const [countryPicked, setCountryPicked] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const { t, locale } = useI18n();
  const jt = jobTitleUi(locale);
  const country = countryPicked ? countryIso : defaultPhoneCountry(locale);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [referralCode, setReferralCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverKey, setServerKey] = useState("");
  const serverError = serverKey ? t(serverKey) : "";
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

  function clearField(name: string) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerKey("");
    if (step === 1) {
      const next: Record<string, string> = {};
      if (!emailOk(email)) next.email = "auth.emailInvalid";
      if (password.length < 8) next.password = "auth.passwordMin";
      if (password !== passwordConfirm) next.confirm = "auth.passwordMismatch";
      setFieldErrors(next);
      if (Object.keys(next).length) return;
      setStep(2);
      return;
    }
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.first = "auth.firstNameRequired";
    if (!lastName.trim()) next.last = "auth.lastNameRequired";
    if (phoneTooShort(phoneDigits)) next.phone = "auth.phoneShort";
    if (password.length < 8) next.password = "auth.passwordMin";
    if (password !== passwordConfirm) next.confirm = "auth.passwordMismatch";
    const code = referralCode.trim();
    if (referralRequired) {
      if (!code) next.referral = "auth.referralRequired";
      else if (expectedReferral && code !== expectedReferral) next.referral = "auth.referralInvalid";
    }
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    const phone = composePhone(country, phoneDigits);
    setLoading(true);
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
          origin: browserOrigin(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerKey(registerErrorKey(typeof data.error === "string" ? data.error : ""));
        return;
      }
      const id = data.user?.accountLoginId ? String(data.user.accountLoginId) : null;
      if (id) {
        setAssignedAccountId(id);
      } else {
        window.location.assign("/trade");
      }
    } catch {
      setServerKey("auth.registerFailed");
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
          <h2 className="text-xl font-normal tracking-tight text-[#111111]">{t("auth.registerTitle")}</h2>
          <LanguageSwitcher compact tone="dark" />
        </div>
        <p className="fx-auth-step mt-1 text-[12px] font-normal uppercase tracking-[0.08em] text-[#8b93a7]">
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearField("email");
                }}
                placeholder={t("auth.emailPlaceholder")}
                disabled={loading}
                autoFocus
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? "fx-reg-email-error" : undefined}
              />
              <FieldMessage id="fx-reg-email-error">{fieldErrors.email ? t(fieldErrors.email) : ""}</FieldMessage>
            </div>
            <div>
              <label htmlFor="fx-reg-password" className={labelClass}>
                {t("common.password")}
              </label>
              <div className="fx-auth-password">
                <input
                  id="fx-reg-password"
                  className={inputClass}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearField("password");
                  }}
                  placeholder={t("auth.passwordMin")}
                  disabled={loading}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  aria-describedby="fx-reg-password-hint"
                />
                <PasswordToggle
                  pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                  showLabel={t("auth.showPassword")}
                  hideLabel={t("auth.hidePassword")}
                />
              </div>
              <PasswordMeter level={passwordStrength(password)} />
              <p className="fx-auth-hint" id="fx-reg-password-hint">
                {t(passwordHintKey(passwordStrength(password)))}
              </p>
              <FieldMessage id="fx-reg-password-error">{fieldErrors.password ? t(fieldErrors.password) : ""}</FieldMessage>
            </div>
            <div>
              <label htmlFor="fx-reg-password2" className={labelClass}>
                {t("auth.repeatPassword")}
              </label>
              <div className="fx-auth-password">
                <input
                  id="fx-reg-password2"
                  className={inputClass}
                  type={showPassword2 ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    clearField("confirm");
                  }}
                  placeholder={t("auth.repeatPassword")}
                  disabled={loading}
                  aria-invalid={fieldErrors.confirm ? true : undefined}
                  aria-describedby={fieldErrors.confirm ? "fx-reg-password2-error" : undefined}
                />
                <PasswordToggle
                  pressed={showPassword2}
                  onClick={() => setShowPassword2((v) => !v)}
                  showLabel={t("auth.showPassword")}
                  hideLabel={t("auth.hidePassword")}
                />
              </div>
              <FieldMessage id="fx-reg-password2-error">{fieldErrors.confirm ? t(fieldErrors.confirm) : ""}</FieldMessage>
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
              onChange={(e) => {
                setFirstName(e.target.value);
                clearField("first");
              }}
              placeholder={t("auth.firstName")}
              disabled={loading}
              aria-invalid={fieldErrors.first ? true : undefined}
              aria-describedby={fieldErrors.first ? "fx-reg-first-error" : undefined}
            />
            <FieldMessage id="fx-reg-first-error">{fieldErrors.first ? t(fieldErrors.first) : ""}</FieldMessage>
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
              onChange={(e) => {
                setLastName(e.target.value);
                clearField("last");
              }}
              placeholder={t("auth.lastName")}
              disabled={loading}
              aria-invalid={fieldErrors.last ? true : undefined}
              aria-describedby={fieldErrors.last ? "fx-reg-last-error" : undefined}
            />
            <FieldMessage id="fx-reg-last-error">{fieldErrors.last ? t(fieldErrors.last) : ""}</FieldMessage>
          </div>
        </div>
        <div>
          <label htmlFor="fx-reg-country" className={labelClass}>
            {t("auth.country")}
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <select
              id="fx-reg-country"
              className={inputClass}
              value={country}
              onChange={(e) => {
                setCountryPicked(true);
                setCountryIso(e.target.value);
              }}
              disabled={loading}
            >
              {PHONE_COUNTRIES.map((row) => (
                <option key={row.iso} value={row.iso}>
                  {t(`auth.country.${row.iso}`)} +{row.dial}
                </option>
              ))}
            </select>
            <div>
              <label htmlFor="fx-reg-phone" className="sr-only">
                {t("common.phone")}
              </label>
              <input
                id="fx-reg-phone"
                className={inputClass}
                type="tel"
                autoComplete="tel-national"
                inputMode="tel"
                value={formatNational(phoneDigits, phoneCountry(country).groups)}
                onChange={(e) => {
                  setPhoneDigits(digitsOnly(e.target.value));
                  clearField("phone");
                }}
                placeholder={t("auth.phonePlaceholder")}
                disabled={loading}
                aria-invalid={fieldErrors.phone ? true : undefined}
                aria-describedby={fieldErrors.phone ? "fx-reg-phone-error" : undefined}
              />
            </div>
          </div>
          <p className="fx-auth-hint">
            {t("common.phone")} ({t("auth.optional")})
          </p>
          <FieldMessage id="fx-reg-phone-error">{fieldErrors.phone ? t(fieldErrors.phone) : ""}</FieldMessage>
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
          <label htmlFor="fx-reg-referral" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-normal text-[#111111]">
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
            onChange={(e) => {
              setReferralCode(e.target.value.replace(/[^\d]/g, ""));
              clearField("referral");
            }}
            placeholder={t("auth.referralCode")}
            disabled={loading}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={fieldErrors.referral ? true : undefined}
            aria-describedby={fieldErrors.referral ? "fx-reg-referral-error" : "fx-reg-referral-hint"}
          />
          <FieldMessage id="fx-reg-referral-error">{fieldErrors.referral ? t(fieldErrors.referral) : ""}</FieldMessage>
          {referralRequired && (
            <p id="fx-reg-referral-hint" className="fx-auth-hint">{t("auth.referralHint")}</p>
          )}
        </div>
          </>
        )}

        {serverError && (
          <AuthAlert title={t("auth.errorTitle")}>{serverError}</AuthAlert>
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
                setServerKey("");
                setFieldErrors({});
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
        <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-[#111111] underline-offset-2 transition hover:underline">
          {t("common.signIn")}
        </Link>
      </div>
    </>
  );
}
