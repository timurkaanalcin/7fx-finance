"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { methodName, readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { ROLE_KEY, deskRole, formatAge } from "@/lib/crmv3/inbox-sla";
import { jobTitleLabel } from "@/lib/job-titles";
import {
  ACCESS_KEY,
  PAYOUT_KEY,
  PERM_KEYS,
  accessLevel,
  ageHours,
  appendRows,
  dropView,
  filterPayouts,
  filterStaff,
  flagCount,
  flagOn,
  listMove,
  minApplies,
  payoutCsv,
  payoutQuery,
  payoutSums,
  permCounts,
  readAccessViews,
  readPayoutViews,
  renameView,
  rowCurrency,
  saveAccessView,
  savePayoutView,
  staffCsv,
  uniqueValues,
  unreadNotes,
  type AccessFilter,
  type AccessView,
  type DeskNote,
  type PayoutFilter,
  type PayoutRow,
  type PayoutSort,
  type PayoutStatus,
  type PayoutView,
  type PermKey,
  type StaffRow,
} from "@/lib/crmv3/payout";
import { crmv3Href } from "@/lib/crmv3/sections";
import { auditExport, downloadCsv, money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const FLAG_LABEL: Record<PermKey, CrmV3CopyKey> = {
  canManageUsers: "axFlagUsers",
  canApproveDeposits: "axFlagDeposits",
  canEditRates: "axFlagRates",
  canManageMethods: "axFlagMethods",
  canAdjustBalance: "axFlagBalance",
};

const LEVEL_LABEL: Record<string, CrmV3CopyKey> = {
  none: "axLevelNone",
  limited: "axLevelLimited",
  desk: "axLevelDesk",
  full: "axLevelFull",
};

const STATUS_LABEL: Record<string, CrmV3CopyKey> = {
  PENDING: "pqPending",
  APPROVED: "pqApproved",
  REJECTED: "pqRejected",
};

function typingTarget(target: EventTarget | null): boolean {
  const node = target as HTMLElement | null;
  return Boolean(node && (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.tagName === "SELECT" || node.isContentEditable));
}

export function PayoutDesk({ base, tx, locale }: { base: string; tx: Tx; locale: string }) {
  const v3 = useV3();
  const [status, setStatus] = useState<PayoutStatus>("PENDING");
  const [skip, setSkip] = useState(0);
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextSkip, setNextSkip] = useState(0);
  const [filter, setFilter] = useState<PayoutFilter>({ text: "", currency: "", method: "", min: null, sort: "new" });
  const [views, setViews] = useState<PayoutView[]>([]);
  const [viewName, setViewName] = useState("");
  const [renameId, setRenameId] = useState("");
  const [renameName, setRenameName] = useState("");
  const [cursor, setCursor] = useState(0);
  const [openId, setOpenId] = useState("");
  const [pending, setPending] = useState<{ id: string; name: string; amount: number | null | undefined; currency: string; action: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEscape(Boolean(pending) || Boolean(openId), () => {
    if (pending) setPending(null);
    else setOpenId("");
  });
  useEffect(() => {
    setViews(readPayoutViews(readJson(PAYOUT_KEY, [])));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => {
      window.removeEventListener("crmv3:desk-role", onRole);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    const onRefresh = () => setTick((n) => n + 1);
    window.addEventListener("crmv3:refresh", onRefresh);
    return () => window.removeEventListener("crmv3:refresh", onRefresh);
  }, []);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    fetch(payoutQuery(status, skip), { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login";
          return null;
        }
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ requests?: PayoutRow[]; hasMore?: boolean; nextSkip?: number }>;
      })
      .then((body) => {
        if (!live || !body) return;
        const incoming = body.requests || [];
        setRows((prev) => (skip === 0 ? incoming : appendRows(prev, incoming)));
        setHasMore(Boolean(body.hasMore));
        setNextSkip(typeof body.nextSkip === "number" ? body.nextSkip : 0);
      })
      .catch(() => {
        if (live) setError("load");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [status, skip, tick]);
  const shown = filterPayouts(rows, filter);
  const currencies = uniqueValues(rows.map(rowCurrency));
  const methods = uniqueValues(rows.map((row) => String(row.method || "")));
  const sums = payoutSums(shown);
  const pendingCount = shown.filter((row) => String(row.status || "").toUpperCase() === "PENDING").length;
  const detail = shown.find((row) => row.id === openId) || null;
  const current = shown[cursor] || null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (typingTarget(event.target) || pending) return;
      if (event.key === "j") setCursor((index) => listMove(index, shown.length, 1));
      if (event.key === "k") setCursor((index) => listMove(index, shown.length, -1));
      if (event.key === "Enter" && shown[cursor]) setOpenId(shown[cursor].id);
      if (event.key === "Escape") setOpenId("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, cursor, pending]);

  function pickStatus(next: PayoutStatus) {
    setStatus(next);
    setSkip(0);
    setRows([]);
    setHasMore(false);
    setCursor(0);
    setOpenId("");
  }

  function applyView(view: PayoutView) {
    pickStatus(view.status);
    setFilter({ text: "", currency: view.currency, method: view.method, min: view.min, sort: view.sort });
  }

  function storeViews(next: PayoutView[]) {
    setViews(next);
    writeJson(PAYOUT_KEY, next);
  }

  function setPreview(next: "desk" | "viewer") {
    writeJson(ROLE_KEY, next);
    setViewer(next === "viewer");
    window.dispatchEvent(new Event("crmv3:desk-role"));
  }

  async function confirmAction() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      const res = await sendJson(approvalEndpoint("WITHDRAW"), "POST", approvalBody(pending.id, pending.action, reason));
      setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
      if (res.ok) {
        setPending(null);
        setReason("");
        setSkip(0);
        setRows([]);
        setTick((n) => n + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    const ok = await auditExport("payout-queue", shown.length, `${base}/payout`);
    if (!ok) {
      setMsg(tx("failed"));
      return;
    }
    downloadCsv("withdrawals-review.csv", ["name", "email", "amount", "currency", "status", "method", "created"], payoutCsv(shown));
  }

  return (
    <section className="c3-payout" aria-label={v3("pqTitle")} data-payout="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("pqSub")}</p>
          <h2 className="c3-title">{v3("pqTitle")}</h2>
        </div>
        <Link className="c3-btn" href={crmv3Href(base, "withdraw")}>{v3("pqChecklist")}</Link>
      </header>
      <p className="c3-muted">{v3("pqHint")}</p>
      <p className="c3-muted">{v3("pqKeys")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => setPreview(viewer ? "desk" : "viewer")}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("pqViewer")}</p>}
      <div className="c3-pay-kpis" aria-label={v3("pqLoaded")}>
        <article className="c3-pay-kpi">
          <span className="c3-muted">{v3("pqLoaded")}</span>
          <strong>{shown.length}</strong>
        </article>
        <article className="c3-pay-kpi" data-status="PENDING">
          <span className="c3-muted">{v3("pqPending")}</span>
          <strong>{pendingCount}</strong>
        </article>
        {sums.map((sum) => (
          <article key={sum.currency} className="c3-pay-kpi">
            <span className="c3-muted">{v3("pqSums")} · {sum.currency}</span>
            <strong>{money(sum.amount, sum.currency, locale)}</strong>
            <span className="c3-muted">{sum.count}</span>
          </article>
        ))}
        {!sums.length && (
          <article className="c3-pay-kpi">
            <span className="c3-muted">{v3("pqSums")}</span>
            <strong>{v3("pqNoSum")}</strong>
          </article>
        )}
      </div>
      <div className="c3-row" role="group" aria-label={v3("pqStatusAll")}>
        {(["PENDING", "APPROVED", "REJECTED", ""] as PayoutStatus[]).map((item) => (
          <button key={item || "all"} type="button" className="c3-chip" data-on={status === item ? "1" : "0"} onClick={() => pickStatus(item)}>
            {item ? v3(STATUS_LABEL[item]) : v3("pqStatusAll")}
          </button>
        ))}
      </div>
      <div className="c3-row" role="group" aria-label={v3("pqCurrencyAll")}>
        <button type="button" className="c3-chip" data-on={filter.currency ? "0" : "1"} onClick={() => setFilter({ ...filter, currency: "" })}>{v3("pqCurrencyAll")}</button>
        {currencies.map((currency) => (
          <button key={currency} type="button" className="c3-chip" data-on={filter.currency === currency ? "1" : "0"} onClick={() => setFilter({ ...filter, currency })}>{currency}</button>
        ))}
      </div>
      <div className="c3-row" role="group" aria-label={v3("pqMethodAll")}>
        <button type="button" className="c3-chip" data-on={filter.method ? "0" : "1"} onClick={() => setFilter({ ...filter, method: "" })}>{v3("pqMethodAll")}</button>
        {methods.map((method) => (
          <button key={method} type="button" className="c3-chip" data-on={filter.method === method ? "1" : "0"} onClick={() => setFilter({ ...filter, method })}>{methodName(method)}</button>
        ))}
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("pqSearch")}</span>
          <input className="c3-field" aria-label={v3("pqSearch")} value={filter.text} onChange={(event) => setFilter({ ...filter, text: event.target.value })} />
        </label>
        <label className="c3-lab">
          <span>{v3("pqMin")}</span>
          <input className="c3-field" inputMode="decimal" aria-label={v3("pqMin")} value={filter.min == null ? "" : String(filter.min)} onChange={(event) => {
            const raw = event.target.value.trim();
            const min = raw === "" ? null : Number(raw);
            setFilter({ ...filter, min: min != null && Number.isFinite(min) ? min : null });
          }} />
        </label>
        <button type="button" className="c3-btn" aria-pressed={filter.sort === "new"} onClick={() => setFilter({ ...filter, sort: "new" satisfies PayoutSort })}>{v3("pqSortNew")}</button>
        <button type="button" className="c3-btn" aria-pressed={filter.sort === "old"} onClick={() => setFilter({ ...filter, sort: "old" })}>{v3("pqSortOld")}</button>
      </div>
      {filter.min != null && !minApplies(filter.currency, filter.min) && <p className="c3-muted">{v3("pqMinHint")}</p>}
      <div className="c3-row">
        <span className="c3-muted">{v3("pqViews")}</span>
        {views.map((view) => (
          <span key={view.id} className="c3-pay-view">
            {renameId === view.id ? (
              <input className="c3-field" aria-label={v3("pqRename")} value={renameName} onChange={(event) => setRenameName(event.target.value)} onBlur={() => {
                storeViews(renameView(views, view.id, renameName));
                setRenameId("");
              }} />
            ) : (
              <button type="button" className="c3-chip" onClick={() => applyView(view)}>{view.name}</button>
            )}
            <button type="button" className="c3-btn" onClick={() => { setRenameId(view.id); setRenameName(view.name); }}>{v3("pqRename")}</button>
            <button type="button" className="c3-btn" onClick={() => storeViews(dropView(views, view.id))}>{v3("pqRemove")}</button>
          </span>
        ))}
        <input className="c3-field" aria-label={v3("pqViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} />
        <button type="button" className="c3-btn" onClick={() => {
          const name = viewName.trim();
          if (!name) return;
          storeViews(savePayoutView(views, { id: String(Date.now()), name, status, ...filter }));
          setViewName("");
        }}>{v3("pqSave")}</button>
      </div>
      <p className="c3-muted">{v3("pqViewHint")}</p>
      {loading && !rows.length && <p className="c3-muted">{v3("pqLoading")}</p>}
      {error && <p className="c3-muted">{tx("failed")}</p>}
      {!loading && !shown.length && <p className="c3-empty">{v3("pqEmpty")}</p>}
      <ol className="c3-pay-list">
        {shown.map((row, index) => {
          const hours = ageHours(row.createdAt, now);
          const state = String(row.status || "").toUpperCase();
          return (
            <li key={row.id}>
              <button type="button" className="c3-pay-row" data-on={current?.id === row.id ? "1" : "0"} data-status={state} onClick={() => { setCursor(index); setOpenId(row.id); }}>
                <strong>{row.user?.name || "—"}</strong>
                <span>{rowCurrency(row) ? money(row.amount, rowCurrency(row), locale) : "—"}</span>
                <span className="c3-sla" data-status={state}>{STATUS_LABEL[state] ? v3(STATUS_LABEL[state]) : state || "—"}</span>
                <span className="c3-muted">{methodName(row.method)}</span>
                <span className="c3-muted">{hours == null ? v3("pqNoTime") : `${v3("pqAge")} ${formatAge(hours)}`}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {hasMore && <button type="button" className="c3-btn" onClick={() => setSkip(nextSkip)}>{v3("pqMore")}</button>}
      {detail && (
        <article className="c3-pay-detail" aria-label={v3("pqDetail")}>
          <h3 className="c3-title">{detail.user?.name || "—"}</h3>
          <p>{detail.user?.email || "—"} · {methodName(detail.method)}</p>
          <p>{rowCurrency(detail) ? money(detail.amount, rowCurrency(detail), locale) : "—"}</p>
          <p className="c3-muted">{detail.reviewedAt ? `${v3("pqReviewed")} ${when(detail.reviewedAt, locale)}` : v3("pqNoReview")}</p>
          <div className="c3-row">
            {detail.user?.id && <Link className="c3-btn" href={crmv3Href(base, `customers/${detail.user.id}`)}>{v3("pqPerson")}</Link>}
            {!viewer && String(detail.status || "").toUpperCase() === "PENDING" && (
              <>
                <button type="button" className="c3-btn c3-btn-hot" onClick={() => setPending({ id: detail.id, name: detail.user?.name || "—", amount: detail.amount, currency: rowCurrency(detail), action: "approve" })}>{v3("pqApprove")}</button>
                <button type="button" className="c3-btn" onClick={() => setPending({ id: detail.id, name: detail.user?.name || "—", amount: detail.amount, currency: rowCurrency(detail), action: "reject" })}>{v3("pqReject")}</button>
              </>
            )}
          </div>
        </article>
      )}
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("pqConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.currency ? money(pending.amount, pending.currency, locale) : "—"} · {pending.action === "approve" ? v3("pqApprove") : v3("pqReject")}</p>
          <label className="c3-lab">
            <span>{v3("pqReason")}</span>
            <input className="c3-field" aria-label={v3("pqReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("pqReasonOptional")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy} onClick={() => void confirmAction()}>{v3("pqConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("pqCancel")}</button>
          </div>
        </div>
      )}
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => void exportCsv()}>{v3("pqCsv")}</button>
        <p className="c3-muted">{v3("pqCsvHint")}</p>
      </div>
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}

export function AccessDesk({ base, tx, locale }: { base: string; tx: Tx; locale: string }) {
  const v3 = useV3();
  const data = useJson<{ workers?: StaffRow[] }>("/api/admin/workers?take=80&counts=1");
  const notes = useJson<{ items?: DeskNote[] }>("/api/notifications?take=20");
  const [filter, setFilter] = useState<AccessFilter>({ text: "", title: "", flag: "", active: "" });
  const [views, setViews] = useState<AccessView[]>([]);
  const [viewName, setViewName] = useState("");
  const [cursor, setCursor] = useState(0);
  const [openId, setOpenId] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [notePending, setNotePending] = useState<{ id: string; title: string; all: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEscape(Boolean(openId) || Boolean(notePending), () => {
    if (notePending) setNotePending(null);
    else setOpenId("");
  });
  useEffect(() => { setViews(readAccessViews(readJson(ACCESS_KEY, []))); }, []);
  const people = data.data?.workers || [];
  const shown = filterStaff(people, filter);
  const titles = uniqueValues(people.map((row) => row.jobTitle));
  const counts = permCounts(shown);
  const detail = shown.find((row) => row.id === openId) || null;
  const current = shown[cursor] || null;
  const noticeRows = unreadNotes(notes.data?.items || [], unreadOnly);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (typingTarget(event.target) || notePending) return;
      if (event.key === "j") setCursor((index) => listMove(index, shown.length, 1));
      if (event.key === "k") setCursor((index) => listMove(index, shown.length, -1));
      if (event.key === "Enter" && shown[cursor]) setOpenId(shown[cursor].id);
      if (event.key === "Escape") setOpenId("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, cursor, notePending]);

  function storeViews(next: AccessView[]) {
    setViews(next);
    writeJson(ACCESS_KEY, next);
  }

  async function confirmNote() {
    if (!notePending || busy) return;
    setBusy(true);
    try {
      const body = notePending.all ? { all: true } : { id: notePending.id };
      const res = await sendJson("/api/notifications", "PATCH", body);
      setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
      if (res.ok) {
        setNotePending(null);
        notes.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    const ok = await auditExport("staff-permissions", shown.length, `${base}/access`);
    if (!ok) {
      setMsg(tx("failed"));
      return;
    }
    downloadCsv(
      "staff-permissions.csv",
      ["name", "email", "jobTitle", "desk", "active", "level", ...PERM_KEYS],
      staffCsv(shown),
    );
  }

  return (
    <section className="c3-access" aria-label={v3("axTitle")} data-access="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("axSub")}</p>
          <h2 className="c3-title">{v3("axTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("axHint")}</p>
      <p className="c3-muted">{v3("axReadOnly")}</p>
      <p className="c3-muted">{v3("axKeys")}</p>
      <div className="c3-pay-kpis" aria-label={v3("axCounts")}>
        <article className="c3-pay-kpi">
          <span className="c3-muted">{v3("axTitle")}</span>
          <strong>{shown.length}</strong>
        </article>
        {PERM_KEYS.map((key) => (
          <article key={key} className="c3-pay-kpi">
            <span className="c3-muted">{v3(FLAG_LABEL[key])}</span>
            <strong>{counts[key]}</strong>
          </article>
        ))}
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("axSearch")}</span>
          <input className="c3-field" aria-label={v3("axSearch")} value={filter.text} onChange={(event) => setFilter({ ...filter, text: event.target.value })} />
        </label>
      </div>
      <div className="c3-row" role="group" aria-label={v3("axTitleAll")}>
        <button type="button" className="c3-chip" data-on={filter.title ? "0" : "1"} onClick={() => setFilter({ ...filter, title: "" })}>{v3("axTitleAll")}</button>
        {titles.map((title) => (
          <button key={title} type="button" className="c3-chip" data-on={filter.title === title ? "1" : "0"} onClick={() => setFilter({ ...filter, title })}>{jobTitleLabel(title, locale) || title}</button>
        ))}
      </div>
      <div className="c3-row" role="group" aria-label={v3("axFlagAll")}>
        <button type="button" className="c3-chip" data-on={filter.flag ? "0" : "1"} onClick={() => setFilter({ ...filter, flag: "" })}>{v3("axFlagAll")}</button>
        {PERM_KEYS.map((key) => (
          <button key={key} type="button" className="c3-chip" data-on={filter.flag === key ? "1" : "0"} onClick={() => setFilter({ ...filter, flag: key })}>{v3(FLAG_LABEL[key])}</button>
        ))}
      </div>
      <div className="c3-row" role="group" aria-label={v3("axActiveAll")}>
        <button type="button" className="c3-chip" data-on={filter.active === "" ? "1" : "0"} onClick={() => setFilter({ ...filter, active: "" })}>{v3("axActiveAll")}</button>
        <button type="button" className="c3-chip" data-on={filter.active === "on" ? "1" : "0"} onClick={() => setFilter({ ...filter, active: "on" })}>{v3("axActiveOn")}</button>
        <button type="button" className="c3-chip" data-on={filter.active === "off" ? "1" : "0"} onClick={() => setFilter({ ...filter, active: "off" })}>{v3("axActiveOff")}</button>
      </div>
      <div className="c3-row">
        <span className="c3-muted">{v3("axViews")}</span>
        {views.map((view) => (
          <button key={view.id} type="button" className="c3-chip" onClick={() => setFilter({ text: view.text, title: view.title, flag: view.flag, active: view.active })}>{view.name}</button>
        ))}
        <input className="c3-field" aria-label={v3("axViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} />
        <button type="button" className="c3-btn" onClick={() => {
          const name = viewName.trim();
          if (!name) return;
          storeViews(saveAccessView(views, { id: String(Date.now()), name, ...filter }));
          setViewName("");
        }}>{v3("axSave")}</button>
      </div>
      <p className="c3-muted">{v3("axViewHint")}</p>
      {data.loading && !people.length && <p className="c3-muted">{v3("axLoading")}</p>}
      {data.error && <p className="c3-muted">{tx("failed")}</p>}
      {!data.loading && !shown.length && <p className="c3-empty">{v3("axEmpty")}</p>}
      <ol className="c3-access-list">
        {shown.map((row, index) => {
          const count = flagCount(row);
          const level = accessLevel(count);
          return (
            <li key={row.id}>
              <button type="button" className="c3-access-card" data-on={current?.id === row.id ? "1" : "0"} data-level={level} onClick={() => { setCursor(index); setOpenId(row.id); }}>
                <strong>{row.name || "—"}</strong>
                <span className="c3-muted">{row.email || "—"}</span>
                <span className="c3-muted">{jobTitleLabel(row.jobTitle, locale) || row.jobTitle || "—"} · {row.desk || v3("axNoDesk")}</span>
                <span className="c3-level" data-level={level} aria-label={v3(LEVEL_LABEL[level])}>
                  {PERM_KEYS.map((key, tick) => <i key={key} data-on={tick < count ? "1" : "0"} />)}
                  <span>{v3(LEVEL_LABEL[level])}</span>
                </span>
                {row.active === false && <span className="c3-sla" data-status="REJECTED">{v3("axActiveOff")}</span>}
                {row.isSelf && <span className="c3-muted">{v3("axSelf")}</span>}
                {row.isMain && <span className="c3-muted">{v3("axMain")}</span>}
              </button>
            </li>
          );
        })}
      </ol>
      {detail && (
        <article className="c3-pay-detail" aria-label={detail.name || v3("axTitle")}>
          <h3 className="c3-title">{detail.name || "—"}</h3>
          <p className="c3-muted">{v3("axReadOnly")}</p>
          <ul className="c3-flag-grid">
            {PERM_KEYS.map((key) => {
              const on = flagOn(detail[key]);
              return (
                <li key={key}>
                  <span className="c3-flag" data-on={on ? "1" : "0"}>{v3(FLAG_LABEL[key])} · {on ? v3("axOn") : v3("axOff")}</span>
                </li>
              );
            })}
          </ul>
        </article>
      )}
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => void exportCsv()}>{v3("axCsv")}</button>
        <p className="c3-muted">{v3("axCsvHint")}</p>
      </div>
      <section className="c3-note-desk" aria-label={v3("ntTitle")}>
        <h3 className="c3-title">{v3("ntTitle")}</h3>
        <p className="c3-muted">{v3("ntHint")}</p>
        <div className="c3-row">
          <button type="button" className="c3-chip" data-on={unreadOnly ? "1" : "0"} onClick={() => setUnreadOnly(true)}>{v3("ntUnread")}</button>
          <button type="button" className="c3-chip" data-on={unreadOnly ? "0" : "1"} onClick={() => setUnreadOnly(false)}>{v3("ntAllNotes")}</button>
          <button type="button" className="c3-btn" onClick={() => setNotePending({ id: "", title: v3("ntMarkAll"), all: true })}>{v3("ntMarkAll")}</button>
        </div>
        {!notes.loading && !noticeRows.length && <p className="c3-empty">{v3("ntEmpty")}</p>}
        <ul className="c3-note-list">
          {noticeRows.map((note) => (
            <li key={note.id} className="c3-note-row" data-read={note.readAt ? "1" : "0"}>
              <strong>{note.title || "—"}</strong>
              <span className="c3-muted">{note.kind || ""} · {when(note.createdAt, locale)}</span>
              {!note.readAt && (
                <button type="button" className="c3-btn" onClick={() => setNotePending({ id: note.id, title: note.title || "—", all: false })}>{v3("ntMark")}</button>
              )}
            </li>
          ))}
        </ul>
        {notePending && (
          <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-note-confirm="">
            <p>{v3("ntConfirmLead")}</p>
            <p><strong>{notePending.title}</strong></p>
            <div className="c3-row">
              <button type="button" className="c3-btn c3-btn-hot" disabled={busy} onClick={() => void confirmNote()}>{v3("ntConfirm")}</button>
              <button type="button" className="c3-btn" onClick={() => setNotePending(null)}>{v3("ntCancel")}</button>
            </div>
          </div>
        )}
      </section>
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}
