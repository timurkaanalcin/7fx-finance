"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round61";
import { sectionPath } from "@/lib/crmv4/round30";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useEscape } from "./round40";
import { money, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const STATUS_LABEL: Record<string, CrmV4CopyKey> = {
  PENDING: "cmPending",
  APPROVED: "cmApproved",
  REJECTED: "cmRejected",
};

function amountText(row: CommRow, locale: string, none: string): string {
  if (row.amount == null) return "—";
  if (row.currency.length === 3) return money(row.amount, row.currency, locale);
  return `${row.amount.toFixed(2)} ${none}`;
}

export function IntroducerBoard({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
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
    <section className="c4-ib-board" aria-label={v4("cmTitle")} data-ib-board="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("cmSub")}</p>
          <h2 className="c4-title">{v4("cmTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("cmCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("cmHint")}</p>
      <p className="c4-meta">{v4("cmLocal")}</p>
      <label className="c4-lab">
        <span>{v4("cmSearch")}</span>
        <input className="c4-field" aria-label={v4("cmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cmAll")}>
        <button type="button" className="c4-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v4("cmAll")}</button>
        {COMM_STATUSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v4(STATUS_LABEL[item])}</button>
        ))}
      </div>
      <div className="c4-ib-totals" aria-label={v4("cmTotals")}>
        <p className="c4-meta">{v4("cmTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <strong>{line.currency.length === 3 ? money(line.amount, line.currency, locale) : line.amount.toFixed(2)}</strong>
              {line.currency.length !== 3 && <span>{v4("cmNoCurrency")}</span>}
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {loading && !loaded.length && <p className="c4-meta">{v4("cmLoading")}</p>}
      {failed && <p className="c4-meta">{v4("cmFailed")} {tx("failed")}</p>}
      {!loading && !failed && !loaded.length && <p className="c4-pay-empty">{v4("cmNone")}</p>}
      {!loading && !failed && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("cmEmpty")}</p>}
      <ul className="c4-ib-cards">
        {shown.map((row) => {
          const marked = marks.some((mark) => mark.id === row.id);
          return (
            <li key={row.id} className="c4-ib-card" data-status={row.status || "none"} data-marked={marked ? "1" : "0"}>
              <div className="c4-row c4-between">
                <strong>{row.affiliate}</strong>
                <span className="c4-ib-status" data-status={row.status || "none"}>{STATUS_LABEL[row.status] ? v4(STATUS_LABEL[row.status]) : row.status || "—"}</span>
              </div>
              <p>{amountText(row, locale, v4("cmNoCurrency"))}</p>
              <p className="c4-meta">{v4("cmCustomer")} {row.name || "—"} · {when(row.createdAt, locale)}</p>
              {marked && <p className="c4-meta">{v4("cmMarked")}</p>}
              <div className="c4-row">
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("cmOpen")}</Link>
                {!marked && (
                  <button type="button" className="c4-btn" onClick={() => { setReason(""); setPending({ id: row.id, name: row.affiliate }); }}>{v4("cmMark")}</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("cmConfirmLead")}</p>
          <p><strong>{pending.name}</strong></p>
          <label className="c4-lab">
            <span>{v4("cmReason")}</span>
            <input className="c4-field" aria-label={v4("cmReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("cmReasonOptional")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(markPayout(marks, pending.id, reason, new Date().toISOString())); setPending(null); setReason(""); }}>{v4("cmConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("cmCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function JumpHistory({ base, v4 }: { base: string; v4: V4 }) {
  const [jumps, setJumps] = useState<Jump[]>([]);
  const [query, setQuery] = useState("");
  const [clearing, setClearing] = useState(false);
  useEscape(clearing, () => setClearing(false));
  useEffect(() => {
    const load = () => setJumps(readJumps(readJson(JUMP_KEY, [])));
    load();
    window.addEventListener("crmv4:jumps", load);
    return () => window.removeEventListener("crmv4:jumps", load);
  }, []);
  const shown = visibleJumps(jumps, query);

  function store(next: Jump[]) {
    setJumps(next);
    writeJson(JUMP_KEY, next);
  }

  return (
    <section className="c4-jump-pad" aria-label={v4("jpTitle")} data-jump-pad="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("jpSub")}</p>
          <h2 className="c4-title">{v4("jpTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("jpHint")}</p>
      <p className="c4-meta">{v4("jpLocal")}</p>
      <label className="c4-lab">
        <span>{v4("jpSearch")}</span>
        <input className="c4-field" aria-label={v4("jpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setClearing(true)}>{v4("jpClear")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("jpEmpty")}</p>}
      <ul className="c4-jump-list">
        {shown.map((jump) => (
          <li key={jump.sectionId} className="c4-jump-card" data-pinned={jump.pinned ? "1" : "0"}>
            <strong>{jump.sectionId}</strong>
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, sectionPath(jump.sectionId))}>{v4("jpOpen")} {jump.sectionId}</Link>
              <button type="button" className="c4-btn" onClick={() => store(toggleJumpPin(jumps, jump.sectionId))}>{jump.pinned ? v4("jpUnpin") : v4("jpPin")}</button>
            </div>
          </li>
        ))}
      </ul>
      {clearing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("jpClearLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(clearUnpinned(jumps)); setClearing(false); }}>{v4("jpClear")}</button>
            <button type="button" className="c4-btn" onClick={() => setClearing(false)}>{v4("jpCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
