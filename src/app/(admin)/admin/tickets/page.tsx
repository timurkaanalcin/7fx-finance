"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";

type Ticket = {
  id: string;
  kind: "DEPOSIT" | "MARGIN" | "WITHDRAW";
  amount: number | null;
  currency: string;
  status: string;
  method: string;
  customer: string;
  customerId: string;
  customerEmail: string;
  tradingAccountId: string | null;
  country: string | null;
  openedAt: string;
  closedAt: string | null;
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [kind, setKind] = useState("all");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (kind !== "all") params.set("kind", kind);
    const res = await fetch(`/api/admin/tickets?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setTickets(data.tickets || []);
  }, [status, kind]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(t: Ticket, action: "approve" | "reject") {
    setBusy(true);
    setMsg("");
    try {
      const url =
        t.kind === "DEPOSIT"
          ? "/api/admin/deposits"
          : t.kind === "WITHDRAW"
            ? "/api/admin/withdrawals"
            : "/api/admin/balance-requests";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Action failed");
        return;
      }
      setMsg(
        action === "approve"
          ? "Approved — trading balance updated"
          : "Rejected"
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Tickets / Deposits</h1>
      <p className="mb-3 text-[11px] text-neutral-500">
        Deposit, withdrawal and margin-call requests are listed here. Approval
        credits the trader&apos;s 1:1 trading account balance.
      </p>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">All statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5"
        >
          <option value="all">All types</option>
          <option value="deposit">Deposit</option>
          <option value="margin">Margin</option>
          <option value="withdraw">Para Withdrawal</option>
        </select>
        <Link href="/admin/deposits" className="rounded bg-neutral-100 px-2 py-1.5 hover:bg-neutral-200">
          Legacy deposit screen
        </Link>
        <Link
          href="/admin/balance-requests"
          className="rounded bg-neutral-100 px-2 py-1.5 hover:bg-neutral-200"
        >
          Legacy margin screen
        </Link>
      </div>
      {msg && <p className="mb-2 text-xs text-emerald-400">{msg}</p>}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-2 py-2">Tip</th>
              <th className="px-2 py-2">Amount</th>
              <th className="px-2 py-2">Client</th>
              <th className="px-2 py-2">Account</th>
              <th className="px-2 py-2">Method</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Open</th>
              <th className="px-2 py-2">Trade</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={`${t.kind}-${t.id}`} className="border-t border-neutral-200">
                <td className="px-2 py-1.5">
                  <span
                    className={`rounded px-1 py-0.5 text-[9px] ${
                      t.kind === "DEPOSIT"
                        ? "bg-sky-500/20 text-sky-300"
                        : t.kind === "WITHDRAW"
                          ? "bg-violet-500/20 text-violet-300"
                          : "bg-amber-500/20 text-amber-700"
                    }`}
                  >
                    {t.kind}
                  </span>
                </td>
                <td className="px-2 py-1.5 tabular-nums">
                  {t.amount != null ? `${t.amount} ${t.currency}` : t.method}
                </td>
                <td className="px-2 py-1.5">
                  <Link href={`/admin/traders/${t.customerId}`} className="text-sky-400 hover:underline">
                    {t.customer}
                  </Link>
                  <div className="text-[9px] text-neutral-500">{t.customerEmail}</div>
                </td>
                <td className="px-2 py-1.5 font-mono text-[9px] text-neutral-500">
                  {(t.tradingAccountId || "—").slice(0, 12)}
                </td>
                <td className="px-2 py-1.5">{t.method}</td>
                <td className="px-2 py-1.5">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-2 py-1.5 text-neutral-500">
                  {new Date(t.openedAt).toLocaleString("en-US")}
                </td>
                <td className="px-2 py-1.5">
                  {t.status === "PENDING" && (
                    <div className="flex gap-1">
                      <button
                        disabled={busy}
                        onClick={() => act(t, "approve")}
                        className="rounded bg-emerald-600/80 px-2 py-0.5 hover:bg-emerald-500"
                      >
                        Onay
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => act(t, "reject")}
                        className="rounded bg-red-600/80 px-2 py-0.5 hover:bg-red-500"
                      >
                        Red
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  Bilet yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
