"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog, CrmFormGrid, type CrmColumn } from "@/components/crm/CrmRecordTable";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { fmtCrmDate } from "@/lib/crm-format";
import { countryFlag } from "@/lib/presence-shared";
import { crmJson } from "@/lib/crm-api";
import { jobTitleLabel, jobTitleOptions, jobTitleUi } from "@/lib/job-titles";

type LoginInfo = {
  at: string;
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  countryName: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  method: string | null;
} | null;

type Worker = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  desk: string | null;
  deskId: string | null;
  jobTitle: string | null;
  lastLoginAt: string | null;
  lastIp: string | null;
  lastCity: string | null;
  lastCountry: string | null;
  lastCountryName: string | null;
  isMain: boolean;
  isSelf: boolean;
  lastLogin: LoginInfo;
  canManageUsers: boolean;
  canApproveDeposits: boolean;
  canEditRates: boolean;
  canManageMethods: boolean;
  canAdjustBalance: boolean;
};
type Desk = { id: string; name: string; code: string | null; active: boolean };
type Draft = Record<string, string>;

const PERMS = [
  { key: "canManageUsers", label: "crm.perm.users", hint: "crm.permHint.users" },
  { key: "canApproveDeposits", label: "crm.perm.deposits", hint: "crm.permHint.deposits" },
  { key: "canEditRates", label: "crm.perm.rates", hint: "crm.permHint.rates" },
  { key: "canManageMethods", label: "crm.perm.methods", hint: "crm.permHint.methods" },
  { key: "canAdjustBalance", label: "crm.perm.balance", hint: "crm.permHint.balance" },
] as const;

function workerDraft(w: Worker): Draft {
  const d: Draft = {
    name: w.name,
    email: w.email,
    deskId: w.deskId || "",
    jobTitle: w.jobTitle || "",
    active: w.active ? "true" : "false",
    password: "",
  };
  for (const p of PERMS) d[p.key] = w[p.key] ? "true" : "false";
  return d;
}

