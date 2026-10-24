"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

const inputClass =
  "fx-auth-input w-full rounded-xl border border-[rgba(16,20,37,0.12)] bg-[#ffffff] px-3.5 py-3 text-[15px] text-[#111111] outline-none transition placeholder:text-[#8b93a7] hover:border-[#111111]/40 focus:border-[#111111] focus:shadow-[0_0_0_3px_rgba(17,17,17,0.15)]";

const labelClass = "mb-1.5 block text-[13px] font-medium text-[#5c657a]";

const BLOCK_COOKIE = "7fx_login_block_msg";
const BLOCK_STORAGE = "7fx_login_block_msg";

function readBlockMessageFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${BLOCK_COOKIE}=`));
  if (!match) return null;
  const raw = match.slice(BLOCK_COOKIE.length + 1);
  // Current format: base64url(UTF-8)
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const bin = atob(b64 + pad);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (text.trim()) return text;
  } catch {
    /* legacy */
  }
  // Legacy: URI-encoded (possibly double-encoded)
  try {
    let s = raw;
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(s);
      if (next === s) break;
      s = next;
    }
    return s;
  } catch {
    return raw;
  }
}

function clearBlockCookie() {
  document.cookie = `${BLOCK_COOKIE}=; path=/; max-age=0`;
}

export default function LoginForm() {
  const { t } = useI18n();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  function showLoginBlocked(message: string) {
    const msg = (message || "").trim() || t("auth.accessClosed");
    setBlockMessage(msg);
    setBlockOpen(true);
    try {
      sessionStorage.setItem(BLOCK_STORAGE, msg);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(BLOCK_STORAGE);
      if (stored) {
        setBlockMessage(stored);
        setBlockOpen(true);
        sessionStorage.removeItem(BLOCK_STORAGE);
      }
    } catch {
      /* ignore */
    }
    const fromCookie = readBlockMessageFromCookie();
    if (fromCookie) {
      showLoginBlocked(fromCookie);
      clearBlockCookie();
    }
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("loginBlocked") === "1" && !fromCookie) {
        showLoginBlocked(t("auth.accessClosed"));
      }
      const err = sp.get("error");
      if (err && !sp.get("loginBlocked")) setError(err);
      const challenge = sp.get("challenge");
      if (challenge) setChallengeToken(challenge);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-[#111111]">{t("auth.loginTitle")}</h2>
          <LanguageSwitcher compact tone="dark" />
        </div>
        <p className="mt-1 text-sm text-[#5c657a]">{t("auth.loginSubtitle")}</p>
      </div>

      
      {challengeToken ? (
        <form
          method="post"
          action="/api/auth/2fa/verify"
          className="space-y-4"
          onSubmit={() => setLoading(true)}
        >
          <input type="hidden" name="nav" value="1" />
          <input type="hidden" name="challengeToken" value={challengeToken} />
          <p className="text-sm text-[#5c657a]">{t("auth.totpPrompt")}</p>
          <div>
            <label className={labelClass} htmlFor="fx-totp">{t("auth.totpCode")}</label>
            <input
              id="fx-totp"
              name="code"
              className={inputClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="123456"
              required
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
            className="flex w-full items-center justify-center rounded-xl bg-[#111111] px-4 py-3 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {loading ? t("auth.signingIn") : t("auth.verifyTotp")}
          </button>
          <button
            type="button"
            className="w-full text-center text-sm text-[#5c657a] underline"
            onClick={() => {
              setChallengeToken(null);
              setTotpCode("");
              setError("");
              window.history.replaceState(null, "", "/login");
            }}
          >
            {t("auth.backToLogin")}
          </button>
        </form>
      ) : (
<form
        method="post"
        action="/api/auth/login"
        className="space-y-4"
        onSubmit={() => setLoading(true)}
      >
        <input type="hidden" name="nav" value="1" />
        <div>
          <label htmlFor="fx-login-identifier" className={labelClass}>
            {t("auth.identifier")}
          </label>
          <input
            id="fx-login-identifier"
            name="email"
            className={inputClass}
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("auth.identifierPh")}
            readOnly={loading}
            inputMode="email"
          />
        </div>
        <div>
          <label htmlFor="fx-login-password" className={labelClass}>
            {t("common.password")}
          </label>
          <input
            id="fx-login-password"
            name="password"
            className={inputClass}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            readOnly={loading}
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
      )}

      <div className="mt-7 border-t border-[rgba(16,20,37,0.08)] pt-5 text-center text-sm text-[#5c657a]">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-[#111111] underline-offset-2 transition hover:underline">
          {t("common.signUp")}
        </Link>
      </div>

      {blockOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fx-login-blocked-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 id="fx-login-blocked-title" className="text-lg font-semibold tracking-tight text-[#111111]">
              {t("auth.loginBlockedTitle")}
            </h3>
            <div className="mt-3 max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-[#333]">
              {blockMessage}
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-[#111111] py-3 text-sm font-semibold text-white"
              onClick={() => setBlockOpen(false)}
            >
              {t("auth.loginBlockedClose")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
