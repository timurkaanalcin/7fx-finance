"use client";

import SignOutForm from "@/components/auth/SignOutForm";
import ThemeToggle from "@/components/theme/ThemeToggle";
import ForcePasswordModal from "@/components/trading/ForcePasswordModal";
import { useI18n } from "@/lib/i18n/context";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/locales";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import LiveSupportPanel from "@/components/profile/LiveSupportPanel";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import { friendlyError } from "@/components/system/friendly-error";
import { getSeenDocs } from "@/lib/docs-seen";
import { normalizeLocale, PUBLIC_DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { fmtMoney, fmtPct } from "@/lib/format";
import { metricsFromStoredAccount } from "@/lib/trade-metrics";
import AccountMetricStrip, { type AccountMetricItem } from "@/components/trading/AccountMetrics";

type Profilee = {
  id: string;
  email: string;
  accountLoginId: string | null;
  name: string;
  role: string;
  active: boolean;
  tradingEnabled?: boolean;
  withdrawalsEnabled?: boolean;
  mustChangePassword?: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthDate: string | null;
  language: string;
  timezone: string;
  country: string | null;
  address: string | null;
  accountType: string;
  registrationDate: string | null;
  registrationCountry: string | null;
  isResident: boolean;
  lastLoginAt: string | null;
  tradingServer: string | null;
  documentsStatus: string;
  balance: number;
  equity: number;
  credit: number;
  bonus: number;
  currency: string;
  margin?: number;
  freeMargin?: number;
  leverage?: number;
  ftd: boolean;
};

type WithdrawalRow = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  details: string | null;
  note: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#2a2a2a] py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-100">{value ?? "—"}</span>
    </div>
  );
}

