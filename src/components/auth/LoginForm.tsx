"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "fx-landing-input w-full rounded-xl border border-white/14 bg-[#07090d] px-3.5 py-3 text-[#e8eef6] outline-none transition placeholder:text-white/35 hover:border-[#f83b00]/55 focus:border-[#f83b00] focus:shadow-[0_0_0_4px_rgba(248,59,0,0.2)]";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Giriş başarısız");
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f83b00]">Giriş</p>
        <h2 className="mt-2 text-2xl tracking-tight text-[#e8eef6] sm:text-[1.75rem]">
          Hesabınıza erişin
        </h2>
        <p className="mt-1.5 text-sm text-[#8b97a8]">E-posta ve şifrenizle güvenli oturum açın.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@eposta.com"
            disabled={loading}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
          {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#8b97a8]">
        Hesabınız yok mu?{" "}
        <Link href="/register" className="font-semibold text-[#f83b00] transition hover:brightness-110">
          Kayıt olun
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
