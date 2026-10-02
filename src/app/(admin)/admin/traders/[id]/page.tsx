"use client";

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

const TABS: { id: Tab; label: string }[] = [
  { id: "profil", label: "Profile" },
  { id: "iletisim", label: "Communications" },
  { id: "biletler", label: "Tickets / Deposits" },
  { id: "pozisyonlar", label: "Positions" },
  { id: "ledger", label: "Balance history" },
  { id: "bonus", label: "Bonuslar" },
  { id: "belgeler", label: "Documents" },
  { id: "takvim", label: "Calendar" },
  { id: "finans", label: "Finance" },
  { id: "notlar", label: "Notes" },
];

function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
  allowEmpty = true,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
  onChange: (v: string) => void;
  type?: string;
  options?: readonly string[];
  allowEmpty?: boolean;
}) {
  if (options) {
    return (
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-neutral-500">{label}</span>
        <select
          value={value == null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded border border-[#e5e5e5] bg-[#111111] px-2 py-1.5"
        >
          {allowEmpty && <option value="">—</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
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
        className="rounded border border-[#e5e5e5] bg-[#111111] px-2 py-1.5"
      />
    </label>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
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
        setMsg(data.error || "Registration failed");
        return;
      }
      setMsg("Profile kaydedildi");
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
        setMsg(data.error || "Finance record failed");
        return;
      }
      setMsg("Finance kaydedildi");
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
        setMsg(data.error || "Note eklenemedi");
        return;
      }
      setNoteText("");
      setMsg("Note eklendi");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return <div className="text-sm text-neutral-500">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/traders" className="text-xs text-neutral-500 hover:text-white">
          ← Traders
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
          {user.active ? "Active" : "Freezeuldu"}
        </span>
        {tradingAccountId && (
          <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-sky-300">
            Trading Account: {tradingAccountId}
          </span>
        )}
        <span className="text-[10px] text-neutral-400" title="Session impersonation disabled for safety">
          Terminal impersonation: off
        </span>
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
            {t.label}
          </button>
        ))}
      </div>

      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}

      {tab === "profil" && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-slate-300">ID</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="First name" value={form.firstName as string} onChange={(v) => setF("firstName", v)} />
            <Field label="Last name" value={form.lastName as string} onChange={(v) => setF("lastName", v)} />
            <Field label="Email" value={user.email} onChange={() => {}} />
            <Field
              label="Account ID"
              value={(user.accountLoginId as string) || "—"}
              onChange={() => {}}
            />
            <Field label="Phone" value={form.phone as string} onChange={(v) => setF("phone", v)} />
            <Field
              label="Date of birth"
              value={form.birthDate as string}
              onChange={(v) => setF("birthDate", v)}
              type="date"
            />
            <Field label="Language" value={form.language as string} onChange={(v) => setF("language", v)} />
            <Field label="Timezone" value={form.timezone as string} onChange={(v) => setF("timezone", v)} />
            <Field label="Country" value={form.country as string} onChange={(v) => setF("country", v)} />
            <Field label="Address" value={form.address as string} onChange={(v) => setF("address", v)} />
          </div>

          <h2 className="mb-2 text-sm font-medium text-slate-300">Account</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Account tipi"
              value={form.accountType as string}
              onChange={(v) => setF("accountType", v)}
              options={ACCOUNT_TYPES}
            />
            <Field
              label="Registration date"
              value={form.registrationDate as string}
              onChange={(v) => setF("registrationDate", v)}
              type="date"
            />
            <Field
              label="Registration country"
              value={form.registrationCountry as string}
              onChange={(v) => setF("registrationCountry", v)}
            />
            <Field
              label="Resident"
              value={form.isResident as boolean}
              onChange={(v) => setF("isResident", v)}
              type="checkbox"
            />
            <Field
              label="Active"
              value={form.active as boolean}
              onChange={(v) => setF("active", v)}
              type="checkbox"
            />
            <Field
              label="Role"
              value={form.role as string}
              onChange={(v) => setF("role", v)}
              options={["TRADER", "ADMIN"]}
            />
            <Field
              label="Documents"
              value={form.documentsStatus as string}
              onChange={(v) => setF("documentsStatus", v)}
              options={DOC_STATUSES}
            />
          </div>

          <h2 className="mb-2 text-sm font-medium text-slate-300">Trading / CRM</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Trading server"
              value={form.tradingServer as string}
              onChange={(v) => setF("tradingServer", v)}
            />
            <Field
              label="Trading group"
              value={form.tradingGroup as string}
              onChange={(v) => setF("tradingGroup", v)}
            />
            <Field label="Desk" value={form.desk as string} onChange={(v) => setF("desk", v)} />
            <Field label="Desk ID" value={form.deskId as string} onChange={(v) => setF("deskId", v)} />
            <Field label="Kampanya" value={form.campaign as string} onChange={(v) => setF("campaign", v)} />
            <Field label="A_AID" value={form.affiliateA as string} onChange={(v) => setF("affiliateA", v)} />
            <Field label="B_BID" value={form.affiliateB as string} onChange={(v) => setF("affiliateB", v)} />
            <Field label="C_CID" value={form.affiliateC as string} onChange={(v) => setF("affiliateC", v)} />
            <Field
              label="Retansiyon"
              value={form.retentionStatus as string}
              onChange={(v) => setF("retentionStatus", v)}
              options={RETENTION_STATUSES}
            />
            <Field
              label="Sale status"
              value={form.saleStatus as string}
              onChange={(v) => setF("saleStatus", v)}
              options={SALE_STATUSES}
            />
            <Field
              label="Potansiyel"
              value={form.potentialStatus as string}
              onChange={(v) => setF("potentialStatus", v)}
              options={POTENTIAL_STATUSES}
            />
            <Field
              label="Verification"
              value={form.validationStatus as string}
              onChange={(v) => setF("validationStatus", v)}
              options={VALIDATION_STATUSES}
            />
            <Field label="FTD" value={form.ftd as boolean} onChange={(v) => setF("ftd", v)} type="checkbox" />
            <Field label="Broker" value={form.brokerName as string} onChange={(v) => setF("brokerName", v)} />
            <Field
              label="Atanan"
              value={form.assigneeName as string}
              onChange={(v) => setF("assigneeName", v)}
            />
          </div>

          <button
            disabled={busy}
            onClick={saveProfilee}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            Save
          </button>
        </div>
      )}

      {tab === "finans" && (
        <div className="max-w-md space-y-3 text-xs">
          <p className="text-neutral-500">
            Equity (equity):{" "}
            <span className="font-semibold text-slate-200">
              {user.equity.toLocaleString("en-US", { style: "currency", currency: user.currency || "USD" })}
            </span>
          </p>
          <Field
            label="Balance"
            value={finance.balance}
            onChange={(v) => setFinance({ ...finance, balance: v })}
            type="number"
          />
          <Field
            label="Credit"
            value={finance.credit}
            onChange={(v) => setFinance({ ...finance, credit: v })}
            type="number"
          />
          <Field
            label="Bonus"
            value={finance.bonus}
            onChange={(v) => setFinance({ ...finance, bonus: v })}
            type="number"
          />
          <Field
            label="Para birimi"
            value={finance.currency}
            onChange={(v) => setFinance({ ...finance, currency: v })}
            options={ACCOUNT_CURRENCIES}
            allowEmpty={false}
          />
          <p className="text-[11px] text-neutral-500">
            Changes the account currency; terminal balances are shown in this code. Amounts are not converted.
          </p>
          <Field
            label="Denetim notu (opsiyonel)"
            value={finance.note}
            onChange={(v) => setFinance({ ...finance, note: v })}
          />
          <button
            disabled={busy}
            onClick={saveFinance}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            Save finance
          </button>
        </div>
      )}

      {tab === "iletisim" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">CRM communication records (chat/call/note).</p>
          <MiniTable cols={["type", "title", "description", "workerName", "createdAt"]} rows={communications} />
          {communications.length === 0 && (
            <p className="mt-2 text-xs text-neutral-400">No records yet — you can add a communication note from the Notes tab.</p>
          )}
        </div>
      )}

      {tab === "biletler" && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium">Deposit requests</h2>
            <p className="mb-2 text-[11px] text-neutral-500">
              Approved deposits post to the same trading account balance.
            </p>
            <MiniTable cols={["amount", "currency", "status", "createdAt"]} rows={deposits} />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">Margin / bakiye talepleri</h2>
            <MiniTable cols={["type", "amount", "status", "reason", "createdAt"]} rows={balanceRequests} />
          </div>
        </div>
      )}

      {tab === "pozisyonlar" && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium">Live pozisyonlar (trade engine)</h2>
            <MiniTable
              cols={["symbol", "side", "volume", "openPrice", "currentPrice", "profit", "status", "openedAt"]}
              rows={positions}
            />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">Orderler</h2>
            <MiniTable cols={["symbol", "side", "type", "volume", "status", "createdAt"]} rows={orders} />
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">
            Balance history — ledger records linked by tradingAccountId.
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
            <div className="text-neutral-500">Bonus</div>
            <div className="text-lg font-semibold tabular-nums">
              {Number(user.bonus || 0).toLocaleString("en-US", {
                style: "currency",
                currency: user.currency || "USD",
              })}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
            <div className="text-neutral-500">Credit</div>
            <div className="text-lg font-semibold tabular-nums">
              {Number(user.credit || 0).toLocaleString("en-US", {
                style: "currency",
                currency: user.currency || "USD",
              })}
            </div>
          </div>
          <p className="text-neutral-500">Use the Finance tab to edit.</p>
        </div>
      )}

      {tab === "belgeler" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">
            Document status (membership): {String(form.documentsStatus || "NONE")}
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
              placeholder="Yeni not…"
              className="flex-1 rounded border border-[#e5e5e5] bg-[#111111] px-3 py-2 text-sm"
            />
            <button
              disabled={busy}
              onClick={addNote}
              className="rounded bg-black text-white px-3 py-2 text-sm hover:bg-neutral-800"
            >
              Ekle
            </button>
          </div>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] p-3 text-xs">
                <div className="mb-1 text-neutral-500">
                  {n.authorName || "—"} · {new Date(n.createdAt).toLocaleString("en-US")}
                </div>
                <div className="whitespace-pre-wrap text-slate-200">{n.body}</div>
              </li>
            ))}
            {notes.length === 0 && <li className="text-neutral-500">No notes yet</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function MiniTable({ cols, rows }: { cols: string[]; rows: Record<string, unknown>[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#ffffff] text-neutral-500">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-3 py-2">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={String(r.id || i)} className="border-t border-[#e5e5e5]">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 tabular-nums">
                  {r[c] == null
                    ? "—"
                    : c.toLowerCase().includes("at") || c === "createdAt"
                      ? new Date(String(r[c])).toLocaleString("en-US")
                      : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="px-3 py-8 text-center text-neutral-500">
                Registered yok
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
