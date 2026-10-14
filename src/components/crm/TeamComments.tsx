"use client";

import { useState } from "react";
import { fmtCrmDate } from "@/lib/crm-format";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

type Note = { id: string; body?: unknown; authorName?: unknown; team?: unknown; createdAt?: unknown };

/**
 * Separate comment areas for the Sale manager and the Ret (retention) manager.
 * Stored as UserNote rows with team = SALE | RET; time is stamped by the server (now).
 */
export default function TeamComments({
  userId,
  notes,
  readOnly,
  onChanged,
}: {
  userId: string;
  notes: Note[];
  readOnly?: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const { i18n } = useCrmLabels();
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2" data-fx-team-comments>
      <Area team="SALE" title={i18n("crm.ui.saleComments", "Sale yorumları")} {...{ userId, notes, readOnly, onChanged }} />
      <Area team="RET" title={i18n("crm.ui.retComments", "Ret yorumları")} {...{ userId, notes, readOnly, onChanged }} />
    </div>
  );
}

function Area({
  team,
  title,
  userId,
  notes,
  readOnly,
  onChanged,
}: {
  team: "SALE" | "RET";
  title: string;
  userId: string;
  notes: Note[];
  readOnly?: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const { i18n } = useCrmLabels();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const list = notes.filter((n) => n.team === team);
  async function add() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "note", body, team }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setText("");
        await onChanged();
      } else setMsg(String(d.error || i18n("crm.ret.error", "Hata")));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded border border-black/10 p-3 text-xs" data-fx-team-comments-area={team}>
      <div className="mb-2 font-semibold">{title}</div>
      {!readOnly && (
        <div className="mb-2 flex flex-col gap-1">
          <textarea
            className="rounded border px-2 py-1"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={i18n("crm.ui.addComment", "Yorum ekle")}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={add}
              disabled={busy || !text.trim()}
              className="rounded bg-black px-3 py-1 text-white disabled:opacity-40"
            >
              {i18n("crm.ui.addComment", "Yorum ekle")}
            </button>
            {msg ? <span className="text-red-600">{msg}</span> : null}
          </div>
        </div>
      )}
      {list.length ? (
        <ul className="max-h-56 space-y-1 overflow-auto">
          {list.map((n) => (
            <li key={n.id} className="text-neutral-700">
              <span className="text-neutral-400">
                {fmtCrmDate(String(n.createdAt || ""))} · {String(n.authorName || "—")}:
              </span>{" "}
              <span className="whitespace-pre-wrap">{String(n.body || "")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-neutral-400">{i18n("crm.ui.noComments", "Henüz yorum yok")}</div>
      )}
    </div>
  );
}
