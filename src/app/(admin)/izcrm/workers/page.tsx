"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog, CrmFormGrid } from "@/components/crm/crm-record-lazy";
import type { CrmColumn } from "@/components/crm/CrmRecordTable";
import { ListPlaceholder } from "@/components/crm/CrmStates";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { fmtCrmDate } from "@/lib/crm-format";
import { countryFlag } from "@/lib/presence-shared";
import { crmJson } from "@/lib/crm-api";
import { jobTitleLabel, jobTitleOptions, jobTitleUi } from "@/lib/job-titles";
import { CRM_LIST_PAGE } from "@/lib/trader-list";

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
type WFilter = "all" | "active" | "inactive" | "stale";
const STALE_MS = 7 * 24 * 60 * 60 * 1000;
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
  const [query, setQuery] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [wFilter, setWFilter] = useState<WFilter>("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [desksPartial, setDesksPartial] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [serverCounts, setServerCounts] = useState<{ all: number; active: number; inactive: number; stale: number } | null>(null);
  const [roleChoices, setRoleChoices] = useState<{ jobTitle: string; count: number }[]>([]);
  const rowsRef = useRef<Worker[]>([]);
  const listGen = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const gen = ++listGen.current;
    const p = new URLSearchParams();
    p.set("take", String(CRM_LIST_PAGE));
    p.set("skip", mode === "more" ? String(rowsRef.current.length) : "0");
    if (qDebounced) p.set("q", qDebounced);
    if (wFilter !== "all") p.set("filter", wFilter);
    if (roleFilter) p.set("role", roleFilter);
    if (mode === "replace") p.set("counts", "1");
    if (mode === "more") setMoreBusy(true);
    try {
      const r = await fetch(`/api/admin/workers?${p}`);
      if (gen !== listGen.current) return;
      if (!r.ok) {
        setErr(r.status === 403 ? i18n("crm.workers.noPermission") : i18n("crm.ui.actionFailed"));
        return;
      }
      const d = await r.json();
      const list: Worker[] = d.workers || [];
      const next = mode === "more" ? rowsRef.current.concat(list.filter((row) => !rowsRef.current.some((old) => old.id === row.id))) : list;
      rowsRef.current = next;
      setRows(next);
      setHasMore(Boolean(d.hasMore));
      if (d.desks) setDesks(d.desks);
      if (mode === "replace") setDesksPartial(Boolean(d.desksPartial));
      if (d.me?.perms) setMyPerms(d.me.perms);
      if (d.counts) setServerCounts(d.counts);
      if (Array.isArray(d.roles)) setRoleChoices(d.roles);
      setErr("");
    } catch {
      if (gen === listGen.current) setErr(i18n("crm.ui.connectionError"));
    } finally {
      if (mode === "more" && gen === listGen.current) setMoreBusy(false);
    }
  }, [i18n, qDebounced, wFilter, roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const deskOpts = useMemo(
    () => desks.map((d) => ({ value: d.id, label: `${deskName(d)}${d.active ? "" : " ✕"}` })),
    [desks, deskName]
  );

  const isStale = useCallback((w: Worker) => {
    const last = w.lastLogin?.at || w.lastLoginAt;
    if (!last) return true;
    const t = new Date(last).getTime();
    return !Number.isFinite(t) || Date.now() - t > STALE_MS;
  }, []);

  const wCounts = serverCounts || {
    all: rows.length,
    active: rows.filter((w) => w.active).length,
    inactive: rows.filter((w) => !w.active).length,
    stale: rows.filter((w) => w.active && isStale(w)).length,
  };

  const shownRows = rows;

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
      {err && (
        <div className="mb-3">
          <ListPlaceholder
            phase="error"
            empty=""
            title={err}
            retry={i18n("crm.ui.tryAgain")}
            loading={i18n("crm.ui.loading")}
            onRetry={() => void load()}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] bg-white">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e5e5e5] px-3 py-2">
          {(
            [
              { k: "all", label: i18n("crm.ui.all"), title: "" },
              { k: "active", label: i18n("crm.ui.active"), title: "" },
              { k: "inactive", label: i18n("crm.ui.inactive"), title: "" },
              {
                k: "stale",
                label: i18n("gap.work.stale"),
                title: i18n("gap.work.staleTitle"),
              },
            ] as { k: WFilter; label: string; title: string }[]
          ).map(({ k, label, title }) => {
            const on = wFilter === k;
            const warn = k === "stale" && wCounts.stale > 0 && !on;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                title={title || undefined}
                onClick={() => setWFilter(k)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                  on
                    ? "border-black bg-black text-white"
                    : warn
                      ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {label}
                <span className="ml-1 tabular-nums opacity-70">{wCounts[k]}</span>
              </button>
            );
          })}
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {roleChoices.length > 1 && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label={jt.field}
                className="rounded border border-neutral-300 bg-white px-1.5 py-1 text-xs"
              >
                <option value="">
                  {jt.field}: {i18n("crm.ui.all")}
                </option>
                {roleChoices.map((r) => (
                  <option key={r.jobTitle || "__none"} value={r.jobTitle || "__none"}>
                    {jobTitleLabel(r.jobTitle, locale) || "—"} ({r.count})
                  </option>
                ))}
              </select>
            )}
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder="Ad, e-posta, masa, rol…"
                aria-label={i18n("crm.ui.search")}
                className="w-48 rounded border border-neutral-300 bg-white py-1 pl-2 pr-6 text-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={i18n("crm.ui.clearField")}
                  title={i18n("crm.ui.clearField")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-1 text-neutral-400 hover:text-neutral-700"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div className="w-full text-[10px] tabular-nums text-neutral-500">
            {rows.length}{hasMore ? "+" : ""}
          </div>
        </div>
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
            {shownRows.map((w) => {
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
            {shownRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  {i18n("crm.ui.noRecords")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {desksPartial && (
        <p className="mt-3 text-center text-[11px] text-amber-800">{i18n("crm.workers.desksPartial")}</p>
      )}
      {hasMore && (
        <div className="mt-3 text-center">
          <button
            type="button"
            disabled={moreBusy}
            onClick={() => void load("more")}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            {i18n("crm.ui.loadMore")}
          </button>
        </div>
      )}

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
