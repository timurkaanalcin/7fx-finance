"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Desk = {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
  chatStatus: boolean;
  minimalDeposit: number;
  maximumDeposit: number;
  tradersCount: number;
  workersCount: number;
  createdAt: string;
};

export default function DesksPage() {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/desks");
    if (!res.ok) return;
    const data = await res.json();
    setDesks(data.desks || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createDesk(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/desks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code: code || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Hata");
      return;
    }
    setName("");
    setCode("");
    setMsg("Desk oluşturuldu");
    await load();
  }

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Desklar</h1>
      <form onSubmit={createDesk} className="mb-4 flex flex-wrap gap-2 text-xs">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Desk adı"
          required
          className="rounded border border-slate-700 bg-[#0a1020] px-2 py-1.5"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Kod (opsiyonel)"
          className="rounded border border-slate-700 bg-[#0a1020] px-2 py-1.5"
        />
        <button type="submit" className="rounded bg-sky-600 px-3 py-1.5 hover:bg-sky-500">
          Ekle
        </button>
        {msg && <span className="self-center text-emerald-400">{msg}</span>}
      </form>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0a1020] text-slate-500">
            <tr>
              <th className="px-3 py-2">Ad</th>
              <th className="px-3 py-2">Kod</th>
              <th className="px-3 py-2">Aktif</th>
              <th className="px-3 py-2">Chat</th>
              <th className="px-3 py-2">Min/Max</th>
              <th className="px-3 py-2">Trader</th>
              <th className="px-3 py-2">Çalışan</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {desks.map((d) => (
              <tr key={d.id} className="border-t border-slate-800 hover:bg-[#0a1020]/50">
                <td className="px-3 py-2 font-medium">{d.name}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{d.code || "—"}</td>
                <td className="px-3 py-2">{d.active ? "✓" : "✗"}</td>
                <td className="px-3 py-2">{d.chatStatus ? "Açık" : "Kapalı"}</td>
                <td className="px-3 py-2 tabular-nums">
                  {d.minimalDeposit} / {d.maximumDeposit}
                </td>
                <td className="px-3 py-2">{d.tradersCount}</td>
                <td className="px-3 py-2">{d.workersCount}</td>
                <td className="px-3 py-2">
                  <Link href={`/admin/desks/${d.id}`} className="rounded bg-sky-600/80 px-2 py-1">
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
            {desks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  Desk yok — seed veya yukarıdan ekleyin
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
