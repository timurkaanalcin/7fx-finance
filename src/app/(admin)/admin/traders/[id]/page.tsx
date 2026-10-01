"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
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
  { id: "profil", label: "Profil" },
  { id: "iletisim", label: "İletişimler" },
  { id: "biletler", label: "Biletler / Yatırmalar" },
  { id: "pozisyonlar", label: "Pozisyonlar" },
  { id: "ledger", label: "Bakiye geçmişi" },
  { id: "bonus", label: "Bonuslar" },
  { id: "belgeler", label: "Belgeler" },
  { id: "takvim", label: "Takvim" },
  { id: "finans", label: "Finans" },
  { id: "notlar", label: "Notlar" },
];

function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
  onChange: (v: string) => void;
  type?: string;
  options?: readonly string[];
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
          <option value="">—</option>
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

  function setF(key: string, v: string) {
    if (key === "isResident" || key === "ftd" || key === "active") {
      setForm((prev) => ({ ...prev, [key]: v === "true" }));
    } else {
      setForm((prev) => ({ ...prev, [key]: v }));
    }
  }

  async function saveProfile() {
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
        setMsg(data.error || "Kayıt başarısız");
        return;
      }
      setMsg("Profil kaydedildi");
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
          note: finance.note || "Finans güncelleme",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Finans kaydı başarısız");
        return;
      }
      setMsg("Finans kaydedildi");
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
        setMsg(data.error || "Not eklenemedi");
        return;
      }
      setNoteText("");
      setMsg("Not eklendi");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return <div className="text-sm text-neutral-500">Yükleniyor…</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/traders" className="text-xs text-neutral-500 hover:text-white">
          ← Traderlar
        </Link>
        <h1 className="text-xl font-semibold">{user.name}</h1>
        <span className="text-xs text-neutral-500">{user.email}</span>
        {user.accountLoginId && (
          <span className="rounded bg-sky-50 px-2 py-0.5 font-mono text-[10px] text-sky-700">
            Hesap kimliği: {user.accountLoginId}
          </span>
        )}
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] ${
            user.active ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
          }`}
        >
          {user.active ? "Aktif" : "Donduruldu"}
        </span>
        {tradingAccountId && (
          <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-sky-300">
            Trading Account: {tradingAccountId}
          </span>
        )}
        <span className="text-[10px] text-neutral-400" title="Session impersonation disabled for safety">
          Terminal impersonation: kapalı
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
          <h2 className="mb-2 text-sm font-medium text-slate-300">Kimlik</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Ad" value={form.firstName as string} onChange={(v) => setF("firstName", v)} />
            <Field label="Soyad" value={form.lastName as string} onChange={(v) => setF("lastName", v)} />
            <Field label="E-posta" value={user.email} onChange={() => {}} />
            <Field
              label="Hesap kimliği"
              value={(user.accountLoginId as string) || "—"}
              onChange={() => {}}
            />
            <Field label="Telefon" value={form.phone as string} onChange={(v) => setF("phone", v)} />
            <Field
              label="Doğum tarihi"
              value={form.birthDate as string}
              onChange={(v) => setF("birthDate", v)}
              type="date"
            />
            <Field label="Dil" value={form.language as string} onChange={(v) => setF("language", v)} />
            <Field label="Saat dilimi" value={form.timezone as string} onChange={(v) => setF("timezone", v)} />
            <Field label="Ülke" value={form.country as string} onChange={(v) => setF("country", v)} />
            <Field label="Adres" value={form.address as string} onChange={(v) => setF("address", v)} />
          </div>

          <h2 className="mb-2 text-sm font-medium text-slate-300">Hesap</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Hesap tipi"
              value={form.accountType as string}
              onChange={(v) => setF("accountType", v)}
              options={ACCOUNT_TYPES}
            />
            <Field
              label="Kayıt tarihi"
              value={form.registrationDate as string}
              onChange={(v) => setF("registrationDate", v)}
              type="date"
            />
            <Field
              label="Kayıt ülkesi"
              value={form.registrationCountry as string}
              onChange={(v) => setF("registrationCountry", v)}
            />
            <Field
              label="Yerleşik"
              value={form.isResident as boolean}
              onChange={(v) => setF("isResident", v)}
              type="checkbox"
            />
            <Field
              label="Aktif"
              value={form.active as boolean}
              onChange={(v) => setF("active", v)}
              type="checkbox"
            />
            <Field
              label="Rol"
              value={form.role as string}
              onChange={(v) => setF("role", v)}
              options={["TRADER", "ADMIN"]}
            />
            <Field
              label="Belgeler"
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
              label="Satış durumu"
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
              label="Doğrulama"
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
            onClick={saveProfile}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            Kaydet
          </button>
        </div>
      )}

      {tab === "finans" && (
        <div className="max-w-md space-y-3 text-xs">
          <p className="text-neutral-500">
            Özsermaye (equity):{" "}
            <span className="font-semibold text-slate-200">
              {user.equity.toLocaleString("en-US", { style: "currency", currency: user.currency || "USD" })}
            </span>
          </p>
          <Field
            label="Bakiye"
            value={finance.balance}
            onChange={(v) => setFinance({ ...finance, balance: v })}
            type="number"
          />
          <Field
            label="Kredi"
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
          />
          <Field
            label="Denetim notu"
            value={finance.note}
            onChange={(v) => setFinance({ ...finance, note: v })}
          />
          <button
            disabled={busy}
            onClick={saveFinance}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            Finansı kaydet
          </button>
        </div>
      )}

      {tab === "iletisim" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">CRM iletişim kayıtları (chat/call/not).</p>
          <MiniTable cols={["type", "title", "description", "workerName", "createdAt"]} rows={communications} />
          {communications.length === 0 && (
            <p className="mt-2 text-xs text-neutral-400">Henüz kayıt yok — notlar sekmesinden iletişim notu ekleyebilirsiniz.</p>
          )}
        </div>
      )}

      {tab === "biletler" && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium">Para yatırma talepleri</h2>
            <p className="mb-2 text-[11px] text-neutral-500">
              Onaylanan yatırmalar aynı trading Account bakiyesine yazılır.
            </p>
            <MiniTable cols={["amount", "currency", "status", "createdAt"]} rows={deposits} />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">Marjin / bakiye talepleri</h2>
            <MiniTable cols={["type", "amount", "status", "reason", "createdAt"]} rows={balanceRequests} />
          </div>
        </div>
      )}

      {tab === "pozisyonlar" && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium">Canlı pozisyonlar (trade engine)</h2>
            <MiniTable
              cols={["symbol", "side", "volume", "openPrice", "currentPrice", "profit", "status", "openedAt"]}
              rows={positions}
            />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">Emirler</h2>
            <MiniTable cols={["symbol", "side", "type", "volume", "status", "createdAt"]} rows={orders} />
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">
            Balance history — tradingAccountId ile bağlı ledger kayıtları.
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
            <div className="text-neutral-500">Kredi</div>
            <div className="text-lg font-semibold tabular-nums">
              {Number(user.credit || 0).toLocaleString("en-US", {
                style: "currency",
                currency: user.currency || "USD",
              })}
            </div>
          </div>
          <p className="text-neutral-500">Düzenlemek için Finans sekmesini kullanın.</p>
        </div>
      )}

      {tab === "belgeler" && (
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">
            Belge durumu (üyelik): {String(form.documentsStatus || "NONE")}
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
                  {n.authorName || "—"} · {new Date(n.createdAt).toLocaleString("tr-TR")}
                </div>
                <div className="whitespace-pre-wrap text-slate-200">{n.body}</div>
              </li>
            ))}
            {notes.length === 0 && <li className="text-neutral-500">Henüz not yok</li>}
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
                      ? new Date(String(r[c])).toLocaleString("tr-TR")
                      : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="px-3 py-8 text-center text-neutral-500">
                Kayıt yok
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
