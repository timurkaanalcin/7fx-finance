import Skeleton from "@/components/ui/Skeleton";

export function CrmShellSkeleton({ label }: { label: string }) {
  return (
    <div className="fx-crm flex min-h-screen bg-white" data-fx-crm-skeleton="" aria-busy="true" role="status">
      <span className="sr-only">{label}</span>
      <div className="hidden w-[200px] shrink-0 flex-col gap-2 border-r border-black/10 p-3 md:flex">
        <Skeleton light className="mb-2 h-7 w-24" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} light className="h-7 w-full" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 items-center gap-2 border-b border-black/10 px-3">
          <Skeleton light className="h-6 w-28" />
          <Skeleton light className="ml-auto h-6 w-16" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 p-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} light className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashSkeleton() {
  return (
    <div data-fx-dash-skeleton="" aria-busy="true">
      <div className="fx-dash-kpis">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} light className="h-[76px] w-full rounded-xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Skeleton light className="h-48 w-full rounded-xl" />
        <Skeleton light className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function TraderSkeleton() {
  return (
    <div className="fx-trader" data-fx-trader-skeleton="" aria-busy="true" role="status">
      <span className="sr-only">Loading trader</span>
      <Skeleton light className="mb-3 h-4 w-28" />
      <Skeleton light className="mb-2 h-7 w-56" />
      <Skeleton light className="mb-4 h-3 w-40" />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} light className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton light className="mt-4 h-64 w-full rounded-xl" />
    </div>
  );
}

export type ListPhase = "loading" | "ready" | "error";

export function listPhase(failed: boolean, loading: boolean): ListPhase {
  if (failed) return "error";
  if (loading) return "loading";
  return "ready";
}

/** Empty list, first-load skeleton, or a retry when the fetch failed. */
export function ListPlaceholder({
  phase,
  empty,
  onRetry,
  title,
  retry,
  loading,
}: {
  phase: ListPhase;
  empty: string;
  onRetry: () => void;
  title: string;
  retry: string;
  loading: string;
}) {
  if (phase === "loading") {
    return (
      <div data-fx-list-skeleton="" aria-busy="true" role="status" className="mx-auto flex max-w-xs flex-col gap-2 py-1">
        <span className="sr-only">{loading}</span>
        <span className="fx-skel fx-skel--light h-3 w-full" />
        <span className="fx-skel fx-skel--light mx-auto h-3 w-2/3" />
      </div>
    );
  }
  if (phase === "error") {
    return (
      <div data-fx-list-error="" role="alert" className="flex flex-col items-center gap-2">
        <p className="text-sm font-normal text-[#111111]">{title}</p>
        <button
          type="button"
          data-fx-list-retry=""
          onClick={onRetry}
          className="min-h-10 rounded-full bg-black px-4 text-xs font-medium text-white"
        >
          {retry}
        </button>
      </div>
    );
  }
  return (
    <span data-fx-list-empty="" className="text-sm font-normal">
      {empty}
    </span>
  );
}

export function CrmNotice({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div
      role="alert"
      data-fx-crm-notice=""
      className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3"
    >
      <div className="min-w-0">
        <p className="text-sm font-normal text-[#111111]">{title}</p>
        <p className="mt-0.5 text-xs font-normal text-neutral-500">{body}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="min-h-10 rounded-full bg-black px-4 text-xs font-normal text-white"
      >
        {action}
      </button>
    </div>
  );
}
