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
      setMsg(data.error || "Error");
      return;
    }
    setName("");
    setCode("");
    setMsg("Desk created");
    await load();
  }

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Desks</h1>
      <form onSubmit={createDesk} className="mb-4 flex flex-wrap gap-2 text-xs">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Desk name"
          required
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Kod (opsiyonel)"
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5"
        />
        <button type="submit" className="rounded bg-black text-white px-3 py-1.5 hover:bg-neutral-800">
          Ekle
        </button>
        {msg && <span className="self-center text-emerald-400">{msg}</span>}
      </form>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Kod</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Chat</th>
              <th className="px-3 py-2">Min/Max</th>
              <th className="px-3 py-2">Trader</th>
              <th className="px-3 py-2">Worker</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {desks.map((d) => (
              <tr key={d.id} className="border-t border-neutral-200 hover:bg-[#ffffff]/50">
                <td className="px-3 py-2 font-medium">{d.name}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-neutral-500">{d.code || "—"}</td>
                <td className="px-3 py-2">{d.active ? "✓" : "✗"}</td>
                <td className="px-3 py-2">{d.chatStatus ? "Open" : "Closed"}</td>
                <td className="px-3 py-2 tabular-nums">
                  {d.minimalDeposit} / {d.maximumDeposit}
                </td>
                <td className="px-3 py-2">{d.tradersCount}</td>
                <td className="px-3 py-2">{d.workersCount}</td>
                <td className="px-3 py-2">
                  <Link href={`/admin/desks/${d.id}`} className="rounded bg-black text-white/80 px-2 py-1">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {desks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  No desks — seed or add above
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
