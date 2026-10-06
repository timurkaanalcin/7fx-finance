"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { MARGIN_CALL_LEVEL } from "@/lib/margin-call";
import { fmtMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";

export type BalanceRequestRow = {
  id: string;
  type: string;
  amount: number | null;
  status: string;
  reason: string;
  createdAt: string;
  reviewedAt?: string | null;
  riskAcknowledged?: boolean;
  riskAcknowledgedAt?: string | null;
};

type Props = {
  open: boolean;
  equity: number;
  marginLevel: number;
  currency?: string;
  pendingRequest: BalanceRequestRow | null;
  onClose: () => void;
  onSubmitted: (req: BalanceRequestRow) => void;
};

/** English fallbacks (kept for legacy imports). Prefer `t("terminal.mc.status.<STATUS>")`. */
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function MarginCallModal({
  open,
  equity,
  marginLevel,
  currency = "USD",
  pendingRequest,
  onClose,
  onSubmitted,
}: Props) {
  const { t, dir } = useI18n();
  const ackId = useId();
  const [amount, setAmount] = useState("5000");
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) return;
    setAck(false);
    setError("");
    setSuccess("");
    setLoading(false);
  }, [open]);

  if (!open) return null;

  const amt = Number(String(amount).replace(",", "."));
  const amountValid = Number.isFinite(amt) && amt > 0 && amt <= 1_000_000;
  const canContinue = ack && amountValid && !loading;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amountValid) {
      setError(t("terminal.mc.invalidAmount"));
      return;
    }
    if (!ack) {
      setError(t("terminal.mc.ackRequired"));
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/balance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ADD", amount: amt, riskAcknowledged: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) setError(t("terminal.mc.alreadyPending"));
        else if (data.code === "RISK_ACK_REQUIRED") setError(t("terminal.mc.ackRequired"));
        else if (data.code === "INVALID_AMOUNT") setError(t("terminal.mc.invalidAmount"));
        else setError(data.error || t("terminal.mc.submitFailed"));
        if (data.request) onSubmitted(data.request);
        return;
      }
      setSuccess(t("terminal.mc.submitted"));
      onSubmitted(data.request);
    } catch {
      setError(t("terminal.mc.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  const hasPending = pendingRequest?.status === "PENDING";
  const statusText = (s: string) => {
    const k = `terminal.mc.status.${s}`;
    const v = t(k);
    return v === k ? STATUS_LABEL[s] || s : v;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]">
      <div
        dir={dir}
        role="dialog"
        aria-modal="true"
        aria-labelledby="margin-call-title"
        className="w-full max-w-md rounded-modal border border-desk-sell/40 bg-desk-panel shadow-desk-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-desk-border px-4 py-3">
          <div>
            <h2 id="margin-call-title" className="text-sm font-semibold tracking-wide text-desk-sell">
              {t("terminal.mc.title")}
            </h2>
            <p className="text-[10px] text-desk-muted">
              {t("terminal.mc.equity")} {fmtMoney(equity, 2, currency)} · {t("terminal.mc.marginLevel")} %
              {marginLevel.toFixed(1)} ({t("terminal.mc.threshold")} %{MARGIN_CALL_LEVEL})
            </p>
          </div>
          {(hasPending || success) && (
            <button
              type="button"
              aria-label={t("common.close")}
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
              {t("terminal.mc.pendingLabel")}{" "}
              <strong>{t("terminal.mc.addBalance")}</strong>
              {pendingRequest.amount != null ? ` (${fmtMoney(pendingRequest.amount, 2, currency)})` : ""} —{" "}
              {t("terminal.mc.statusLabel")} <strong>{statusText(pendingRequest.status)}</strong>
              <p className="mt-1 text-desk-muted">{t("terminal.mc.pendingHint")}</p>
            </div>
          )}

          {!hasPending && !success && (
            <form onSubmit={onSubmit} className="space-y-3">
              <p className="text-xs text-desk-text/90">{t("terminal.mc.intro")}</p>

              <div className="rounded-[12px] border border-desk-border bg-desk-bg px-4 py-3">
                <div className="font-semibold text-desk-text">{t("terminal.mc.addBalance")}</div>
                <div className="mt-0.5 text-[11px] text-desk-muted">{t("terminal.mc.addBalanceDesc")}</div>
                <label className="mb-1 mt-3 block text-[10px] uppercase tracking-wide text-desk-muted">
                  {t("terminal.mc.amountLabel")} ({currency})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={1000000}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-[10px] border border-desk-border bg-desk-panel px-3 py-2 text-sm text-desk-text outline-none focus:border-desk-accent"
                  required
                />
              </div>

              <label
                htmlFor={ackId}
                className={`flex cursor-pointer items-start gap-2.5 rounded-[12px] border px-3 py-2.5 text-[11px] leading-snug transition-colors ${
                  ack ? "border-desk-accent/60 bg-desk-hover text-desk-text" : "border-desk-border text-desk-text/85 hover:bg-desk-hover"
                }`}
              >
                <input
                  id={ackId}
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-white"
                />
                <span>{t("terminal.mc.riskAck")}</span>
              </label>

              <button
                type="submit"
                disabled={!canContinue}
                className="w-full rounded-control bg-desk-accent py-2.5 text-xs font-semibold text-desk-accent-ink shadow-accent-glow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100"
              >
                {loading ? t("terminal.mc.submitting") : t("terminal.mc.continue")}
              </button>
            </form>
          )}

          {error && <div className="rounded-[10px] bg-desk-sell/10 px-3 py-2 text-xs text-desk-sell">{error}</div>}
          {success && <div className="rounded-[10px] bg-desk-buy/10 px-3 py-2 text-xs text-desk-buy">{success}</div>}
        </div>
      </div>
    </div>
  );
}

export { STATUS_LABEL };
