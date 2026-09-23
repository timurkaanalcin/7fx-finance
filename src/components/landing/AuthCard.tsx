"use client";

import { FormEvent } from "react";

export type AuthTab = "login" | "register";

type AuthCardProps = {
  tab: AuthTab;
  error: string;
  loading: boolean;
  loginEmail: string;
  loginPassword: string;
  firstName: string;
  lastName: string;
  regEmail: string;
  phone: string;
  regPassword: string;
  regPasswordConfirm: string;
  onOpenAuth: (tab: AuthTab) => void;
  onLogin: (e: FormEvent) => void;
  onRegister: (e: FormEvent) => void;
  setLoginEmail: (v: string) => void;
  setLoginPassword: (v: string) => void;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setRegEmail: (v: string) => void;
  setPhone: (v: string) => void;
  setRegPassword: (v: string) => void;
  setRegPasswordConfirm: (v: string) => void;
};

const inputClass =
  "fx-landing-input w-full rounded-xl border border-white/14 bg-[#07090d] px-3.5 py-3 text-[#e8eef6] outline-none transition placeholder:text-white/35 hover:border-[#f83b00]/55 focus:border-[#f83b00] focus:shadow-[0_0_0_4px_rgba(248,59,0,0.2)]";

export default function AuthCard(props: AuthCardProps) {
  const {
    tab,
    error,
    loading,
    loginEmail,
    loginPassword,
    firstName,
    lastName,
    regEmail,
    phone,
    regPassword,
    regPasswordConfirm,
    onOpenAuth,
    onLogin,
    onRegister,
    setLoginEmail,
    setLoginPassword,
    setFirstName,
    setLastName,
    setRegEmail,
    setPhone,
    setRegPassword,
    setRegPasswordConfirm,
  } = props;

  return (
    <div
      id="auth"
      className="fx-auth-card relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c1017]/95 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-16 h-44 w-44 rounded-full bg-[#f83b00]/18 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[#00ffc2]/10 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/7fx-mark.png" alt="" className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-[#e8eef6]">Hesabınıza erişin</p>
            <p className="text-xs text-[#8b97a8]">Güvenli oturum · 7FX</p>
          </div>
        </div>

        <div
          className="mb-6 mt-5 flex rounded-xl border border-white/10 bg-[#07090d]/80 p-1"
          role="tablist"
          aria-label="Kimlik doğrulama"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "login"}
            onClick={() => onOpenAuth("login")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
              tab === "login"
                ? "bg-[#f83b00] text-white shadow-[0_8px_22px_rgba(248,59,0,0.35)]"
                : "text-[#8b97a8] hover:text-[#e8eef6]"
            }`}
          >
            Giriş
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "register"}
            onClick={() => onOpenAuth("register")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
              tab === "register"
                ? "bg-[#f83b00] text-white shadow-[0_8px_22px_rgba(248,59,0,0.35)]"
                : "text-[#8b97a8] hover:text-[#e8eef6]"
            }`}
          >
            Kayıt
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={onLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="fx-login-email" className="mb-1.5 block text-sm font-medium text-[#8b97a8]">
                E-posta
              </label>
              <input
                id="fx-login-email"
                className={inputClass}
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="ornek@eposta.com"
              />
            </div>
            <div>
              <label htmlFor="fx-login-password" className="mb-1.5 block text-sm font-medium text-[#8b97a8]">
                Şifre
              </label>
              <input
                id="fx-login-password"
                className={inputClass}
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
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
              className="w-full rounded-xl bg-[#f83b00] py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(248,59,0,0.28)] transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister} className="space-y-3.5" noValidate>
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
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="ornek@eposta.com"
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
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="En az 8 karakter"
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
                value={regPasswordConfirm}
                onChange={(e) => setRegPasswordConfirm(e.target.value)}
                placeholder="Şifrenizi tekrar yazın"
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
              className="w-full rounded-xl bg-[#f83b00] py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(248,59,0,0.28)] transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#8b97a8]">
          Giriş sonrası işlem terminali <span className="font-medium text-[#e8eef6]">/trade</span> adresinde açılır.
        </p>
      </div>
    </div>
  );
}
