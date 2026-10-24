"use client";

/**
 * Generic CRM inline-edit table: Edit → inputs → Kaydet/İptal, Add row, Delete (confirm dialog).
 * When `balanceAware` is set, edit/add/delete expose the explicit "Bakiyeye yansıt"
 * (reflect to balance) checkbox — default OFF — and pass it to the handlers.
 */
import { useState, type ReactNode } from "react";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import {
  fmtCrmDate,
  fmtCrmMoney,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/crm-format";

export type CrmColumn = {
  key: string;
  /** i18n key (or literal label when not found) */
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "money"
    | "select"
    | "datetime"
    | "color"
    | "readonly"
    | "checkbox"
    | "password";
  /** input placeholder */
  placeholder?: string;
  /** optional i18n key: short muted explanation shown in parentheses after the label (forms only) */
  hint?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Dynamic requirement based on the current draft. */
  requiredIf?: (draft: Record<string, string>) => boolean;
  /** false = shown but never editable (computed/system) */
  editable?: boolean;
  /** hide from the add form */
  hideOnCreate?: boolean;
  /** hide from the table (only in forms) */
  hideInTable?: boolean;
  /** only show in the add form when this returns true for the current draft */
  showIf?: (draft: Record<string, string>) => boolean;
  /** never show in inline-edit grids */
  createOnly?: boolean;
  /** custom cell renderer for view mode */
  render?: (row: Record<string, unknown>) => ReactNode;
  /** custom input for edit/add mode (e.g. a client picker); `row` is undefined in the add form */
  editor?: (
    value: string,
    onChange: (v: string) => void,
    draft: Record<string, string>,
    row?: Record<string, unknown>
  ) => ReactNode;
};

type Result = { ok: boolean; error?: string };
type Row = Record<string, unknown>;

const inp =
  "w-full min-w-[5rem] rounded border border-[#111111] bg-white px-1.5 py-1 text-[11px] text-[#111111] tabular-nums outline-none focus:ring-1 focus:ring-[#111111]/30";

function toDraftValue(col: CrmColumn, v: unknown): string {
  if (v == null) return "";
  if (col.type === "datetime") return toDatetimeLocalValue(v);
  return String(v);
}

function fromDraft(cols: CrmColumn[], draft: Record<string, string>, create: boolean) {
  const out: Record<string, unknown> = {};
  for (const c of cols) {
    if (c.editable === false || c.type === "readonly") continue;
    if (create && c.hideOnCreate) continue;
    if (!create && c.createOnly) continue;
    if (c.showIf && !c.showIf(draft)) continue;
    if (!(c.key in draft)) continue;
    const raw = draft[c.key];
    if (c.type === "datetime") out[c.key] = raw ? fromDatetimeLocalValue(raw) : "";
    else if (c.type === "number" || c.type === "money") out[c.key] = raw.trim() === "" ? "" : raw.replace(",", ".");
    else out[c.key] = raw;
  }
  return out;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  balanceAware,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  balanceAware?: boolean;
  onConfirm: (applyToBalance: boolean) => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const { i18n } = useCrmLabels();
  const [apply, setApply] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-sm rounded-xl border border-[#e5e5e5] bg-white p-4 text-xs text-[#111111] shadow-xl">
        <h3 className="mb-2 text-sm font-semibold">{title}</h3>
        <p className="mb-3 text-neutral-600">{message}</p>
        {balanceAware && (
          <label className="mb-3 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2">
            <input type="checkbox" checked={apply} onChange={(e) => setApply(e.target.checked)} />
            <span>
              <span className="font-semibold">{i18n("crm.edit.reflect")}</span>
              <span className="block text-[10px] text-neutral-500">{i18n("crm.edit.reflectDeleteHint")}</span>
            </span>
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setApply(false);
              onCancel();
            }}
            className="rounded border border-neutral-300 px-3 py-1.5"
          >
            {i18n("crm.ui.cancel")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const a = apply;
              setApply(false);
              onConfirm(a);
            }}
            className={`rounded px-3 py-1.5 font-semibold text-white disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-500" : "bg-black hover:bg-neutral-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReflectBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { i18n } = useCrmLabels();
  return (
    <label className="flex items-center gap-1 whitespace-nowrap text-[10px] text-amber-800" title={i18n("crm.edit.reflectHint")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {i18n("crm.edit.reflect")}
    </label>
  );
}

export function CellInput({
  col,
  value,
  onChange,
  draft,
  row,
}: {
  col: CrmColumn;
  value: string;
  onChange: (v: string) => void;
  draft?: Record<string, string>;
  row?: Record<string, unknown>;
}) {
  if (col.editor) return <>{col.editor(value, onChange, draft || {}, row)}</>;
  if (col.type === "checkbox") {
    return (
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={value === "true"}
        onChange={(e) => onChange(e.target.checked ? "true" : "false")}
      />
    );
  }
  if (col.type === "select") {
    return (
      <select className={inp} value={value} onChange={(e) => onChange(e.target.value)}>
        {!col.required && <option value="">—</option>}
        {(col.options || []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (col.type === "textarea") {
    return (
      <textarea
        className={inp + " min-w-[10rem]"}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (col.type === "datetime") {
    return (
      <input
        type="datetime-local"
        step={1}
        className={inp + " min-w-[12.5rem]"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (col.type === "color") {
    return (
      <input
        type="color"
        className="h-7 w-12 rounded border border-[#111111] bg-white"
        value={value || "#3b82f6"}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      className={inp}
      type={col.type === "password" ? "password" : "text"}
      autoComplete={col.type === "password" ? "new-password" : undefined}
      placeholder={col.placeholder}
      inputMode={col.type === "number" || col.type === "money" ? "decimal" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Grid of labelled inputs (used by add forms and expanded inline-edit rows). */
export function CrmFormGrid({
  columns,
  draft,
  setDraft,
  row,
  cols = 4,
}: {
  columns: CrmColumn[];
  draft: Record<string, string>;
  setDraft: (fn: (d: Record<string, string>) => Record<string, string>) => void;
  row?: Record<string, unknown>;
  cols?: 2 | 3 | 4;
}) {
  const { i18n } = useCrmLabels();
  const grid = cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={`grid grid-cols-1 gap-2 ${grid}`}>
      {columns.filter((c) => !c.createOnly).map((c) => (
        <label
          key={c.key}
          className={`flex gap-1 text-[11px] ${c.type === "checkbox" ? "flex-row items-center pt-4" : "flex-col"} ${
            c.type === "textarea" ? "sm:col-span-2" : ""
          }`}
        >
          {c.type === "checkbox" ? null : (
            <span className="text-neutral-500">
              {i18n(c.label)}
              {c.required ? " *" : ""}
              {c.hint ? <span className="ml-1 text-[10px] font-normal text-neutral-400">({i18n(c.hint)})</span> : null}
            </span>
          )}
          {c.type === "checkbox" && c.editable === false ? (
            <input type="checkbox" className="h-4 w-4 opacity-50" checked={draft[c.key] === "true"} disabled readOnly />
          ) : c.type === "readonly" || c.editable === false ? (
            <span className="py-1 text-neutral-700">
              {c.render && row ? c.render(row) : c.type === "password" ? "—" : draft[c.key] || "—"}
            </span>
          ) : (
            <CellInput
              col={c}
              value={draft[c.key] ?? ""}
              draft={draft}
              row={row}
              onChange={(v) => setDraft((d) => ({ ...d, [c.key]: v }))}
            />
          )}
          {c.type === "checkbox" ? (
            <span className="min-w-0 whitespace-normal leading-tight text-neutral-700">
              {i18n(c.label)}
              {c.hint ? <span className="ml-1 text-[10px] font-normal text-neutral-400">({i18n(c.hint)})</span> : null}
            </span>
          ) : null}
        </label>
      ))}
    </div>
  );
}

export function CrmAddForm({
  columns,
  initial,
  balanceAware,
  onCreate,
  title,
}: {
  columns: CrmColumn[];
  initial?: Record<string, string>;
  balanceAware?: boolean;
  onCreate: (values: Record<string, unknown>, applyToBalance: boolean) => Promise<Result>;
  title?: string;
}) {
  const { i18n } = useCrmLabels();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(initial || {});
  const [apply, setApply] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const allCols = columns.filter((c) => c.editable !== false && c.type !== "readonly" && !c.hideOnCreate);
  const cols = allCols.filter((c) => !c.showIf || c.showIf(draft));

  function reset() {
    setDraft(initial || {});
    setApply(false);
    setErr("");
  }

  async function submit() {
    for (const c of cols) {
      if ((c.required || c.requiredIf?.(draft)) && !String(draft[c.key] ?? "").trim()) {
        setErr(`${i18n(c.label)}: ${i18n("crm.edit.required")}`);
        return;
      }
    }
    setBusy(true);
    setErr("");
    try {
      const r = await onCreate(fromDraft(cols, draft, true), apply);
      if (!r.ok) {
        setErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      reset();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="rounded border border-[#111111] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111111] hover:bg-neutral-50"
      >
        + {title || i18n("crm.edit.addNew")}
      </button>
    );
  }
  return (
    <div className="mb-3 rounded-xl border border-[#e5e5e5] bg-white p-3">
      <div className="mb-2 text-xs font-semibold">{title || i18n("crm.edit.addNew")}</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {cols.map((c) => (
          <label key={c.key} className="flex flex-col gap-1 text-[11px]">
            <span className="text-neutral-500">
              {i18n(c.label)}
              {c.required || c.requiredIf?.(draft) ? " *" : ""}
              {c.hint ? <span className="ml-1 text-[10px] font-normal text-neutral-400">({i18n(c.hint)})</span> : null}
            </span>
            <CellInput
              col={c}
              value={draft[c.key] ?? ""}
              draft={draft}
              onChange={(v) => setDraft((d) => ({ ...d, [c.key]: v }))}
            />
          </label>
        ))}
      </div>
      {err && <p className="mt-2 text-[11px] text-red-600">{err}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {i18n("crm.ui.save")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen(false)}
          className="rounded border border-neutral-300 px-3 py-1.5 text-[11px]"
        >
          {i18n("crm.ui.cancel")}
        </button>
        {balanceAware && <ReflectBox checked={apply} onChange={setApply} />}
      </div>
      {balanceAware && <p className="mt-1 text-[10px] text-neutral-500">{i18n("crm.edit.reflectHint")}</p>}
    </div>
  );
}

export default function CrmRecordTable({
  rows,
  columns,
  balanceAware,
  onCreate,
  onUpdate,
  onDelete,
  createInitial,
  addTitle,
  emptyText,
  readOnly = false,
}: {
  rows: Row[];
  columns: CrmColumn[];
  balanceAware?: boolean;
  onCreate?: (values: Record<string, unknown>, applyToBalance: boolean) => Promise<Result>;
  onUpdate?: (id: string, values: Record<string, unknown>, applyToBalance: boolean) => Promise<Result>;
  onDelete?: (id: string, applyToBalance: boolean) => Promise<Result>;
  createInitial?: Record<string, string>;
  addTitle?: string;
  emptyText?: string;
  /** Hide add/edit/delete (CRM view-only admins). */
  readOnly?: boolean;
}) {
  const { i18n } = useCrmLabels();
  const canCreate = Boolean(onCreate) && !readOnly;
  const canUpdate = Boolean(onUpdate) && !readOnly;
  const canDelete = Boolean(onDelete) && !readOnly;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [apply, setApply] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const tableCols = columns.filter((c) => !c.hideInTable);

  function startEdit(r: Row) {
    const d: Record<string, string> = {};
    for (const c of columns) d[c.key] = toDraftValue(c, r[c.key]);
    setDraft(d);
    setEditingId(String(r.id));
    setApply(false);
    setErr("");
    setMsg("");
  }

  async function save() {
    if (!editingId || !onUpdate) return;
    for (const c of columns) {
      // createOnly / showIf fields are not in the edit UI — never require them here
      // (e.g. ledger sourceUserId is TRANSFER-only; requiring it blocked ADJUSTMENT saves).
      if (c.createOnly) continue;
      if (c.showIf && !c.showIf(draft)) continue;
      if ((c.required || c.requiredIf?.(draft)) && c.editable !== false && !String(draft[c.key] ?? "").trim()) {
        setErr(`${i18n(c.label)}: ${i18n("crm.edit.required")}`);
        return;
      }
    }
    setBusy(true);
    setErr("");
    try {
      const r = await onUpdate(editingId, fromDraft(columns, draft, false), apply);
      if (!r.ok) {
        setErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setEditingId(null);
      setMsg(i18n("crm.ui.saved"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete(applyToBalance: boolean) {
    if (!deleteId || !canDelete || !onDelete) return;
    setBusy(true);
    setErr("");
    try {
      const r = await onDelete(deleteId, applyToBalance);
      if (!r.ok) {
        setErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(i18n("crm.edit.deleted"));
    } finally {
      setBusy(false);
      setDeleteId(null);
    }
  }

  function view(c: CrmColumn, r: Row): ReactNode {
    if (c.render) return c.render(r);
    const v = r[c.key];
    if (v == null || v === "") return "—";
    if (c.type === "datetime") return fmtCrmDate(v);
    if (c.type === "money") return fmtCrmMoney(v, 2);
    if (c.type === "select") return c.options?.find((o) => o.value === String(v))?.label ?? String(v);
    if (c.type === "checkbox") return v === true || v === "true" ? i18n("crm.ui.yes") : i18n("crm.ui.no");
    if (c.type === "password") return "••••";
    if (c.type === "color")
      return <span className="inline-block h-3 w-6 rounded" style={{ background: String(v) }} title={String(v)} />;
    return <span className="whitespace-pre-wrap break-words">{String(v)}</span>;
  }

  return (
    <div>
      {canCreate && (
        <div className="mb-2">
          <CrmAddForm
            columns={columns}
            initial={createInitial}
            balanceAware={balanceAware}
            onCreate={async (v, a) => {
              if (!onCreate) return { ok: false, error: "read-only" };
              const r = await onCreate(v, a);
              if (r.ok) setMsg(i18n("crm.edit.created"));
              return r;
            }}
            title={addTitle}
          />
        </div>
      )}
      {(err || msg) && (
        <p className={`mb-2 text-[11px] ${err ? "text-red-600" : "text-emerald-600"}`}>{err || msg}</p>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] bg-white">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-white text-neutral-500">
            <tr>
              {tableCols.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-2 py-2 font-semibold">
                  {i18n(c.label)}
                </th>
              ))}
              {(canUpdate || canDelete) && (
                <th className="whitespace-nowrap px-2 py-2 font-semibold">{i18n("crm.edit.actions")}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const id = String(r.id);
              const isEdit = editingId === id;
              return (
                <tr key={id} className={`border-t border-[#e5e5e5] align-top ${isEdit ? "bg-amber-50/70" : ""}`}>
                  {tableCols.map((c) => (
                    <td key={c.key} className="max-w-[22rem] px-2 py-1.5 tabular-nums">
                      {isEdit && c.editable !== false && c.type !== "readonly" ? (
                        <CellInput
                          col={c}
                          value={draft[c.key] ?? ""}
                          draft={draft}
                          row={r}
                          onChange={(v) => setDraft((d) => ({ ...d, [c.key]: v }))}
                        />
                      ) : (
                        view(c, r)
                      )}
                    </td>
                  ))}
                  {(canUpdate || canDelete) && (
                    <td className="whitespace-nowrap px-2 py-1.5">
                      {isEdit ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={save}
                              className="rounded bg-black px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                            >
                              {i18n("crm.ui.save")}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setEditingId(null)}
                              className="rounded border border-neutral-300 px-2 py-1 text-[10px]"
                            >
                              {i18n("crm.ui.cancel")}
                            </button>
                          </div>
                          {balanceAware && <ReflectBox checked={apply} onChange={setApply} />}
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() => startEdit(r)}
                              className="rounded border border-[#111111] bg-white px-2 py-1 text-[10px] font-semibold text-[#111111] hover:bg-neutral-50"
                            >
                              {i18n("crm.ui.edit")}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteId(id)}
                              className="rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                            >
                              {i18n("crm.ui.delete")}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={tableCols.length + 1} className="px-3 py-8 text-center text-neutral-500">
                  {emptyText || i18n("crm.ui.noRecords")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={deleteId != null}
        title={i18n("crm.edit.confirmTitle")}
        message={i18n("crm.edit.confirmDelete")}
        confirmLabel={i18n("crm.edit.yesDelete")}
        danger
        balanceAware={balanceAware}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
