"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

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
  const { i18n } = useCrmLabels();
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
      setMsg(data.error || i18n("crm.ui.saveFailed"));
      return;
    }
    setMsg(editId ? i18n("crm.methods.updated") : i18n("crm.methods.created"));
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
    if (!confirm(i18n("crm.methods.deleteConfirm"))) return;
    await fetch(`/api/admin/methods?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="mb-3 text-lg font-semibold">{i18n("crm.nav.methods")}</h1>
        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="rounded-lg border border-[#e5e5e5] bg-[#e5e5e5] p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${m.active ? "bg-emerald-600" : "bg-slate-600"}`}>
                  {m.active ? i18n("crm.ui.active") : i18n("crm.ui.inactive")}
                </span>
                <span className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[10px]">{m.type}</span>
                <span className="font-medium">{m.label}</span>
              </div>
              <div className="mt-2 text-neutral-500">
                {m.type === "IBAN"
                  ? `${m.bankName || "—"} · ${m.iban || "—"}`
                  : `${m.asset || "—"} / ${m.network || "—"} · ${m.address?.slice(0, 24) || "—"}…`}
              </div>
              <div className="mt-2 flex gap-1">
                <button onClick={() => startEdit(m)} className="rounded bg-black text-white/80 px-2 py-1 hover:bg-neutral-800">
                  {i18n("crm.ui.edit")}
                </button>
                <button onClick={() => toggleActive(m)} className="rounded bg-[#f0f0f0] px-2 py-1 hover:bg-[#e5e5e5]">
                  {m.active ? i18n("crm.methods.deactivate") : i18n("crm.ui.activate")}
                </button>
                <button onClick={() => remove(m.id)} className="rounded bg-red-600/70 px-2 py-1 hover:bg-red-500">
                  {i18n("crm.ui.delete")}
                </button>
              </div>
            </div>
          ))}
          {methods.length === 0 && <p className="text-sm text-neutral-500">{i18n("crm.methods.none")}</p>}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">{editId ? i18n("crm.methods.edit") : i18n("crm.methods.new")}</h2>
        {msg && <p className="mb-2 text-xs text-emerald-400">{msg}</p>}
        <form onSubmit={onSubmit} className="space-y-2 rounded-lg border border-[#e5e5e5] bg-[#e5e5e5] p-4 text-xs">
          <label className="block">
            <span className="text-neutral-500">{i18n("crm.ui.type")}</span>
            <select
              className="mt-1 w-full rounded border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="IBAN">IBAN</option>
              <option value="CRYPTO">CRYPTO</option>
            </select>
          </label>
          <label className="block">
            <span className="text-neutral-500">{i18n("crm.ui.label")}</span>
            <input
              className="mt-1 w-full rounded border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
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
            {i18n("crm.ui.active")}
          </label>

          {form.type === "IBAN" ? (
            <>
              <input placeholder={i18n("crm.methods.bank")} className="w-full rounded border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
                value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
              <input placeholder={i18n("crm.methods.holder")} className="w-full rounded border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
                value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} />
              <input placeholder="IBAN" className="w-full rounded border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
                value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
            </>
          ) : (
            <>
              <input placeholder={i18n("crm.methods.asset")} className="w-full rounded border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
                value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} />
              <input placeholder={i18n("crm.methods.network")} className="w-full rounded border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
                value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} />
              <input placeholder={i18n("crm.methods.wallet")} className="w-full rounded border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </>
          )}
          <textarea
            placeholder={i18n("crm.methods.instructions")}
            rows={3}
            className="w-full rounded border border-[#e5e5e5] bg-[#ffffff] px-2 py-1.5"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
          <div className="flex gap-2 pt-1">
            <button type="submit" className="rounded bg-black text-white px-3 py-1.5 hover:bg-neutral-800">
              {editId ? i18n("crm.ui.save") : i18n("crm.ui.create")}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({ ...emptyForm });
                }}
                className="rounded bg-[#f0f0f0] px-3 py-1.5"
              >
                {i18n("crm.ui.cancel")}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
