/** Dark-desk empty, loading, and retry panels. Weights stay 400/500. */
export function DeskSkeleton({ label }: { label: string }) {
  return (
    <div data-fx-desk-skeleton="" aria-busy="true" role="status" className="space-y-2">
      <span className="sr-only">{label}</span>
      <span className="fx-skel h-4 w-40" />
      <span className="fx-skel h-24 w-full rounded-xl" />
      <span className="fx-skel h-24 w-full rounded-xl" />
    </div>
  );
}

export function DeskRetry({ title, retry, onRetry }: { title: string; retry: string; onRetry: () => void }) {
  return (
    <div data-fx-desk-error="" role="alert" className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-8 text-center">
      <p className="text-sm font-normal text-slate-300">{title}</p>
      <button
        type="button"
        data-fx-desk-retry=""
        onClick={onRetry}
        className="mt-3 min-h-10 rounded-full bg-[#f4f5f7] px-4 text-xs font-medium text-[#111111]"
      >
        {retry}
      </button>
    </div>
  );
}
