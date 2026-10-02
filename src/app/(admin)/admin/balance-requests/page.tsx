"use client";

import { fmtCrmDate } from "@/lib/crm-format";

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

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Approved",
  REJECTED: "Rejected",
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
        setMsg(data.error || "Action failed");
        return;
      }
      setMsg(
        action === "approve"
          ? "Approved — balance / positions updated"
          : "Rejected — account unchanged"
      );
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Margin / Balance Talepleri</h1>
        <div className="ml-auto flex gap-1">
          {["PENDING", "APPROVED", "REJECTED", ""].map((f) => (
            <button
              key={f || "ALL"}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-1 text-xs ${filter === f ? "bg-black text-white" : "bg-[#e5e5e5]"}`}
            >
              {f ? STATUS_LABEL[f] || f : "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-1 rounded-lg border border-[#e5e5e5] bg-[#ffffff]/50 p-3 text-[11px] text-neutral-500">
        <p className="font-medium text-slate-300">Kurallar (admin)</p>
        <p>
          {ruleTr ||
            `Margin call: equity ≤ 0 or margin level < %${MARGIN_CALL_LEVEL}. Balance reset approval → ${DEFAULT_RESET_BALANCE.toLocaleString("en-US")} USD + open positions are closed.`}
        </p>
        <p>
          <strong className="text-slate-300">Balance Reset (RESET):</strong> on approval open positions
          are closed (PnL is not applied to balance), pending orders cancelled, balance set to{" "}
          {DEFAULT_RESET_BALANCE.toLocaleString("en-US")} USD.
        </p>
        <p>
          <strong className="text-slate-300">Add Balance (ADD):</strong> on approval the requested amount is added to the balance
          is added. Reject: account stays as-is.
        </p>
      </div>

      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}
      <div className="overflow-x-auto rounded-lg border border-[#e5e5e5]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#e5e5e5] text-neutral-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Tip</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Equity / Marj%</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Trade</th>
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
                  {r.type === "RESET" ? "Balance Reset" : "Add Balance"}
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
                <td className="px-3 py-2">{STATUS_LABEL[r.status] || r.status}</td>
                <td className="px-3 py-2">
                  {r.status === "PENDING" ? (
                    <div className="flex gap-1">
                      <button
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "approve")}
                        className="rounded bg-emerald-600 px-2 py-1 hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "reject")}
                        className="rounded bg-red-600/80 px-2 py-1 hover:bg-red-500 disabled:opacity-50"
                      >
                        Reject
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
                  Registered yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
