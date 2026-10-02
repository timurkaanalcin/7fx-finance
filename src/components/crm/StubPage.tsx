import { CRM_STUB_NOTE } from "@/lib/crm-nav";

export function StubPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h1 className="text-lg font-semibold">{title}</h1>
      {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      <div className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-[#ffffff] p-6 text-center">
        <p className="text-sm text-neutral-600">{CRM_STUB_NOTE}</p>
        <p className="mt-2 text-[11px] text-neutral-400">7FX · Desk CRM</p>
      </div>
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const s = status.toUpperCase();
  const cls =
    s === "APPROVED" || s === "OPEN" || s === "ACTIVE" || s === "FILLED"
      ? "bg-emerald-100 text-emerald-700"
      : s === "PENDING" || s === "NEW"
        ? "bg-amber-100 text-amber-700"
        : s === "REJECTED" || s === "CLOSED" || s === "CANCELLED"
          ? "bg-red-100 text-red-700"
          : "bg-neutral-100 text-neutral-600";
  return (
    <span className={`inline-rounded rounded px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
      {status}
    </span>
  );
}
