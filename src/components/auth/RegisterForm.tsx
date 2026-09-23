"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "fx-landing-input w-full rounded-xl border border-white/12 bg-[#07090d] px-3.5 py-3 text-[15px] text-[#e8eef6] outline-none transition placeholder:text-white/30 hover:border-white/22 focus:border-[#f83b00] focus:shadow-[0_0_0_3px_rgba(248,59,0,0.18)]";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#9aa6b5]";

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
    if (!referralCode.trim()) {
      setError("Geçerli bir referans kodu girin.");
      setLoading(false);
      return;
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
        <h2 className="text-xl font-semibold tracking-tight text-[#e8eef6]">Kayıt Ol</h2>
        <p className="mt-1 text-sm text-[#8b97a8]">
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
            Telefon <span className="font-normal text-[#8b97a8]/80">(isteğe bağlı)</span>
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

        {/* Prominent required referral */}
        <div className="rounded-xl border border-[#f83b00]/35 bg-[#f83b00]/[0.06] p-3.5 sm:p-4">
          <label htmlFor="fx-reg-referral" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#e8eef6]">
            Referans Kodu
            <span className="text-[#f83b00]" aria-hidden>
              *
            </span>
            <span className="sr-only">(zorunlu)</span>
          </label>
          <input
            id="fx-reg-referral"
            className={`${inputClass} border-[#f83b00]/40 bg-[#07090d] focus:border-[#f83b00]`}
            required
            aria-required="true"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Referans kodunuzu girin"
            disabled={loading}
            autoComplete="off"
          />
          <p className="mt-2 text-[12px] leading-relaxed text-[#b8c0cc]">
            Referans kodu zorunludur. Geçerli bir kod olmadan kayıt tamamlanamaz.
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
            className="rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3.5 py-2.5 text-sm text-rose-200"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-xl bg-[#f83b00] py-3.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(248,59,0,0.32)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
        </button>
      </form>

      <div className="mt-7 border-t border-white/[0.07] pt-5 text-center text-sm text-[#8b97a8]">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="font-semibold text-[#f83b00] transition hover:brightness-110">
          Giriş yapın
        </Link>
      </div>
    </>
  );
}