export default function ProfileePage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [profile, setProfilee] = useState<Profilee | null>(null);
  const [profileError, setProfileError] = useState("");
  const [phone, setPhone] = useState("");
  const [newDocs, setNewDocs] = useState(0);
  useEffect(() => {
    fetch("/api/documents", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : { documents: [] }))
      .then((d: { documents?: { id: string }[] }) => {
        const seen = getSeenDocs();
        setNewDocs((d.documents || []).filter((x) => !seen.has(x.id)).length);
      })
      .catch(() => {});
  }, []);
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Europe/Istanbul");
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const [wdAmount, setWdAmount] = useState("100");
  const [wdMethod, setWdMethod] = useState<"BANK" | "CRYPTO">("BANK");
  const [wdDetails, setWdDetails] = useState("");
  const [wdNote, setWdNote] = useState("");
  const [wdMsg, setWdMsg] = useState("");
  const [wdErr, setWdErr] = useState("");
  const [wdBusy, setWdBusy] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [wdHasMore, setWdHasMore] = useState(false);
  const [wdMoreBusy, setWdMoreBusy] = useState(false);
  const wdRef = useRef<WithdrawalRow[]>([]);

  const loadWithdrawals = useCallback(async (mode: "replace" | "more" = "replace") => {
    try {
      const skip = mode === "more" ? wdRef.current.length : 0;
      if (mode === "more") setWdMoreBusy(true);
      const res = await fetch(`/api/withdraw?take=50&skip=${skip}`);
      if (!res.ok) return;
      const data = await res.json();
      const incoming: WithdrawalRow[] = data.requests || [];
      const next =
        mode === "more"
          ? wdRef.current.concat(incoming.filter((row) => !wdRef.current.some((old) => old.id === row.id)))
          : incoming;
      wdRef.current = next;
      setWithdrawals(next);
      setWdHasMore(Boolean(data.hasMore));
    } catch {
      /* ignore */
    } finally {
      if (mode === "more") setWdMoreBusy(false);
    }
  }, []);

  const loadProfile = useCallback(() => {
    setProfileError("");
    fetch("/api/profile")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        const data = await r.json().catch(() => null);
        if (!r.ok || !data?.profile) {
          setProfileError("fail");
          return null;
        }
        return data;
      })
      .then((d) => {
        if (!d?.profile) return;
        setProfilee(d.profile);
        setPhone(d.profile.phone || "");
        setLanguage(d.profile.language || PUBLIC_DEFAULT_LOCALE);
        // Sync site UI (margin-call etc.) to profile language
        if (d.profile.language) setLocale(normalizeLocale(d.profile.language, "public"));
        setTimezone(d.profile.timezone || "Europe/Istanbul");
        setAddress(d.profile.address || "");
      })
      .catch(() => setProfileError("fail"));
  }, [router, setLocale]);

  useEffect(() => {
    loadProfile();
    loadWithdrawals();
  }, [loadProfile, loadWithdrawals]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, language, timezone, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(friendlyError(data.error, t("term.profile.saveFailed")));
        return;
      }
      setMsg(t("term.profile.saved"));
      setProfilee((p) => (p ? { ...p, phone, language, timezone, address } : p));
      setLocale(normalizeLocale(language, "public"));
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg("");
    setPwErr("");
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPwErr(t("term.profile.pwFill"));
        return;
      }
      if (newPassword.length < 8) {
        setPwErr(t("term.profile.pwMin"));
        return;
      }
      if (newPassword !== confirmPassword) {
        setPwErr(t("term.profile.pwMatch"));
        return;
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changePassword: true,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwErr(friendlyError(data.error, t("term.profile.pwFail")));
        return;
      }
      setPwMsg(t("term.profile.pwOk"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPwErr(t("term.profile.conn"));
    } finally {
      setPwBusy(false);
    }
  }

  async function onWithdraw(e: FormEvent) {
    e.preventDefault();
    if (profile?.withdrawalsEnabled === false) {
      setWdErr(t("term.withdrawalsDisabled"));
      return;
    }
    setWdBusy(true);
    setWdErr("");
    setWdMsg("");
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(wdAmount),
          method: wdMethod,
          details: wdDetails,
          note: wdNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWdErr(friendlyError(data.error, t("term.profile.wdFail")));
        return;
      }
      setWdMsg(t("term.profile.wdOk"));
      setWdDetails("");
      setWdNote("");
      await loadWithdrawals();
    } catch {
      setWdErr(t("term.profile.conn"));
    } finally {
      setWdBusy(false);
    }
  }

  if (!profile && profileError) {
    return (
      <div className="fx-profile flex min-h-screen flex-col items-center justify-center gap-3 bg-[#000000] px-6 text-center" data-fx-profile-error="" role="alert">
        <p className="text-sm font-normal text-slate-100">{t("term.profile.loadFail")}</p>
        <button type="button" className="min-h-10 rounded-full bg-white px-4 text-sm font-normal text-black" onClick={() => loadProfile()}>
          {t("term.retry")}
        </button>
      </div>
    );
  }

  if (!profile) {
    return <ProfileSkeleton />;
  }

  const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: profile.currency || "USD" });
  const stored = metricsFromStoredAccount({
    balance: profile.balance,
    equity: profile.equity,
    margin: profile.margin ?? 0,
    freeMargin: profile.freeMargin ?? 0,
    leverage: profile.leverage ?? 1,
    currency: profile.currency || "USD",
    credit: profile.credit,
    bonus: profile.bonus,
  });
  const fig = (n: number) => fmtMoney(n, 2, stored.currency);
  const financeItems: AccountMetricItem[] = [
    { key: "balance", label: t("term.top.balance"), value: fig(stored.balance) },
    { key: "equity", label: t("term.top.equity"), value: fig(stored.equity) },
    { key: "margin", label: t("term.top.margin"), value: fig(stored.margin) },
    { key: "free", label: t("term.top.free"), value: fig(stored.freeMargin) },
    {
      key: "level",
      label: t("term.margin.level"),
      value: stored.margin > 0 ? fmtPct(stored.marginLevel) : "—",
      tone: stored.marginLevel > 0 && stored.marginLevel < 100 ? "danger" : "default",
    },
    {
      key: "pl",
      label: t("term.top.pl"),
      value: fig(stored.profitLoss),
      tone: stored.profitLoss < 0 ? "danger" : stored.profitLoss > 0 ? "positive" : "default",
    },
    { key: "credit", label: t("term.top.credit"), value: fig(stored.credit ?? 0) },
    { key: "bonus", label: t("term.profile.bonus"), value: fig(stored.bonus ?? 0) },
  ];

  return (
    <div className="fx-profile min-h-screen bg-[#000000] text-slate-100">
      <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-[#2a2a2a] bg-[#0a0a0a] px-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
        <img src="/icons/v3/icon-64.png" alt="" className="h-7 w-7 rounded-md object-cover ring-1 ring-[#2a2a2a]" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{t("term.profile.membership")}</span>
        <Link
          href="/trade"
          className="ml-auto rounded-md bg-[#2a2a2a] px-2.5 py-1.5 text-xs hover:bg-[#1f1f1f]"
        >
          <span className="fx-rtl-flip" aria-hidden="true">←</span> {t("common.terminal")}
        </Link>
        <NotificationBell tone="dark" />
        <ThemeToggle />
        <SignOutForm
          label={t("common.signOut")}
          buttonClassName="rounded-md border border-[#2a2a2a] px-2.5 py-1.5 text-xs text-slate-400 hover:bg-[#1f1f1f] hover:text-slate-200"
        />
      </header>

      <main className="mx-auto max-w-2xl p-4 pb-10 md:p-6">
        <div id="destek" className="mb-4 scroll-mt-20">
          <LiveSupportPanel />
        </div>
        <Link
          href="/assistant"
          className="mb-4 flex min-h-[56px] items-center justify-between rounded-xl border border-[#c9a54a]/50 bg-[#0a0a0a] px-4 py-3 no-underline"
        >
          <span>
            <span className="block text-sm font-semibold text-slate-100">7FX AI</span>
            <span className="block text-xs text-slate-500">{t("profile.aiLine")}</span>
          </span>
          <span className="text-[#c9a54a]" aria-hidden>›</span>
        </Link>
        <Link
          href="/documents"
          className="mb-4 flex min-h-[56px] items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 no-underline"
        >
          <span>
            <span className="block text-sm font-semibold text-slate-100">{t("docs.title")}</span>
            <span className="block text-xs text-slate-500">{t("docs.subtitle")}</span>
          </span>
          <span className="flex items-center gap-2">
            {newDocs > 0 && (
              <span
                className="rounded-full bg-[#c9a54a] px-2 py-0.5 text-[11px] font-bold leading-none text-black"
                aria-label={`${newDocs} ${t("docs.new")}`}
              >
                {newDocs}
              </span>
            )}
            <span className="text-slate-400" aria-hidden>›</span>
          </span>
        </Link>
        <div className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <div className="mb-1 text-lg font-semibold">{profile.name}</div>
          <div className="text-xs text-slate-500">{profile.email}</div>
          {profile.accountLoginId && (
            <div className="mt-1 text-xs text-slate-400">
              {t("term.profile.accountId")}:{" "}
              <span className="font-mono tracking-wider text-slate-200">{profile.accountLoginId}</span>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            <span className="rounded bg-slate-700 px-1.5 py-0.5">{profile.accountType}</span>
            <span
              className={`rounded px-1.5 py-0.5 ${
                profile.active ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
              }`}
            >
              {profile.active ? t("term.profile.active") : t("term.profile.frozen")}
            </span>
            {profile.documentsStatus && profile.documentsStatus !== "NONE" && (
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-blue-300">
                {t("term.profile.documents")}:{" "}
                {profile.documentsStatus === "PENDING"
                  ? t("term.wd.pending")
                  : profile.documentsStatus === "APPROVED"
                    ? t("term.wd.approved")
                    : profile.documentsStatus === "REJECTED"
                      ? t("term.wd.rejected")
                      : profile.documentsStatus}
              </span>
            )}
          </div>
        </div>

        <section className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <h2 className="mb-2 text-sm font-medium text-slate-300">{t("term.profile.idAccount")}</h2>
          <Row label={t("term.profile.accountId")} value={profile.accountLoginId || "—"} />
          <Row label={t("term.profile.firstName")} value={profile.firstName} />
          <Row label={t("term.profile.lastName")} value={profile.lastName} />
          <Row label={t("term.profile.country")} value={profile.country} />
          <Row
            label={t("term.profile.birth")}
            value={
              profile.birthDate ? new Date(profile.birthDate).toLocaleDateString(locale) : "—"
            }
          />
          <Row
            label={t("term.profile.registered")}
            value={
              profile.registrationDate
                ? new Date(profile.registrationDate).toLocaleDateString(locale)
                : "—"
            }
          />
          <Row label={t("term.profile.regCountry")} value={profile.registrationCountry} />
          <Row label={t("term.profile.resident")} value={profile.isResident ? t("common.yes") : t("common.no")} />
          <Row
            label={t("term.profile.lastLogin")}
            value={
              profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString(locale) : "—"
            }
          />
          <Row label={t("term.profile.server")} value={profile.tradingServer || "—"} />
        </section>

        <section className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-300">{t("term.profile.finance")}</h2>
          <AccountMetricStrip variant="panel" items={financeItems} />
        </section>


        <form onSubmit={save} className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-300">{t("term.profile.editable")}</h2>
          {msg && <p className="mb-2 text-xs text-emerald-400">{msg}</p>}
          <div className="grid gap-3 text-xs sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">{t("common.phone")}</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">{t("common.language")}</span>
              <select
                value={language}
                onChange={(e) => {
                  const v = e.target.value;
                  setLanguage(v);
                  setLocale(normalizeLocale(v, "public"));
                }}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
              >
                {LOCALES.map((code) => (
                  <option key={code} value={code}>
                    {LOCALE_META[code as Locale].native}
                  </option>
                ))}
              </select>
              <span className="mt-1 text-[10px] text-slate-500">
                {t("term.profile.siteLang")}:{' '}
                <LanguageSwitcher compact tone="dark" />
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">{t("common.timezone")}</span>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-slate-500">{t("common.address")}</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {t("common.save")}
          </button>
        </form>

        <form
          onSubmit={changePassword}
          className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4"
        >
          <h2 className="mb-1 text-sm font-medium text-slate-300">{t("term.profile.password")}</h2>
          <p className="mb-3 text-[11px] text-slate-500">
            {t("term.profile.pwHint")}
          </p>
          {pwMsg && <p className="mb-2 text-xs text-emerald-400">{pwMsg}</p>}
          {pwErr && <p className="mb-2 text-xs text-red-400">{pwErr}</p>}
          <div className="grid gap-3 text-xs sm:grid-cols-1">
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">{t("term.profile.pwCurrent")}</span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">{t("term.profile.pwNew")}</span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
                minLength={8}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">{t("term.profile.pwConfirm")}</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
                minLength={8}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pwBusy}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {t("term.profile.pwUpdate")}
          </button>
        </form>

        {/* Withdraw funds — bottom of profile */}
        <section
          id="para-cekme"
          className="fx-cashier rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4"
        >
          <h2 className="mb-1 text-sm font-normal text-slate-300">{t("term.profile.withdraw")}</h2>
          <p className="mb-3 text-[11px] text-slate-500">
            {t("term.profile.wdLead").replace("{amount}", money(profile.balance))}
          </p>
          {profile.withdrawalsEnabled === false && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {t("term.withdrawalsDisabled")}
            </div>
          )}

          <form onSubmit={onWithdraw} className="fx-wd-fields">
            <div className="fx-wd-note flex gap-1 rounded-lg border border-[#2a2a2a] bg-[#000000] p-1">
              {(["BANK", "CRYPTO"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setWdMethod(m)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
                    wdMethod === m
                      ? "bg-white text-black shadow-sm"
                      : "text-slate-400 hover:bg-[#1f1f1f]"
                  }`}
                >
                  {m === "BANK" ? t("term.profile.wdBank") : t("term.profile.wdCrypto")}
                </button>
              ))}
            </div>

            <label className="flex flex-col gap-1 text-xs">
              <span className="text-slate-500">{t("term.profile.amount").replace("{currency}", profile.currency || "USD")}</span>
              <input
                type="number"
                min={1}
                step="0.01"
                required
                value={wdAmount}
                onChange={(e) => setWdAmount(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-3 py-2 text-sm font-normal tabular-nums"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="text-slate-500">
                {wdMethod === "BANK" ? t("term.profile.wdIban") : t("term.profile.wdWallet")}
              </span>
              <input
                required
                value={wdDetails}
                onChange={(e) => setWdDetails(e.target.value)}
                placeholder={
                  wdMethod === "BANK" ? t("term.profile.ibanPh") : t("term.profile.walletPh")
                }
                className="rounded border border-[#2a2a2a] bg-[#000000] px-3 py-2 text-sm"
              />
            </label>

            <label className="fx-wd-note flex flex-col gap-1 text-xs">
              <span className="text-slate-500">{t("term.profile.wdNote")}</span>
              <input
                value={wdNote}
                onChange={(e) => setWdNote(e.target.value)}
                placeholder={t("term.profile.wdNotePh")}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-3 py-2 text-sm"
              />
            </label>

            {wdErr && (
              <div className="fx-wd-note rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{wdErr}</div>
            )}
            {wdMsg && (
              <div className="fx-wd-note rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {wdMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={wdBusy || profile.withdrawalsEnabled === false}
              className="fx-wd-note w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {wdBusy ? t("term.profile.wdBusy") : t("term.profile.wdSubmit")}
            </button>
          </form>

          {withdrawals.length === 0 ? (
            <p className="fx-empty mt-4 border-t border-[#2a2a2a] pt-3 text-xs font-normal text-slate-500" data-fx-wd-empty="">
              {t("term.profile.wdEmpty")}
            </p>
          ) : (
            <div className="mt-4 border-t border-[#2a2a2a] pt-3">
              <h3 className="mb-2 text-xs font-normal uppercase tracking-wide text-slate-500">
                {t("term.wd.recent")}
              </h3>
              <ul className="space-y-2 text-xs">
                {withdrawals.map((w) => (
                    <li
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#2a2a2a] bg-[#000000] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="font-normal tabular-nums text-slate-200">
                        {money(w.amount)} · {w.method}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(w.createdAt).toLocaleString(locale)}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                        w.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-300"
                          : w.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {(w.status === "PENDING"
                        ? t("term.wd.pending")
                        : w.status === "APPROVED"
                          ? t("term.wd.approved")
                          : w.status === "REJECTED"
                            ? t("term.wd.rejected")
                            : w.status)}
                    </span>
                  </li>
                ))}
              </ul>
              {wdHasMore && (
                <button
                  type="button"
                  disabled={wdMoreBusy}
                  onClick={() => void loadWithdrawals("more")}
                  className="mt-2 w-full rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  {wdMoreBusy ? t("common.loading") : t("term.loadMore")}
                </button>
              )}
            </div>
          )}
        </section>
      </main>
      {profile?.mustChangePassword ? (
        <ForcePasswordModal onDone={() => window.location.reload()} />
      ) : null}
    </div>
  );
}
