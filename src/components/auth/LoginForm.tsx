"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "fx-auth-input w-full rounded-xl border border-[rgba(16,20,37,0.12)] bg-[#ffffff] px-3.5 py-3 text-[15px] text-[#111111] outline-none transition placeholder:text-[#8b93a7] hover:border-[#111111]/40 focus:border-[#111111] focus:shadow-[0_0_0_3px_rgba(17,17,17,0.15)]";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#5c657a]";

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
        <h2 className="text-xl font-semibold tracking-tight text-[#111111]">Giriş Yap</h2>
        <p className="mt-1 text-sm text-[#5c657a]">E-posta ve şifrenizle oturum açın.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="fx-login-email" className={labelClass}>
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
          <label htmlFor="fx-login-password" className={labelClass}>
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
          {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>

      <div className="mt-7 border-t border-[rgba(16,20,37,0.08)] pt-5 text-center text-sm text-[#5c657a]">
        Hesabınız yok mu?{" "}
        <Link href="/register" className="font-semibold text-[#111111] underline-offset-2 transition hover:underline">
          Kayıt olun
        </Link>
      </div>
    </>
  );
}
