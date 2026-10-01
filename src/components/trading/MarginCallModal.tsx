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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md rounded-modal border border-desk-sell/40 bg-desk-panel shadow-desk-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-desk-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-desk-sell">Marjin Çağrısı</h2>
            <p className="text-[10px] text-desk-muted">
              Özsermaye {fmtMoney(equity)} · Marj seviyesi %{marginLevel.toFixed(1)} (eşik %{MARGIN_CALL_LEVEL})
            </p>
          </div>
          {(hasPending || success) && (
            <button
              onClick={onClose}
              className="rounded-[8px] px-2 py-1 text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-3 p-4 text-sm">
          {hasPending && pendingRequest && (
            <div className="rounded-[12px] border border-desk-warn/40 bg-desk-warn/10 px-3 py-2 text-xs text-desk-warn">
              Bekleyen talep:{" "}
              <strong>{pendingRequest.type === "RESET" ? "Bakiye Sıfırlama" : "Bakiye Ekle"}</strong>
              {pendingRequest.type === "ADD" && pendingRequest.amount != null
                ? ` (${fmtMoney(pendingRequest.amount)})`
                : ""}{" "}
              — durum: <strong>{STATUS_TR[pendingRequest.status] || pendingRequest.status}</strong>
              <p className="mt-1 text-desk-muted">
                Admin onaylayana kadar bakiye değişmez. Reddedilirse hesap aynı kalır.
              </p>
            </div>
          )}

          {!hasPending && !success && (
            <>
              <p className="text-xs text-desk-text/90">
                Hesabınız marjin çağrısı seviyesine düştü. Lütfen bir seçenek belirleyin. Seçiminiz{" "}
                <strong>admin onayı</strong> sonrası uygulanır; onaylanana kadar bakiye değişmez.
              </p>

              {mode === "choose" && (
                <div className="grid gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submit("RESET")}
                    className="rounded-[12px] border border-desk-border bg-desk-bg px-4 py-3 text-left hover:border-desk-accent hover:bg-desk-hover disabled:opacity-60"
                  >
                    <div className="font-semibold text-desk-text">1. Bakiye Sıfırlama</div>
                    <div className="mt-0.5 text-[11px] text-desk-muted">
                      Admin onayında bakiye {fmtMoney(DEFAULT_RESET_BALANCE)} yapılır; açık pozisyonlar
                      kapatılır.
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setMode("add")}
                    className="rounded-[12px] border border-desk-border bg-desk-bg px-4 py-3 text-left hover:border-desk-accent hover:bg-desk-hover disabled:opacity-60"
                  >
                    <div className="font-semibold text-desk-text">2. Bakiye Ekle</div>
                    <div className="mt-0.5 text-[11px] text-desk-muted">
                      Tutar girin; admin onayında bakiyenize eklenir.
                    </div>
                  </button>
                </div>
              )}

              {mode === "add" && (
                <form onSubmit={onAddSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wide text-desk-muted">
                      Eklenecek tutar (USD)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-[10px] border border-desk-border bg-desk-bg px-3 py-2 text-sm text-desk-text outline-none focus:border-desk-accent"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("choose")}
                      className="flex-1 rounded-[10px] border border-desk-border py-2 text-xs hover:bg-desk-hover"
                    >
                      Geri
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-control bg-desk-accent py-2 text-xs font-semibold text-desk-accent-ink shadow-accent-glow-sm hover:brightness-110 disabled:opacity-60"
                    >
                      {loading ? "Gönderiliyor…" : "Talep gönder"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {error && <div className="rounded-[10px] bg-desk-sell/10 px-3 py-2 text-xs text-desk-sell">{error}</div>}
          {success && (
            <div className="rounded-[10px] bg-desk-buy/10 px-3 py-2 text-xs text-desk-buy">{success}</div>
          )}

          {loading && mode === "choose" && !success && (
            <p className="text-center text-xs text-desk-muted">Gönderiliyor…</p>
          )}
        </div>
      </div>
    </div>
  );
}

export { STATUS_TR };
