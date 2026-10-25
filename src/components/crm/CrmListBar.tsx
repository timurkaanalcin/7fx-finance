"use client";

import { useEffect } from "react";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { listCountKind } from "@/lib/crm-list-url";

/** Keep the address bar in step with list state. Refresh and back land on the same filters. */
export function useListQueryUrl(ready: boolean, query: string) {
  useEffect(() => {
    if (!ready) return;
    const path = window.location.pathname;
    const url = query ? `${path}?${query}` : path;
    if (url !== `${path}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [ready, query]);
}

type PagerProps = {
  page: number;
  take: number;
  takes: readonly number[];
  hasMore: boolean;
  from: number;
  to: number;
  total: number | null;
  onPage: (page: number) => void;
  onTake: (take: number) => void;
  onClear: () => void;
  clearDisabled: boolean;
  busy?: boolean;
};

export function CrmListPager({
  page,
  take,
  takes,
  hasMore,
  from,
  to,
  total,
  onPage,
  onTake,
  onClear,
  clearDisabled,
  busy,
}: PagerProps) {
  const { i18n } = useCrmLabels();
  const showing = i18n("crm.list.showing");
  const kind = listCountKind(from, to, total);
  let range = i18n("crm.list.page").replace("{page}", String(page));
  if (kind === "empty") {
    range = i18n("crm.list.none");
  } else if (kind === "showing") {
    range = showing.replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(total));
  } else if (kind === "open") {
    range = i18n("crm.list.showingOpen").replace("{from}", String(from)).replace("{to}", String(to));
  } else if (kind === "count") {
    range = i18n("crm.list.countOf").replace("{count}", String(to)).replace("{total}", String(total));
  }
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs" data-fx-list-pager="">
      <span className="tabular-nums text-neutral-500" data-fx-list-range="">
        {range}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={clearDisabled || busy}
          data-fx-list-clear=""
          className="min-h-10 rounded-full border border-[#e5e5e5] px-3 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
        >
          {i18n("crm.list.clear")}
        </button>
        <label className="flex items-center gap-1 text-neutral-500">
          <span>{i18n("crm.list.pageSize")}</span>
          <select
            value={take}
            onChange={(e) => onTake(Number(e.target.value))}
            aria-label={i18n("crm.list.pageSize")}
            data-fx-list-take=""
            className="min-h-10 rounded-full border border-[#e5e5e5] bg-white px-2 font-medium text-neutral-800"
          >
            {takes.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={page <= 1 || busy}
          onClick={() => onPage(Math.max(1, page - 1))}
          data-fx-list-prev=""
          className="min-h-10 rounded-full border border-[#e5e5e5] px-3 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
        >
          {i18n("crm.list.prev")}
        </button>
        <button
          type="button"
          disabled={!hasMore || busy}
          onClick={() => onPage(page + 1)}
          data-fx-list-next=""
          className="min-h-10 rounded-full border border-[#e5e5e5] px-3 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
        >
          {i18n("crm.list.next")}
        </button>
      </div>
    </div>
  );
}
