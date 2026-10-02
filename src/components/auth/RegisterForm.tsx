"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const inputClass =
  "fx-auth-input w-full rounded-xl border border-[rgba(16,20,37,0.12)] bg-[#ffffff] px-3.5 py-3 text-[15px] text-[#111111] outline-none transition placeholder:text-[#8b93a7] hover:border-[#111111]/40 focus:border-[#111111] focus:shadow-[0_0_0_3px_rgba(17,17,17,0.15)]";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#5c657a]";

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    const code = referralCode.trim();
    if (referralRequired) {
      if (!code) {
        setError("Referral code zorunludur. / Referral code is required.");
        setLoading(false);
        return;
      }
      if (expectedReferral && code !== expectedReferral) {
        setError("Enter a valid referral code.");
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
          referralCode: referralCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      const id = data.user?.accountLoginId ? String(data.user.accountLoginId) : null;
      if (id) {
        setAssignedAccountId(id);
      } else {
        window.location.assign("/trade");
      }
    } catch {
      setError("Connection error");
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
          <h2 className="text-xl font-semibold tracking-tight text-[#111111]">Registration complete</h2>
          <p className="mt-1 text-sm text-[#5c657a]">
            Your account was created. You can sign in with your email or the account ID below.
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(16,20,37,0.1)] bg-[#f7f8fa] p-4">
          <div className="text-[13px] font-medium text-[#5c657a]">Account ID</div>
          <div className="mt-1 font-mono text-xl font-semibold tracking-wider text-[#111111]">
            {assignedAccountId}
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[#5c657a]">
            Save this 16-digit number. You can sign in with it together with your password.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={copyAccountId}
              className="flex-1 rounded-xl border border-[rgba(16,20,37,0.15)] bg-white py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#f0f1f4]"
            >
              {copied ? "Copied" : "Copy ID"}
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/trade")}
              className="flex-1 rounded-xl bg-[#111111] py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(17,17,17,0.28)] transition hover:brightness-110"
            >
              Terminale git
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-[#111111]">Register</h2>
        <p className="mt-1 text-sm text-[#5c657a]">
          Create an account; after signing in you will be redirected to the trading terminal.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="fx-reg-first" className={labelClass}>
              First name
            </label>
            <input
              id="fx-reg-first"
              className={inputClass}
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="fx-reg-last" className={labelClass}>
              Last name
            </label>
            <input
              id="fx-reg-last"
              className={inputClass}
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="fx-reg-email" className={labelClass}>
            Email
          </label>
          <input
            id="fx-reg-email"
            className={inputClass}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@eposta.com"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="fx-reg-phone" className={labelClass}>
            Phone <span className="font-normal text-[#8b93a7]">(optional)</span>
          </label>
          <input
            id="fx-reg-phone"
            className={inputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+90 …"
            disabled={loading}
          />
        </div>

        {/* Prominent required referral — light charcoal, not red */}
        <div className="rounded-xl border border-[rgba(16,20,37,0.1)] bg-[#ffffff] p-3.5 sm:p-4">
          <label htmlFor="fx-reg-referral" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#111111]">
            Referans Kodu
            <span className="text-[#111111]" aria-hidden>
              *
            </span>
            <span className="sr-only">(zorunlu)</span>
          </label>
          <input
            id="fx-reg-referral"
            className={`${inputClass} border-[rgba(16,20,37,0.12)] bg-white focus:border-[#111111]`}
            required
            aria-required="true"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Referral codenuz (rakam)"
            disabled={loading}
            inputMode="numeric"
            autoComplete="off"
          />
          <p className="mt-2 text-[12px] leading-relaxed text-[#5c657a]">
            Referral code is required (digits only). Registration cannot complete without a valid code.
          </p>
        </div>

        <div>
          <label htmlFor="fx-reg-password" className={labelClass}>
            Password
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
            placeholder="En az 8 karakter"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="fx-reg-password2" className={labelClass}>
            Confirm password
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
            placeholder="Re-enter your password"
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
          {loading ? "Creating account…" : "Register"}
        </button>
      </form>

      <div className="mt-7 border-t border-[rgba(16,20,37,0.08)] pt-5 text-center text-sm text-[#5c657a]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#111111] underline-offset-2 transition hover:underline">
          Sign in
        </Link>
      </div>
    </>
  );
}
