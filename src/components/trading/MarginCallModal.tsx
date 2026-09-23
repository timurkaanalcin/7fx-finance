"use client";

import { FormEvent, useEffect, useState } from "react";
import { DEFAULT_RESET_BALANCE, MARGIN_CALL_LEVEL } from "@/lib/margin-call";
import { fmtMoney } from "@/lib/format";

export type BalanceRequestRow = {
  id: string;
  type: string;
  amount: number | null;
  status: string;
  reason: string;
  createdAt: string;
  reviewedAt?: string | null;
};

type Props = {
  open: boolean;
  equity: number;
  marginLevel: number;
  pendingRequest: BalanceRequestRow | null;
  onClose: () => void;
  onSubmitted: (req: BalanceRequestRow) => void;
};

const STATUS_TR: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
};

export default function MarginCallModal({
  open,
  equity,
  marginLevel,
  pendingRequest,
  onClose,
  onSubmitted,
}: Props) {
  const [mode, setMode] = useState<"choose" | "add">("choose");
  const [amount, setAmount] = useState("5000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode("choose");
    setError("");
    setSuccess("");
    setLoading(false);
  }, [open]);

  if (!open) return null;

  async function submit(type: "RESET" | "ADD", amt?: number) {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/balance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type === "ADD" ? { type, amount: amt } : { type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Talep gönderilemedi");
        if (data.request) onSubmitted(data.request);
        return;
      }
      setSuccess(
        type === "RESET"
          ? "Bakiye sıfırlama talebi gönderildi. Admin onayı bekleniyor."
          : "Bakiye ekleme talebi gönderildi. Admin onayı bekleniyor."
      );
      onSubmitted(data.request);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  function onAddSubmit(e: FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Geçerli tutar girin");
      return;
    }
    submit("ADD", amt);
  }

  const hasPending = pendingRequest?.status === "PENDING";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-red-500/40 bg-[#1e293b] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#3a4658] px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-red-400">Marjin Çağrısı</h2>
            <p className="text-[10px] text-slate-400">
              Özsermaye {fmtMoney(equity)} · Marj seviyesi %{marginLevel.toFixed(1)} (eşik %{MARGIN_CALL_LEVEL})
            </p>
          </div>
          {(hasPending || success) && (
            <button
              onClick={onClose}
              className="rounded px-2 py-1 text-slate-400 hover:bg-[#334155] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-3 p-4 text-sm">
          {hasPending && pendingRequest && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Bekleyen talep:{" "}
              <strong>{pendingRequest.type === "RESET" ? "Bakiye Sıfırlama" : "Bakiye Ekle"}</strong>
              {pendingRequest.type === "ADD" && pendingRequest.amount != null
                ? ` (${fmtMoney(pendingRequest.amount)})`
                : ""}{" "}
              — durum: <strong>{STATUS_TR[pendingRequest.status] || pendingRequest.status}</strong>
              <p className="mt-1 text-slate-400">
                Admin onaylayana kadar bakiye değişmez. Reddedilirse hesap aynı kalır.
              </p>
            </div>
          )}

          {!hasPending && !success && (
            <>
              <p className="text-xs text-slate-300">
                Hesabınız marjin çağrısı seviyesine düştü. Lütfen bir seçenek belirleyin. Seçiminiz{" "}
                <strong>admin onayı</strong> sonrası uygulanır; onaylanana kadar bakiye değişmez.
              </p>

              {mode === "choose" && (
                <div className="grid gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submit("RESET")}
                    className="rounded-lg border border-[#3a4658] bg-[#0f172a] px-4 py-3 text-left hover:border-blue-500 hover:bg-[#243044] disabled:opacity-60"
                  >
                    <div className="font-semibold text-slate-100">1. Bakiye Sıfırlama</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      Admin onayında bakiye {fmtMoney(DEFAULT_RESET_BALANCE)} yapılır; açık pozisyonlar
                      kapatılır.
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setMode("add")}
                    className="rounded-lg border border-[#3a4658] bg-[#0f172a] px-4 py-3 text-left hover:border-blue-500 hover:bg-[#243044] disabled:opacity-60"
                  >
                    <div className="font-semibold text-slate-100">2. Bakiye Ekle</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      Tutar girin; admin onayında bakiyenize eklenir.
                    </div>
                  </button>
                </div>
              )}

              {mode === "add" && (
                <form onSubmit={onAddSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-400">
                      Eklenecek tutar (USD)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-md border border-[#3a4658] bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("choose")}
                      className="flex-1 rounded-lg border border-[#3a4658] py-2 text-xs hover:bg-[#243044]"
                    >
                      Geri
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium hover:bg-blue-500 disabled:opacity-60"
                    >
                      {loading ? "Gönderiliyor…" : "Talep gönder"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {error && <div className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
          {success && (
            <div className="rounded bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{success}</div>
          )}

          {loading && mode === "choose" && !success && (
            <p className="text-center text-xs text-slate-400">Gönderiliyor…</p>
          )}
        </div>
      </div>
    </div>
  );
}

export { STATUS_TR };
