"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  accountLoginId?: string | null;
  name: string;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
  balance: number;
  equity: number;
  credit: number;
  bonus: number;
  currency: string;
  country: string | null;
  desk: string | null;
  saleStatus: string | null;
  retentionStatus: string | null;
  brokerName: string | null;
  ftd: boolean;
  phone: string | null;
  accountType: string;
  tradingAccountId?: string | null;
};

const emptyCreate = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  country: "TR",
  desk: "",
  brokerName: "",
  accountType: "STANDARD",
  balance: "10000",
  currency: "USD",
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [desks, setDesks] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [desk, setDesk] = useState("");
  const [country, setCountry] = useState("");
  const [saleStatus, setSaleStatus] = useState("");
  const [retentionStatus, setRetentionStatus] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [bulkDesk, setBulkDesk] = useState("");
  const [bulkBroker, setBulkBroker] = useState("");
  const [ftdOnly, setFtdOnly] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    if (desk) params.set("desk", desk);
    if (country) params.set("country", country);
    if (saleStatus) params.set("saleStatus", saleStatus);
    if (retentionStatus) params.set("retentionStatus", retentionStatus);
    const res = await fetch(`/api/admin/users?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    let list = data.users || [];
    if (ftdOnly) list = list.filter((u: UserRow) => u.ftd);
    setRows(list);
    setDesks(data.desks || []);
  }, [q, status, desk, country, saleStatus, retentionStatus, ftdOnly]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  async function bulk(bulkAction: string, extra: Record<string, unknown> = {}) {
    if (!selected.size) {
      setMsg("Önce kullanıcı seçin");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk",
          bulkAction,
          userIds: Array.from(selected),
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "İşlem başarısız");
        return;
      }
      setMsg(`Toplu işlem: ${data.count} kullanıcı`);
      setSelected(new Set());
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function createMember(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          email: createForm.email,
          password: createForm.password,
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          phone: createForm.phone,
          country: createForm.country,
          desk: createForm.desk || null,
          brokerName: createForm.brokerName || null,
          accountType: createForm.accountType,
          balance: Number(createForm.balance),
          currency: createForm.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Oluşturma başarısız");
        return;
      }
      setMsg("Üye oluşturuldu");
      setShowCreate(false);
      setCreateForm(emptyCreate);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Traderlar</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800"
        >
          + Yeni üye
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="E-posta, hesap kimliği, ad, telefon, broker…"
          className="ml-auto w-full max-w-xs rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-3 py-1.5 text-sm"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="frozen">Donduruldu</option>
        </select>
        <select
          value={desk}
          onChange={(e) => setDesk(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">Tüm deskler</option>
          {desks.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Ülke"
          className="w-20 rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        />
        <select
          value={saleStatus}
          onChange={(e) => setSaleStatus(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">Satış durumu</option>
          {["NEW", "CONTACTED", "INTERESTED", "NO_ANSWER", "DEPOSITED", "LOST"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={retentionStatus}
          onChange={(e) => setRetentionStatus(e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">Retansiyon</option>
          {["ACTIVE", "INACTIVE", "AT_RISK", "CHURNED", "VIP"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-neutral-500">
          <input
            type="checkbox"
            checked={ftdOnly}
            onChange={(e) => setFtdOnly(e.target.checked)}
          />
          FTD
        </label>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#e5e5e5] bg-[#ffffff] p-2 text-xs">
          <span className="text-neutral-500">{selected.size} seçili</span>
          <button
            disabled={busy}
            onClick={() => bulk("freeze")}
            className="rounded bg-red-600/80 px-2 py-1 hover:bg-red-500"
          >
            Dondur
          </button>
          <button
            disabled={busy}
            onClick={() => bulk("activate")}
            className="rounded bg-emerald-600/80 px-2 py-1 hover:bg-emerald-500"
          >
            Aktifleştir
          </button>
          <input
            value={bulkDesk}
            onChange={(e) => setBulkDesk(e.target.value)}
            placeholder="Desk ata"
            className="w-28 rounded border border-[#e5e5e5] bg-[#111111] px-2 py-1"
          />
          <button
            disabled={busy}
            onClick={() => bulk("assignDesk", { desk: bulkDesk })}
            className="rounded bg-[#e5e5e5] px-2 py-1 hover:bg-[#f0f0f0]"
          >
            Desk ata
          </button>
          <input
            value={bulkBroker}
            onChange={(e) => setBulkBroker(e.target.value)}
            placeholder="Broker ata"
            className="w-28 rounded border border-[#e5e5e5] bg-[#111111] px-2 py-1"
          />
          <button
            disabled={busy}
            onClick={() => bulk("assignBroker", { brokerName: bulkBroker })}
            className="rounded bg-[#e5e5e5] px-2 py-1 hover:bg-[#f0f0f0]"
          >
            Broker ata
          </button>
        </div>
      )}

      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}

      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-2 py-2.5">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2.5">ID / Üye</th>
              <th className="px-3 py-2.5">Telefon</th>
              <th className="px-3 py-2.5">Desk</th>
              <th className="px-3 py-2.5">Ülke</th>
              <th className="px-3 py-2.5">Satış / Ret.</th>
              <th className="px-3 py-2.5">Bakiye</th>
              <th className="px-3 py-2.5">Hesap</th>
              <th className="px-3 py-2.5">Durum</th>
              <th className="px-3 py-2.5">Broker</th>
              <th className="px-3 py-2.5">Son giriş</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-[#e5e5e5] hover:bg-[#ffffff]/60">
                <td className="px-2 py-2.5">
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-mono text-[9px] text-neutral-400">{u.id.slice(0, 8)}…</div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-neutral-500">{u.email}</div>
                  {u.accountLoginId && (
                    <div className="font-mono text-[10px] tracking-wide text-sky-600">
                      Hesap kimliği: {u.accountLoginId}
                    </div>
                  )}
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    <span
                      className={`rounded px-1 py-0.5 text-[9px] font-semibold ${
                        u.role === "ADMIN" ? "bg-amber-500/20 text-amber-300" : "bg-neutral-200 text-slate-300"
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="rounded bg-neutral-100 px-1 py-0.5 text-[9px] text-neutral-500">
                      {u.accountType}
                    </span>
                    {u.ftd && (
                      <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] text-emerald-300">
                        FTD
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-neutral-500">{u.phone || "—"}</td>
                <td className="px-3 py-2.5 text-slate-300">{u.desk || "—"}</td>
                <td className="px-3 py-2.5">{u.country || "—"}</td>
                <td className="px-3 py-2.5">
                  <div>{u.saleStatus || "—"}</div>
                  <div className="text-neutral-500">{u.retentionStatus || "—"}</div>
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  <div>
                    {u.balance.toLocaleString("en-US", {
                      style: "currency",
                      currency: u.currency || "USD",
                    })}
                  </div>
                  <div className="text-[9px] text-neutral-500">
                    eq{" "}
                    {u.equity.toLocaleString("en-US", {
                      style: "currency",
                      currency: u.currency || "USD",
                    })}
                  </div>
                </td>
                <td className="px-3 py-2.5 font-mono text-[9px] text-neutral-500">
                  {(u as { tradingAccountId?: string }).tradingAccountId?.slice(0, 10) || "—"}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      u.active ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {u.active ? "Aktif" : "Donduruldu"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-neutral-500">{u.brokerName || "—"}</td>
                <td className="px-3 py-2.5 text-[10px] text-neutral-500">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("tr-TR") : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/traders/${u.id}`}
                    className="rounded bg-black text-white/80 px-2 py-1 hover:bg-neutral-800"
                  >
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-10 text-center text-neutral-500">
                  Trader bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={createMember}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-4"
          >
            <h2 className="mb-3 text-sm font-semibold">Yeni üye oluştur</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(
                [
                  ["email", "E-posta *", "email"],
                  ["password", "Şifre *", "password"],
                  ["firstName", "Ad", "text"],
                  ["lastName", "Soyad", "text"],
                  ["phone", "Telefon", "text"],
                  ["country", "Ülke", "text"],
                  ["desk", "Desk", "text"],
                  ["brokerName", "Broker", "text"],
                  ["accountType", "Hesap tipi", "text"],
                  ["balance", "Başlangıç bakiyesi", "number"],
                  ["currency", "Para birimi", "text"],
                ] as const
              ).map(([key, label, type]) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-neutral-500">{label}</span>
                  <input
                    type={type}
                    required={key === "email" || key === "password"}
                    value={createForm[key]}
                    onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })}
                    className="rounded border border-[#e5e5e5] bg-[#111111] px-2 py-1.5"
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={busy} className="rounded bg-black text-white px-3 py-1.5 text-sm">
                Oluştur
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded bg-[#e5e5e5] px-3 py-1.5 text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
