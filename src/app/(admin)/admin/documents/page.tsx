"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";

type Doc = {
  id: string;
  name: string;
  docType: string;
  status: string;
  note: string | null;
  traderId: string;
  trader: string;
  traderEmail: string;
  desk: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type TraderOpt = { id: string; name: string; email: string };

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [status, setStatus] = useState("");
  const [traders, setTraders] = useState<TraderOpt[]>([]);
  const [form, setForm] = useState({ userId: "", name: "", docType: "ID", note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const q = status ? `?status=${status}` : "";
    const res = await fetch(`/api/admin/documents${q}`);
    if (!res.ok) return;
    const data = await res.json();
    setDocs(data.documents || []);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) =>
        setTraders(
          (d.users || [])
            .filter((u: { role: string }) => u.role === "TRADER")
            .map((u: TraderOpt) => ({ id: u.id, name: u.name, email: u.email }))
        )
      )
      .catch(() => {});
  }, []);

  async function review(id: string, next: "APPROVED" | "REJECTED") {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", id, status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "İşlem başarısız");
        return;
      }
      setMsg(next === "APPROVED" ? "Belge onaylandı" : "Belge reddedildi");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Kayıt başarısız");
        return;
      }
      setForm((f) => ({ ...f, name: "", note: "" }));
      setMsg("Belge kaydı eklendi");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Belgeler</h1>
      <p className="mb-3 text-[11px] text-neutral-500">KYC belge meta verileri — onay / red</p>
      {msg && <p className="mb-2 text-[11px] text-neutral-500">{msg}</p>}
      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-lg border border-neutral-200">
          <div className="border-b border-neutral-200 bg-[#ffffff] px-3 py-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded border border-neutral-300 bg-[#fafafa] px-2 py-1 text-xs"
            >
              <option value="">Tüm durumlar</option>
              {["PENDING", "APPROVED", "REJECTED"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#ffffff] text-neutral-500">
              <tr>
                <th className="px-2 py-2">Belge</th>
                <th className="px-2 py-2">Tip</th>
                <th className="px-2 py-2">Trader</th>
                <th className="px-2 py-2">Durum</th>
                <th className="px-2 py-2">Tarih</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-t border-neutral-200">
                  <td className="px-2 py-1.5">
                    <div className="font-medium">{d.name}</div>
                    {d.note && <div className="text-neutral-400">{d.note}</div>}
                  </td>
                  <td className="px-2 py-1.5">{d.docType}</td>
                  <td className="px-2 py-1.5">
                    <Link href={`/admin/traders/${d.traderId}`} className="text-sky-400 hover:underline">
                      {d.trader}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-2 py-1.5 text-neutral-500">
                    {new Date(d.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-2 py-1.5 space-x-1">
                    {d.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => review(d.id, "APPROVED")}
                          className="rounded bg-emerald-600/80 px-1.5 py-0.5 text-[10px] hover:bg-emerald-500"
                        >
                          Onay
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => review(d.id, "REJECTED")}
                          className="rounded bg-red-600/80 px-1.5 py-0.5 text-[10px] hover:bg-red-500"
                        >
                          Red
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-neutral-500">
                    Belge yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3">
          <h2 className="mb-2 text-xs font-semibold text-slate-300">Belge kaydı ekle</h2>
          <div className="space-y-2 text-xs">
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            >
              <option value="">Trader seç…</option>
              {traders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Belge adı"
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            />
            <select
              value={form.docType}
              onChange={(e) => setForm({ ...form, docType: e.target.value })}
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            >
              {["ID", "ADDRESS", "SELFIE", "OTHER"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Not (opsiyonel)"
              className="w-full rounded border border-neutral-300 bg-[#fafafa] px-2 py-1.5"
            />
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="w-full rounded bg-black text-white px-3 py-1.5 font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
