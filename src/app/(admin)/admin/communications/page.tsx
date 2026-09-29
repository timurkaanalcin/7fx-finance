"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";

type Row = {
  id: string;
  type: string;
  title: string | null;
  description: string;
  workerName: string | null;
  traderId: string;
  trader: string;
  traderEmail: string;
  desk: string | null;
  createdAt: string;
};

type TraderOpt = { id: string; name: string; email: string };

export default function CommunicationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [type, setType] = useState("");
  const [traders, setTraders] = useState<TraderOpt[]>([]);
  const [form, setForm] = useState({ userId: "", type: "NOTE", title: "", description: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const q = type ? `?type=${type}` : "";
    const res = await fetch(`/api/admin/communications${q}`);
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.communications || []);
  }, [type]);

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
            .map((u: TraderOpt & { role: string }) => ({ id: u.id, name: u.name, email: u.email }))
        )
      )
      .catch(() => {});
  }, []);

  async function create() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Kayıt başarısız");
        return;
      }
      setForm((f) => ({ ...f, title: "", description: "" }));
      setMsg("İletişim kaydı eklendi");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">İletişimler</h1>
      <p className="mb-3 text-[11px] text-slate-500">Chat / Call / Note kayıtları</p>
      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-lg border border-slate-800">
          <div className="border-b border-slate-800 bg-[#0a1020] px-3 py-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded border border-slate-700 bg-[#0d1526] px-2 py-1 text-xs"
            >
              <option value="">Tüm tipler</option>
              {["CHAT", "CALL", "NOTE"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#0a1020] text-slate-500">
              <tr>
                <th className="px-2 py-2">Tip</th>
                <th className="px-2 py-2">Başlık</th>
                <th className="px-2 py-2">Trader</th>
                <th className="px-2 py-2">Çalışan</th>
                <th className="px-2 py-2">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800 align-top">
                  <td className="px-2 py-1.5">
                    <StatusBadge status={r.type === "CALL" ? "OPEN" : r.type === "CHAT" ? "PENDING" : "NEW"} />
                    <span className="ml-1 text-slate-400">{r.type}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="font-medium">{r.title || "—"}</div>
                    <div className="max-w-[280px] truncate text-slate-500">{r.description}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <Link href={`/admin/traders/${r.traderId}`} className="text-sky-400 hover:underline">
                      {r.trader}
                    </Link>
                    <div className="text-slate-600">{r.desk || "—"}</div>
                  </td>
                  <td className="px-2 py-1.5 text-slate-400">{r.workerName || "—"}</td>
                  <td className="px-2 py-1.5 text-slate-500">
                    {new Date(r.createdAt).toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    Kayıt yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0a1020] p-3">
          <h2 className="mb-2 text-xs font-semibold text-slate-300">Yeni kayıt</h2>
          <div className="space-y-2 text-xs">
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            >
              <option value="">Trader seç…</option>
              {traders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            >
              {["NOTE", "CALL", "CHAT"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Başlık"
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Açıklama"
              rows={4}
              className="w-full rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
            />
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="w-full rounded bg-sky-600 px-3 py-1.5 text-xs font-medium hover:bg-sky-500 disabled:opacity-50"
            >
              Kaydet
            </button>
            {msg && <p className="text-[11px] text-slate-400">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
