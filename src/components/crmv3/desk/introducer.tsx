"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { sectionPath } from "@/lib/crmv3/nav";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  COMM_STATUSES,
  JUMP_KEY,
  MARK_KEY,
  clearUnpinned,
  commissionRows,
  currencyTotals,
  filterComm,
  markPayout,
  readJumps,
  readMarks,
  toggleJumpPin,
  visibleJumps,
  type Cash,
  type CommRow,
  type Jump,
  type PayoutMark,
  type Person,
} from "@/lib/crmv3/introducer";
import { money, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const STATUS_LABEL: Record<string, CrmV3CopyKey> = {
  PENDING: "cmPending",
  APPROVED: "cmApproved",
  REJECTED: "cmRejected",
};

function amountText(row: CommRow, locale: string, none: string): string {
  if (row.amount == null) return "—";
  if (row.currency.length === 3) return money(row.amount, row.currency, locale);
  return `${row.amount.toFixed(2)} ${none}`;
}

export function IntroducerBoard({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?take=40");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [marks, setMarks] = useState<PayoutMark[]>([]);
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => { setMarks(readMarks(readJson(MARK_KEY, []))); }, []);
  const loaded = commissionRows(people.data?.users || [], deposits.data?.requests || []);
  const shown = filterComm(loaded, status, query);
  const totals = currencyTotals(shown);
  const loading = (people.loading && !people.data) || (deposits.loading && !deposits.data);
  const failed = Boolean(people.error || deposits.error);

  function store(next: PayoutMark[]) {
    setMarks(next);
    writeJson(MARK_KEY, next);
  }

  return (
    <section className="c3-ib-board" aria-label={v3("cmTitle")} data-ib-board="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("cmSub")}</p>
          <h2 className="c3-title">{v3("cmTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("cmCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("cmHint")}</p>
      <p className="c3-muted">{v3("cmLocal")}</p>
      <label className="c3-lab">
        <span>{v3("cmSearch")}</span>
        <input className="c3-field" aria-label={v3("cmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("cmAll")}>
        <button type="button" className="c3-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v3("cmAll")}</button>
        {COMM_STATUSES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v3(STATUS_LABEL[item])}</button>
        ))}
      </div>
      <div className="c3-ib-totals" aria-label={v3("cmTotals")}>
        <p className="c3-muted">{v3("cmTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v3("cmNoCurrency")}</span>
              <strong>{line.amount.toLocaleString(locale || "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {loading && !loaded.length && <p className="c3-muted">{v3("cmLoading")}</p>}
      {failed && <p className="c3-muted">{v3("cmFailed")} {tx("failed")}</p>}
      {!loading && !failed && !loaded.length && <p className="c3-empty">{v3("cmNone")}</p>}
      {!loading && !failed && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("cmEmpty")}</p>}
      <ul className="c3-ib-cards">
        {shown.map((row) => {
          const marked = marks.some((mark) => mark.id === row.id);
          return (
            <li key={row.id} className="c3-ib-card" data-status={row.status || "none"} data-marked={marked ? "1" : "0"}>
              <div className="c3-row c3-between">
                <strong>{row.affiliate}</strong>
                <span className="c3-ib-status" data-status={row.status || "none"}>{STATUS_LABEL[row.status] ? v3(STATUS_LABEL[row.status]) : row.status || "—"}</span>
              </div>
              <p>{amountText(row, locale, v3("cmNoCurrency"))}</p>
              <p className="c3-muted">{v3("cmCustomer")} {row.name || "—"} · {when(row.createdAt, locale)}</p>
              {marked && <p className="c3-muted">{v3("cmMarked")}</p>}
              <div className="c3-row">
                <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("cmOpen")}</Link>
                {!marked && (
                  <button type="button" className="c3-btn" onClick={() => { setReason(""); setPending({ id: row.id, name: row.affiliate }); }}>{v3("cmMark")}</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("cmConfirmLead")}</p>
          <p><strong>{pending.name}</strong></p>
          <label className="c3-lab">
            <span>{v3("cmReason")}</span>
            <input className="c3-field" aria-label={v3("cmReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("cmReasonOptional")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(markPayout(marks, pending.id, reason, new Date().toISOString())); setPending(null); setReason(""); }}>{v3("cmConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("cmCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function JumpHistory({ base }: { base: string }) {
  const v3 = useV3();
  const [jumps, setJumps] = useState<Jump[]>([]);
  const [query, setQuery] = useState("");
  const [clearing, setClearing] = useState(false);
  useEscape(clearing, () => setClearing(false));
  useEffect(() => {
    const load = () => setJumps(readJumps(readJson(JUMP_KEY, [])));
    load();
    window.addEventListener("crmv3:jumps", load);
    return () => window.removeEventListener("crmv3:jumps", load);
  }, []);
  const shown = visibleJumps(jumps, query);

  function store(next: Jump[]) {
    setJumps(next);
    writeJson(JUMP_KEY, next);
  }

  return (
    <section className="c3-jump-pad" aria-label={v3("jpTitle")} data-jump-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("jpSub")}</p>
          <h2 className="c3-title">{v3("jpTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("jpHint")}</p>
      <p className="c3-muted">{v3("jpLocal")}</p>
      <label className="c3-lab">
        <span>{v3("jpSearch")}</span>
        <input className="c3-field" aria-label={v3("jpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => setClearing(true)}>{v3("jpClear")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("jpEmpty")}</p>}
      <ul className="c3-jump-list">
        {shown.map((jump) => (
          <li key={jump.sectionId} className="c3-jump-card" data-pinned={jump.pinned ? "1" : "0"}>
            <strong>{jump.sectionId}</strong>
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, sectionPath(jump.sectionId))}>{v3("jpOpen")} {jump.sectionId}</Link>
              <button type="button" className="c3-btn" onClick={() => store(toggleJumpPin(jumps, jump.sectionId))}>{jump.pinned ? v3("jpUnpin") : v3("jpPin")}</button>
            </div>
          </li>
        ))}
      </ul>
      {clearing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-jump-clear="">
          <p>{v3("jpClearLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(clearUnpinned(jumps)); setClearing(false); }}>{v3("jpClear")}</button>
            <button type="button" className="c3-btn" onClick={() => setClearing(false)}>{v3("jpCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
