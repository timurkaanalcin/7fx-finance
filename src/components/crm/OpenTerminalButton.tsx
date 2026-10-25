"use client";

import { useState } from "react";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

/** Admin-only control. The server rejects anyone who is not an admin. */
export default function OpenTerminalButton({
  userId,
  returnTo,
  className,
}: {
  userId: string;
  returnTo?: string;
  className?: string;
}) {
  const { i18n } = useCrmLabels();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function openTerminal() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          returnTo: returnTo || `/izcrm/traders/${userId}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || i18n("crm.ui.impersonationFailed"));
        return;
      }
      window.location.href = data.redirect || "/trade";
    } catch {
      setErr(i18n("crm.ui.connectionError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        disabled={busy}
        onClick={openTerminal}
        data-open-terminal={userId}
        className={
          className ||
          "rounded bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        }
      >
        {i18n("crm.ui.openTerminal")}
      </button>
      {err ? <span className="max-w-[10rem] text-[10px] text-red-500">{err}</span> : null}
    </span>
  );
}
