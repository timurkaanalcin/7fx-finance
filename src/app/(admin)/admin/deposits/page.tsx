"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { fmtCrmDate } from "@/lib/crm-format";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; email: string; name: string };
  method: { label: string; type: string };
};

export default function AdminDepositsPage() {
  const { i18n, code, deskName } = useCrmLabels();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const q = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/deposits${q}`);
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.requests || []);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    setMsg("");
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || i18n("crm.ui.actionFailed"));
        return;
      }
      setMsg(action === "approve" ? i18n("crm.dep.approved") : i18n("crm.dep.rejected"));
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{i18n("crm.dep.title")}</h1>
        <div className="ml-auto flex gap-1">
          {["PENDING", "APPROVED", "REJECTED", ""].map((f) => (
            <button
              key={f || "ALL"}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-1 text-xs ${filter === f ? "bg-black text-white" : "bg-[#e5e5e5]"}`}
            >
              {f ? code("crm.status", f) : i18n("crm.ui.all")}
            </button>
          ))}
        </div>
      </div>
      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}
      <div className="overflow-x-auto rounded-lg border border-[#e5e5e5]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#e5e5e5] text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.date")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.user")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.method")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.amount")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.note")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.status")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#e5e5e5]">
                <td className="px-3 py-2 whitespace-nowrap">{fmtCrmDate(r.createdAt)}</td>
                <td className="px-3 py-2">
                  <div>{r.user.name}</div>
                  <div className="text-neutral-500">{r.user.email}</div>
                </td>
                <td className="px-3 py-2">
                  {r.method.type} · {r.method.label}
                </td>
                <td className="px-3 py-2 tabular-nums font-medium">
                  {r.amount.toLocaleString("en-US", { style: "currency", currency: r.currency || "USD" })}
                </td>
                <td className="px-3 py-2 max-w-[160px] truncate text-neutral-500">{r.note || "—"}</td>
                <td className="px-3 py-2">{code("crm.status", r.status)}</td>
                <td className="px-3 py-2">
                  {r.status === "PENDING" ? (
                    <div className="flex gap-1">
                      <button
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "approve")}
                        className="rounded bg-emerald-600 px-2 py-1 hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {i18n("crm.ui.approve")}
                      </button>
                      <button
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "reject")}
                        className="rounded bg-red-600/80 px-2 py-1 hover:bg-red-500 disabled:opacity-50"
                      >
                        {i18n("crm.ui.reject")}
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
                  {i18n("crm.ui.noRecords")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
