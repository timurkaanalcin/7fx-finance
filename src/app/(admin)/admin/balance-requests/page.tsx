"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_RESET_BALANCE, MARGIN_CALL_LEVEL } from "@/lib/margin-call";

type Row = {
  id: string;
  type: string;
  amount: number | null;
  status: string;
  reason: string;
  equityAt: number | null;
  marginLvl: number | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; email: string; name: string };
};

const STATUS_TR: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
};

export default function AdminBalanceRequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [ruleTr, setRuleTr] = useState("");

  const load = useCallback(async () => {
    const q = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/balance-requests${q}`);
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.requests || []);
    if (data.config?.ruleTr) setRuleTr(data.config.ruleTr);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    setMsg("");
    try {
      const res = await fetch("/api/admin/balance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "İşlem başarısız");
        return;
      }
      setMsg(
        action === "approve"
          ? "Onaylandı — bakiye / pozisyonlar güncellendi"
          : "Reddedildi — hesap değiştirilmedi"
      );
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Marjin / Bakiye Talepleri</h1>
        <div className="ml-auto flex gap-1">
          {["PENDING", "APPROVED", "REJECTED", ""].map((f) => (
            <button
              key={f || "ALL"}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-1 text-xs ${filter === f ? "bg-black text-white" : "bg-[#e5e5e5]"}`}
            >
              {f ? STATUS_TR[f] || f : "Tümü"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-1 rounded-lg border border-[#e5e5e5] bg-[#ffffff]/50 p-3 text-[11px] text-neutral-500">
        <p className="font-medium text-slate-300">Kurallar (admin)</p>
        <p>
          {ruleTr ||
            `Marjin çağrısı: özsermaye ≤ 0 veya marj seviyesi < %${MARGIN_CALL_LEVEL}. Bakiye sıfırlama onayı → ${DEFAULT_RESET_BALANCE.toLocaleString("en-US")} USD + açık pozisyonlar kapatılır.`}
        </p>
        <p>
          <strong className="text-slate-300">Bakiye Sıfırlama (RESET):</strong> onayda açık pozisyonlar
          kapatılır (PnL bakiyeye uygulanmaz), bekleyen emirler iptal, bakiye{" "}
          {DEFAULT_RESET_BALANCE.toLocaleString("en-US")} USD yapılır.
        </p>
        <p>
          <strong className="text-slate-300">Bakiye Ekle (ADD):</strong> onayda istenen tutar bakiyeye
          eklenir. Red: hesap olduğu gibi kalır.
        </p>
      </div>

      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}
      <div className="overflow-x-auto rounded-lg border border-[#e5e5e5]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#e5e5e5] text-neutral-500">
            <tr>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Kullanıcı</th>
              <th className="px-3 py-2">Tip</th>
              <th className="px-3 py-2">Tutar</th>
              <th className="px-3 py-2">Özsermaye / Marj%</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#e5e5e5]">
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString("tr-TR")}
                </td>
                <td className="px-3 py-2">
                  <div>{r.user.name}</div>
                  <div className="text-neutral-500">{r.user.email}</div>
                </td>
                <td className="px-3 py-2">
                  {r.type === "RESET" ? "Bakiye Sıfırlama" : "Bakiye Ekle"}
                </td>
                <td className="px-3 py-2 tabular-nums font-medium">
                  {r.type === "ADD" && r.amount != null
                    ? r.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
                    : `→ ${DEFAULT_RESET_BALANCE.toLocaleString("en-US")} USD`}
                </td>
                <td className="px-3 py-2 tabular-nums text-neutral-500">
                  {r.equityAt != null ? r.equityAt.toFixed(2) : "—"} /{" "}
                  {r.marginLvl != null ? `%${r.marginLvl.toFixed(1)}` : "—"}
                </td>
                <td className="px-3 py-2">{STATUS_TR[r.status] || r.status}</td>
                <td className="px-3 py-2">
                  {r.status === "PENDING" ? (
                    <div className="flex gap-1">
                      <button
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "approve")}
                        className="rounded bg-emerald-600 px-2 py-1 hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Onayla
                      </button>
                      <button
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "reject")}
                        className="rounded bg-red-600/80 px-2 py-1 hover:bg-red-500 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                    </div>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">
                  Kayıt yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
