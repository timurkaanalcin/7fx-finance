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
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-[#0a1020] p-6 text-center">
        <p className="text-sm text-slate-400">{CRM_STUB_NOTE}</p>
        <p className="mt-2 text-[11px] text-slate-600">M1 Finance · Desk CRM</p>
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
      ? "bg-emerald-500/15 text-emerald-300"
      : s === "PENDING" || s === "NEW"
        ? "bg-amber-500/15 text-amber-300"
        : s === "REJECTED" || s === "CLOSED" || s === "CANCELLED"
          ? "bg-red-500/15 text-red-300"
          : "bg-slate-700/60 text-slate-300";
  return (
    <span className={`inline-rounded rounded px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
      {status}
    </span>
  );
}
