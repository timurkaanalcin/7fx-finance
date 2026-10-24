"use client";

import Skeleton from "@/components/ui/Skeleton";
import { useI18n } from "@/lib/i18n/context";

/** Reserves the terminal chrome so quotes and the blotter do not jump in. */
export default function TradeSkeleton() {
  const { t } = useI18n();
  return (
    <div className="fx-desk flex h-[100dvh] flex-col bg-desk-bg" data-fx-trade-skeleton="" aria-busy="true" role="status">
      <span className="sr-only">{t("term.loadingTerminal")}</span>
      <div className="flex min-h-12 items-center gap-3 border-b border-desk-border px-3">
        <Skeleton className="h-7 w-7 rounded-[8px]" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="ml-auto hidden h-8 w-64 sm:block" />
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="fx-watchlist hidden flex-col gap-2 border-r border-desk-border p-3 md:flex">
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Skeleton className="min-h-[44vh] flex-1 rounded-none" />
          <div className="flex h-[clamp(200px,22vh,280px)] flex-col gap-2 border-t border-desk-border p-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WatchlistSkeleton() {
  return <div className="fx-watch-skel" data-fx-watch-skeleton="" aria-hidden="true" />;
}

export function BlotterSkeleton() {
  return <div className="fx-blotter-skel" data-fx-blotter-skeleton="" aria-hidden="true" />;
}
