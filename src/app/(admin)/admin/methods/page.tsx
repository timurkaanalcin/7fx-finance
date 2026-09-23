"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Method = {
  id: string;
  type: string;
  label: string;
  active: boolean;
  bankName?: string | null;
  accountHolder?: string | null;
  iban?: string | null;
  asset?: string | null;
  network?: string | null;
  address?: string | null;
  instructions?: string | null;
  sortOrder: number;
};

const emptyForm = {
  type: "IBAN",
  label: "",
  active: true,
  bankName: "",
  accountHolder: "",
  iban: "",
  asset: "",
  network: "",
  address: "",
  instructions: "",
  sortOrder: 0,
};

export default function AdminMethodsPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/methods");
    if (!res.ok) return;
    const data = await res.json();
    setMethods(data.methods || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(m: Method) {
    setEditId(m.id);
    setForm({
      type: m.type,
      label: m.label,
      active: m.active,
      bankName: m.bankName || "",
      accountHolder: m.accountHolder || "",
      iban: m.iban || "",
      asset: m.asset || "",
      network: m.network || "",
      address: m.address || "",
      instructions: m.instructions || "",
      sortOrder: m.sortOrder,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    const payload = { ...form, id: editId || undefined };
    const res = await fetch("/api/admin/methods", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Kayıt başarısız");
      return;
    }
    setMsg(editId ? "Güncellendi" : "Oluşturuldu");
    setEditId(null);
    setForm({ ...emptyForm });
    await load();
  }

  async function toggleActive(m: Method) {
    await fetch("/api/admin/methods", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, active: !m.active }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Yöntemi silmek istiyor musunuz?")) return;
    await fetch(`/api/admin/methods?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="mb-3 text-lg font-semibold">Yatırma Yöntemleri</h1>
        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="rounded-lg border border-[#3a4658] bg-[#1e293b] p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${m.active ? "bg-emerald-600" : "bg-slate-600"}`}>
                  {m.active ? "Aktif" : "Pasif"}
                </span>
                <span className="rounded bg-[#334155] px-1.5 py-0.5 text-[10px]">{m.type}</span>
                <span className="font-medium">{m.label}</span>
              </div>
              <div className="mt-2 text-slate-400">
                {m.type === "IBAN"
                  ? `${m.bankName || "—"} · ${m.iban || "—"}`
                  : `${m.asset || "—"} / ${m.network || "—"} · ${m.address?.slice(0, 24) || "—"}…`}
              </div>
              <div className="mt-2 flex gap-1">
                <button onClick={() => startEdit(m)} className="rounded bg-blue-600/80 px-2 py-1 hover:bg-blue-500">
                  Düzenle
                </button>
                <button onClick={() => toggleActive(m)} className="rounded bg-[#334155] px-2 py-1 hover:bg-[#3a4658]">
                  {m.active ? "Pasifleştir" : "Aktifleştir"}
                </button>
                <button onClick={() => remove(m.id)} className="rounded bg-red-600/70 px-2 py-1 hover:bg-red-500">
                  Sil
                </button>
              </div>
            </div>
          ))}
          {methods.length === 0 && <p className="text-sm text-slate-500">Henüz yöntem yok.</p>}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">{editId ? "Yöntemi Düzenle" : "Yeni Yöntem"}</h2>
        {msg && <p className="mb-2 text-xs text-emerald-400">{msg}</p>}
        <form onSubmit={onSubmit} className="space-y-2 rounded-lg border border-[#3a4658] bg-[#1e293b] p-4 text-xs">
          <label className="block">
            <span className="text-slate-400">Tip</span>
            <select
              className="mt-1 w-full rounded border border-[#3a4658] bg-[#0f172a] px-2 py-1.5"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="IBAN">IBAN</option>
              <option value="CRYPTO">CRYPTO</option>
            </select>
          </label>
          <label className="block">
            <span className="text-slate-400">Etiket</span>
            <input
              className="mt-1 w-full rounded border border-[#3a4658] bg-[#0f172a] px-2 py-1.5"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Aktif
          </label>

          {form.type === "IBAN" ? (
            <>
              <input placeholder="Banka adı" className="w-full rounded border border-[#3a4658] bg-[#0f172a] px-2 py-1.5"
                value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
              <input placeholder="Hesap sahibi" className="w-full rounded border border-[#3a4658] bg-[#0f172a] px-2 py-1.5"
                value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} />
              <input placeholder="IBAN" className="w-full rounded border border-[#3a4658] bg-[#0f172a] px-2 py-1.5"
                value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
            </>
          ) : (
            <>
              <input placeholder="Varlık (USDT/BTC/ETH)" className="w-full rounded border border-[#3a4658] bg-[#0f172a] px-2 py-1.5"
                value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} />
              <input placeholder="Ağ (TRC20/ERC20/BTC)" className="w-full rounded border border-[#3a4658] bg-[#0f172a] px-2 py-1.5"
                value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} />
              <input placeholder="Cüzdan adresi" className="w-full rounded border border-[#3a4658] bg-[#0f172a] px-2 py-1.5"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </>
          )}
          <textarea
            placeholder="Talimatlar"
            rows={3}
            className="w-full rounded border border-[#3a4658] bg-[#0f172a] px-2 py-1.5"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
          <div className="flex gap-2 pt-1">
            <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 hover:bg-blue-500">
              {editId ? "Kaydet" : "Oluştur"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({ ...emptyForm });
                }}
                className="rounded bg-[#334155] px-3 py-1.5"
              >
                İptal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