export default function WorkersPage() {
  const { i18n, deskName, locale } = useCrmLabels();
  const jt = jobTitleUi(locale);
  const jobOpts = useMemo(() => jobTitleOptions(locale), [locale]);
  const [rows, setRows] = useState<Worker[]>([]);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [myPerms, setMyPerms] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [orig, setOrig] = useState<Draft>({});
  const [editErr, setEditErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>({});
  const [newErr, setNewErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{ w: Worker; count: number } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/workers");
    if (!r.ok) {
      setErr(r.status === 403 ? i18n("crm.workers.noPermission") : i18n("crm.ui.actionFailed"));
      return;
    }
    const d = await r.json();
    setRows(d.workers || []);
    setDesks(d.desks || []);
    setMyPerms(d.me?.perms || {});
  }, [i18n]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deskOpts = useMemo(
    () => desks.map((d) => ({ value: d.id, label: `${deskName(d)}${d.active ? "" : " ✕"}` })),
    [desks, deskName]
  );

  function columns(w: Worker | null, create: boolean): CrmColumn[] {
    const cols: CrmColumn[] = [
      { key: "name", label: "crm.ui.name", required: true },
      { key: "email", label: "crm.ui.email", required: true, editable: !(w?.isMain) },
      { key: "jobTitle", label: jt.field, type: "select", options: jobOpts },
      { key: "deskId", label: "crm.ui.desk", type: "select", options: deskOpts },
      {
        key: "password",
        label: create ? "crm.workers.password" : "crm.workers.newPassword",
        type: "password",
        hint: "crm.permHint.password",
        required: create,
        editable: !(w?.isMain && !w?.isSelf),
      },
      { key: "active", label: "crm.ui.active", hint: "crm.permHint.active", type: "checkbox", editable: !(w?.isMain || w?.isSelf) },
    ];
    for (const p of PERMS) {
      cols.push({
        key: p.key,
        label: p.label,
        hint: p.hint,
        type: "checkbox",
        // can't grant what you don't hold; main admin's flags are locked; keep own user-management
        editable: !(w?.isMain) && !(w?.isSelf && p.key === "canManageUsers") && myPerms[p.key] !== false,
      });
    }
    return cols;
  }

  function startEdit(w: Worker) {
    const d = workerDraft(w);
    setEditId(w.id);
    setDraft(d);
    setOrig(d);
    setEditErr("");
    setMsg("");
    setErr("");
  }

  async function saveEdit(w: Worker) {
    const body: Record<string, unknown> = { id: w.id };
    for (const k of Object.keys(draft)) {
      if (draft[k] === orig[k]) continue;
      if (k === "active" || PERMS.some((p) => p.key === k)) body[k] = draft[k] === "true";
      else body[k] = draft[k];
    }
    if (body.password === "") delete body.password;
    if (Object.keys(body).length === 1) {
      setEditId(null);
      return;
    }
    if (typeof body.password === "string" && body.password.length < 8) {
      setEditErr(i18n("crm.workers.passwordMin"));
      return;
    }
    setBusy(true);
    setEditErr("");
    try {
      const r = await crmJson("/api/admin/workers", "PATCH", body);
      if (!r.ok) {
        setEditErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setEditId(null);
      setMsg(i18n("crm.ui.saved"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openAdd() {
    setAdding(true);
    setNewErr("");
    const d: Draft = { name: "", email: "", jobTitle: "", deskId: "", password: "", active: "true" };
    for (const p of PERMS) d[p.key] = "false";
    setNewDraft(d);
  }

  async function saveNew() {
    if (!newDraft.email.trim() || !newDraft.name.trim()) {
      setNewErr(`${i18n("crm.ui.name")} / ${i18n("crm.ui.email")}: ${i18n("crm.edit.required")}`);
      return;
    }
    if (newDraft.password.length < 8) {
      setNewErr(i18n("crm.workers.passwordMin"));
      return;
    }
    const body: Record<string, unknown> = {
      name: newDraft.name.trim(),
      email: newDraft.email.trim(),
      password: newDraft.password,
      deskId: newDraft.deskId,
      jobTitle: newDraft.jobTitle || null,
      active: newDraft.active === "true",
    };
    for (const p of PERMS) body[p.key] = newDraft[p.key] === "true";
    setBusy(true);
    setNewErr("");
    try {
      const r = await crmJson("/api/admin/workers", "POST", body);
      if (!r.ok) {
        setNewErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setAdding(false);
      setMsg(i18n("crm.edit.created"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(w: Worker, force: boolean) {
    setBusy(true);
    setErr("");
    try {
      const r = await crmJson("/api/admin/workers", "DELETE", { id: w.id, force });
      if (!r.ok) {
        const count = Number(r.data?.auditCount || 0);
        if (r.status === 409 && count > 0 && !force) {
          setArchiveTarget({ w, count });
          return;
        }
        setErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(i18n("crm.edit.deleted"));
      await load();
    } finally {
      setBusy(false);
      setDeleteTarget(null);
      if (force) setArchiveTarget(null);
    }
  }

  function location(w: Worker) {
    const l = w.lastLogin;
    const ip = l?.ip || w.lastIp;
    const cc = l?.country || w.lastCountry;
    const place = [l?.city || w.lastCity, l?.countryName || w.lastCountryName].filter(Boolean).join(", ");
    if (!ip && !place) return null;
    return (
      <div className="text-[9px] text-neutral-500">
        {cc ? `${countryFlag(cc)} ` : ""}
        {place || i18n("crm.presence.noLocation")}
        {ip ? ` · ${ip}` : ""}
        {l?.browser || l?.os ? ` · ${[l?.browser, l?.os].filter(Boolean).join(" / ")}` : ""}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{i18n("crm.nav.workers")}</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded border border-[#111111] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#111111] hover:bg-neutral-50"
        >
          + {i18n("crm.workers.new")}
        </button>
      </div>
      <p className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
        {i18n("crm.workers.protectedHint")} {i18n("crm.workers.grantHint")}
      </p>

      {adding && (
        <div className="mb-3 rounded-xl border border-[#e5e5e5] bg-white p-3">
          <div className="mb-2 text-xs font-semibold">{i18n("crm.workers.new")}</div>
          <CrmFormGrid columns={columns(null, true)} draft={newDraft} setDraft={setNewDraft} />
          {newErr && <p className="mt-2 text-[11px] text-red-600">{newErr}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={saveNew}
              className="rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              {i18n("crm.ui.save")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setAdding(false)}
              className="rounded border border-neutral-300 px-3 py-1.5 text-[11px]"
            >
              {i18n("crm.ui.cancel")}
            </button>
          </div>
        </div>
      )}

      {msg && <p className="mb-2 text-xs text-emerald-700">{msg}</p>}
      {err && <p className="mb-2 text-xs text-red-600">{err}</p>}

      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-white text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.name")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.email")}</th>
              <th className="px-3 py-2">{jt.field}</th>
              <th className="px-3 py-2">{i18n("crm.ui.desk")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.active")}</th>
              <th className="px-3 py-2">{i18n("crm.permissions")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.lastLogin")}</th>
              <th className="px-3 py-2">{i18n("crm.edit.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => {
              const isEdit = editId === w.id;
              const locked = w.isMain || w.isSelf;
              const last = w.lastLogin?.at || w.lastLoginAt;
              return (
                <Fragment key={w.id}>
                  <tr className={`border-t border-[#e5e5e5] align-top ${isEdit ? "bg-amber-50/70" : ""}`}>
                    <td className="px-3 py-2 font-medium">
                      {w.name}
                      {w.isMain && (
                        <span className="ml-1 rounded bg-neutral-900 px-1 text-[9px] font-semibold text-white">
                          {i18n("crm.workers.main")}
                        </span>
                      )}
                      {w.isSelf && (
                        <span className="ml-1 rounded bg-sky-50 px-1 text-[9px] font-semibold text-sky-700">
                          {i18n("crm.workers.you")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-neutral-600">{w.email}</td>
                    <td className="px-3 py-2">{jobTitleLabel(w.jobTitle, locale) || "—"}</td>
                    <td className="px-3 py-2">{w.desk ? deskName({ name: w.desk, code: null }) : "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          w.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {w.active ? i18n("crm.ui.active") : i18n("crm.ui.inactive")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-neutral-600">
                      {PERMS.filter((p) => w[p.key])
                        .map((p) => i18n(p.label))
                        .join(", ") || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] text-neutral-600">
                      {last ? fmtCrmDate(last) : "—"}
                      {location(w)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {isEdit ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => saveEdit(w)}
                            className="rounded bg-black px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                          >
                            {i18n("crm.ui.save")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setEditId(null)}
                            className="rounded border border-neutral-300 px-2 py-1 text-[10px]"
                          >
                            {i18n("crm.ui.cancel")}
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(w)}
                            className="rounded border border-[#111111] bg-white px-2 py-1 text-[10px] font-semibold text-[#111111] hover:bg-neutral-50"
                          >
                            {i18n("crm.ui.edit")}
                          </button>
                          <button
                            type="button"
                            disabled={locked}
                            title={locked ? i18n("crm.workers.protectedHint") : undefined}
                            onClick={() => setDeleteTarget(w)}
                            className="rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {i18n("crm.ui.delete")}
                          </button>
                          <Link
                            href={`/izcrm/traders/${w.id}`}
                            className="rounded px-1 py-1 text-[10px] text-sky-700 hover:underline"
                          >
                            {i18n("crm.ui.profile")}
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                  {isEdit && (
                    <tr className="border-t border-amber-100 bg-amber-50/70">
                      <td colSpan={8} className="px-3 py-3">
                        <CrmFormGrid columns={columns(w, false)} draft={draft} setDraft={setDraft} />
                        {editErr && <p className="mt-2 text-[11px] text-red-600">{editErr}</p>}
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => saveEdit(w)}
                            className="rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                          >
                            {i18n("crm.ui.save")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setEditId(null)}
                            className="rounded border border-neutral-300 px-3 py-1.5 text-[11px]"
                          >
                            {i18n("crm.ui.cancel")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  {i18n("crm.ui.noRecords")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget != null}
        title={i18n("crm.edit.confirmTitle")}
        message={`${deleteTarget?.name ?? ""} <${deleteTarget?.email ?? ""}> — ${i18n("crm.workers.confirmDelete")}`}
        confirmLabel={i18n("crm.edit.yesDelete")}
        danger
        busy={busy}
        onConfirm={() => deleteTarget && doDelete(deleteTarget, false)}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={archiveTarget != null}
        title={i18n("crm.edit.confirmTitle")}
        message={`${archiveTarget?.w.email ?? ""}: ${archiveTarget?.count ?? 0} — ${i18n("crm.workers.auditConfirm")}`}
        confirmLabel={i18n("crm.workers.archiveDelete")}
        danger
        busy={busy}
        onConfirm={() => archiveTarget && doDelete(archiveTarget.w, true)}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
