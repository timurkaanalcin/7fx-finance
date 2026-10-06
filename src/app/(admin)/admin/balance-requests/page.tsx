"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { fmtCrmDate } from "@/lib/crm-format";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_RESET_BALANCE } from "@/lib/margin-call";

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

export default function AdminBalanceRequestsPage() {
  const { i18n, code } = useCrmLabels();
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
        setMsg(data.error || i18n("crm.ui.actionFailed"));
        return;
      }
      setMsg(action === "approve" ? i18n("crm.bal.approved") : i18n("crm.bal.rejected"));
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{i18n("crm.bal.title")}</h1>
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

      <div className="mb-4 space-y-1 rounded-lg border border-[#e5e5e5] bg-[#ffffff]/50 p-3 text-[11px] text-neutral-500">
        <p className="font-medium text-neutral-600">{i18n("crm.bal.rules")}</p>
        <p>{ruleTr || i18n("crm.bal.resetLine")}</p>
        <p>{i18n("crm.bal.addLine")}</p>
        <p>{i18n("crm.bal.rejected")}</p>
      </div>

      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}
      <div className="overflow-x-auto rounded-lg border border-[#e5e5e5]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-black/10 bg-white text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.date")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.user")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.type")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.amount")}</th>
              <th className="px-3 py-2">{i18n("crm.bal.marginPct")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.status")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#e5e5e5]">
                <td className="px-3 py-2 whitespace-nowrap">
                  {fmtCrmDate(r.createdAt)}
                </td>
                <td className="px-3 py-2">
                  <div>{r.user.name}</div>
                  <div className="text-neutral-500">{r.user.email}</div>
                </td>
                <td className="px-3 py-2">
                  {r.type === "RESET" ? i18n("crm.bal.reset") : i18n("crm.bal.add")}
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
