"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";
import { useI18n } from "@/lib/i18n/context";

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
  approvalReason?: string | null;
  eventScenario?: string | null;
};

export default function TicketsPage() {
  const { t } = useI18n();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [kind, setKind] = useState("all");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Ticket | null>(null);
  const [reason, setReason] = useState("");
  const [scenario, setScenario] = useState("");
  const [scenarioBusy, setScenarioBusy] = useState(false);
  const [dialogErr, setDialogErr] = useState("");
  const [openRecord, setOpenRecord] = useState<string | null>(null);

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

  function openApprove(ticket: Ticket) {
    setApproveTarget(ticket);
    setReason("");
    setScenario("");
    setDialogErr("");
  }

  async function prepareScenario() {
    if (!approveTarget) return;
    setScenarioBusy(true);
    setDialogErr("");
    try {
      const res = await fetch("/api/admin/deposits/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: approveTarget.id,
          kind: approveTarget.kind,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDialogErr(data.error || "Scenario failed");
        return;
      }
      setScenario(String(data.scenario || ""));
    } finally {
      setScenarioBusy(false);
    }
  }

  async function act(
    ticket: Ticket,
    action: "approve" | "reject",
    extra?: { approvalReason?: string; eventScenario?: string }
  ) {
    setBusy(true);
    setMsg("");
    try {
      const url =
        ticket.kind === "DEPOSIT"
          ? "/api/admin/deposits"
          : ticket.kind === "WITHDRAW"
            ? "/api/admin/withdrawals"
            : "/api/admin/balance-requests";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticket.id, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error || "Action failed";
        if (action === "approve") setDialogErr(err);
        else setMsg(err);
        return false;
      }
      setMsg(action === "approve" ? t("crm.tickets.approvedMsg") : "Rejected");
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function confirmApprove() {
    if (!approveTarget) return;
    if (!reason.trim()) {
      setDialogErr(t("crm.tickets.reasonRequired"));
      return;
    }
    const ok = await act(approveTarget, "approve", {
      approvalReason: reason.trim(),
      eventScenario: scenario.trim(),
    });
    if (ok) {
      setApproveTarget(null);
      setReason("");
      setScenario("");
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
      {msg && <p className="mb-2 text-xs text-emerald-700">{msg}</p>}
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
            {tickets.map((ticket) => {
              const rowKey = `${ticket.kind}-${ticket.id}`;
              const hasRecord = Boolean(ticket.approvalReason || ticket.eventScenario);
              return (
                <Fragment key={rowKey}>
                  <tr className="border-t border-neutral-200">
                    <td className="px-2 py-1.5">
                      <span
                        className={`rounded px-1 py-0.5 text-[9px] ${
                          ticket.kind === "DEPOSIT"
                            ? "bg-sky-500/20 text-sky-300"
                            : ticket.kind === "WITHDRAW"
                              ? "bg-violet-500/20 text-violet-300"
                              : "bg-amber-500/20 text-amber-700"
                        }`}
                      >
                        {ticket.kind}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">
                      {ticket.amount != null ? `${ticket.amount} ${ticket.currency}` : ticket.method}
                    </td>
                    <td className="px-2 py-1.5">
                      <Link href={`/admin/traders/${ticket.customerId}`} className="text-sky-400 hover:underline">
                        {ticket.customer}
                      </Link>
                      <div className="text-[9px] text-neutral-500">{ticket.customerEmail}</div>
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[9px] text-neutral-500">
                      {(ticket.tradingAccountId || "—").slice(0, 12)}
                    </td>
                    <td className="px-2 py-1.5">{ticket.method}</td>
                    <td className="px-2 py-1.5">
                      <StatusBadge status={ticket.status} />
                      {hasRecord && (
                        <button
                          type="button"
                          onClick={() => setOpenRecord(openRecord === rowKey ? null : rowKey)}
                          className="ml-1 rounded border border-neutral-300 bg-white px-1 py-0.5 text-[9px] text-neutral-700 hover:bg-neutral-100"
                        >
                          {openRecord === rowKey ? t("crm.tickets.hideRecord") : t("crm.tickets.record")}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-neutral-500">
                      {new Date(ticket.openedAt).toLocaleString("en-US")}
                    </td>
                    <td className="px-2 py-1.5">
                      {ticket.status === "PENDING" && (
                        <div className="flex gap-1">
                          <button
                            disabled={busy}
                            onClick={() => openApprove(ticket)}
                            className="rounded bg-emerald-600/80 px-2 py-0.5 text-white hover:bg-emerald-500"
                          >
                            Onay
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => act(ticket, "reject")}
                            className="rounded bg-red-600/80 px-2 py-0.5 text-white hover:bg-red-500"
                          >
                            Red
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {openRecord === rowKey && hasRecord && (
                    <tr className="border-t border-neutral-100 bg-[#f7f7f7]">
                      <td colSpan={8} className="px-3 py-2 text-[11px] text-neutral-800">
                        <div className="mb-1 font-medium">{t("crm.tickets.approveReason")}</div>
                        <p className="mb-2 whitespace-pre-wrap">{ticket.approvalReason || "—"}</p>
                        <div className="mb-1 font-medium">{t("crm.tickets.eventScenario")}</div>
                        <p className="whitespace-pre-wrap">{ticket.eventScenario || "—"}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
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

      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-4 text-neutral-900 shadow-lg">
            <h2 className="mb-1 text-sm font-semibold">{t("crm.tickets.approveTitle")}</h2>
            <p className="mb-3 text-[11px] text-neutral-500">
              {approveTarget.customer} · {approveTarget.customerEmail} ·{" "}
              {approveTarget.amount != null
                ? `${approveTarget.amount} ${approveTarget.currency}`
                : approveTarget.method}
            </p>
            <label className="mb-1 block text-[11px] font-medium">
              {t("crm.tickets.approveReason")}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t("crm.tickets.approveReasonPh")}
              className="mb-3 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs"
            />
            <div className="mb-1 flex items-center gap-2">
              <label className="text-[11px] font-medium">{t("crm.tickets.eventScenario")}</label>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("crm.tickets.scenarioReady")}
              </span>
              <button
                type="button"
                onClick={prepareScenario}
                disabled={scenarioBusy}
                className="ml-auto rounded border border-neutral-300 bg-white px-2 py-0.5 text-[11px] hover:bg-neutral-100 disabled:opacity-60"
              >
                {scenarioBusy ? t("crm.tickets.preparing") : t("crm.tickets.prepareScenario")}
              </button>
            </div>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              rows={7}
              placeholder={t("crm.tickets.scenarioPh")}
              className="mb-3 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs"
            />
            {dialogErr && <p className="mb-2 text-[11px] text-red-600">{dialogErr}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs hover:bg-neutral-100"
              >
                {t("crm.tickets.cancel")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmApprove}
                className="rounded bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {t("crm.tickets.confirmApprove")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
