"use client";

import { LOCALES } from "@/lib/i18n/locales";
import EditablePositionsTable from "@/components/crm/EditablePositionsTable";
import EditableOrdersTable from "@/components/crm/EditableOrdersTable";
import { fmtCrmDate, fmtCrmMoney } from "@/lib/crm-format";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
  | "notlar";

type Membership = Record<string, unknown> & {
  id: string;
  email: string;
  accountLoginId?: string | null;
  name: string;
  role: string;
  active: boolean;
  balance: number;
  equity: number;
  credit: number;
  bonus: number;
  currency: string;
  tradingAccountId?: string | null;
};

const TABS: { id: Tab; labelKey: string }[] = [
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
];


function TraderAccessTools({ userId, traderName }: { userId: string; traderName: string }) {
  const { i18n } = useCrmLabels();
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [expiresIn, setExpiresIn] = useState(60);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [enabled, setEnabled] = useState(true);

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
        body: JSON.stringify({ expiresInMinutes: expiresIn, maxUses: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || i18n("crm.ui.linkFailed"));
        return;
      }
      setLinkUrl(data.url || "");
      setMsg(`${i18n("crm.ui.linkExpires")} ${new Date(data.expiresAt).toLocaleString("en-GB", { hour12: false })}`);
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
        disabled={busy}
        onClick={openTerminal}
        className="rounded bg-sky-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        title={`Open terminal as ${traderName}`}
      >
        {i18n("crm.ui.openTerminal")}
      </button>
      <select
        className="rounded border border-neutral-300 bg-white px-1.5 py-1 text-[10px]"
        value={expiresIn}
        onChange={(e) => setExpiresIn(Number(e.target.value))}
        disabled={busy}
        title={i18n("crm.ui.linkExpiry")}
      >
        <option value={15}>15m</option>
        <option value={60}>1h</option>
        <option value={360}>6h</option>
        <option value={1440}>24h</option>
        <option value={10080}>7d</option>
      </select>
      <button
        type="button"
        disabled={busy}
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
      {msg && <span className="text-[10px] text-emerald-600">{msg}</span>}
      {err && <span className="text-[10px] text-red-500">{err}</span>}
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
}: {
  label: string;
  value: string | number | boolean | null | undefined;
  onChange: (v: string) => void;
  type?: string;
  options?: readonly string[];
  allowEmpty?: boolean;
  optionLabel?: (value: string) => string;
}) {
  if (options) {
    return (
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-neutral-500">{label}</span>
        <select
          value={value == null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded border border-[#111111] bg-white px-2 py-1.5 text-sm text-[#111111] outline-none focus:ring-1 focus:ring-[#111111]/30"
        >
          {allowEmpty && <option value="">—</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {optionLabel ? optionLabel(o) : o}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={Boolean(value)}
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
        value={value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-[#111111] bg-white px-2 py-1.5 text-sm text-[#111111] outline-none focus:ring-1 focus:ring-[#111111]/30"
      />
    </label>
  );
}

export default function AdminUserDetailPage() {
  const { i18n, code, deskName } = useCrmLabels();
  const params = useParams();
  const id = String(params?.id || "");
  const [desks, setDesks] = useState<{ id: string; name: string; code: string | null }[]>([]);
  const [tab, setTab] = useState<Tab>("profil");
  const [user, setUser] = useState<Membership | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [notes, setNotes] = useState<{ id: string; body: string; authorName: string | null; createdAt: string }[]>(
    []
  );
  const [positions, setPositions] = useState<Record<string, unknown>[]>([]);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [deposits, setDeposits] = useState<Record<string, unknown>[]>([]);
  const [balanceRequests, setBalanceRequests] = useState<Record<string, unknown>[]>([]);
  const [ledger, setLedger] = useState<Record<string, unknown>[]>([]);
  const [communications, setCommunications] = useState<Record<string, unknown>[]>([]);
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([]);
  const [reminders, setReminders] = useState<Record<string, unknown>[]>([]);
  const [tradingAccountId, setTradingAccountId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [finance, setFinance] = useState({ balance: "", credit: "", bonus: "", currency: "USD", note: "" });

  useEffect(() => {
    fetch("/api/admin/desks")
      .then((r) => r.json())
      .then((d) => setDesks(d.desks || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/admin/users/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    const u = data.user as Membership;
    setUser(u);
    setNotes(data.notes || []);
    setPositions(data.positions || []);
    setOrders(data.orders || []);
    setDeposits(data.deposits || []);
    setBalanceRequests(data.balanceRequests || []);
    setLedger(data.ledger || []);
    setCommunications(data.communications || []);
    setDocuments(data.documents || []);
    setReminders(data.reminders || []);
    setTradingAccountId(data.tradingAccountId || data.user?.tradingAccountId || null);
    setFinance({
      balance: String(u.balance ?? 0),
      credit: String(u.credit ?? 0),
      bonus: String(u.bonus ?? 0),
      currency: String(u.currency || "USD"),
      note: "",
    });
    const f: Record<string, string | boolean> = {};
    const keys = [
      "firstName",
      "lastName",
      "email",
      "phone",
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
    ];
    for (const k of keys) {
      const v = u[k];
      if (typeof v === "boolean") f[k] = v;
      else if (v == null) f[k] = "";
      else if (k === "birthDate" || k === "registrationDate") {
        f[k] = v ? new Date(String(v)).toISOString().slice(0, 10) : "";
      } else f[k] = String(v);
    }
    setForm(f);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh while viewing trading tabs so CRM mirrors terminal open/close.
  useEffect(() => {
    if (!id) return;
    if (tab !== "pozisyonlar" && tab !== "finans") return;
    const timer = window.setInterval(() => {
      load();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [id, tab, load]);

  function setF(key: string, v: string) {
    if (key === "isResident" || key === "ftd" || key === "active") {
      setForm((prev) => ({ ...prev, [key]: v === "true" }));
    } else {
      setForm((prev) => ({ ...prev, [key]: v }));
    }
  }

  async function saveProfilee() {
    setBusy(true);
    setMsg("");
    try {
      const payload: Record<string, unknown> = { ...form };
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(i18n("crm.ui.profileSaved"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveFinance() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateFinance",
          userId: id,
          balance: Number(finance.balance),
          credit: Number(finance.credit),
          bonus: Number(finance.bonus),
          currency: finance.currency,
          note: finance.note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(i18n("crm.ui.financeSaved"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addNote: noteText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.noteFailed"));
        return;
      }
      setNoteText("");
      setMsg(i18n("crm.ui.noteAdded"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return <div className="text-sm text-neutral-500">{i18n("crm.ui.loading")}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/traders" className="text-xs text-neutral-500 hover:text-white">
          {i18n("crm.ui.backToTraders")}
        </Link>
        <h1 className="text-xl font-semibold">{user.name}</h1>
        <span className="text-xs text-neutral-500">{user.email}</span>
        {user.accountLoginId && (
          <span className="rounded bg-sky-50 px-2 py-0.5 font-mono text-[10px] text-sky-700">
            Account ID: {user.accountLoginId}
          </span>
        )}
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] ${
            user.active ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
          }`}
        >
          {user.active ? i18n("crm.ui.active") : i18n("crm.ui.frozen")}
        </span>
        {tradingAccountId && (
          <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-sky-300">
            {i18n("crm.ui.account")}: {tradingAccountId}
          </span>
        )}
        <TraderAccessTools userId={user.id} traderName={user.name} />
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-[#e5e5e5] pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              tab === t.id ? "bg-black text-white text-white" : "text-neutral-500 hover:bg-[#e5e5e5]"
            }`}
          >
            {i18n(t.labelKey)}
          </button>
        ))}
      </div>

      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}

      {tab === "profil" && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-600">{i18n("crm.ui.idSection")}</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={i18n("crm.ui.firstName")} value={form.firstName as string} onChange={(v) => setF("firstName", v)} />
            <Field label={i18n("crm.ui.lastName")} value={form.lastName as string} onChange={(v) => setF("lastName", v)} />
            <Field label={i18n("crm.ui.email")} value={user.email} onChange={() => {}} />
            <Field
              label={i18n("crm.ui.accountId")}
              value={(user.accountLoginId as string) || "—"}
              onChange={() => {}}
            />
            <Field label={i18n("crm.ui.phone")} value={form.phone as string} onChange={(v) => setF("phone", v)} />
            <Field
              label={i18n("crm.ui.dob")}
              value={form.birthDate as string}
              onChange={(v) => setF("birthDate", v)}
              type="date"
            />
            <Field label={i18n("crm.ui.language")} value={form.language as string} onChange={(v) => setF("language", v)} options={LOCALES} allowEmpty={false} />
            <Field label={i18n("crm.ui.timezone")} value={form.timezone as string} onChange={(v) => setF("timezone", v)} />
            <Field label={i18n("crm.ui.country")} value={form.country as string} onChange={(v) => setF("country", v)} />
            <Field label={i18n("crm.ui.address")} value={form.address as string} onChange={(v) => setF("address", v)} />
          </div>

          <h2 className="mb-2 text-sm font-medium text-neutral-600">{i18n("crm.ui.account")}</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label={i18n("crm.ui.accountType")}
              value={form.accountType as string}
              onChange={(v) => setF("accountType", v)}
              options={ACCOUNT_TYPES}
              optionLabel={(o) => code("crm.accountType", o)}
            />
            <Field
              label={i18n("crm.ui.regDate")}
              value={form.registrationDate as string}
              onChange={(v) => setF("registrationDate", v)}
              type="date"
            />
            <Field
              label={i18n("crm.ui.regCountry")}
              value={form.registrationCountry as string}
              onChange={(v) => setF("registrationCountry", v)}
            />
            <Field
              label={i18n("crm.ui.resident")}
              value={form.isResident as boolean}
              onChange={(v) => setF("isResident", v)}
              type="checkbox"
            />
            <Field
              label={i18n("crm.ui.active")}
              value={form.active as boolean}
              onChange={(v) => setF("active", v)}
              type="checkbox"
            />
            <Field
              label={i18n("crm.ui.role")}
              value={form.role as string}
              onChange={(v) => setF("role", v)}
              options={["TRADER", "ADMIN"]}
              optionLabel={(o) => code("crm.role", o)}
            />
            <Field
              label={i18n("crm.ui.documents")}
              value={form.documentsStatus as string}
              onChange={(v) => setF("documentsStatus", v)}
              options={DOC_STATUSES}
              optionLabel={(o) => code("crm.status", o)}
            />
          </div>

          <h2 className="mb-2 text-sm font-medium text-neutral-600">{i18n("crm.ui.tradingCrm")}</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label={i18n("crm.ui.tradingServer")}
              value={form.tradingServer as string}
              onChange={(v) => setF("tradingServer", v)}
            />
            <Field
              label={i18n("crm.ui.tradingGroup")}
              value={form.tradingGroup as string}
              onChange={(v) => setF("tradingGroup", v)}
            />
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-neutral-500">{i18n("crm.ui.desk")}</span>
              <select
                value={
                  desks.find(
                    (d) => d.id === form.deskId || d.code === form.deskId || d.name === form.desk
                  )?.id || String(form.deskId || "")
                }
                onChange={(e) => {
                  const picked = desks.find((d) => d.id === e.target.value);
                  setForm((prev) => ({
                    ...prev,
                    desk: picked ? picked.name : "",
                    deskId: picked ? picked.id : "",
                  }));
                }}
                className="rounded border border-[#111111] bg-white px-2 py-1.5 text-sm text-[#111111]"
              >
                <option value="">—</option>
                {desks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {deskName(d)}
                  </option>
                ))}
              </select>
            </label>
            <Field label={i18n("crm.ui.campaign")} value={form.campaign as string} onChange={(v) => setF("campaign", v)} />
            <Field label="A_AID" value={form.affiliateA as string} onChange={(v) => setF("affiliateA", v)} />
            <Field label="B_BID" value={form.affiliateB as string} onChange={(v) => setF("affiliateB", v)} />
            <Field label="C_CID" value={form.affiliateC as string} onChange={(v) => setF("affiliateC", v)} />
            <Field
              label={i18n("crm.ui.retention")}
              value={form.retentionStatus as string}
              onChange={(v) => setF("retentionStatus", v)}
              options={RETENTION_STATUSES}
              optionLabel={(o) => code("crm.retention", o)}
            />
            <Field
              label={i18n("crm.ui.saleStatus")}
              value={form.saleStatus as string}
              onChange={(v) => setF("saleStatus", v)}
              options={SALE_STATUSES}
              optionLabel={(o) => code("crm.sale", o)}
            />
            <Field
              label={i18n("crm.ui.potential")}
              value={form.potentialStatus as string}
              onChange={(v) => setF("potentialStatus", v)}
              options={POTENTIAL_STATUSES}
              optionLabel={(o) => code("crm.potential", o)}
            />
            <Field
              label={i18n("crm.ui.verification")}
              value={form.validationStatus as string}
              onChange={(v) => setF("validationStatus", v)}
              options={VALIDATION_STATUSES}
              optionLabel={(o) => code("crm.validation", o)}
            />
            <Field label="FTD" value={form.ftd as boolean} onChange={(v) => setF("ftd", v)} type="checkbox" />
            <Field label={i18n("crm.ui.broker")} value={form.brokerName as string} onChange={(v) => setF("brokerName", v)} />
            <Field
              label={i18n("crm.ui.assignee")}
              value={form.assigneeName as string}
              onChange={(v) => setF("assigneeName", v)}
            />
          </div>

          <button
            disabled={busy}
            onClick={saveProfilee}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            {i18n("crm.ui.save")}
          </button>
        </div>
      )}

      {tab === "finans" && (
        <div className="max-w-md space-y-3 text-xs">
          <p className="text-neutral-500">
            {i18n("crm.ui.equityLabel")}:{" "}
            <span className="font-semibold text-neutral-800">
              {user.equity.toLocaleString("en-US", { style: "currency", currency: user.currency || "USD" })}
            </span>
          </p>
          <Field
            label={i18n("crm.ui.balance")}
            value={finance.balance}
            onChange={(v) => setFinance({ ...finance, balance: v })}
            type="number"
          />
          <Field
            label={i18n("crm.ui.credit")}
            value={finance.credit}
            onChange={(v) => setFinance({ ...finance, credit: v })}
            type="number"
          />
          <Field
            label={i18n("crm.ui.bonus")}
            value={finance.bonus}
            onChange={(v) => setFinance({ ...finance, bonus: v })}
            type="number"
          />
          <Field
            label={i18n("crm.ui.currency")}
            value={finance.currency}
            onChange={(v) => setFinance({ ...finance, currency: v })}
            options={ACCOUNT_CURRENCIES}
            allowEmpty={false}
          />
          <p className="text-[11px] text-neutral-500">
            {i18n("crm.ui.currencyHint")}
          </p>
          <Field
            label={i18n("crm.ui.auditNote")}
            value={finance.note}
            onChange={(v) => setFinance({ ...finance, note: v })}
          />
          <button
            disabled={busy}
            onClick={saveFinance}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            {i18n("crm.ui.saveFinance")}
          </button>
        </div>
      )}

      {tab === "iletisim" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">{i18n("crm.ui.commsHint")}</p>
          <MiniTable cols={["type", "title", "description", "workerName", "createdAt"]} rows={communications} />
          {communications.length === 0 && (
            <p className="mt-2 text-xs text-neutral-400">{i18n("crm.ui.noComms")}</p>
          )}
        </div>
      )}

      {tab === "biletler" && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium">{i18n("crm.ui.depositRequests")}</h2>
            <p className="mb-2 text-[11px] text-neutral-500">
              {i18n("crm.ui.depositsHint")}
            </p>
            <MiniTable cols={["amount", "currency", "status", "createdAt"]} rows={deposits} />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">{i18n("crm.ui.marginRequests")}</h2>
            <MiniTable cols={["type", "amount", "status", "reason", "createdAt"]} rows={balanceRequests} />
          </div>
        </div>
      )}

      {tab === "pozisyonlar" && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium">{i18n("crm.ui.positionsFull")}</h2>
            <p className="mb-2 text-[11px] text-neutral-500">
              {i18n("crm.ui.positionsHint")}
            </p>
            <EditablePositionsTable rows={positions} onSaved={() => load()} />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">{i18n("crm.ui.ordersFull")}</h2>
            <EditableOrdersTable rows={orders} onSaved={() => load()} />
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">
            {i18n("crm.ui.ledgerHint")}
          </p>
          <MiniTable
            cols={["type", "amount", "balanceBefore", "balanceAfter", "comment", "createdByName", "createdAt"]}
            rows={ledger}
          />
        </div>
      )}

      {tab === "bonus" && (
        <div className="max-w-md space-y-2 text-xs">
          <div className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
            <div className="text-neutral-500">{i18n("crm.ui.bonus")}</div>
            <div className="text-lg font-semibold tabular-nums">
              {Number(user.bonus || 0).toLocaleString("en-US", {
                style: "currency",
                currency: user.currency || "USD",
              })}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
            <div className="text-neutral-500">{i18n("crm.ui.credit")}</div>
            <div className="text-lg font-semibold tabular-nums">
              {Number(user.credit || 0).toLocaleString("en-US", {
                style: "currency",
                currency: user.currency || "USD",
              })}
            </div>
          </div>
          <p className="text-neutral-500">{i18n("crm.ui.useFinanceTab")}</p>
        </div>
      )}

      {tab === "belgeler" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">
            {i18n("crm.ui.docStatus")}: {code("crm.status", String(form.documentsStatus || "NONE"))}
          </p>
          <MiniTable cols={["name", "docType", "status", "createdAt"]} rows={documents} />
        </div>
      )}

      {tab === "takvim" && (
        <div>
          <MiniTable cols={["body", "remindAt", "workerName", "color"]} rows={reminders} />
        </div>
      )}

      {tab === "notlar" && (
        <div>
          <div className="mb-3 flex gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={i18n("crm.ui.newNote")}
              className="flex-1 rounded border border-[#111111] bg-white px-3 py-2 text-sm text-[#111111]"
            />
            <button
              disabled={busy}
              onClick={addNote}
              className="rounded bg-black text-white px-3 py-2 text-sm hover:bg-neutral-800"
            >
              {i18n("crm.ui.add")}
            </button>
          </div>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] p-3 text-xs">
                <div className="mb-1 text-neutral-500">
                  {n.authorName || "—"} · {fmtCrmDate(n.createdAt)}
                </div>
                <div className="whitespace-pre-wrap text-neutral-800">{n.body}</div>
              </li>
            ))}
            {notes.length === 0 && <li className="text-neutral-500">{i18n("crm.ui.noNotes")}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function cellValue(col: string, value: unknown): string {
  if (value == null || value === "") return "—";
  const lc = col.toLowerCase();
  if (lc.includes("at") || lc === "createdat" || lc === "remindat" || lc.endsWith("date")) {
    return fmtCrmDate(value);
  }
  if (
    ["profit", "closeprofit", "volume", "openprice", "currentprice", "closeprice", "amount", "balance", "balancebefore", "balanceafter", "credit", "bonus", "margin"].includes(
      lc
    )
  ) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    const digits = lc.includes("price") ? 5 : 2;
    return fmtCrmMoney(n, digits);
  }
  return String(value);
}

function MiniTable({ cols, rows }: { cols: string[]; rows: Record<string, unknown>[] }) {
  const { i18n } = useCrmLabels();
  const colKey: Record<string, string> = {
    type: "crm.ui.type",
    title: "crm.ui.title",
    description: "crm.ui.description",
    workerName: "crm.ui.worker",
    createdAt: "crm.ui.date",
    amount: "crm.ui.amount",
    currency: "crm.ui.currency",
    status: "crm.ui.status",
    reason: "crm.ui.note",
    balanceBefore: "crm.ui.beforeAfter",
    balanceAfter: "crm.ui.balance",
    comment: "crm.ui.comment",
    createdByName: "crm.ui.createdBy",
    name: "crm.ui.name",
    docType: "crm.ui.type",
    body: "crm.ui.body",
    remindAt: "crm.ui.date",
    color: "crm.ui.color",
  };

  function labelEnum(col: string, raw: unknown) {
    const value = String(raw ?? "");
    if (!value) return "—";
    const prefixes =
      col === "docType"
        ? ["crm.doc"]
        : col === "status"
          ? ["crm.status", "crm.sale", "crm.retention"]
          : ["crm.kind", "crm.comm", "crm.ledger"];
    for (const prefix of prefixes) {
      const labeled = i18n(`${prefix}.${value}`, "");
      if (labeled) return labeled;
    }
    return value;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#ffffff] text-neutral-500">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-3 py-2">
                {colKey[c] ? i18n(colKey[c]) : c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={String(r.id || i)} className="border-t border-[#e5e5e5]">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 tabular-nums">
                  {c === "status" || c === "type" || c === "docType"
                    ? labelEnum(c, r[c])
                    : cellValue(c, r[c])}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="px-3 py-8 text-center text-neutral-500">
                {i18n("crm.ui.noRecords")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
