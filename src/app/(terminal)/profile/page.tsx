"use client";

import ForcePasswordModal from "@/components/trading/ForcePasswordModal";
import { useI18n } from "@/lib/i18n/context";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/locales";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

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
  tradingGroup: string | null;
  desk: string | null;
  documentsStatus: string;
  balance: number;
  equity: number;
  credit: number;
  bonus: number;
  currency: string;
  retentionStatus: string | null;
  saleStatus: string | null;
  ftd: boolean;
  brokerName: string | null;
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

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function ProfileePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [profile, setProfilee] = useState<Profilee | null>(null);
  const [phone, setPhone] = useState("");
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

  const loadWithdrawals = useCallback(async () => {
    try {
      const res = await fetch("/api/withdraw");
      if (!res.ok) return;
      const data = await res.json();
      setWithdrawals(data.requests || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d?.profile) return;
        setProfilee(d.profile);
        setPhone(d.profile.phone || "");
        setLanguage(d.profile.language || "tr");
        setTimezone(d.profile.timezone || "Europe/Istanbul");
        setAddress(d.profile.address || "");
      })
      .catch(() => router.push("/login"));
    loadWithdrawals();
  }, [router, loadWithdrawals]);

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
        setMsg(data.error || "Registration failed");
        return;
      }
      setMsg("Kaydedildi");
      setProfilee((p) => (p ? { ...p, phone, language, timezone, address } : p));
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
        setPwErr("Fill in all password fields");
        return;
      }
      if (newPassword.length < 8) {
        setPwErr("New password must be at least 8 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPwErr("New passwords do not match");
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
        setPwErr(data.error || "Could not change password");
        return;
      }
      setPwMsg("Your password was updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPwErr("Connection error");
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
        setWdErr(data.error || "Could not submit request");
        return;
      }
      setWdMsg("Withdrawal request submitted. Balance will be deducted after admin approval.");
      setWdDetails("");
      setWdNote("");
      await loadWithdrawals();
    } catch {
      setWdErr("Connection error");
    } finally {
      setWdBusy(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#000000] text-slate-400">
        Loading profile…
      </div>
    );
  }

  const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: profile.currency || "USD" });

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100">
      <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-[#2a2a2a] bg-[#0a0a0a] px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/v3/icon-192.png" alt="" className="h-7 w-7 rounded-md object-cover ring-1 ring-[#2a2a2a]" />
        <span className="text-sm font-semibold">Membership Details</span>
        <Link
          href="/trade"
          className="ml-auto rounded-md bg-[#2a2a2a] px-2.5 py-1.5 text-xs hover:bg-[#1f1f1f]"
        >
          ← Terminal
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border border-[#2a2a2a] px-2.5 py-1.5 text-xs text-slate-400 hover:bg-[#1f1f1f] hover:text-slate-200"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-2xl p-4 pb-10 md:p-6">
        <div className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <div className="mb-1 text-lg font-semibold">{profile.name}</div>
          <div className="text-xs text-slate-500">{profile.email}</div>
          {profile.accountLoginId && (
            <div className="mt-1 text-xs text-slate-400">
              Account ID:{" "}
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
              {profile.active ? "Active" : "Freezeuldu"}
            </span>
            {profile.documentsStatus && profile.documentsStatus !== "NONE" && (
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-blue-300">
                Documents: {profile.documentsStatus}
              </span>
            )}
          </div>
        </div>

        <section className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <h2 className="mb-2 text-sm font-medium text-slate-300">ID / Account</h2>
          <Row label="Account ID" value={profile.accountLoginId || "—"} />
          <Row label="First name" value={profile.firstName} />
          <Row label="Last name" value={profile.lastName} />
          <Row label="Country" value={profile.country} />
          <Row
            label="Date of birth"
            value={
              profile.birthDate ? new Date(profile.birthDate).toLocaleDateString("en-US") : "—"
            }
          />
          <Row
            label="Registered"
            value={
              profile.registrationDate
                ? new Date(profile.registrationDate).toLocaleDateString("en-US")
                : "—"
            }
          />
          <Row label="Registration country" value={profile.registrationCountry} />
          <Row label="Resident" value={profile.isResident ? "Yes" : "No"} />
          <Row
            label="Last login"
            value={
              profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString("en-US") : "—"
            }
          />
          <Row label="Desk" value={profile.desk} />
          <Row label="Server / Group" value={[profile.tradingServer, profile.tradingGroup].filter(Boolean).join(" / ") || "—"} />
          <Row label="Broker" value={profile.brokerName} />
        </section>

        <section className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <h2 className="mb-2 text-sm font-medium text-slate-300">Finance summary</h2>
          <Row label="Balance" value={money(profile.balance)} />
          <Row label="Equity" value={money(profile.equity)} />
          <Row label="Credit" value={money(profile.credit)} />
          <Row label="Bonus" value={money(profile.bonus)} />
          <Row label="Para birimi" value={profile.currency} />
        </section>

        <section className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <h2 className="mb-2 text-sm font-medium text-slate-300">Status (salt okunur)</h2>
          <Row label="Sell" value={profile.saleStatus} />
          <Row label="Retansiyon" value={profile.retentionStatus} />
          <Row label="FTD" value={profile.ftd ? "Yes" : "No"} />
          <p className="mt-2 text-[10px] text-slate-600">
            CRM status fields are managed by the desk only; not editable.
          </p>
        </section>

        <form onSubmit={save} className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-300">Editable fields</h2>
          {msg && <p className="mb-2 text-xs text-emerald-400">{msg}</p>}
          <div className="grid gap-3 text-xs sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
              >
                {LOCALES.map((code) => (
                  <option key={code} value={code}>
                    {LOCALE_META[code as Locale].native}
                  </option>
                ))}
              </select>
              <span className="mt-1 text-[10px] text-slate-500">
                Site language:{' '}
                <LanguageSwitcher compact tone="dark" />
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">Timezone</span>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-slate-500">Address</span>
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
            Save
          </button>
        </form>

        <form
          onSubmit={changePassword}
          className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4"
        >
          <h2 className="mb-1 text-sm font-medium text-slate-300">Change Password</h2>
          <p className="mb-3 text-[11px] text-slate-500">
            For your security, enter your current password, then the new password twice.
          </p>
          {pwMsg && <p className="mb-2 text-xs text-emerald-400">{pwMsg}</p>}
          {pwErr && <p className="mb-2 text-xs text-red-400">{pwErr}</p>}
          <div className="grid gap-3 text-xs sm:grid-cols-1">
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">Current password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">New password</span>
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
              <span className="text-slate-500">New password (confirm)</span>
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
            Update password
          </button>
        </form>

        {/* Para Withdrawal — bottom of profile */}
        <section
          id="para-cekme"
          className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4"
        >
          <h2 className="mb-1 text-sm font-medium text-slate-300">Para Withdrawal</h2>
          <p className="mb-3 text-[11px] text-slate-500">
            The request is deducted from your balance after admin approval. Withdrawable amount is limited by your balance and free
            margin ({money(profile.balance)}).
          </p>
          {profile.withdrawalsEnabled === false && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {t("term.withdrawalsDisabled")}
            </div>
          )}

          <form onSubmit={onWithdraw} className="space-y-3">
            <div className="flex gap-1 rounded-lg border border-[#2a2a2a] bg-[#000000] p-1">
              {(["BANK", "CRYPTO"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setWdMethod(m)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
                    wdMethod === m
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-[#1f1f1f]"
                  }`}
                >
                  {m === "BANK" ? "IBAN / Wire" : "Crypto"}
                </button>
              ))}
            </div>

            <label className="flex flex-col gap-1 text-xs">
              <span className="text-slate-500">Amount ({profile.currency || "USD"})</span>
              <input
                type="number"
                min={1}
                step="0.01"
                required
                value={wdAmount}
                onChange={(e) => setWdAmount(e.target.value)}
                className="rounded border border-[#2a2a2a] bg-[#000000] px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="text-slate-500">
                {wdMethod === "BANK" ? "IBAN / Account bilgisi" : "Wallet address"}
              </span>
              <input
                required
                value={wdDetails}
                onChange={(e) => setWdDetails(e.target.value)}
                placeholder={
                  wdMethod === "BANK" ? "TR00 0000 0000 0000 0000 0000 00" : "0x… / T… "
                }
                className="rounded border border-[#2a2a2a] bg-[#000000] px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="text-slate-500">Note (opsiyonel)</span>
              <input
                value={wdNote}
                onChange={(e) => setWdNote(e.target.value)}
                placeholder="Bank name / network (TRC20) etc."
                className="rounded border border-[#2a2a2a] bg-[#000000] px-3 py-2 text-sm"
              />
            </label>

            {wdErr && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{wdErr}</div>
            )}
            {wdMsg && (
              <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {wdMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={wdBusy || profile.withdrawalsEnabled === false}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {wdBusy ? "Submitting…" : "Submit Withdrawal Request"}
            </button>
          </form>

          {withdrawals.length > 0 && (
            <div className="mt-4 border-t border-[#2a2a2a] pt-3">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Son talepler
              </h3>
              <ul className="space-y-2 text-xs">
                {withdrawals.slice(0, 8).map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#2a2a2a] bg-[#000000] px-3 py-2"
                  >
                    <div>
                      <div className="font-medium tabular-nums text-slate-200">
                        {money(w.amount)} · {w.method}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(w.createdAt).toLocaleString("en-US")}
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
                      {STATUS_LABEL[w.status] || w.status}
                    </span>
                  </li>
                ))}
              </ul>
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
