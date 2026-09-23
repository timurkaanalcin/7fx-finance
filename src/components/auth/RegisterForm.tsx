"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "fx-landing-input w-full rounded-xl border border-white/14 bg-[#07090d] px-3.5 py-3 text-[#e8eef6] outline-none transition placeholder:text-white/35 hover:border-[#f83b00]/55 focus:border-[#f83b00] focus:shadow-[0_0_0_4px_rgba(248,59,0,0.2)]";

export default function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f83b00]">Kayıt</p>
        <h2 className="mt-2 text-2xl tracking-tight text-[#e8eef6] sm:text-[1.75rem]">
          Hesap oluşturun
        </h2>
        <p className="mt-1.5 text-sm text-[#8b97a8]">
          Aynı alanlarla kayıt; oturum sonrası işlem terminaline yönlendirilirsiniz.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="fx-reg-first" className="mb-1.5 block text-sm font-medium text-[#8b97a8]">
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
            <label htmlFor="fx-reg-last" className="mb-1.5 block text-sm font-medium text-[#8b97a8]">
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
          <label htmlFor="fx-reg-email" className="mb-1.5 block text-sm font-medium text-[#8b97a8]">
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
          <label htmlFor="fx-reg-phone" className="mb-1.5 block text-sm font-medium text-[#8b97a8]">
            Telefon <span className="font-normal opacity-70">(isteğe bağlı)</span>
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
        <div>
          <label htmlFor="fx-reg-password" className="mb-1.5 block text-sm font-medium text-[#8b97a8]">
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
          <label htmlFor="fx-reg-password2" className="mb-1.5 block text-sm font-medium text-[#8b97a8]">
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
            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#f83b00] py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(248,59,0,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#8b97a8]">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="font-semibold text-[#f83b00] transition hover:brightness-110">
          Giriş yapın
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-[#8b97a8]">
        <Link href="/" className="transition hover:text-[#e8eef6]">
          Ana sayfaya dön
        </Link>
      </p>
    </>
  );
}
