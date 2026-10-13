"use client";

import { pushRecentClient } from "@/lib/crm-recent-clients";
import { LOCALES } from "@/lib/i18n/locales";
import EditablePositionsTable from "@/components/crm/EditablePositionsTable";
import EditableOrdersTable from "@/components/crm/EditableOrdersTable";
import CopyButton from "@/components/crm/CopyButton";
import CrmRecordTable, { CrmAddForm, type CrmColumn } from "@/components/crm/CrmRecordTable";
import { fmtCrmDate, fmtCrmMoney, fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/crm-format";
import { SYMBOLS } from "@/lib/symbols";

import Link from "next/link";
import { useParams } from "next/navigation";
import RetentionPanel, { AssigneePicker } from "@/components/crm/RetentionPanel";
import { useCallback, useEffect, useState } from "react";
import { LoginHistory, TraderPresenceHeader } from "@/components/crm/Presence";
import AccountPermissionsPanel from "@/components/crm/AccountPermissionsPanel";
import {
  ACCOUNT_CURRENCIES,
  ACCOUNT_TYPES,
  DOC_STATUSES,
  POTENTIAL_STATUSES,
  RETENTION_STATUSES,
  SALE_STATUSES,
  VALIDATION_STATUSES,
} from "@/lib/membership";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { JOB_TITLE_KEYS, jobTitleLabel, jobTitleUi } from "@/lib/job-titles";

type Tab =
  | "profil"
  | "iletisim"
  | "biletler"
  | "pozisyonlar"
  | "ledger"
  | "bonus"
  | "belgeler"
  | "takvim"
  | "finans"
  | "notlar"
  | "izinler";

type Membership = Record<string, unknown> & {
  id: string;
  email: string;
  accountLoginId?: string | null;
  name: string;
  role: string;
  active: boolean;
  tradingEnabled?: boolean;
  withdrawalsEnabled?: boolean;
  loginEnabled?: boolean;
  loginBlockedMessage?: string | null;
  loginBlockedAt?: string | null;
  balance: number;
  equity: number;
  credit: number;
  bonus: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
  tradingAccountId?: string | null;
};

type Row = Record<string, unknown>;
type Result = { ok: boolean; error?: string };

const TABS: { id: Tab; labelKey: string; requiresManageUsers?: boolean }[] = [
  { id: "profil", labelKey: "crm.ui.profile" },
  { id: "iletisim", labelKey: "crm.nav.communications" },
  { id: "biletler", labelKey: "crm.nav.tickets" },
  { id: "pozisyonlar", labelKey: "crm.nav.positions" },
  { id: "ledger", labelKey: "crm.ui.balanceHistory" },
  { id: "bonus", labelKey: "crm.ui.bonuses" },
  { id: "belgeler", labelKey: "crm.nav.documents" },
  { id: "takvim", labelKey: "crm.nav.calendar" },
  { id: "finans", labelKey: "crm.nav.finance" },
  { id: "notlar", labelKey: "crm.ui.notes" },
  { id: "izinler", labelKey: "crm.perms.tab", requiresManageUsers: true },
];

const LEDGER_TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "ADJUSTMENT",
  "BONUS",
  "CREDIT",
  "TRADE_PNL",
  "MARGIN_ADD",
  "RESET",
  "FINANCE_SET",
  "CURRENCY_CHANGE",
  "TRANSFER",
];
const REQ_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

const PROFILE_KEYS = [
  "firstName",
  "lastName",
  "name",
  "email",
  "accountLoginId",
  "phone",
  "jobTitle",
  "birthDate",
  "language",
  "timezone",
  "country",
  "address",
  "accountType",
  "registrationDate",
  "registrationCountry",
  "isResident",
  "tradingServer",
  "tradingGroup",
  "desk",
  "deskId",
  "campaign",
  "affiliateA",
  "affiliateB",
  "affiliateC",
  "referralCodeUsed",
  "retentionStatus",
  "saleStatus",
  "potentialStatus",
  "validationStatus",
  "ftd",
  "brokerName",
  "assigneeName",
  "documentsStatus",
  "role",
  "active",
  "currency",
  "leverage",
];
const BOOL_KEYS = ["isResident", "ftd", "active"];

function randomPassword(len = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?";
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length];
  // guarantee at least one digit
  return /\d/.test(out) ? out : out.slice(0, -1) + String(buf[0] % 10);
}

async function jsonCall(url: string, method: string, body: unknown): Promise<Result & { data?: Row }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Row;
    if (!res.ok) return { ok: false, error: String(data.error || res.status) };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Connection error" };
  }
}

