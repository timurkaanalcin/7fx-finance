"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "fx-auth-input w-full rounded-xl border border-[rgba(16,20,37,0.12)] bg-[#ffffff] px-3.5 py-3 text-[15px] text-[#0b1220] outline-none transition placeholder:text-[#8b93a7] hover:border-[#68F848]/40 focus:border-[#68F848] focus:shadow-[0_0_0_3px_rgba(104,248,72,0.15)]";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#5c657a]";

export default function RegisterForm() {
  const router = useRouter();
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
      setError("Şifre en az 8 karakter olmalı");
      setLoading(false);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor");
      setLoading(false);
      return;
    }
    const code = referralCode.trim();
    if (referralRequired) {
      if (!code) {
        setError("Referans kodu zorunludur. / Referral code is required.");
        setLoading(false);
        return;
      }
      if (expectedReferral && code !== expectedReferral) {
        setError("Geçerli bir referans kodu girin. / Enter a valid referral code.");
        setLoading(false);
        return;
      }
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
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
        setError(data.error || "Kayıt başarısız");
        return;
      }
      router.push(data.user?.role === "ADMIN" ? "/admin" : "/trade");
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-[#0b1220]">Kayıt Ol</h2>
        <p className="mt-1 text-sm text-[#5c657a]">
          Hesap oluşturun; oturum sonrası işlem terminaline yönlendirilirsiniz.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="fx-reg-first" className={labelClass}>
              Ad
            </label>
            <input
              id="fx-reg-first"
              className={inputClass}
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Adınız"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="fx-reg-last" className={labelClass}>
              Soyad
            </label>
            <input
              id="fx-reg-last"
              className={inputClass}
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Soyadınız"
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="fx-reg-email" className={labelClass}>
            E-posta
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
            Telefon <span className="font-normal text-[#8b93a7]">(isteğe bağlı)</span>
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
          <label htmlFor="fx-reg-referral" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#0b1220]">
            Referans Kodu
            <span className="text-[#0b1220]" aria-hidden>
              *
            </span>
            <span className="sr-only">(zorunlu)</span>
          </label>
          <input
            id="fx-reg-referral"
            className={`${inputClass} border-[rgba(16,20,37,0.12)] bg-white focus:border-[#68F848]`}
            required
            aria-required="true"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Referans kodunuz (rakam)"
            disabled={loading}
            inputMode="numeric"
            autoComplete="off"
          />
          <p className="mt-2 text-[12px] leading-relaxed text-[#5c657a]">
            Referans kodu zorunludur (yalnızca rakam). Geçerli bir kod olmadan kayıt tamamlanamaz. / Referral code required (digits only).
          </p>
        </div>

        <div>
          <label htmlFor="fx-reg-password" className={labelClass}>
            Şifre
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
            Şifre tekrar
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
            placeholder="Şifrenizi tekrar yazın"
            disabled={loading}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#ea3943]/40 bg-[#ea3943]/10 px-3.5 py-2.5 text-sm text-[#ea3943]"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-xl bg-[#68F848] py-3.5 text-sm font-semibold text-[#0a0a0a] shadow-[0_8px_24px_rgba(104,248,72,0.28)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
        </button>
      </form>

      <div className="mt-7 border-t border-[rgba(16,20,37,0.08)] pt-5 text-center text-sm text-[#5c657a]">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="font-semibold text-[#0b1220] underline-offset-2 transition hover:underline">
          Giriş yapın
        </Link>
      </div>
    </>
  );
}
