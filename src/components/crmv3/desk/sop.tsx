"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  DEP_STATUSES,
  SOP_KEY,
  addList,
  addStep,
  clearTicks,
  currencyTotals,
  depStatus,
  filterDeposits,
  listsFromStorage,
  progress,
  searchLists,
  togglePin,
  toggleStep,
  type DepRow,
  type SopList,
} from "@/lib/crmv3/sop";
import { money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const STATUS_LABEL: Record<string, CrmV3CopyKey> = {
  PENDING: "dbPending",
  APPROVED: "dbApproved",
  REJECTED: "dbRejected",
};

const STEP_LABEL: Record<string, CrmV3CopyKey> = {
  "ob-name": "sopObName",
  "ob-contact": "sopObContact",
  "ob-desk": "sopObDesk",
  "kyc-doc": "sopKycDoc",
  "kyc-match": "sopKycMatch",
  "kyc-note": "sopKycNote",
};

function amountText(row: DepRow, locale: string, none: string): string {
  const currency = String(row.currency || "").trim().toUpperCase();
  const amount = Number(row.amount);
  if (!Number.isFinite(amount)) return "—";
  if (currency.length === 3) return money(amount, currency, locale);
  return `${amount.toFixed(2)} ${none}`;
}

function stepText(step: { id: string; label?: string }, v3: (key: CrmV3CopyKey) => string): string {
  const key = STEP_LABEL[step.id];
  return key ? v3(key) : step.label || step.id;
}

function listTitle(list: SopList, v3: (key: CrmV3CopyKey) => string): string {
  if (list.kind === "onboarding") return v3("sopOnboarding");
  if (list.kind === "kyc") return v3("sopKyc");
  return list.title || list.id;
}

export function DepositBoard({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ requests?: DepRow[] }>("/api/admin/deposits?take=40");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<{ id: string; name: string; action: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  useEscape(Boolean(pending) && !busy, () => setPending(null));
  useEffect(() => {
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const loaded = data.data?.requests || [];
  const shown = filterDeposits(loaded, status, query);
  const totals = currencyTotals(shown);

  async function confirm() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      const res = await sendJson(approvalEndpoint("DEPOSIT"), "POST", approvalBody(pending.id, pending.action, reason));
      setMsg(`${pending.name} · ${res.ok ? v3("dbSaved") : `${v3("dbNotSaved")} ${res.error || ""}`}`);
      if (res.ok) {
        setPending(null);
        setReason("");
        data.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c3-dep-board" aria-label={v3("dbTitle")} data-dep-board="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("dbSub")}</p>
          <h2 className="c3-title">{v3("dbTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("dbCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("dbHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(next === "viewer");
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("dbViewer")}</p>}
      <label className="c3-lab">
        <span>{v3("dbSearch")}</span>
        <input className="c3-field" aria-label={v3("dbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("dbAll")}>
        <button type="button" className="c3-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v3("dbAll")}</button>
        {DEP_STATUSES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v3(STATUS_LABEL[item])}</button>
        ))}
      </div>
      <div className="c3-dep-totals" aria-label={v3("dbTotals")}>
        <p className="c3-muted">{v3("dbTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v3("dbNoCurrency")}</span>
              <strong>{line.amount.toLocaleString(locale || "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("dbLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("dbFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("dbNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("dbEmpty")}</p>}
      <ul className="c3-dep-cards">
        {shown.map((row) => {
          const current = depStatus(row);
          const name = row.user?.name || row.user?.email || "—";
          const note = String(row.note || "").trim();
          return (
            <li key={row.id} className="c3-dep-card" data-status={current || "none"}>
              <div className="c3-row c3-between">
                <strong>{name}</strong>
                <span className="c3-dep-status" data-status={current || "none"}>{STATUS_LABEL[current] ? v3(STATUS_LABEL[current]) : current || "—"}</span>
              </div>
              <p>{amountText(row, locale, v3("dbNoCurrency"))}</p>
              <p className="c3-muted">{v3("dbMethod")} {row.method?.label || "—"} · {when(row.createdAt, locale)}</p>
              {note && <p className="c3-muted">{v3("dbNote")} {note}</p>}
              <div className="c3-row">
                {row.user?.id && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.user.id}`)}>{v3("dbOpen")}</Link>}
                {!viewer && current === "PENDING" && (
                  <>
                    <button type="button" className="c3-btn" onClick={() => { setReason(""); setPending({ id: row.id, name, action: "approve" }); }}>{v3("dbApprove")}</button>
                    <button type="button" className="c3-btn" onClick={() => { setReason(""); setPending({ id: row.id, name, action: "reject" }); }}>{v3("dbReject")}</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("dbConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.action === "approve" ? v3("dbApprove") : v3("dbReject")}</p>
          <label className="c3-lab">
            <span>{v3("dbReason")}</span>
            <input className="c3-field" aria-label={v3("dbReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("dbReasonOptional")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy} onClick={() => void confirm()}>{v3("dbConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("dbCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}

export function SopPad() {
  const v3 = useV3();
  const [lists, setLists] = useState<SopList[]>([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState<Record<string, string>>({});
  const [clearing, setClearing] = useState<string | null>(null);
  useEscape(Boolean(clearing), () => setClearing(null));
  useEffect(() => {
    const raw = window.localStorage.getItem(SOP_KEY);
    const next = listsFromStorage(raw);
    setLists(next.lists);
    if (next.seeded) writeJson(SOP_KEY, next.lists);
  }, []);

  function store(next: SopList[]) {
    setLists(next);
    writeJson(SOP_KEY, next);
  }

  const labels: Record<string, string> = {};
  for (const list of lists) {
    labels[list.id] = listTitle(list, v3);
    for (const step of list.steps) labels[step.id] = stepText(step, v3);
  }
  const shown = searchLists(lists, query, labels);

  function addNamedList() {
    const next = addList(lists, `list-${Date.now()}`, title);
    if (next.length === lists.length && next.every((list, index) => list.id === lists[index]?.id)) return;
    store(next);
    setTitle("");
  }

  function addNamedStep(listId: string) {
    const text = steps[listId] || "";
    const next = addStep(lists, listId, `step-${Date.now()}`, text);
    if (next.every((item, index) => item.steps.length === lists[index]?.steps.length)) return;
    store(next);
    setSteps((prev) => ({ ...prev, [listId]: "" }));
  }

  return (
    <section className="c3-sop-pad" aria-label={v3("sopTitle")} data-sop-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("sopSub")}</p>
          <h2 className="c3-title">{v3("sopTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("sopHint")}</p>
      <p className="c3-muted">{v3("sopLocal")}</p>
      <label className="c3-lab">
        <span>{v3("sopSearch")}</span>
        <input className="c3-field" aria-label={v3("sopSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("sopListName")}</span>
          <input className="c3-field" aria-label={v3("sopListName")} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={addNamedList}>{v3("sopAddList")}</button>
      </div>
      <p className="c3-muted">{v3("sopBlank")}</p>
      {!shown.length && <p className="c3-empty">{v3("sopEmpty")}</p>}
      <ul className="c3-sop-lists">
        {shown.map((list) => {
          const mark = progress(list);
          return (
            <li key={list.id} className="c3-sop-list" data-pinned={list.pinned ? "1" : "0"} data-kind={list.kind}>
              <div className="c3-row c3-between">
                <strong>{listTitle(list, v3)}</strong>
                <span className="c3-muted">{v3("sopProgress")} {mark.done}/{mark.total}</span>
              </div>
              <ul className="c3-sop-steps">
                {list.steps.map((step) => (
                  <li key={step.id}>
                    <label className="c3-sop-step">
                      <input type="checkbox" checked={step.done} aria-label={stepText(step, v3)} onChange={() => store(toggleStep(lists, list.id, step.id))} />
                      <span>{stepText(step, v3)}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="c3-row">
                <label className="c3-lab">
                  <span>{v3("sopStep")}</span>
                  <input className="c3-field" aria-label={v3("sopStep")} value={steps[list.id] || ""} onChange={(event) => setSteps((prev) => ({ ...prev, [list.id]: event.target.value }))} />
                </label>
                <button type="button" className="c3-btn" onClick={() => addNamedStep(list.id)}>{v3("sopAddStep")}</button>
              </div>
              <div className="c3-row">
                <button type="button" className="c3-btn" onClick={() => store(togglePin(lists, list.id))}>{list.pinned ? v3("sopUnpin") : v3("sopPin")}</button>
                <button type="button" className="c3-btn" onClick={() => setClearing(list.id)}>{v3("sopClear")}</button>
              </div>
            </li>
          );
        })}
      </ul>
      {clearing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-sop-clear="">
          <p>{v3("sopClearLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(clearTicks(lists, clearing)); setClearing(null); }}>{v3("sopClear")}</button>
            <button type="button" className="c3-btn" onClick={() => setClearing(null)}>{v3("dbCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