function TraderAccessTools({ userId, traderName, readOnly = false, isStaff = false }: { userId: string; traderName: string; readOnly?: boolean; isStaff?: boolean }) {
  const { i18n } = useCrmLabels();
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [expiresIn, setExpiresIn] = useState(60);
  const [forcePwReset, setForcePwReset] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [links, setLinks] = useState<LoginLinkRow[]>([]);

  const loadLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/login-link`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.links)) setLinks(data.links as LoginLinkRow[]);
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  async function revokeLink(id: string) {
    if (!window.confirm(i18n("crm.ui.linkRevokeConfirm"))) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/login-link?linkId=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setErr(data.error || i18n("crm.ui.linkFailed"));
      await loadLinks();
    } catch {
      setErr(i18n("crm.ui.connectionError"));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setEnabled(d.terminalImpersonationEnabled !== false))
      .catch(() => setEnabled(true));
  }, []);

  async function openTerminal() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || i18n("crm.ui.impersonationFailed"));
        return;
      }
      window.location.href = data.redirect || "/trade";
    } catch {
      setErr(i18n("crm.ui.connectionError"));
    } finally {
      setBusy(false);
    }
  }

  async function createLink() {
    setBusy(true);
    setErr("");
    setMsg("");
    setLinkUrl("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/login-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInMinutes: expiresIn, forcePasswordReset: forcePwReset }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || i18n("crm.ui.linkFailed"));
        return;
      }
      // Prefer path + browser origin so the copied link is never an internal Railway bind (0.0.0.0).
      const path =
        typeof data.path === "string" && data.path.startsWith("/")
          ? data.path
          : typeof data.token === "string" && data.token
            ? `/api/auth/auto-login?token=${encodeURIComponent(data.token)}`
            : "";
      const absolute =
        path && typeof window !== "undefined"
          ? `${window.location.origin}${path}`
          : String(data.url || "");
      setLinkUrl(absolute);
      setMsg(`${i18n("crm.ui.linkExpires")} ${new Date(data.expiresAt).toLocaleString("en-GB", { hour12: false })} · ${i18n("crm.ui.linkReusable")}`);
      loadLinks();
    } catch {
      setErr(i18n("crm.ui.connectionError"));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) {
    return (
      <span className="text-[10px] text-neutral-400" title={i18n("crm.ui.impersonationOff")}>
        {i18n("crm.ui.impersonationOff")}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy || readOnly}
        onClick={openTerminal}
        className="rounded bg-sky-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        title={`Open terminal as ${traderName}`}
      >
        {i18n("crm.ui.openTerminal")}
      </button>
      <select
        className="rounded border border-neutral-300 bg-white px-1.5 py-1 text-[10px]"
        value={expiresIn}
        onChange={(e) => {
          const v = Number(e.target.value);
          setExpiresIn(v);
          // 23h preset defaults the force-password checkbox on
          setForcePwReset(v === 1380);
        }}
        disabled={busy}
        title={i18n("crm.ui.linkExpiry")}
      >
        <option value={15}>15m</option>
        <option value={60}>1h</option>
        <option value={360}>6h</option>
        <option value={1380}>23h</option>
        <option value={1440}>24h</option>
        <option value={10080}>7d</option>
      </select>
      <label className="flex items-center gap-1 text-[10px] text-neutral-600" title={i18n("crm.ui.forcePasswordResetHint")}>
        <input
          type="checkbox"
          checked={forcePwReset}
          onChange={(e) => setForcePwReset(e.target.checked)}
          disabled={busy}
        />
        {i18n("crm.ui.forcePasswordReset")}
      </label>
      <button
        type="button"
        disabled={busy || readOnly}
        onClick={createLink}
        className="rounded border border-[#111111] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#111111] hover:bg-neutral-50 disabled:opacity-50"
      >
        {i18n("crm.ui.autoLogin")}
      </button>
      {linkUrl && (
        <button
          type="button"
          className="max-w-[14rem] truncate rounded bg-emerald-50 px-2 py-1 font-mono text-[9px] text-emerald-800"
          title={linkUrl}
          onClick={() => {
            navigator.clipboard?.writeText(linkUrl);
            setMsg(i18n("crm.ui.copied"));
          }}
        >
          {i18n("crm.ui.copy")}
        </button>
      )}
      {isStaff && !err && (
        <span className="text-[10px] font-medium text-amber-700">
          Bu hesap personel (ADMIN) rolünde — terminal/otomatik giriş için Profil → Rol: Trader olmalı.
        </span>
      )}
      {msg && <span className="text-[10px] text-emerald-600">{msg}</span>}
      {err && <span className="text-[10px] text-red-500">{err}</span>}
      {!msg && <span className="text-[10px] text-neutral-400">{i18n("crm.ui.linkReusable")}</span>}
      {links.length > 0 && (
        <div className="basis-full overflow-x-auto">
          <table className="mt-1 w-full text-[10px]">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pr-2 font-medium">{i18n("crm.ui.linkCreated")}</th>
                <th className="pr-2 font-medium">{i18n("crm.ui.linkExpires")}</th>
                <th className="pr-2 font-medium">{i18n("crm.ui.linkUses")}</th>
                <th className="pr-2 font-medium">{i18n("crm.ui.linkLastUsed")}</th>
                <th className="pr-2 font-medium" />
                <th />
              </tr>
            </thead>
            <tbody>
              {links.slice(0, 10).map((l) => {
                const fmt = (v?: string | null) =>
                  v ? new Date(v).toLocaleString("en-GB", { hour12: false }) : "—";
                const fmtPw = (v: string) => {
                  const d = new Date(v);
                  const pad = (n: number) => String(n).padStart(2, "0");
                  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                };
                const revoked = Boolean(l.revokedAt);
                const expired = !revoked && new Date(l.expiresAt).getTime() < Date.now();
                const status = revoked
                  ? i18n("crm.ui.linkStatusRevoked")
                  : expired
                    ? i18n("crm.ui.linkStatusExpired")
                    : i18n("crm.ui.linkStatusActive");
                return (
                  <tr key={l.id} className="border-t border-neutral-100">
                    <td className="pr-2">{fmt(l.createdAt)}</td>
                    <td className="pr-2">{fmt(l.expiresAt)}</td>
                    <td className="pr-2 tabular-nums">{l.useCount ?? 0}</td>
                    <td className="pr-2">{fmt(l.lastUsedAt || l.usedAt)}</td>
                    <td className={`pr-2 ${revoked || expired ? "text-neutral-400" : "text-emerald-600"}`}>
                      {status}
                      {l.passwordSetAt ? (
                        <span
                          className="ml-1 inline-flex flex-wrap items-center gap-0.5 rounded bg-emerald-50 px-1 text-[9px] font-medium text-emerald-700"
                          title={fmtPw(l.passwordSetAt)}
                        >
                          {i18n("crm.ui.passwordSetBadge")}
                          <span className="font-normal tabular-nums text-emerald-800/80">
                            {fmtPw(l.passwordSetAt)}
                          </span>
                        </span>
                      ) : l.forcePasswordReset ? (
                        <span className="ml-1 rounded bg-amber-50 px-1 text-[9px] text-amber-700">
                          {i18n("crm.ui.forcePasswordResetShort")}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {!revoked && !expired && (
                        <button
                          type="button"
                          disabled={busy || readOnly}
                          onClick={() => revokeLink(l.id)}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          {i18n("crm.ui.linkRevoke")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type LoginLinkRow = {
  id: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  useCount?: number;
  forcePasswordReset?: boolean;
  passwordSetAt?: string | null;
};


type PickUser = { id: string; name: string; email: string; accountLoginId: string | null; role?: string; balance?: number; currency?: string };

/** Searchable trader picker (name / email / 16-digit account ID) for internal transfers. */
function SourceAccountPicker({ value, onChange, excludeId }: { value: string; onChange: (v: string) => void; excludeId: string }) {
  const { i18n } = useCrmLabels();
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<PickUser[]>([]);
  useEffect(() => {
    let live = true;
    const h = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q.trim())}&take=50`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        const list: PickUser[] = (d.users || []).filter((u: PickUser) => u.id !== excludeId && (u.role ?? "TRADER") !== "ADMIN");
        if (live) setOpts(list);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(h);
    };
  }, [q, excludeId]);
  const cls = "w-full min-w-[5rem] rounded border border-[#111111] bg-white px-1.5 py-1 text-[11px] text-[#111111] outline-none";
  return (
    <div className="flex flex-col gap-1">
      <input className={cls} placeholder={i18n("crm.edit.sourceSearch")} value={q} onChange={(e) => setQ(e.target.value)} />
      <select className={cls} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{i18n("crm.edit.sourceSelect")}</option>
        {opts.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {u.accountLoginId || u.email}
            {typeof u.balance === "number" ? ` · ${u.balance.toFixed(2)} ${u.currency || ""}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
  allowEmpty = true,
  optionLabel,
  disabled,
  hint,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
  onChange: (v: string) => void;
  type?: string;
  options?: readonly string[];
  allowEmpty?: boolean;
  optionLabel?: (value: string) => string;
  disabled?: boolean;
  hint?: string;
}) {
  const cls =
    "rounded border bg-white px-2 py-1.5 text-sm text-[#111111] outline-none focus:ring-1 focus:ring-[#111111]/30 " +
    (disabled ? "border-[#e5e5e5] bg-white text-neutral-700" : "border-[#111111]");
  if (options) {
    return (
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-neutral-500">{label}</span>
        <select
          value={value == null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          disabled={disabled}
        >
          {allowEmpty && <option value="">—</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {optionLabel ? optionLabel(o) : o}
            </option>
          ))}
        </select>
        {hint && <span className="text-[10px] text-neutral-400">{hint}</span>}
      </label>
    );
  }
  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
        />
        <span className="text-neutral-500">{label}</span>
      </label>
    );
  }
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-neutral-500">{label}</span>
      <input
        type={type}
        step={type === "datetime-local" ? 1 : undefined}
        value={value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
        disabled={disabled}
      />
      {hint && <span className="text-[10px] text-neutral-400">{hint}</span>}
    </label>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-3" title={hint}>
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div
        className={`text-base font-semibold tabular-nums ${
          tone === "pos" ? "text-emerald-600" : tone === "neg" ? "text-red-500" : "text-[#111111]"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-neutral-400">{hint}</div>}
    </div>
  );
}

function PasswordPanel({ userId }: { userId: string }) {
  const { i18n } = useCrmLabels();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function save() {
    setErr("");
    setMsg("");
    if (pw.length < 8) return setErr(i18n("crm.pw.tooShort"));
    if (pw !== pw2) return setErr(i18n("crm.pw.mismatch"));
    setBusy(true);
    const r = await jsonCall("/api/admin/users", "POST", { action: "resetPassword", userId, password: pw });
    setBusy(false);
    if (!r.ok) return setErr(r.error || i18n("crm.ui.saveFailed"));
    setPw("");
    setPw2("");
    setMsg(i18n("crm.pw.saved"));
  }

  const inputCls =
    "w-full rounded border border-[#111111] bg-white px-2 py-1.5 font-mono text-sm text-[#111111] outline-none focus:ring-1 focus:ring-[#111111]/30";
  return (
    <div className="mt-6 max-w-xl rounded-xl border border-[#e5e5e5] bg-white p-4">
      <h2 className="mb-1 text-sm font-medium text-neutral-700">{i18n("crm.pw.title")}</h2>
      <p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.pw.hint")}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-neutral-500">{i18n("crm.pw.new")}</span>
          <input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-neutral-500">{i18n("crm.pw.repeat")}</span>
          <input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="rounded border border-neutral-300 px-2.5 py-1 text-[11px]"
        >
          {show ? i18n("crm.pw.hide") : i18n("crm.pw.show")}
        </button>
        <button
          type="button"
          onClick={() => {
            const g = randomPassword();
            setPw(g);
            setPw2(g);
            setShow(true);
          }}
          className="rounded border border-[#111111] bg-white px-2.5 py-1 text-[11px] font-semibold"
        >
          {i18n("crm.pw.generate")}
        </button>
        {pw && show && (
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(pw)}
            className="rounded border border-neutral-300 px-2.5 py-1 text-[11px]"
          >
            {i18n("crm.ui.copy")}
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {i18n("crm.pw.save")}
        </button>
        {msg && <span className="text-[11px] text-emerald-600">{msg}</span>}
        {err && <span className="text-[11px] text-red-600">{err}</span>}
      </div>
    </div>
  );
}

function FinancePanel({
  user,
  onChanged,
  readOnly = false,
}: {
  user: Membership;
  onChanged: (account?: Row) => Promise<void> | void;
  readOnly?: boolean;
}) {
  const { i18n, code } = useCrmLabels();
  const cur = user.currency || "USD";
  const money = (n: unknown) => `${fmtCrmMoney(n, 2)} ${cur}`;
  const floating = Number(user.equity) - Number(user.balance);
  const marginLevel = Number(user.margin) > 0 ? (Number(user.equity) / Number(user.margin)) * 100 : 0;

  // Mode A — set exact main balance
  const [setVal, setSetVal] = useState("");
  const [setNote, setSetNote] = useState("");
  // Mode B — add / subtract
  const [dir, setDir] = useState<"add" | "sub">("add");
  const [delta, setDelta] = useState("");
  const [ledgerType, setLedgerType] = useState("ADJUSTMENT");
  const [deltaNote, setDeltaNote] = useState("");
  // Other stored fields
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ credit: "", bonus: "", currency: "USD", leverage: "100", note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function feedback(r: Result & { data?: Row }, ok: string) {
    if (!r.ok) {
      setErr(r.error || i18n("crm.ui.saveFailed"));
      setMsg("");
      return false;
    }
    setErr("");
    setMsg(ok);
    return true;
  }

  async function doSet() {
    const v = Number(setVal.replace(",", "."));
    if (setVal.trim() === "" || !Number.isFinite(v)) return setErr(i18n("crm.fin.invalidAmount"));
    setBusy(true);
    const r = await jsonCall("/api/admin/users", "POST", {
      action: "setBalance",
      userId: user.id,
      amount: v,
      note: setNote.trim() || undefined,
    });
    setBusy(false);
    if (feedback(r, i18n("crm.fin.balanceSet"))) {
      setSetVal("");
      setSetNote("");
      await onChanged(r.data?.account as Row | undefined);
    }
  }

  async function doDelta() {
    const v = Math.abs(Number(delta.replace(",", ".")));
    if (delta.trim() === "" || !Number.isFinite(v) || v === 0) return setErr(i18n("crm.fin.invalidAmount"));
    setBusy(true);
    const r = await jsonCall("/api/admin/users", "POST", {
      action: "adjustBalance",
      userId: user.id,
      amount: dir === "add" ? v : -v,
      ledgerType,
      note: deltaNote.trim() || undefined,
    });
    setBusy(false);
    if (feedback(r, i18n("crm.fin.balanceAdjusted"))) {
      setDelta("");
      setDeltaNote("");
      await onChanged(r.data?.account as Row | undefined);
    }
  }

  async function saveOther() {
    setBusy(true);
    const r = await jsonCall("/api/admin/users", "POST", {
      action: "updateFinance",
      userId: user.id,
      credit: draft.credit,
      bonus: draft.bonus,
      currency: draft.currency,
      leverage: draft.leverage,
      note: draft.note.trim() || undefined,
    });
    setBusy(false);
    if (feedback(r, i18n("crm.ui.financeSaved"))) {
      setEditing(false);
      await onChanged(r.data?.account as Row | undefined);
    }
  }

  const inputCls =
    "rounded border border-[#111111] bg-white px-2 py-1.5 text-sm text-[#111111] tabular-nums outline-none focus:ring-1 focus:ring-[#111111]/30";
  const typeOpts = dir === "add" ? ["ADJUSTMENT", "DEPOSIT"] : ["ADJUSTMENT", "WITHDRAWAL"];

  return (
    <div className="space-y-4 text-xs">
      {readOnly ? (
        <p className="rounded border border-amber-100 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
          {i18n("crm.ui.readOnly")}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={i18n("crm.ui.balance")} value={money(user.balance)} hint={i18n("crm.fin.storedHint")} />
        <Stat
          label={i18n("crm.ui.equity")}
          value={money(user.equity)}
          hint={i18n("crm.fin.equityFormula")}
        />
        <Stat
          label={i18n("crm.fin.floating")}
          value={money(floating)}
          tone={floating >= 0 ? "pos" : "neg"}
          hint={i18n("crm.fin.floatingFormula")}
        />
        <Stat label={i18n("crm.fin.usedMargin")} value={money(user.margin)} hint={i18n("crm.fin.marginFormula")} />
        <Stat
          label={i18n("crm.fin.freeMargin")}
          value={money(user.freeMargin)}
          hint={i18n("crm.fin.freeMarginFormula")}
        />
        <Stat
          label={i18n("crm.fin.marginLevel")}
          value={Number(user.margin) > 0 ? `${fmtCrmMoney(marginLevel, 2)} %` : "—"}
          hint={i18n("crm.fin.marginLevelFormula")}
        />
        <Stat label={i18n("crm.ui.credit")} value={money(user.credit)} hint={i18n("crm.fin.storedHint")} />
        <Stat label={i18n("crm.ui.bonus")} value={money(user.bonus)} hint={i18n("crm.fin.storedHint")} />
      </div>

      {(msg || err) && <p className={`text-[11px] ${err ? "text-red-600" : "text-emerald-600"}`}>{err || msg}</p>}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-4">
          <h3 className="mb-1 text-sm font-semibold">{i18n("crm.fin.setTitle")}</h3>
          <p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.fin.setHint")}</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-neutral-500">
                {i18n("crm.fin.newBalance")} ({cur})
              </span>
              <input
                className={inputCls}
                inputMode="decimal"
                placeholder={String(user.balance)}
                value={setVal}
                onChange={(e) => setSetVal(e.target.value)}
              />
            </label>
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
              <span className="text-neutral-500">{i18n("crm.ui.auditNote")}</span>
              <input className={inputCls} value={setNote} onChange={(e) => setSetNote(e.target.value)} />
            </label>
            <button
              type="button"
              disabled={busy || readOnly}
              onClick={doSet}
              className="rounded bg-black px-3 py-2 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {i18n("crm.fin.setButton")}
            </button>
          </div>
          {setVal.trim() !== "" && Number.isFinite(Number(setVal.replace(",", "."))) && (
            <p className="mt-2 text-[11px] text-neutral-500">
              {i18n("crm.fin.delta")}: {fmtCrmMoney(Number(setVal.replace(",", ".")) - Number(user.balance), 2)} {cur}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-4">
          <h3 className="mb-1 text-sm font-semibold">{i18n("crm.fin.deltaTitle")}</h3>
          <p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.fin.deltaHint")}</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-neutral-500">{i18n("crm.fin.direction")}</span>
              <select
                className={inputCls}
                value={dir}
                onChange={(e) => {
                  const d = e.target.value as "add" | "sub";
                  setDir(d);
                  setLedgerType("ADJUSTMENT");
                }}
              >
                <option value="add">{i18n("crm.fin.add")} (+)</option>
                <option value="sub">{i18n("crm.fin.subtract")} (−)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-neutral-500">
                {i18n("crm.ui.amount")} ({cur})
              </span>
              <input className={inputCls} inputMode="decimal" value={delta} onChange={(e) => setDelta(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-neutral-500">{i18n("crm.ui.type")}</span>
              <select className={inputCls} value={ledgerType} onChange={(e) => setLedgerType(e.target.value)}>
                {typeOpts.map((t) => (
                  <option key={t} value={t}>
                    {code("crm.ledger", t)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
              <span className="text-neutral-500">{i18n("crm.ui.auditNote")}</span>
              <input className={inputCls} value={deltaNote} onChange={(e) => setDeltaNote(e.target.value)} />
            </label>
            <button
              type="button"
              disabled={busy || readOnly}
              onClick={doDelta}
              className="rounded bg-black px-3 py-2 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {i18n("crm.fin.applyButton")}
            </button>
          </div>
          {delta.trim() !== "" && Number.isFinite(Number(delta.replace(",", "."))) && (
            <p className="mt-2 text-[11px] text-neutral-500">
              {i18n("crm.fin.resulting")}:{" "}
              {fmtCrmMoney(
                Number(user.balance) + (dir === "add" ? 1 : -1) * Math.abs(Number(delta.replace(",", "."))),
                2
              )}{" "}
              {cur}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-sm font-semibold">{i18n("crm.fin.otherTitle")}</h3>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setDraft({
                  credit: String(user.credit ?? 0),
                  bonus: String(user.bonus ?? 0),
                  currency: String(user.currency || "USD"),
                  leverage: String(user.leverage ?? 100),
                  note: "",
                });
                setEditing(true);
                setMsg("");
                setErr("");
              }}
              className="rounded border border-[#111111] bg-white px-2 py-1 text-[10px] font-semibold hover:bg-neutral-50"
            >
              {i18n("crm.ui.edit")}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Field
            label={i18n("crm.ui.credit")}
            value={editing ? draft.credit : fmtCrmMoney(user.credit, 2)}
            onChange={(v) => setDraft({ ...draft, credit: v })}
            disabled={!editing}
          />
          <Field
            label={i18n("crm.ui.bonus")}
            value={editing ? draft.bonus : fmtCrmMoney(user.bonus, 2)}
            onChange={(v) => setDraft({ ...draft, bonus: v })}
            disabled={!editing}
          />
          <Field
            label={i18n("crm.ui.currency")}
            value={editing ? draft.currency : user.currency}
            onChange={(v) => setDraft({ ...draft, currency: v })}
            options={ACCOUNT_CURRENCIES}
            allowEmpty={false}
            disabled={!editing}
            hint={i18n("crm.ui.currencyHint")}
          />
          <Field
            label={i18n("crm.edit.leverage")}
            value={editing ? draft.leverage : `1:${user.leverage}`}
            onChange={(v) => setDraft({ ...draft, leverage: v })}
            disabled={!editing}
          />
          <Field
            label={i18n("crm.ui.auditNote")}
            value={draft.note}
            onChange={(v) => setDraft({ ...draft, note: v })}
            disabled={!editing}
          />
        </div>
        {editing && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy || readOnly}
              onClick={saveOther}
              className="rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {i18n("crm.ui.save")}
            </button>
            <button
              type="button"
              disabled={busy || readOnly}
              onClick={() => setEditing(false)}
              className="rounded border border-neutral-300 px-3 py-1.5 text-[11px]"
            >
              {i18n("crm.ui.cancel")}
            </button>
          </div>
        )}
        <p className="mt-2 text-[10px] text-neutral-400">{i18n("crm.fin.computedNote")}</p>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { i18n, code, deskName, locale } = useCrmLabels();
  const params = useParams();
  const id = String(params?.id || "");
  const [desks, setDesks] = useState<{ id: string; name: string; code: string | null }[]>([]);
  const [tab, setTab] = useState<Tab>("profil");
  const [user, setUser] = useState<Membership | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [crmReadOnly, setCrmReadOnly] = useState(false);
  const [isMainAdminTarget, setIsMainAdminTarget] = useState(false);

  useEffect(() => {
    // Read-only admins may view Hesap İzinleri; only kick if no view access at all.
    if (tab === "izinler" && !canManageUsers && !crmReadOnly) setTab("profil");
  }, [tab, canManageUsers, crmReadOnly]);
  const [notes, setNotes] = useState<Row[]>([]);
  const [positions, setPositions] = useState<Row[]>([]);
  const [orders, setOrders] = useState<Row[]>([]);
  const [deposits, setDeposits] = useState<Row[]>([]);
  const [withdrawals, setWithdrawals] = useState<Row[]>([]);
  const [balanceRequests, setBalanceRequests] = useState<Row[]>([]);
  const [ledger, setLedger] = useState<Row[]>([]);
  const [communications, setCommunications] = useState<Row[]>([]);
  const [activityEvents, setActivityEvents] = useState<
    { id: string; kind: string; path?: string | null; userAgent?: string | null; meta?: string | null; createdAt: string }[]
  >([]);
  const [documents, setDocuments] = useState<Row[]>([]);
  const [reminders, setReminders] = useState<Row[]>([]);
  const [depositMethods, setDepositMethods] = useState<{ id: string; label: string; type: string; active: boolean }[]>(
    []
  );
  const [tradingAccountId, setTradingAccountId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/desks")
      .then((r) => r.json())
      .then((d) => setDesks(d.desks || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    const [res, meRes] = await Promise.all([
      fetch(`/api/admin/users/${id}`),
      fetch("/api/auth/me", { credentials: "include" }),
    ]);
    if (meRes.ok) {
      const me = await meRes.json().catch(() => ({}));
      setCanManageUsers(Boolean(me.permissions?.canManageUsers));
      setCrmReadOnly(Boolean(me.permissions?.crmReadOnly));
    } else {
      setCanManageUsers(false);
    }
    if (!res.ok) return;
    const data = await res.json();
    setUser(data.user as Membership);
    // Recently viewed customers (per browser; name + login id only).
    if (data.user?.id && (data.user.role || "TRADER") === "TRADER") {
      try {
        pushRecentClient({ id: data.user.id, name: data.user.name, accountLoginId: data.user.accountLoginId });
      } catch {
        /* ignore */
      }
    }
    setIsMainAdminTarget(false);
    // Detect main admin via permissions endpoint (does not expose ADMIN_EMAIL to client)
    try {
      const pr = await fetch(`/api/admin/users/${id}/permissions`);
      if (pr.ok) {
        const pd = await pr.json();
        setIsMainAdminTarget(Boolean(pd.isMainAdmin));
      }
    } catch {
      /* ignore */
    }
    setNotes(data.notes || []);
    setPositions(data.positions || []);
    setOrders(data.orders || []);
    setDeposits(data.deposits || []);
    setWithdrawals(data.withdrawals || []);
    setBalanceRequests(data.balanceRequests || []);
    setLedger(data.ledger || []);
    setCommunications(data.communications || []);
    setActivityEvents(data.activityEvents || []);
    setDocuments(data.documents || []);
    setReminders(data.reminders || []);
    setDepositMethods(data.depositMethods || []);
    setTradingAccountId(data.tradingAccountId || data.user?.tradingAccountId || null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh while viewing trading tabs so CRM mirrors terminal open/close.
  // Edit drafts live in their own component state, so polling never overwrites typed values.
  useEffect(() => {
    if (!id) return;
    if (tab !== "pozisyonlar" && tab !== "finans") return;
    const timer = window.setInterval(() => {
      load();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [id, tab, load]);

  function startProfileEdit() {
    if (!user) return;
    const f: Record<string, string | boolean> = {};
    for (const k of PROFILE_KEYS) {
      const v = user[k];
      if (BOOL_KEYS.includes(k)) f[k] = Boolean(v);
      else if (v == null) f[k] = "";
      else if (k === "birthDate") f[k] = new Date(String(v)).toISOString().slice(0, 10);
      else if (k === "registrationDate") f[k] = toDatetimeLocalValue(v);
      else f[k] = String(v);
    }
    setForm(f);
    if (canWrite) setEditingProfile(true);
    setMsg("");
    setErr("");
  }

  function setF(key: string, v: string) {
    if (BOOL_KEYS.includes(key)) {
      setForm((prev) => ({ ...prev, [key]: v === "true" }));
    } else {
      setForm((prev) => ({ ...prev, [key]: v }));
    }
  }

  async function saveProfile() {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const payload: Record<string, unknown> = { ...form };
      // Display name: only send when changed (otherwise server composes it from first/last name)
      if (!String(form.name || "").trim() || form.name === user?.name) delete payload.name;
      payload.registrationDate = form.registrationDate
        ? fromDatetimeLocalValue(String(form.registrationDate))
        : null;
      const r = await jsonCall(`/api/admin/users/${id}`, "PATCH", payload);
      if (!r.ok) {
        setErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(i18n("crm.ui.profileSaved"));
      setEditingProfile(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  /** CRUD helpers for /api/admin/users/[id]/records */
  const rec = useCallback(
    (entity: string) => ({
      create: async (values: Row, applyToBalance: boolean): Promise<Result> => {
        const r = await jsonCall(`/api/admin/users/${id}/records`, "POST", { entity, ...values, applyToBalance });
        if (r.ok) await load();
        return r;
      },
      update: async (rid: string, values: Row, applyToBalance: boolean): Promise<Result> => {
        const r = await jsonCall(`/api/admin/users/${id}/records`, "PATCH", {
          entity,
          id: rid,
          ...values,
          applyToBalance,
        });
        if (r.ok) await load();
        return r;
      },
      remove: async (rid: string, applyToBalance: boolean): Promise<Result> => {
        const r = await jsonCall(`/api/admin/users/${id}/records`, "DELETE", { entity, id: rid, applyToBalance });
        if (r.ok) await load();
        return r;
      },
    }),
    [id, load]
  );

  const statusOpts = REQ_STATUSES.map((s) => ({ value: s, label: code("crm.status", s) }));
  const currencyOpts = ACCOUNT_CURRENCIES.map((c) => ({ value: c, label: c }));
  const statusBadge = (r: Row) => {
    const s = String(r.status || "");
    const tone =
      s === "APPROVED" ? "bg-emerald-50 text-emerald-700" : s === "REJECTED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700";
    return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}>{code("crm.status", s)}</span>;
  };

  const ticketCommon: CrmColumn[] = [
    { key: "adminNote", label: "crm.edit.adminNote", type: "textarea" },
    { key: "approvalReason", label: "crm.edit.approvalReason", type: "textarea" },
    { key: "eventScenario", label: "crm.edit.eventScenario", type: "textarea", hideInTable: false },
    { key: "createdAt", label: "crm.ui.date", type: "datetime" },
    { key: "reviewedAt", label: "crm.edit.reviewedAt", type: "datetime", hideOnCreate: true },
  ];

  const depositCols: CrmColumn[] = [
    { key: "amount", label: "crm.ui.amount", type: "money", required: true },
    { key: "currency", label: "crm.ui.currency", type: "select", options: currencyOpts, required: true },
    {
      key: "methodId",
      label: "crm.ui.method",
      type: "select",
      required: true,
      options: depositMethods.map((m) => ({ value: m.id, label: `${m.label} (${m.type})${m.active ? "" : " ✕"}` })),
    },
    { key: "status", label: "crm.ui.status", type: "select", options: statusOpts, required: true, render: statusBadge },
    { key: "note", label: "crm.edit.clientNote", type: "textarea" },
    ...ticketCommon,
  ];
  const withdrawalCols: CrmColumn[] = [
    { key: "amount", label: "crm.ui.amount", type: "money", required: true },
    { key: "currency", label: "crm.ui.currency", type: "select", options: currencyOpts, required: true },
    {
      key: "method",
      label: "crm.ui.method",
      type: "select",
      required: true,
      options: ["BANK", "CRYPTO"].map((m) => ({ value: m, label: code("crm.edit.wmethod", m) })),
    },
    { key: "details", label: "crm.edit.details", type: "textarea" },
    { key: "status", label: "crm.ui.status", type: "select", options: statusOpts, required: true, render: statusBadge },
    { key: "note", label: "crm.edit.clientNote", type: "textarea" },
    ...ticketCommon,
  ];
  const balanceReqCols: CrmColumn[] = [
    {
      key: "type",
      label: "crm.ui.type",
      type: "select",
      required: true,
      options: ["ADD", "RESET"].map((t) => ({ value: t, label: code("crm.kind", t) })),
    },
    { key: "amount", label: "crm.ui.amount", type: "money" },
    { key: "status", label: "crm.ui.status", type: "select", options: statusOpts, required: true, render: statusBadge },
    { key: "reason", label: "crm.edit.reason" },
    { key: "equityAt", label: "crm.edit.equityAt", type: "money" },
    { key: "marginLvl", label: "crm.edit.marginLvl", type: "number" },
    {
      key: "riskAcknowledgedAt",
      label: "crm.bal.riskAck",
      type: "readonly",
      editable: false,
      hideOnCreate: true,
      render: (r) =>
        r.riskAcknowledged ? (
          <span className="text-emerald-700" title={i18n("crm.bal.riskAckText")}>
            ✓ {r.riskAcknowledgedAt ? fmtCrmDate(String(r.riskAcknowledgedAt)) : ""}
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    ...ticketCommon,
  ];
  const ledgerTypeOpts = LEDGER_TYPES.map((t) => ({ value: t, label: code("crm.ledger", t) }));
  const ledgerCols: CrmColumn[] = [
    { key: "type", label: "crm.ui.type", type: "select", options: ledgerTypeOpts, required: true },
    {
      key: "sourceUserId",
      label: "crm.edit.sourceAccount",
      required: true,
      hideInTable: true,
      createOnly: true,
      showIf: (d) => d.type === "TRANSFER",
      editor: (v, onChange) => <SourceAccountPicker value={v} onChange={onChange} excludeId={id} />,
    },
    { key: "amount", label: "crm.ui.amount", type: "money", required: true },
    { key: "balanceBefore", label: "crm.edit.balanceBefore", type: "money" },
    { key: "balanceAfter", label: "crm.edit.balanceAfter", type: "money" },
    { key: "currency", label: "crm.ui.currency", type: "select", options: currencyOpts, hideOnCreate: true },
    { key: "comment", label: "crm.ui.comment", type: "textarea" },
    { key: "createdByName", label: "crm.ui.createdBy", hideOnCreate: true },
    {
      key: "refType",
      label: "crm.edit.ref",
      editable: false,
      render: (r) => (r.refType ? `${r.refType}${r.refId ? ` · ${String(r.refId).slice(-6)}` : ""}` : "—"),
    },
    { key: "createdAt", label: "crm.ui.date", type: "datetime" },
  ];
  const bonusRows = ledger.filter((l) => l.type === "BONUS" || l.type === "CREDIT");
  const bonusCols: CrmColumn[] = [
    {
      key: "type",
      label: "crm.ui.type",
      type: "select",
      required: true,
      options: ["BONUS", "CREDIT"].map((t) => ({ value: t, label: code("crm.ledger", t) })),
    },
    { key: "amount", label: "crm.ui.amount", type: "money", required: true },
    { key: "comment", label: "crm.ui.comment", type: "textarea" },
    { key: "createdByName", label: "crm.ui.createdBy", hideOnCreate: true },
    { key: "createdAt", label: "crm.ui.date", type: "datetime" },
  ];
  const commCols: CrmColumn[] = [
    {
      key: "type",
      label: "crm.ui.type",
      type: "select",
      required: true,
      options: ["CALL", "CHAT", "NOTE", "EMAIL", "SMS", "MEETING"].map((t) => ({ value: t, label: code("crm.comm", t) })),
    },
    { key: "title", label: "crm.ui.title" },
    { key: "description", label: "crm.ui.description", type: "textarea", required: true },
    { key: "workerName", label: "crm.ui.worker" },
    { key: "createdAt", label: "crm.ui.date", type: "datetime" },
  ];
  const docCols: CrmColumn[] = [
    { key: "name", label: "crm.ui.name", required: true },
    {
      key: "docType",
      label: "crm.ui.type",
      type: "select",
      required: true,
      options: ["ID", "ADDRESS", "SELFIE", "OTHER"].map((t) => ({ value: t, label: code("crm.doc", t) })),
    },
    { key: "status", label: "crm.ui.status", type: "select", options: statusOpts, required: true, render: statusBadge },
    { key: "note", label: "crm.ui.note", type: "textarea" },
    { key: "createdAt", label: "crm.ui.date", type: "datetime" },
    { key: "reviewedAt", label: "crm.edit.reviewedAt", type: "datetime", hideOnCreate: true },
    {
      key: "quick",
      label: "crm.edit.quickReview",
      editable: false,
      render: (r) => (
        <div className="flex gap-1">
          {r.status !== "APPROVED" && (
            <button
              type="button"
              onClick={() => rec("document").update(String(r.id), { status: "APPROVED" }, false)}
              className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-500"
            >
              {i18n("crm.ui.approve")}
            </button>
          )}
          {r.status !== "REJECTED" && (
            <button
              type="button"
              onClick={() => rec("document").update(String(r.id), { status: "REJECTED" }, false)}
              className="rounded border border-red-300 px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-50"
            >
              {i18n("crm.ui.reject")}
            </button>
          )}
        </div>
      ),
    },
  ];
  const reminderCols: CrmColumn[] = [
    { key: "body", label: "crm.ui.body", type: "textarea", required: true },
    { key: "remindAt", label: "crm.ui.date", type: "datetime", required: true },
    { key: "workerName", label: "crm.ui.worker" },
    { key: "color", label: "crm.ui.color", type: "color" },
  ];
  const noteCols: CrmColumn[] = [
    { key: "body", label: "crm.ui.body", type: "textarea", required: true },
    { key: "authorName", label: "crm.edit.author", hideOnCreate: true },
    { key: "createdAt", label: "crm.ui.date", type: "datetime", hideOnCreate: true },
  ];
  const sideOpts = ["BUY", "SELL"].map((v) => ({ value: v, label: code("crm.kind", v) }));
  const newPositionCols: CrmColumn[] = [
    { key: "symbol", label: "crm.ui.symbol", type: "select", required: true, options: SYMBOLS.map((s) => ({ value: s.symbol, label: s.symbol })) },
    { key: "side", label: "crm.ui.side", type: "select", options: sideOpts, required: true },
    { key: "volume", label: "crm.ui.volume", type: "number", required: true },
    { key: "openPrice", label: "crm.ui.open", type: "number", required: true },
    {
      key: "status",
      label: "crm.ui.status",
      type: "select",
      required: true,
      options: ["OPEN", "CLOSED"].map((v) => ({ value: v, label: code("crm.status", v) })),
    },
    { key: "currentPrice", label: "crm.ui.current", type: "number" },
    { key: "closePrice", label: "crm.ui.closePrice", type: "number" },
    { key: "profit", label: "crm.edit.profitAuto", type: "number" },
    { key: "stopLoss", label: "crm.edit.stopLoss", type: "number" },
    { key: "takeProfit", label: "crm.edit.takeProfit", type: "number" },
    { key: "openedAt", label: "crm.ui.opened", type: "datetime" },
    { key: "closedAt", label: "crm.ui.closedAt", type: "datetime" },
  ];

  async function createPosition(values: Row, applyToBalance: boolean): Promise<Result> {
    const r = await jsonCall("/api/admin/positions", "POST", {
      entity: "position",
      userId: id,
      ...values,
      applyToBalance,
    });
    if (r.ok) await load();
    return r;
  }

  if (!user) {
    return <div className="text-sm text-neutral-500">{i18n("crm.ui.loading")}</div>;
  }

  const canWrite = !crmReadOnly;
  const ed = editingProfile && canWrite;
  const fv = (k: string) => (ed ? form[k] : user[k]) as string | boolean | null | undefined;
  const dateView = (k: string) => (ed ? (form[k] as string) : fmtCrmDate(user[k]));

  return (
    <div className="text-[#111111]">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/izcrm/traders" className="text-xs text-neutral-500 hover:text-[#111111]">
          {i18n("crm.ui.backToTraders")}
        </Link>
        <h1 className="text-xl font-semibold">{user.name}</h1>
        <span className="text-xs text-neutral-500">{user.email}</span>
        {user.accountLoginId && (
          <span className="rounded bg-sky-50 px-2 py-0.5 font-mono text-[10px] text-sky-700">
            {i18n("crm.ui.accountId")}: {user.accountLoginId}
            <CopyButton value={user.accountLoginId} title="Hesap ID kopyala" className="ml-1" />
          </span>
        )}
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            user.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {user.active ? i18n("crm.ui.active") : i18n("crm.ui.frozen")}
        </span>
        {user.tradingEnabled === false && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            {i18n("crm.perms.badgeTradeOff")}
          </span>
        )}
        {user.withdrawalsEnabled === false && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            {i18n("crm.perms.badgeWithdrawOff")}
          </span>
        )}
        {user.loginEnabled === false && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            {i18n("crm.perms.badgeLoginOff")}
          </span>
        )}
        <TraderPresenceHeader userId={user.id} />
        {tradingAccountId && (
          <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-600">
            {i18n("crm.ui.account")}: {tradingAccountId}
          </span>
        )}
        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] tabular-nums text-neutral-700">
          {i18n("crm.ui.balance")}: {fmtCrmMoney(user.balance, 2)} {user.currency}
        </span>
        <TraderAccessTools readOnly={crmReadOnly} userId={user.id} traderName={user.name} isStaff={user.role === "ADMIN"} />
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-[#e5e5e5] pb-2">
        {TABS.filter((t) => !t.requiresManageUsers || canManageUsers || crmReadOnly).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              tab === t.id ? "bg-black text-white" : "text-neutral-500 hover:bg-[#e5e5e5]"
            }`}
          >
            {i18n(t.labelKey)}
          </button>
        ))}
      </div>

      {activityEvents.filter((e) => e.kind === "SCREENSHOT_SUSPECTED").length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <div className="font-semibold">Olası ekran görüntüsü / yakalama uyarıları (en iyi çaba)</div>
          <p className="mt-0.5 text-[11px] text-amber-800/80">
            Tarayıcılar işletim sistemi ekran görüntüsünü güvenilir şekilde tespit edemez; bunlar istemci tarafı sinyalleridir.
          </p>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
            {activityEvents
              .filter((e) => e.kind === "SCREENSHOT_SUSPECTED")
              .slice(0, 15)
              .map((e) => {
                let reason = "";
                try {
                  reason = e.meta ? (JSON.parse(e.meta).reason as string) || "" : "";
                } catch {
                  /* ignore */
                }
                return (
                  <li key={e.id} className="font-mono text-[10px] text-amber-950">
                    {new Date(e.createdAt).toLocaleString()} · {e.path || "—"} · {reason || e.kind}
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {(msg || err) && <p className={`mb-3 text-xs ${err ? "text-red-600" : "text-emerald-600"}`}>{err || msg}</p>}

      {tab === "profil" && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            {!ed ? (
              <button
                type="button"
                onClick={startProfileEdit}
                className="rounded border border-[#111111] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
              >
                {i18n("crm.ui.edit")}
              </button>
            ) : (
              <>
                <button
                  disabled={busy}
                  onClick={saveProfile}
                  className="rounded bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {i18n("crm.ui.save")}
                </button>
                <button
                  disabled={busy}
                  onClick={() => setEditingProfile(false)}
                  className="rounded border border-neutral-300 px-4 py-1.5 text-xs"
                >
                  {i18n("crm.ui.cancel")}
                </button>
              </>
            )}
          </div>

          <h2 className="mb-2 text-sm font-medium text-neutral-600">{i18n("crm.ui.idSection")}</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={i18n("crm.ui.firstName")} value={fv("firstName") as string} onChange={(v) => setF("firstName", v)} disabled={!ed} />
            <Field label={i18n("crm.ui.lastName")} value={fv("lastName") as string} onChange={(v) => setF("lastName", v)} disabled={!ed} />
            <Field label={i18n("crm.edit.displayName")} value={fv("name") as string} onChange={(v) => setF("name", v)} disabled={!ed} />
            <Field label={i18n("crm.ui.email")} value={fv("email") as string} onChange={(v) => setF("email", v)} disabled={!ed} type="email" hint={ed ? i18n("crm.edit.uniqueHint") : undefined} />
            <Field
              label={i18n("crm.ui.accountId")}
              value={(fv("accountLoginId") as string) || ""}
              onChange={(v) => setF("accountLoginId", v.replace(/\D/g, "").slice(0, 16))}
              disabled={!ed}
              hint={ed ? i18n("crm.edit.accountIdHint") : undefined}
            />
            <Field label={i18n("crm.ui.phone")} value={fv("phone") as string} onChange={(v) => setF("phone", v)} disabled={!ed} />
            <Field label={jobTitleUi(locale).field} value={(fv("jobTitle") as string) || ""} onChange={(v) => setF("jobTitle", v)} options={JOB_TITLE_KEYS} optionLabel={(v) => jobTitleLabel(v, locale)} disabled={!ed} />
            <Field
              label={i18n("crm.ui.dob")}
              value={ed ? (form.birthDate as string) : user.birthDate ? new Date(String(user.birthDate)).toLocaleDateString("en-GB") : ""}
              onChange={(v) => setF("birthDate", v)}
              type={ed ? "date" : "text"}
              disabled={!ed}
            />
            <Field label={i18n("crm.ui.language")} value={fv("language") as string} onChange={(v) => setF("language", v)} options={LOCALES} allowEmpty={false} disabled={!ed} />
            <Field label={i18n("crm.ui.timezone")} value={fv("timezone") as string} onChange={(v) => setF("timezone", v)} disabled={!ed} />
            <Field label={i18n("crm.ui.country")} value={fv("country") as string} onChange={(v) => setF("country", v)} disabled={!ed} />
            <Field label={i18n("crm.ui.address")} value={fv("address") as string} onChange={(v) => setF("address", v)} disabled={!ed} />
          </div>

          <h2 className="mb-2 text-sm font-medium text-neutral-600">{i18n("crm.ui.account")}</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label={i18n("crm.ui.accountType")}
              value={fv("accountType") as string}
              onChange={(v) => setF("accountType", v)}
              options={ACCOUNT_TYPES}
              optionLabel={(o) => code("crm.accountType", o)}
              disabled={!ed}
            />
            <Field
              label={i18n("crm.ui.regDate")}
              value={dateView("registrationDate")}
              onChange={(v) => setF("registrationDate", v)}
              type={ed ? "datetime-local" : "text"}
              disabled={!ed}
            />
            <Field label={i18n("crm.edit.createdAt")} value={fmtCrmDate(user.createdAt)} onChange={() => {}} disabled hint={i18n("crm.edit.systemField")} />
            <Field label={i18n("crm.ui.lastLogin")} value={fmtCrmDate(user.lastLoginAt)} onChange={() => {}} disabled hint={i18n("crm.edit.systemField")} />
            <Field label={i18n("crm.ui.regCountry")} value={fv("registrationCountry") as string} onChange={(v) => setF("registrationCountry", v)} disabled={!ed} />
            <Field
              label={i18n("crm.ui.currency")}
              value={fv("currency") as string}
              onChange={(v) => setF("currency", v)}
              options={ACCOUNT_CURRENCIES}
              allowEmpty={false}
              disabled={!ed}
              hint={ed ? i18n("crm.ui.currencyHint") : undefined}
            />
            <Field
              label={i18n("crm.edit.leverage")}
              value={ed ? (form.leverage as string) : `1:${user.leverage}`}
              onChange={(v) => setF("leverage", v.replace(/[^\d]/g, ""))}
              disabled={!ed}
            />
            <Field
              label={i18n("crm.ui.role")}
              value={fv("role") as string}
              onChange={(v) => setF("role", v)}
              options={["TRADER", "ADMIN"]}
              optionLabel={(o) => code("crm.role", o)}
              allowEmpty={false}
              disabled={!ed}
            />
            <Field
              label={i18n("crm.ui.documents")}
              value={fv("documentsStatus") as string}
              onChange={(v) => setF("documentsStatus", v)}
              options={DOC_STATUSES}
              optionLabel={(o) => code("crm.status", o)}
              disabled={!ed}
            />
            <Field label={i18n("crm.ui.resident")} value={fv("isResident") as boolean} onChange={(v) => setF("isResident", v)} type="checkbox" disabled={!ed} />
            <Field label={i18n("crm.ui.active")} value={fv("active") as boolean} onChange={(v) => setF("active", v)} type="checkbox" disabled={!ed} />
          </div>

          <h2 className="mb-2 text-sm font-medium text-neutral-600">{i18n("crm.ui.tradingCrm")}</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={i18n("crm.ui.tradingServer")} value={fv("tradingServer") as string} onChange={(v) => setF("tradingServer", v)} disabled={!ed} />
            <Field label={i18n("crm.ui.tradingGroup")} value={fv("tradingGroup") as string} onChange={(v) => setF("tradingGroup", v)} disabled={!ed} />
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-neutral-500">{i18n("crm.ui.desk")}</span>
              <select
                disabled={!ed}
                value={
                  desks.find((d) => d.id === fv("deskId") || d.code === fv("deskId") || d.name === fv("desk"))?.id ||
                  String(fv("deskId") || "")
                }
                onChange={(e) => {
                  const picked = desks.find((d) => d.id === e.target.value);
                  setForm((prev) => ({
                    ...prev,
                    desk: picked ? picked.name : "",
                    deskId: picked ? picked.id : "",
                  }));
                }}
                className={`rounded border bg-white px-2 py-1.5 text-sm text-[#111111] ${ed ? "border-[#111111]" : "border-[#e5e5e5]"}`}
              >
                <option value="">{(!ed && (user.desk as string)) || "—"}</option>
                {desks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {deskName(d)}
                  </option>
                ))}
              </select>
            </label>
            <Field label={i18n("crm.ui.campaign")} value={fv("campaign") as string} onChange={(v) => setF("campaign", v)} disabled={!ed} />
            <Field label="A_AID" value={fv("affiliateA") as string} onChange={(v) => setF("affiliateA", v)} disabled={!ed} />
            <Field label="B_BID" value={fv("affiliateB") as string} onChange={(v) => setF("affiliateB", v)} disabled={!ed} />
            <Field label="C_CID" value={fv("affiliateC") as string} onChange={(v) => setF("affiliateC", v)} disabled={!ed} />
            <Field label={i18n("crm.edit.referralCode")} value={fv("referralCodeUsed") as string} onChange={(v) => setF("referralCodeUsed", v)} disabled={!ed} />
            <Field
              label={i18n("crm.ui.retention")}
              value={fv("retentionStatus") as string}
              onChange={(v) => setF("retentionStatus", v)}
              options={RETENTION_STATUSES}
              optionLabel={(o) => code("crm.retention", o)}
              disabled={!ed}
            />
            <Field
              label={i18n("crm.ui.saleStatus")}
              value={fv("saleStatus") as string}
              onChange={(v) => setF("saleStatus", v)}
              options={SALE_STATUSES}
              optionLabel={(o) => code("crm.sale", o)}
              disabled={!ed}
            />
            <Field
              label={i18n("crm.ui.potential")}
              value={fv("potentialStatus") as string}
              onChange={(v) => setF("potentialStatus", v)}
              options={POTENTIAL_STATUSES}
              optionLabel={(o) => code("crm.potential", o)}
              disabled={!ed}
            />
            <Field
              label={i18n("crm.ui.verification")}
              value={fv("validationStatus") as string}
              onChange={(v) => setF("validationStatus", v)}
              options={VALIDATION_STATUSES}
              optionLabel={(o) => code("crm.validation", o)}
              disabled={!ed}
            />
            <Field label="FTD" value={fv("ftd") as boolean} onChange={(v) => setF("ftd", v)} type="checkbox" disabled={!ed} />
            <Field label={i18n("crm.ui.broker")} value={fv("brokerName") as string} onChange={(v) => setF("brokerName", v)} disabled={!ed} />
            <Field label={i18n("crm.ui.assignee")} value={fv("assigneeName") as string} onChange={(v) => setF("assigneeName", v)} disabled={!ed} />
          </div>
          {canManageUsers ? <AssigneePicker userId={user.id} current={(user as { assigneeId?: string | null }).assigneeId ?? null} /> : null}
          <RetentionPanel userId={user.id} />

          <LoginHistory userId={user.id} />

          {canWrite ? (<PasswordPanel userId={user.id} />) : null}
        </div>
      )}

      {tab === "finans" && (
        <FinancePanel
          user={user}
          readOnly={crmReadOnly}
          onChanged={async (account) => {
            if (account) setUser((u) => (u ? ({ ...u, ...account } as Membership) : u));
            await load();
          }}
        />
      )}

      {tab === "iletisim" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">{i18n("crm.ui.commsHint")}</p>
          <CrmRecordTable
            readOnly={crmReadOnly}
            rows={communications}
            columns={commCols}
            createInitial={{ type: "CALL" }}
            onCreate={rec("communication").create}
            onUpdate={rec("communication").update}
            onDelete={rec("communication").remove}
            emptyText={i18n("crm.ui.noComms")}
          />
        </div>
      )}

      {tab === "biletler" && (
        <div className="space-y-6">
          <p className="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
            {i18n("crm.edit.balanceRule")}
          </p>
          <div>
            <h2 className="mb-2 text-sm font-medium">{i18n("crm.ui.depositRequests")}</h2>
            <CrmRecordTable
            readOnly={crmReadOnly}
              rows={deposits}
              columns={depositCols}
              balanceAware
              createInitial={{
                currency: user.currency || "USD",
                status: "PENDING",
                methodId: depositMethods[0]?.id || "",
              }}
              onCreate={rec("deposit").create}
              onUpdate={rec("deposit").update}
              onDelete={rec("deposit").remove}
            />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">{i18n("crm.edit.withdrawals")}</h2>
            <CrmRecordTable
            readOnly={crmReadOnly}
              rows={withdrawals}
              columns={withdrawalCols}
              balanceAware
              createInitial={{ currency: user.currency || "USD", status: "PENDING", method: "BANK" }}
              onCreate={rec("withdrawal").create}
              onUpdate={rec("withdrawal").update}
              onDelete={rec("withdrawal").remove}
            />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">{i18n("crm.ui.marginRequests")}</h2>
            <CrmRecordTable
            readOnly={crmReadOnly}
              rows={balanceRequests}
              columns={balanceReqCols}
              balanceAware
              createInitial={{ type: "ADD", status: "PENDING", reason: "MARGIN_CALL" }}
              onCreate={rec("balanceRequest").create}
              onUpdate={rec("balanceRequest").update}
              onDelete={rec("balanceRequest").remove}
            />
            <p className="mt-1 text-[10px] text-neutral-400">{i18n("crm.edit.resetNote")}</p>
          </div>
        </div>
      )}

      {tab === "pozisyonlar" && (
        <div className="space-y-4">
          <p className="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
            {i18n("crm.edit.positionRule")}
          </p>
          <div>
            <h2 className="mb-2 text-sm font-medium">{i18n("crm.ui.positionsFull")}</h2>
            <p className="mb-2 text-[11px] text-neutral-500">{i18n("crm.ui.positionsHint")}</p>
            {canWrite ? (
            <div className="mb-2">
              <CrmAddForm
                columns={newPositionCols}
                initial={{ side: "BUY", status: "OPEN", symbol: SYMBOLS[0]?.symbol || "" }}
                balanceAware
                onCreate={createPosition}
                title={i18n("crm.edit.addPosition")}
              />
            </div>
            ) : null}
            <EditablePositionsTable rows={positions} onSaved={() => load()} manage={canWrite} />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">{i18n("crm.ui.ordersFull")}</h2>
            <EditableOrdersTable rows={orders} onSaved={() => load()} userId={user.id} readOnly={crmReadOnly} />
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div>
          <p className="mb-2 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
            {i18n("crm.edit.ledgerRule")}
          </p>
          <div className="mb-3 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={i18n("crm.ui.balance")} value={`${fmtCrmMoney(user.balance, 2)} ${user.currency}`} />
            <Stat label={i18n("crm.ui.equity")} value={`${fmtCrmMoney(user.equity, 2)} ${user.currency}`} />
            <Stat label={i18n("crm.ui.credit")} value={`${fmtCrmMoney(user.credit, 2)} ${user.currency}`} />
            <Stat label={i18n("crm.ui.bonus")} value={`${fmtCrmMoney(user.bonus, 2)} ${user.currency}`} />
          </div>
          <p className="mb-2 text-[11px] text-neutral-500">
            {i18n("crm.edit.ledgerFinanceLink")}{" "}
            <button type="button" className="underline" onClick={() => setTab("finans")}>
              {i18n("crm.nav.finance")}
            </button>
          </p>
          <CrmRecordTable
            readOnly={crmReadOnly}
            rows={ledger}
            columns={ledgerCols}
            balanceAware
            createInitial={{ type: "ADJUSTMENT" }}
            onCreate={rec("ledger").create}
            onUpdate={rec("ledger").update}
            onDelete={rec("ledger").remove}
          />
        </div>
      )}

      {tab === "bonus" && (
        <div>
          <div className="mb-3 grid max-w-md grid-cols-2 gap-2">
            <Stat label={i18n("crm.ui.bonus")} value={`${fmtCrmMoney(user.bonus, 2)} ${user.currency}`} />
            <Stat label={i18n("crm.ui.credit")} value={`${fmtCrmMoney(user.credit, 2)} ${user.currency}`} />
          </div>
          <p className="mb-2 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
            {i18n("crm.edit.bonusRule")}
          </p>
          <CrmRecordTable
            readOnly={crmReadOnly}
            rows={bonusRows}
            columns={bonusCols}
            balanceAware
            createInitial={{ type: "BONUS" }}
            onCreate={rec("ledger").create}
            onUpdate={rec("ledger").update}
            onDelete={rec("ledger").remove}
          />
        </div>
      )}

      {tab === "belgeler" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">
            {i18n("crm.ui.docStatus")}: {code("crm.status", String(user.documentsStatus || "NONE"))}
          </p>
          <CrmRecordTable
            readOnly={crmReadOnly}
            rows={documents}
            columns={docCols}
            createInitial={{ docType: "ID", status: "PENDING" }}
            onCreate={rec("document").create}
            onUpdate={rec("document").update}
            onDelete={rec("document").remove}
            emptyText={i18n("crm.docs.none")}
          />
        </div>
      )}

      {tab === "takvim" && (
        <CrmRecordTable
            readOnly={crmReadOnly}
          rows={reminders}
          columns={reminderCols}
          createInitial={{ color: "#3b82f6" }}
          onCreate={rec("reminder").create}
          onUpdate={rec("reminder").update}
          onDelete={rec("reminder").remove}
          emptyText={i18n("crm.cal.none")}
        />
      )}

      {tab === "notlar" && (
        <CrmRecordTable
            readOnly={crmReadOnly}
          rows={notes}
          columns={noteCols}
          onCreate={rec("note").create}
          onUpdate={rec("note").update}
          onDelete={rec("note").remove}
          emptyText={i18n("crm.ui.noNotes")}
        />
      )}

      {tab === "izinler" && (canManageUsers || crmReadOnly) && (
        <AccountPermissionsPanel
          userId={user.id}
          canManage={canManageUsers && !crmReadOnly}
          isMainAdmin={isMainAdminTarget}
          initial={{
            tradingEnabled: user.tradingEnabled !== false,
            withdrawalsEnabled: user.withdrawalsEnabled !== false,
            loginEnabled: user.loginEnabled !== false,
            loginBlockedMessage: user.loginBlockedMessage ?? null,
            loginBlockedAt: user.loginBlockedAt ?? null,
          }}
          onUpdated={(p) =>
            setUser((u) =>
              u
                ? {
                    ...u,
                    tradingEnabled: p.tradingEnabled,
                    withdrawalsEnabled: p.withdrawalsEnabled,
                    loginEnabled: p.loginEnabled,
                    loginBlockedMessage: p.loginBlockedMessage,
                    loginBlockedAt: p.loginBlockedAt as string | null,
                  }
                : u
            )
          }
        />
      )}
    </div>
  );
}
