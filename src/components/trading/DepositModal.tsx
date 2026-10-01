"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

export type DepositMethod = {
  id: string;
  type: "IBAN" | "CRYPTO" | string;
  label: string;
  active: boolean;
  bankName?: string | null;
  accountHolder?: string | null;
  iban?: string | null;
  asset?: string | null;
  network?: string | null;
  address?: string | null;
  instructions?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function DepositModal({ open, onClose, onSubmitted }: Props) {
  const [methods, setMethods] = useState<DepositMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"IBAN" | "CRYPTO">("IBAN");
  const [methodId, setMethodId] = useState("");
  const [amount, setAmount] = useState("1000");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccess("");
    setLoading(true);
    fetch("/api/deposit/methods")
      .then((r) => r.json())
      .then((d) => {
        const list: DepositMethod[] = d.methods || [];
        setMethods(list);
        const hasIban = list.some((m) => m.type === "IBAN");
        const hasCrypto = list.some((m) => m.type === "CRYPTO");
        const initialTab = hasIban ? "IBAN" : hasCrypto ? "CRYPTO" : "IBAN";
        setTab(initialTab);
        const first = list.find((m) => m.type === initialTab);
        setMethodId(first?.id || "");
      })
      .catch(() => setError("Yöntemler yüklenemedi"))
      .finally(() => setLoading(false));
  }, [open]);

  const availableTypes = useMemo(() => {
    const types: ("IBAN" | "CRYPTO")[] = [];
    if (methods.some((m) => m.type === "IBAN")) types.push("IBAN");
    if (methods.some((m) => m.type === "CRYPTO")) types.push("CRYPTO");
    return types;
  }, [methods]);

  const filtered = methods.filter((m) => m.type === tab);
  const selected = filtered.find((m) => m.id === methodId) || filtered[0];

  useEffect(() => {
    if (filtered.length && !filtered.some((m) => m.id === methodId)) {
      setMethodId(filtered[0].id);
    }
  }, [tab, filtered, methodId]);

  if (!open) return null;

  async function onCopy(label: string, value: string) {
    const ok = await copyText(value);
    setCopied(ok ? label : "");
    setTimeout(() => setCopied(""), 2000);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selected) {
      setError("Aktif yöntem yok");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Geçerli tutar girin");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methodId: selected.id, amount: amt, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Talep gönderilemedi");
        return;
      }
      setSuccess("Bildirim gönderildi. Admin onayından sonra bakiyenize yansır.");
      onSubmitted?.();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-modal border border-desk-border bg-desk-panel shadow-desk-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-desk-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-wide">Para Yatırma</h2>
          <button onClick={onClose} className="rounded-[8px] px-2 py-1 text-desk-muted hover:bg-desk-hover hover:text-desk-text">
            ✕
          </button>
        </div>

        <div className="p-4">
          {availableTypes.length === 0 && !loading && (
            <p className="text-sm text-desk-muted">Şu an aktif yatırma yöntemi yok. Lütfen daha sonra tekrar deneyin.</p>
          )}

          {availableTypes.length > 0 && (
            <>
              <div className="mb-3 flex gap-1 rounded-control border border-desk-border bg-desk-bg p-1">
                {availableTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
                      tab === t ? "bg-desk-accent text-desk-accent-ink" : "text-desk-muted hover:bg-desk-hover"
                    }`}
                  >
                    {t === "IBAN" ? "IBAN / Havale" : "Kripto"}
                  </button>
                ))}
              </div>

              {filtered.length > 1 && (
                <select
                  className="mb-3 w-full rounded-[10px] border border-desk-border bg-desk-bg px-2 py-2 text-xs text-desk-text"
                  value={selected?.id || ""}
                  onChange={(e) => setMethodId(e.target.value)}
                >
                  {filtered.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              )}

              {selected && (
                <div className="mb-3 space-y-2 rounded-[12px] border border-desk-border bg-desk-bg/60 p-3 text-xs">
                  <div className="font-medium text-desk-text">{selected.label}</div>
                  {selected.type === "IBAN" && (
                    <>
                      {selected.bankName && (
                        <div className="flex justify-between gap-2">
                          <span className="text-desk-muted">Banka</span>
                          <span>{selected.bankName}</span>
                        </div>
                      )}
                      {selected.accountHolder && (
                        <div className="flex justify-between gap-2">
                          <span className="text-desk-muted">Alıcı</span>
                          <span className="text-right">{selected.accountHolder}</span>
                        </div>
                      )}
                      {selected.iban && (
                        <div className="flex items-start justify-between gap-2">
                          <span className="shrink-0 text-desk-muted">IBAN</span>
                          <div className="flex items-center gap-2">
                            <code className="break-all text-right text-[11px]">{selected.iban}</code>
                            <button
                              type="button"
                              onClick={() => onCopy("iban", selected.iban!)}
                              className="shrink-0 rounded-[8px] bg-desk-accent/90 px-2 py-0.5 text-[10px] text-desk-accent-ink hover:bg-desk-accent"
                            >
                              {copied === "iban" ? "Kopyalandı" : "Kopyala"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {selected.type === "CRYPTO" && (
                    <>
                      <div className="flex justify-between gap-2">
                        <span className="text-desk-muted">Varlık</span>
                        <span>{selected.asset}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-desk-muted">Ağ</span>
                        <span>{selected.network}</span>
                      </div>
                      {selected.address && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-desk-muted">Cüzdan</span>
                            <button
                              type="button"
                              onClick={() => onCopy("addr", selected.address!)}
                              className="rounded-[8px] bg-desk-accent/90 px-2 py-0.5 text-[10px] text-desk-accent-ink hover:bg-desk-accent"
                            >
                              {copied === "addr" ? "Kopyalandı" : "Kopyala"}
                            </button>
                          </div>
                          <code className="block break-all rounded-[8px] bg-desk-bg p-2 text-[11px]">{selected.address}</code>
                          <div className="mt-2 flex justify-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-[10px] border border-dashed border-desk-border bg-desk-bg text-[10px] text-desk-muted">
                              QR stub
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {selected.instructions && (
                    <p className="border-t border-desk-border pt-2 text-desk-muted">{selected.instructions}</p>
                  )}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-desk-muted">Tutar (USD)</label>
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
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-desk-muted">Not (opsiyonel)</label>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="İşlem referansı / tx hash"
                    className="w-full rounded-[10px] border border-desk-border bg-desk-bg px-3 py-2 text-sm text-desk-text outline-none focus:border-desk-accent"
                  />
                </div>
                {error && <div className="rounded-[10px] bg-desk-sell/10 px-3 py-2 text-xs text-desk-sell">{error}</div>}
                {success && <div className="rounded-[10px] bg-desk-buy/10 px-3 py-2 text-xs text-desk-buy">{success}</div>}
                <button
                  type="submit"
                  disabled={loading || !selected}
                  className="w-full rounded-control bg-desk-accent py-2.5 text-sm font-semibold text-desk-accent-ink shadow-accent-glow-sm hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? "Gönderiliyor…" : "Bildirim gönder"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
