"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CHECK_ITEMS,
  checksDone,
  emptyChecks,
  fileFor,
  isPdf,
  matchQuery,
  readChecks,
  reviewQueue,
  rowsForCurrency,
  setCheck,
  sumsByCurrency,
  type CheckItem,
  type DocChecks,
  type FileRow,
  type MoneyLine,
  type ReviewDoc,
} from "@/lib/crmv4/round27";
import { auditExport, downloadCsv, money, sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const CHECK_KEY = "crmv4-doc-review";

const CHECK_LABEL: Record<CheckItem, CrmV4CopyKey> = {
  name: "kycCheckName",
  photo: "kycCheckPhoto",
  expiry: "kycCheckExpiry",
  readable: "kycCheckReadable",
};

export function KycDesk({ v4, tx, locale }: { v4: V4; tx: Tx; locale: string }) {
  const docs = useJson<{ documents?: ReviewDoc[] }>("/api/admin/documents?status=PENDING&take=40");
  const files = useJson<{ documents?: FileRow[] }>("/api/admin/customer-documents?take=40");
  const [query, setQuery] = useState("");
  const [personId, setPersonId] = useState("");
  const [docId, setDocId] = useState("");
  const [checks, setChecks] = useState<Record<string, DocChecks>>({});
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { setChecks(readChecks(readJson(CHECK_KEY, {}))); }, []);
  const people = matchQuery(reviewQueue(docs.data?.documents || []), query);
  const person = people.find((row) => row.id === personId) || people[0];
  const doc = person?.docs.find((row) => row.id === docId) || person?.docs[0];
  const file = person ? fileFor(person.id, files.data?.documents || []) : null;
  const box = doc ? checks[doc.id] || emptyChecks() : emptyChecks();
  function saveCheck(item: CheckItem, on: boolean) {
    if (!doc) return;
    const next = setCheck(checks, doc.id, item, on);
    setChecks(next);
    writeJson(CHECK_KEY, next);
  }
  async function review(status: "APPROVED" | "REJECTED") {
    if (!doc) return;
    const note = reason.trim();
    const res = await sendJson("/api/admin/documents", "POST", { action: "review", id: doc.id, status, ...(note ? { note } : {}) });
    setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
    if (res.ok) {
      setReason("");
      docs.reload();
    }
  }
  return (
    <section className="c4-kyc-luxe c4-kyc-folio c4-kyc-scriptorium c4-kyc-cellar" aria-label={v4("kycDesk")} data-kyc="1" data-desk="cellar">
      <header className="c4-kyc-mast">
        <div>
          <p className="c4-kyc-scriptorium-kicker">{v4("kycSub")}</p>
          <p className="c4-kyc-kicker">{v4("kycDesk")}</p>
          <h2 className="c4-title">{v4("kycDesk")}</h2>
        </div>
        <ol className="c4-kyc-scriptorium-index" aria-label={v4("kycDesk")}>
          <li data-tone="gold">{v4("kycQueue")}</li>
          <li data-tone="ink">{v4("kycApprove")}</li>
          <li data-tone="ivory">{v4("kycReject")}</li>
        </ol>
        <p className="c4-kyc-plate" data-logo="mono">7FX</p>
      </header>
      <p className="c4-muted c4-kyc-hint">{v4("kycHint")}</p>
      <div className="c4-kyc-split">
        <div>
          <h3 className="c4-title">{v4("kycQueue")}</h3>
          <label className="c4-lab"><span>{v4("kycSearch")}</span><input className="c4-field" aria-label={v4("kycSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {!people.length && <p className="c4-empty-gold">{v4("kycEmpty")}</p>}
          <ul className="c4-kyc-queue">
            {people.map((row) => (
              <li key={row.id}>
                <button type="button" className="c4-btn" data-on={person?.id === row.id ? "1" : "0"} onClick={() => { setPersonId(row.id); setDocId(""); }}>
                  {row.name} · {row.docs.length}
                </button>
              </li>
            ))}
          </ul>
          {person && (
            <ul className="c4-kyc-docs" aria-label={v4("kycDocs")}>
              {person.docs.map((row) => (
                <li key={row.id}>
                  <button type="button" className="c4-btn" data-on={doc?.id === row.id ? "1" : "0"} onClick={() => setDocId(row.id)}>
                    {row.name || row.docType || row.id} · {row.status}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="c4-kyc-stage" aria-label={v4("kycPreview")} data-ready={checksDone(box) === CHECK_ITEMS.length ? "1" : "0"}>
          <h3 className="c4-title">{doc?.name || v4("kycPreview")}</h3>
          <p className="c4-muted">{doc ? `${doc.docType || "—"} · ${when(doc.createdAt, locale)}` : v4("kycEmpty")}</p>
          {file ? (
            isPdf(file)
              ? <iframe title={file.title || v4("kycPreview")} src={`/api/admin/customer-documents/${file.id}`} className="c4-kyc-frame" />
              : (
                // eslint-disable-next-line @next/next/no-img-element -- loaded customer file, not a bundled image
                <img className="c4-kyc-frame" alt={file.title || ""} src={`/api/admin/customer-documents/${file.id}`} />
              )
          ) : <p className="c4-kyc-empty">{v4("kycNoFile")}</p>}
          <fieldset className="c4-kyc-checks">
            <legend className="c4-muted">{v4("kycCheckHint")} {checksDone(box)}/{CHECK_ITEMS.length}</legend>
            {CHECK_ITEMS.map((item) => (
              <label key={item} className="c4-row">
                <input type="checkbox" checked={box[item]} aria-label={v4(CHECK_LABEL[item])} onChange={(event) => saveCheck(item, event.target.checked)} />
                <span>{v4(CHECK_LABEL[item])}</span>
              </label>
            ))}
          </fieldset>
          <label className="c4-lab">
            <span>{v4("kycReason")}</span>
            <input className="c4-field" aria-label={v4("kycReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c4-muted">{v4("kycReasonHint")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={!doc} onClick={() => void review("APPROVED")}>{v4("kycApprove")}</button>
            <button type="button" className="c4-btn" disabled={!doc} onClick={() => void review("REJECTED")}>{v4("kycReject")}</button>
          </div>
          {msg && <p className="c4-muted">{msg}</p>}
        </div>
      </div>
    </section>
  );
}

function printReport() {
  const root = document.querySelector("[data-crmv4-root]");
  root?.setAttribute("data-print", "report");
  window.print();
  window.setTimeout(() => root?.removeAttribute("data-print"), 400);
}

async function saveCsv(kind: string, filename: string, header: string[], lines: string[][]) {
  const ok = await auditExport(kind, lines.length, "/crmv4/reports");
  if (!ok) return;
  downloadCsv(filename, header, lines);
}

export function ReportsPage({ v4, locale }: { v4: V4; locale: string }) {
  const people = useJson<{ users?: { id: string; name?: string | null; email?: string | null; country?: string | null; desk?: string | null; documentsStatus?: string | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; user?: { name?: string | null } | null }[] }>("/api/admin/deposits?take=80");
  const withdrawals = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; user?: { name?: string | null } | null }[] }>("/api/admin/withdrawals?take=80");
  const tickets = useJson<{ tickets?: { id: string; kind?: string | null; amount?: number | null; currency?: string | null; status?: string | null; customer?: string | null; openedAt?: string | null }[] }>("/api/admin/tickets?take=40");
  const [currency, setCurrency] = useState("");
  const [needle, setNeedle] = useState("");
  const users = people.data?.users || [];
  const depositRows: MoneyLine[] = (deposits.data?.requests || []).map((row) => ({ id: row.id, amount: row.amount, currency: row.currency, status: row.status, createdAt: row.createdAt, name: row.user?.name }));
  const withdrawalRows: MoneyLine[] = (withdrawals.data?.requests || []).map((row) => ({ id: row.id, amount: row.amount, currency: row.currency, status: row.status, createdAt: row.createdAt, name: row.user?.name }));
  const ticketRows: MoneyLine[] = (tickets.data?.tickets || []).map((row) => ({ id: row.id, amount: row.amount, currency: row.currency, status: row.status, openedAt: row.openedAt, name: row.customer, kind: row.kind }));
  const codes = Array.from(new Set([...sumsByCurrency(depositRows), ...sumsByCurrency(withdrawalRows), ...sumsByCurrency(ticketRows)].map((row) => row.currency)));
  const text = needle.trim().toLowerCase();
  const named = (row: { name?: string | null }) => !text || String(row.name || "").toLowerCase().includes(text);
  const shownUsers = users.filter((row) => !text || `${row.name || ""} ${row.email || ""} ${row.country || ""} ${row.desk || ""}`.toLowerCase().includes(text));
  const shownDeposits = rowsForCurrency(depositRows, currency).filter(named);
  const shownWithdrawals = rowsForCurrency(withdrawalRows, currency).filter(named);
  const shownTickets = rowsForCurrency(ticketRows, currency).filter(named);
  return (
    <section className="c4-report-center c4-report-ledger" aria-label={v4("reportsTitle")} data-reports="1" data-desk="ledger">
      <header className="c4-report-ledger-mast">
        <p className="c4-report-ledger-seal" data-logo="mono">7FX</p>
        <div className="c4-report-ledger-copy">
          <p className="c4-report-ledger-kicker">{v4("reportsMark")}</p>
          <h2 className="c4-title c4-report-ledger-title">{v4("reportsTitle")}</h2>
          <p className="c4-report-ledger-rule">{v4("reportsHint")}</p>
        </div>
        <ol className="c4-report-ledger-index" aria-label={v4("reportsTitle")}>
          <li data-tone="gold">{v4("reportsCustomers")}</li>
          <li data-tone="ink">{v4("reportsDeposits")}</li>
          <li data-tone="ivory">{v4("reportsWithdrawals")}</li>
        </ol>
      </header>
      <p className="c4-report-ledger-links">
        <Link href="qire">{v4("qirTitle")}</Link>
        <Link href="rmgn">{v4("rmgTitle")}</Link>
      </p>
      <label className="c4-lab c4-report-ledger-find">
        <span>{v4("reportsSearch")}</span>
        <input className="c4-field c4-report-ledger-search" aria-label={v4("reportsSearch")} aria-required={false} value={needle} onChange={(event) => setNeedle(event.target.value)} />
      </label>
      <div className="c4-line-filters c4-report-ledger-filters" aria-label={v4("reportsAll")}>
        <button type="button" className="c4-chip" data-on={currency ? "0" : "1"} onClick={() => setCurrency("")}>{v4("reportsAll")}</button>
        {codes.map((code) => <button key={code} type="button" className="c4-chip" data-on={currency === code ? "1" : "0"} onClick={() => setCurrency(code)}>{code}</button>)}
      </div>
      <article className="c4-report-card c4-report-ledger-card" data-report="customers">
        <h3 className="c4-title">{v4("reportsCustomers")}</h3>
        <p className="c4-muted">{v4("reportsRows")} {shownUsers.length}</p>
        {!shownUsers.length && <p className="c4-empty-gold c4-report-ledger-empty">{v4("reportsEmpty")}</p>}
        <ul>{shownUsers.slice(0, 8).map((row) => <li key={row.id}>{row.name || "—"} · {row.email || "—"} · {row.documentsStatus || "NONE"}</li>)}</ul>
        <div className="c4-row">
          <button type="button" className="c4-btn" onClick={() => void saveCsv("customers", "customers.csv", ["name", "email", "country", "desk", "documents"], shownUsers.map((row) => [String(row.name || ""), String(row.email || ""), String(row.country || ""), String(row.desk || ""), String(row.documentsStatus || "NONE")]))}>{v4("reportsCsv")}</button>
          <button type="button" className="c4-btn" onClick={printReport}>{v4("reportsPrint")}</button>
        </div>
      </article>
      <MoneyReport title={v4("reportsDeposits")} rows={shownDeposits} locale={locale} v4={v4} filename="deposits.csv" kind="deposits" />
      <MoneyReport title={v4("reportsWithdrawals")} rows={shownWithdrawals} locale={locale} v4={v4} filename="withdrawals.csv" kind="withdrawals" />
      <MoneyReport title={v4("reportsTickets")} rows={shownTickets} locale={locale} v4={v4} filename="tickets.csv" kind="tickets" />
    </section>
  );
}

function MoneyReport({ title, rows, locale, v4, filename, kind }: { title: string; rows: MoneyLine[]; locale: string; v4: V4; filename: string; kind: string }) {
  const sums = sumsByCurrency(rows);
  return (
    <article className="c4-report-card c4-report-ledger-card" data-report={kind}>
      <h3 className="c4-title">{title}</h3>
      <p className="c4-muted">{v4("reportsRows")} {rows.length}</p>
      {!rows.length && <p className="c4-empty-gold c4-report-ledger-empty">{v4("reportsEmpty")}</p>}
      <ul className="c4-report-sums c4-report-ledger-sums">
        {sums.map((row) => {
          const peak = Math.max(1, ...sums.map((item) => item.count));
          return (
            <li key={row.currency}>
              <span className="c4-report-ledger-bar" style={{ width: `${Math.max(8, Math.round((row.count / peak) * 100))}%` }} />
              <span>{row.currency} · {row.count} · {money(row.amount, row.currency, locale)}</span>
            </li>
          );
        })}
      </ul>
      <ul>{rows.slice(0, 6).map((row) => <li key={row.id}>{row.name || row.kind || row.id} · {row.currency ? money(row.amount, row.currency, locale) : "—"} · {row.status || "—"}</li>)}</ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => void saveCsv(kind, filename, ["name", "amount", "currency", "status", "at"], rows.map((row) => [String(row.name || row.kind || ""), String(row.amount ?? ""), String(row.currency || ""), String(row.status || ""), String(row.createdAt || row.openedAt || "")]))}>{v4("reportsCsv")}</button>
        <button type="button" className="c4-btn" onClick={printReport}>{v4("reportsPrint")}</button>
      </div>
    </article>
  );
}
