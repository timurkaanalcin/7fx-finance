"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round58";
import { crmv4Href } from "@/lib/crmv4/sections";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { money, sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const STATUS_LABEL: Record<string, CrmV4CopyKey> = {
  PENDING: "dbPending",
  APPROVED: "dbApproved",
  REJECTED: "dbRejected",
};

const STEP_LABEL: Record<string, CrmV4CopyKey> = {
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

function stepText(step: { id: string; label?: string }, v4: V4): string {
  const key = STEP_LABEL[step.id];
  return key ? v4(key) : step.label || step.id;
}

function listTitle(list: SopList, v4: V4): string {
  if (list.kind === "onboarding") return v4("sopOnboarding");
  if (list.kind === "kyc") return v4("sopKyc");
  return list.title || list.id;
}

export function DepositBoard({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
  const data = useJson<{ requests?: DepRow[] }>("/api/admin/deposits?take=40");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<{ id: string; name: string; action: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const loaded = data.data?.requests || [];
  const shown = filterDeposits(loaded, status, query);
  const totals = currencyTotals(shown);

  async function confirm() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      const res = await sendJson(approvalEndpoint("DEPOSIT"), "POST", approvalBody(pending.id, pending.action, reason));
      setMsg(`${pending.name} · ${res.ok ? v4("dbSaved") : `${v4("dbNotSaved")} ${res.error || ""}`}`);
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
    <section className="c4-dep-board" aria-label={v4("dbTitle")} data-dep-board="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("dbSub")}</p>
          <h2 className="c4-title">{v4("dbTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("dbCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("dbHint")}</p>
      {viewer && <p className="c4-meta">{v4("dbViewer")}</p>}
      <label className="c4-lab">
        <span>{v4("dbSearch")}</span>
        <input className="c4-field" aria-label={v4("dbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("dbAll")}>
        <button type="button" className="c4-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v4("dbAll")}</button>
        {DEP_STATUSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v4(STATUS_LABEL[item])}</button>
        ))}
      </div>
      <div className="c4-dep-totals" aria-label={v4("dbTotals")}>
        <p className="c4-meta">{v4("dbTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <strong>{line.currency.length === 3 ? money(line.amount, line.currency, locale) : line.amount.toFixed(2)}</strong>
              {line.currency.length !== 3 && <span>{v4("dbNoCurrency")}</span>}
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("dbLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("dbFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("dbNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("dbEmpty")}</p>}
      <ul className="c4-dep-cards">
        {shown.map((row) => {
          const current = depStatus(row);
          const name = row.user?.name || row.user?.email || "—";
          const note = String(row.note || "").trim();
          return (
            <li key={row.id} className="c4-dep-card" data-status={current || "none"}>
              <div className="c4-row c4-between">
                <strong>{name}</strong>
                <span className="c4-dep-status" data-status={current || "none"}>{STATUS_LABEL[current] ? v4(STATUS_LABEL[current]) : current || "—"}</span>
              </div>
              <p>{amountText(row, locale, v4("dbNoCurrency"))}</p>
              <p className="c4-meta">{v4("dbMethod")} {row.method?.label || "—"} · {when(row.createdAt, locale)}</p>
              {note && <p className="c4-meta">{v4("dbNote")} {note}</p>}
              <div className="c4-row">
                {row.user?.id && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.user.id}`)}>{v4("dbOpen")}</Link>}
                {!viewer && current === "PENDING" && (
                  <>
                    <button type="button" className="c4-btn" onClick={() => { setReason(""); setPending({ id: row.id, name, action: "approve" }); }}>{v4("dbApprove")}</button>
                    <button type="button" className="c4-btn" onClick={() => { setReason(""); setPending({ id: row.id, name, action: "reject" }); }}>{v4("dbReject")}</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("dbConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.action === "approve" ? v4("dbApprove") : v4("dbReject")}</p>
          <label className="c4-lab">
            <span>{v4("dbReason")}</span>
            <input className="c4-field" aria-label={v4("dbReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("dbReasonOptional")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy} onClick={() => void confirm()}>{v4("dbConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("dbCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}

export function SopPad({ v4 }: { v4: V4 }) {
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
    labels[list.id] = listTitle(list, v4);
    for (const step of list.steps) labels[step.id] = stepText(step, v4);
  }
  const shown = searchLists(lists, query, labels);

  return (
    <section className="c4-sop-pad c4-sop-glass" aria-label={v4("sopTitle")} data-sop-pad="1" data-desk="conservatory">
      <header className="c4-sop-mast">
        <p className="c4-sop-seal" data-logo="mono">7FX</p>
        <div className="c4-sop-trellis" aria-hidden="true"><i /><i /><i /></div>
        <div>
          <p className="c4-pay-kicker">{v4("sopSub")}</p>
          <h2 className="c4-title">{v4("sopTitle")}</h2>
        </div>
        <ol className="c4-sop-index" aria-label={v4("sopTitle")}>
          <li data-tone="gold">{v4("sopGlassChampagne")}</li>
          <li data-tone="ink">{v4("sopGlassGraphite")}</li>
          <li data-tone="ivory">{v4("sopGlassIvory")}</li>
          <li>{shown.length}</li>
        </ol>
      </header>
      <p className="c4-meta">{v4("sopHint")}</p>
      <p className="c4-meta">{v4("sopLocal")}</p>
      <label className="c4-lab">
        <span>{v4("sopSearch")}</span>
        <input className="c4-field" aria-label={v4("sopSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addList(lists, `list-${Date.now()}`, title);
        if (next.length === lists.length && next.every((list, index) => list.id === lists[index]?.id)) return;
        store(next);
        setTitle("");
      }}>
        <label className="c4-lab">
          <span>{v4("sopListName")}</span>
          <input className="c4-field" aria-label={v4("sopListName")} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("sopAddList")}</button>
      </form>
      <p className="c4-meta">{v4("sopBlank")}</p>
      {!shown.length && <p className="c4-pay-empty">{v4("sopEmpty")}</p>}
      <ul className="c4-sop-lists">
        {shown.map((list) => {
          const mark = progress(list);
          return (
            <li key={list.id} className="c4-sop-list" data-pinned={list.pinned ? "1" : "0"} data-kind={list.kind}>
              <div className="c4-row c4-between">
                <strong>{listTitle(list, v4)}</strong>
                <span className="c4-meta">{v4("sopProgress")} {mark.done}/{mark.total}</span>
              </div>
              <ul className="c4-sop-steps">
                {list.steps.map((step) => (
                  <li key={step.id}>
                    <label className="c4-sop-step">
                      <input type="checkbox" checked={step.done} aria-label={stepText(step, v4)} onChange={() => store(toggleStep(lists, list.id, step.id))} />
                      <span>{stepText(step, v4)}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <form className="c4-row" onSubmit={(event) => {
                event.preventDefault();
                const text = steps[list.id] || "";
                const next = addStep(lists, list.id, `step-${Date.now()}`, text);
                if (next === lists || next.every((item, index) => item.steps.length === lists[index]?.steps.length)) return;
                store(next);
                setSteps((prev) => ({ ...prev, [list.id]: "" }));
              }}>
                <label className="c4-lab">
                  <span>{v4("sopStep")}</span>
                  <input className="c4-field" aria-label={v4("sopStep")} value={steps[list.id] || ""} onChange={(event) => setSteps((prev) => ({ ...prev, [list.id]: event.target.value }))} />
                </label>
                <button type="submit" className="c4-btn">{v4("sopAddStep")}</button>
              </form>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => store(togglePin(lists, list.id))}>{list.pinned ? v4("sopUnpin") : v4("sopPin")}</button>
                <button type="button" className="c4-btn" onClick={() => setClearing(list.id)}>{v4("sopClear")}</button>
              </div>
            </li>
          );
        })}
      </ul>
      {clearing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("sopClearLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(clearTicks(lists, clearing)); setClearing(null); }}>{v4("sopClear")}</button>
            <button type="button" className="c4-btn" onClick={() => setClearing(null)}>{v4("dbCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
