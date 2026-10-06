"use client";

import { useEffect, useState } from "react";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

type Perms = {
  tradingEnabled: boolean;
  withdrawalsEnabled: boolean;
  loginEnabled: boolean;
  loginBlockedMessage: string | null;
  loginBlockedAt: string | Date | null;
};

type Props = {
  userId: string;
  initial: Perms;
  canManage: boolean;
  isMainAdmin: boolean;
  onUpdated?: (p: Perms) => void;
};

type ConfirmState =
  | null
  | {
      key: "tradingEnabled" | "withdrawalsEnabled" | "loginEnabled";
      next: boolean;
    };

export default function AccountPermissionsPanel({
  userId,
  initial,
  canManage,
  isMainAdmin,
  onUpdated,
}: Props) {
  const { i18n } = useCrmLabels();
  const [perms, setPerms] = useState<Perms>(initial);
  const [reasonNote, setReasonNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [loginMsgDraft, setLoginMsgDraft] = useState(initial.loginBlockedMessage || "");

  useEffect(() => {
    setPerms(initial);
    setLoginMsgDraft(initial.loginBlockedMessage || "");
  }, [initial]);

  if (!canManage) return null;

  async function save(patch: Record<string, unknown>) {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, reasonNote: reasonNote.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error || res.status));
        return;
      }
      const next = data.permissions as Perms;
      setPerms(next);
      setLoginMsgDraft(next.loginBlockedMessage || "");
      setMsg(i18n("crm.perms.saved"));
      onUpdated?.(next);
    } catch {
      setErr(i18n("crm.ui.connectionError") || "Connection error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  function requestToggle(key: "tradingEnabled" | "withdrawalsEnabled" | "loginEnabled") {
    if (isMainAdmin) {
      setErr(i18n("crm.perms.mainAdminLocked"));
      return;
    }
    const next = !perms[key];
    if (!next) {
      setConfirm({ key, next });
      if (key === "loginEnabled") {
        setLoginMsgDraft(perms.loginBlockedMessage || "");
      }
      return;
    }
    void save({ [key]: true });
  }

  async function confirmDisable() {
    if (!confirm) return;
    if (confirm.key === "loginEnabled") {
      const m = loginMsgDraft.trim();
      if (!m) {
        setErr(i18n("crm.perms.loginMsgRequired"));
        return;
      }
      await save({ loginEnabled: false, loginBlockedMessage: m });
      return;
    }
    await save({ [confirm.key]: false });
  }

  async function saveLoginMessage() {
    if (isMainAdmin) return;
    const m = loginMsgDraft.trim();
    if (!m) {
      setErr(i18n("crm.perms.loginMsgRequired"));
      return;
    }
    await save({ loginBlockedMessage: m });
  }

  const rows: {
    key: "tradingEnabled" | "withdrawalsEnabled" | "loginEnabled";
    label: string;
    hint: string;
  }[] = [
    {
      key: "tradingEnabled",
      label: i18n("crm.perms.trading"),
      hint: i18n("crm.perms.tradingHint"),
    },
    {
      key: "withdrawalsEnabled",
      label: i18n("crm.perms.withdrawals"),
      hint: i18n("crm.perms.withdrawalsHint"),
    },
    {
      key: "loginEnabled",
      label: i18n("crm.perms.login"),
      hint: i18n("crm.perms.loginHint"),
    },
  ];

  return (
    <div className="mb-4 rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#111111]">{i18n("crm.perms.title")}</h2>
        {isMainAdmin && (
          <span className="text-[10px] text-amber-700">{i18n("crm.perms.mainAdminLocked")}</span>
        )}
      </div>
      <p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.perms.freezeNote")}</p>

      <div className="space-y-3">
        {rows.map((r) => {
          const on = perms[r.key];
          return (
            <div
              key={r.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e5e5] bg-white px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#111111]">{r.label}</div>
                <div className="text-[10px] text-neutral-500">{r.hint}</div>
              </div>
              <button
                type="button"
                disabled={busy || isMainAdmin}
                onClick={() => requestToggle(r.key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  on ? "bg-emerald-500" : "bg-neutral-300"
                } disabled:opacity-50`}
                aria-pressed={on}
                aria-label={r.label}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    on ? "left-5" : "left-0.5"
                  }`}
                />
                <span className="sr-only">{on ? i18n("crm.ui.active") : i18n("crm.ui.inactive")}</span>
              </button>
              <span
                className={`w-14 text-right text-[10px] font-semibold ${
                  on ? "text-emerald-700" : "text-neutral-500"
                }`}
              >
                {on ? i18n("crm.perms.aktif") : i18n("crm.perms.pasif")}
              </span>
            </div>
          );
        })}
      </div>

      {!perms.loginEnabled && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <label className="mb-1 block text-[11px] font-medium text-amber-900">
            {i18n("crm.perms.loginMsgLabel")}
          </label>
          <textarea
            value={loginMsgDraft}
            onChange={(e) => setLoginMsgDraft(e.target.value)}
            rows={4}
            disabled={busy || isMainAdmin}
            className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-2 text-xs text-[#111111]"
            placeholder={i18n("crm.perms.loginMsgPh")}
          />
          <button
            type="button"
            disabled={busy || isMainAdmin}
            onClick={() => void saveLoginMessage()}
            className="mt-2 rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            {i18n("crm.perms.saveLoginMsg")}
          </button>
        </div>
      )}

      <div className="mt-3">
        <label className="mb-1 block text-[11px] font-medium text-neutral-600">
          {i18n("crm.perms.reasonNote")}
        </label>
        <input
          value={reasonNote}
          onChange={(e) => setReasonNote(e.target.value)}
          disabled={busy || isMainAdmin}
          className="w-full rounded-lg border border-[#e5e5e5] bg-white px-2.5 py-1.5 text-xs"
          placeholder={i18n("crm.perms.reasonNotePh")}
        />
      </div>

      {(err || msg) && (
        <p className={`mt-2 text-[11px] ${err ? "text-red-600" : "text-emerald-600"}`}>{err || msg}</p>
      )}

      {confirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-[#111111]">{i18n("crm.perms.confirmTitle")}</h3>
            <p className="mt-2 text-xs text-neutral-600">
              {confirm.key === "tradingEnabled"
                ? i18n("crm.perms.confirmTrade")
                : confirm.key === "withdrawalsEnabled"
                  ? i18n("crm.perms.confirmWithdraw")
                  : i18n("crm.perms.confirmLogin")}
            </p>
            {confirm.key === "loginEnabled" && (
              <div className="mt-3">
                <label className="mb-1 block text-[11px] font-medium text-[#111111]">
                  {i18n("crm.perms.loginMsgLabel")} <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={loginMsgDraft}
                  onChange={(e) => setLoginMsgDraft(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-[#e5e5e5] px-2.5 py-2 text-xs"
                  placeholder={i18n("crm.perms.loginMsgPh")}
                  required
                />
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-[#e5e5e5] px-3 py-1.5 text-xs"
                onClick={() => setConfirm(null)}
                disabled={busy}
              >
                {i18n("crm.ui.cancel")}
              </button>
              <button
                type="button"
                className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                onClick={() => void confirmDisable()}
                disabled={busy}
              >
                {i18n("crm.perms.confirmDisable")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
