"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { MONEY_QUEUE_TAKES, queueStatusTone } from "@/lib/crm-money-queue";
import type { useMoneyQueue } from "@/components/crm/use-money-queue";

type Queue = ReturnType<typeof useMoneyQueue>;

const CHIP_STATUSES = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;

export function MoneyQueueChrome({
  queue,
  title,
  clock,
  extra,
}: {
  queue: Queue;
  title: string;
  clock?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const { i18n, code } = useCrmLabels();
  const range =
    queue.total == null
      ? `${queue.rows.length} ${i18n("crm.dep.count")}`
      : `${i18n("crm.traders.range")
          .replace("{from}", String(queue.range.from))
          .replace("{to}", String(queue.range.to))
          .replace("{total}", String(queue.total))} ${i18n("crm.dep.count")}`;
  return (
    <div className="mb-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-medium">{title}</h1>
        <div className="flex flex-wrap gap-1" role="group" aria-label={i18n("crm.ui.status")}>
          {CHIP_STATUSES.map((status) => {
            const on = queue.status === status;
            const tone = status === "ALL" ? "border-[#e5e5e5] bg-white text-neutral-600" : queueStatusTone(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => queue.setStatus(status)}
                aria-pressed={on}
                data-fx-queue-chip={status}
                className={`min-h-10 rounded-full border px-3 text-xs font-medium ${on ? "border-black bg-black text-white" : tone}`}
              >
                {status === "ALL" ? i18n("crm.ui.all") : code("crm.status", status)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <input
            ref={queue.searchRef}
            value={queue.q}
            onChange={(e) => queue.setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") queue.setQ("");
            }}
            placeholder={i18n("crm.dep.searchPh")}
            aria-label={i18n("crm.ui.search")}
            aria-keyshortcuts="/"
            data-fx-queue-search=""
            autoComplete="off"
            className="min-h-10 w-full rounded border border-[#e5e5e5] bg-white px-3 pr-8 text-base outline-none focus:border-black/40 lg:text-sm"
          />
          {queue.q && (
            <button
              type="button"
              onClick={() => queue.setQ("")}
              aria-label={i18n("crm.ui.clearField")}
              title={i18n("crm.ui.clearField")}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-1 text-neutral-400 hover:text-neutral-700"
            >
              ×
            </button>
          )}
          <p className="mt-1 text-[11px] font-medium text-neutral-400">{i18n("crm.traders.searchKey")}</p>
        </div>
        <span className="rounded bg-[#f2f2f2] px-2 py-1 text-xs tabular-nums" data-fx-queue-count="">
          {queue.total == null
            ? range
            : `${i18n("crm.list.showing")
                .replace("{from}", String(queue.range.from))
                .replace("{to}", String(queue.range.to))
                .replace("{total}", String(queue.total))}`}
        </span>
        <button
          type="button"
          onClick={queue.clearFilters}
          disabled={!queue.q && queue.status === "PENDING" && !queue.sort}
          data-fx-queue-clear=""
          className="min-h-10 rounded border border-[#e5e5e5] bg-white px-3 text-xs font-medium text-neutral-700 hover:bg-[#f7f7f7] disabled:opacity-40"
        >
          {i18n("crm.list.clear")}
        </button>
        {extra}
        <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
          {clock}
          <button
            type="button"
            onClick={() => void queue.exportCsv()}
            disabled={queue.csvBusy || queue.total === 0}
            title={i18n("crm.queue.csv")}
            data-fx-queue-csv=""
            className="min-h-10 rounded border border-[#e5e5e5] bg-white px-3 text-xs font-medium text-black hover:bg-[#f7f7f7] disabled:opacity-40"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => void queue.load()}
            disabled={queue.loading}
            className="min-h-10 rounded bg-[#e5e5e5] px-3 text-xs font-medium text-black disabled:opacity-50"
          >
            {i18n("crm.dep.refresh")}
          </button>
        </div>
      </div>
      {queue.msg ? <p className="mt-2 text-xs text-red-700">{queue.msg}</p> : null}
    </div>
  );
}

export function MoneyQueuePager({ queue }: { queue: Queue }) {
  const { i18n } = useCrmLabels();
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs" data-fx-queue-pager="">
      <span className="tabular-nums text-neutral-500">
        {i18n("crm.traders.pageStatus").replace("{page}", String(queue.page))}
        {queue.total != null ? ` · ${queue.total}` : ""}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-neutral-500">
          <span>{i18n("crm.list.pageSize")}</span>
          <select
            value={queue.take}
            onChange={(e) => queue.setTake(Number(e.target.value))}
            aria-label={i18n("crm.list.pageSize")}
            data-fx-queue-take=""
            className="min-h-10 rounded-full border border-[#e5e5e5] bg-white px-2 font-medium text-neutral-800"
          >
            {MONEY_QUEUE_TAKES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={queue.page <= 1}
          onClick={() => queue.setPage((n) => Math.max(1, n - 1))}
          data-fx-queue-prev=""
          className="min-h-10 rounded-full border border-[#e5e5e5] px-3 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
        >
          {i18n("crm.traders.prev")}
        </button>
        <button
          type="button"
          disabled={!queue.hasMore}
          onClick={() => queue.setPage((n) => n + 1)}
          data-fx-queue-next=""
          className="min-h-10 rounded-full border border-[#e5e5e5] px-3 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
        >
          {i18n("crm.traders.next")}
        </button>
      </div>
    </div>
  );
}
