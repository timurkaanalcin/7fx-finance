"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Msg = { id: string; title: string | null; body: string; workerName: string | null; createdAt: string };
type Thread = {
  traderId: string;
  trader: string;
  traderEmail: string;
  desk: string | null;
  active: boolean;
  lastAt: string;
  messages: Msg[];
};
type TraderOpt = { id: string; name: string; email: string };

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [traders, setTraders] = useState<TraderOpt[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/chat");
    if (!res.ok) return;
    const data = await res.json();
    setThreads(data.threads || []);
    setTraders(data.traders || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = threads.find((t) => t.traderId === selected) || null;

  async function send(userId: string) {
    if (!message.trim() || !userId) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Gönderilemedi");
        return;
      }
      setMessage("");
      setSelected(userId);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Sohbet</h1>
      <p className="mb-3 text-[11px] text-slate-500">Trader iletişim notları — CHAT kayıtları</p>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <div className="bg-[#0a1020] px-3 py-2 text-[11px] text-slate-500">Konuşmalar ({threads.length})</div>
          <ul className="max-h-[480px] overflow-y-auto divide-y divide-slate-800">
            {threads.map((t) => (
              <li key={t.traderId}>
                <button
                  type="button"
                  onClick={() => setSelected(t.traderId)}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-800/40 ${
                    selected === t.traderId ? "bg-sky-950/40" : ""
                  }`}
                >
                  <div className="font-medium">{t.trader}</div>
                  <div className="truncate text-[10px] text-slate-500">
                    {t.messages[t.messages.length - 1]?.body || t.traderEmail}
                  </div>
                </button>
              </li>
            ))}
            {threads.length === 0 && (
              <li className="px-3 py-6 text-center text-slate-500 text-xs">Sohbet yok</li>
            )}
          </ul>
        </div>
        <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-[#0a1020] flex flex-col min-h-[420px]">
          {active ? (
            <>
              <div className="border-b border-slate-800 px-3 py-2 flex justify-between items-center">
                <div>
                  <Link href={`/admin/traders/${active.traderId}`} className="text-sm font-medium text-sky-400 hover:underline">
                    {active.trader}
                  </Link>
                  <div className="text-[10px] text-slate-500">
                    {active.traderEmail} · {active.desk || "—"}
                  </div>
                </div>
                <span className={`text-[10px] ${active.active ? "text-emerald-400" : "text-red-400"}`}>
                  {active.active ? "Aktif" : "Donuk"}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {active.messages.map((m) => (
                  <div key={m.id} className="rounded-lg bg-[#0d1526] border border-slate-800 px-3 py-2 text-xs">
                    <div className="text-[10px] uppercase text-slate-500">
                      {m.workerName || "worker"} · {new Date(m.createdAt).toLocaleString("tr-TR")}
                    </div>
                    {m.title && <div className="mt-0.5 font-medium text-slate-300">{m.title}</div>}
                    <p className="mt-1 text-slate-200 whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-800 p-3 flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesaj yaz…"
                  className="flex-1 rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send(active.traderId);
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => send(active.traderId)}
                  className="rounded bg-sky-600 px-3 py-1.5 text-xs font-medium hover:bg-sky-500 disabled:opacity-50"
                >
                  Gönder
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-xs text-slate-500">
              <p>Soldan bir konuşma seçin veya yeni başlatın</p>
              <div className="flex w-full max-w-md flex-col gap-2">
                <select
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
                >
                  <option value="">Trader seç…</option>
                  {traders.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="İlk mesaj"
                  className="rounded border border-slate-700 bg-[#0d1526] px-2 py-1.5"
                />
                <button
                  type="button"
                  disabled={busy || !newUserId}
                  onClick={() => send(newUserId)}
                  className="rounded bg-sky-600 px-3 py-1.5 font-medium hover:bg-sky-500 disabled:opacity-50"
                >
                  Konuşma başlat
                </button>
              </div>
              {msg && <p className="text-amber-400">{msg}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
