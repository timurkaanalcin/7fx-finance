"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { LOCALE_META } from "@/lib/i18n/locales";
import { fmtCrmDate } from "@/lib/crm-format";
import { formatQueueMoney, nextMoneySort, queueStatusTone } from "@/lib/crm-money-queue";
import { ListPlaceholder, listPhase } from "@/components/crm/CrmStates";
import { MoneyQueueChrome, MoneyQueuePager } from "@/components/crm/MoneyQueueChrome";
import { useMoneyQueue, type MoneyQueueRow } from "@/components/crm/use-money-queue";
import Link from "next/link";
import { useState } from "react";

type Row = MoneyQueueRow & { method: string };

function sortMark(sort: string, field: string): string {
  if (field === "created" && (sort === "" || sort === "created_desc")) return " ↓";
  if (sort === `${field}_desc`) return " ↓";
  if (sort === `${field}_asc`) return " ↑";
  return " ↕";
}

/** Withdrawal queue. Approve and reject stay on the existing POST. */
export default function AdminWithdrawalsPage() {
  const { i18n, code, locale } = useCrmLabels();
  const queue = useMoneyQueue<Row>("/api/admin/withdrawals", { take: "50", kind: "withdrawal" });
  const dateLocale = LOCALE_META[locale].htmlLang;
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  function money(amount: number, currency: string) {
    return formatQueueMoney(amount, currency, dateLocale);
  }

  async function act(id: string, action: "approve" | "reject") {
    const row = queue.rows.find((r) => r.id === id);
    const detail = row ? `\n\n${row.user.name} · ${row.user.email}\n${money(row.amount, row.currency)}` : "";
    const question = action === "approve" ? i18n("crm.ui.approve") : i18n("crm.ui.reject");
    if (!window.confirm(question + detail)) return;
    setBusy(id);
    setMsg("");
    try {
      const res = await fetch("/api/admin/withdrawals", {
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
      await queue.load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <MoneyQueueChrome
        queue={queue}
        title={i18n("crm.edit.withdrawals")}
        clock={
          queue.loadedAt ? (
            <span>
              {i18n("crm.dep.updated")}{" "}
              {queue.loadedAt.toLocaleTimeString(LOCALE_META[locale].htmlLang, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          ) : null
        }
      />
      {msg && <p className="mb-3 text-xs text-emerald-400">{msg}</p>}
      {queue.failed && (
        <div className="mb-3 rounded-xl border border-black/10 bg-white px-4 py-6 text-center">
          <ListPlaceholder
            phase="error"
            empty={i18n("crm.ui.noRecords")}
            title={i18n("crm.ui.loadFailed")}
            retry={i18n("crm.ui.tryAgain")}
            loading={i18n("crm.ui.loading")}
            onRetry={() => void queue.load()}
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-[#e5e5e5]">
        <table className="fx-crm-table w-full text-left text-xs">
          <thead className="border-b border-black/10 bg-white text-neutral-500">
            <tr>
              <th className="px-3 py-2">
                <button type="button" className="font-medium hover:text-neutral-900" data-fx-queue-sort="created" onClick={() => queue.setSort(nextMoneySort(queue.sort, "created"))}>
                  {i18n("crm.ui.date")}
                  {sortMark(queue.sort, "created")}
                </button>
              </th>
              <th className="px-3 py-2">
                <button type="button" className="font-medium hover:text-neutral-900" data-fx-queue-sort="name" onClick={() => queue.setSort(nextMoneySort(queue.sort, "name"))}>
                  {i18n("crm.ui.user")}
                  {sortMark(queue.sort, "name")}
                </button>
              </th>
              <th className="px-3 py-2">{i18n("crm.ui.method")}</th>
              <th className="fx-crm-num px-3 py-2">
                <button type="button" className="font-medium hover:text-neutral-900" data-fx-queue-sort="amount" onClick={() => queue.setSort(nextMoneySort(queue.sort, "amount"))}>
                  {i18n("crm.ui.amount")}
                  {sortMark(queue.sort, "amount")}
                </button>
              </th>
              <th className="px-3 py-2">{i18n("crm.ui.note")}</th>
              <th className="px-3 py-2">
                <button type="button" className="font-medium hover:text-neutral-900" data-fx-queue-sort="status" onClick={() => queue.setSort(nextMoneySort(queue.sort, "status"))}>
                  {i18n("crm.ui.status")}
                  {sortMark(queue.sort, "status")}
                </button>
              </th>
              <th className="px-3 py-2">{i18n("crm.ui.action")}</th>
            </tr>
          </thead>
          <tbody>
            {queue.rows.map((r) => (
              <tr key={r.id} className="border-t border-[#e5e5e5]">
                <td className="whitespace-nowrap px-3 py-2">{fmtCrmDate(r.createdAt)}</td>
                <td className="px-3 py-2">
                  <Link href={`/izcrm/traders/${r.user.id}`} className="text-sky-600 hover:underline">
                    {r.user.name}
                  </Link>
                  <div className="text-neutral-500">{r.user.email}</div>
                  {r.user.accountLoginId && (
                    <div className="font-mono text-[10px] text-sky-700">{r.user.accountLoginId}</div>
                  )}
                </td>
                <td className="px-3 py-2">{r.method || "—"}</td>
                <td className="fx-crm-num px-3 py-2 tabular-nums">{money(r.amount, r.currency)}</td>
                <td className="max-w-[160px] truncate px-3 py-2 text-neutral-500">{r.note || "—"}</td>
                <td className="px-3 py-2">
                  <span
                    data-fx-queue-status={r.status}
                    className={`inline-flex rounded-full border px-2 py-0.5 font-medium ${queueStatusTone(r.status)}`}
                  >
                    {code("crm.status", r.status)}
                  </span>
                </td>
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
            {queue.rows.length === 0 && !queue.failed && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">
                  <ListPlaceholder
                    phase={listPhase(false, queue.loading)}
                    empty={i18n("crm.ui.noRecords")}
                    title={i18n("crm.ui.loadFailed")}
                    retry={i18n("crm.ui.tryAgain")}
                    loading={i18n("crm.ui.loading")}
                    onRetry={() => void queue.load()}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <MoneyQueuePager queue={queue} />
    </div>
  );
}
