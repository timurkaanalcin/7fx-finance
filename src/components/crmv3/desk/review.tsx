"use client";

import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/review";
import { auditExport, downloadCsv, money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const CHECK_KEY = "crmv3-doc-review";

const CHECK_LABEL: Record<CheckItem, CrmV3CopyKey> = {
  name: "kycCheckName",
  photo: "kycCheckPhoto",
  expiry: "kycCheckExpiry",
  readable: "kycCheckReadable",
};

export function KycDesk({ tx, locale }: { tx: Tx; locale: string }) {
  const v3 = useV3();
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
    <section className="c3-card" aria-label={v3("kycDesk")} data-kyc="1">
      <h2 className="c3-title c3-pad">{v3("kycDesk")}</h2>
      <p className="c3-muted c3-pad">{v3("kycHint")}</p>
      <div className="c3-kyc-split">
        <div>
          <h3 className="c3-title c3-pad">{v3("kycQueue")}</h3>
          <label className="c3-lab c3-pad"><span>{v3("kycSearch")}</span><input className="c3-field" aria-label={v3("kycSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {!people.length && <p className="c3-empty" role="status">{v3("kycEmpty")}</p>}
          <ul className="c3-arrange-list">
            {people.map((row) => (
              <li key={row.id}>
                <button type="button" className="c3-btn" data-on={person?.id === row.id ? "1" : "0"} onClick={() => { setPersonId(row.id); setDocId(""); }}>
                  {row.name} · {row.docs.length}
                </button>
              </li>
            ))}
          </ul>
          {person && (
            <ul className="c3-arrange-list" aria-label={v3("kycDocs")}>
              {person.docs.map((row) => (
                <li key={row.id}>
                  <button type="button" className="c3-btn" data-on={doc?.id === row.id ? "1" : "0"} onClick={() => setDocId(row.id)}>
                    {row.name || row.docType || row.id} · {row.status}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="c3-kyc-stage" aria-label={v3("kycPreview")}>
          <h3 className="c3-title">{doc?.name || v3("kycPreview")}</h3>
          <p className="c3-muted">{doc ? `${doc.docType || "—"} · ${when(doc.createdAt, locale)}` : v3("kycEmpty")}</p>
          {file ? (
            isPdf(file)
              ? <iframe title={file.title || v3("kycPreview")} src={`/api/admin/customer-documents/${file.id}`} className="c3-kyc-frame" />
              : (
                // eslint-disable-next-line @next/next/no-img-element -- loaded customer file, not a bundled image
                <img className="c3-kyc-frame" alt={file.title || ""} src={`/api/admin/customer-documents/${file.id}`} />
              )
          ) : <p className="c3-kyc-empty">{v3("kycNoFile")}</p>}
          <fieldset className="c3-kyc-checks">
            <legend className="c3-muted">{v3("kycCheckHint")} {checksDone(box)}/{CHECK_ITEMS.length}</legend>
            {CHECK_ITEMS.map((item) => (
              <label key={item} className="c3-row">
                <input type="checkbox" checked={box[item]} aria-label={v3(CHECK_LABEL[item])} onChange={(event) => saveCheck(item, event.target.checked)} />
                <span>{v3(CHECK_LABEL[item])}</span>
              </label>
            ))}
          </fieldset>
          <label className="c3-lab">
            <span>{v3("kycReason")}</span>
            <input className="c3-field" aria-label={v3("kycReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("kycReasonHint")}</p>
          <div className="c3-tools">
            <button type="button" className="c3-btn c3-btn-hot" disabled={!doc} onClick={() => void review("APPROVED")}>{v3("kycApprove")}</button>
            <button type="button" className="c3-btn" disabled={!doc} onClick={() => void review("REJECTED")}>{v3("kycReject")}</button>
          </div>
          {msg && <p className="c3-muted" role="status">{msg}</p>}
        </div>
      </div>
    </section>
  );
}

function printReport() {
  const root = document.querySelector("[data-crmv3-root]");
  root?.setAttribute("data-print", "report");
  const clear = () => root?.removeAttribute("data-print");
  window.addEventListener("afterprint", clear, { once: true });
  window.print();
  window.setTimeout(clear, 400);
}

async function saveCsv(kind: string, filename: string, header: string[], lines: string[][]) {
  const ok = await auditExport(kind, lines.length, "/crmv3/reports");
  if (!ok) return;
  downloadCsv(filename, header, lines);
}

export function ReportsPage({ locale }: { locale: string }) {
  const v3 = useV3();
  const people = useJson<{ users?: { id: string; name?: string | null; email?: string | null; country?: string | null; desk?: string | null; documentsStatus?: string | null }[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; user?: { name?: string | null } | null }[] }>("/api/admin/deposits?take=80");
  const withdrawals = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; user?: { name?: string | null } | null }[] }>("/api/admin/withdrawals?take=80");
  const tickets = useJson<{ tickets?: { id: string; kind?: string | null; amount?: number | null; currency?: string | null; status?: string | null; customer?: string | null; openedAt?: string | null }[] }>("/api/admin/tickets?take=40");
  const [currency, setCurrency] = useState("");
  const users = people.data?.users || [];
  const depositRows: MoneyLine[] = (deposits.data?.requests || []).map((row) => ({ id: row.id, amount: row.amount, currency: row.currency, status: row.status, createdAt: row.createdAt, name: row.user?.name }));
  const withdrawalRows: MoneyLine[] = (withdrawals.data?.requests || []).map((row) => ({ id: row.id, amount: row.amount, currency: row.currency, status: row.status, createdAt: row.createdAt, name: row.user?.name }));
  const ticketRows: MoneyLine[] = (tickets.data?.tickets || []).map((row) => ({ id: row.id, amount: row.amount, currency: row.currency, status: row.status, openedAt: row.openedAt, name: row.customer, kind: row.kind }));
  const codes = Array.from(new Set([...sumsByCurrency(depositRows), ...sumsByCurrency(withdrawalRows), ...sumsByCurrency(ticketRows)].map((row) => row.currency)));
  const shownDeposits = rowsForCurrency(depositRows, currency);
  const shownWithdrawals = rowsForCurrency(withdrawalRows, currency);
  const shownTickets = rowsForCurrency(ticketRows, currency);
  return (
    <section className="c3-stack" aria-label={v3("reportsTitle")} data-reports="1">
      <div className="c3-card">
        <h2 className="c3-title c3-pad">{v3("reportsTitle")}</h2>
        <p className="c3-muted c3-pad">{v3("reportsHint")}</p>
        <div className="c3-tools" aria-label={v3("reportsAll")}>
          <button type="button" className="c3-chip" data-on={currency ? "0" : "1"} onClick={() => setCurrency("")}>{v3("reportsAll")}</button>
          {codes.map((code) => <button key={code} type="button" className="c3-chip" data-on={currency === code ? "1" : "0"} onClick={() => setCurrency(code)}>{code}</button>)}
        </div>
      </div>
      <article className="c3-card" data-report="customers">
        <h3 className="c3-title c3-pad">{v3("reportsCustomers")}</h3>
        <p className="c3-muted c3-pad">{v3("reportsRows")} {users.length}</p>
        {!users.length && <p className="c3-empty" role="status">{v3("reportsEmpty")}</p>}
        <ul className="c3-arrange-list">{users.slice(0, 8).map((row) => <li key={row.id}>{row.name || "—"} · {row.email || "—"} · {row.documentsStatus || "NONE"}</li>)}</ul>
        <div className="c3-tools c3-report-tools">
          <button type="button" className="c3-btn" onClick={() => void saveCsv("customers", "customers.csv", ["name", "email", "country", "desk", "documents"], users.map((row) => [String(row.name || ""), String(row.email || ""), String(row.country || ""), String(row.desk || ""), String(row.documentsStatus || "NONE")]))}>{v3("reportsCsv")}</button>
          <button type="button" className="c3-btn" onClick={printReport}>{v3("reportsPrint")}</button>
        </div>
      </article>
      <MoneyReport title={v3("reportsDeposits")} rows={shownDeposits} locale={locale} filename="deposits.csv" kind="deposits" />
      <MoneyReport title={v3("reportsWithdrawals")} rows={shownWithdrawals} locale={locale} filename="withdrawals.csv" kind="withdrawals" />
      <MoneyReport title={v3("reportsTickets")} rows={shownTickets} locale={locale} filename="tickets.csv" kind="tickets" />
    </section>
  );
}

function MoneyReport({ title, rows, locale, filename, kind }: { title: string; rows: MoneyLine[]; locale: string; filename: string; kind: string }) {
  const v3 = useV3();
  const sums = sumsByCurrency(rows);
  return (
    <article className="c3-card" data-report={kind}>
      <h3 className="c3-title c3-pad">{title}</h3>
      <p className="c3-muted c3-pad">{v3("reportsRows")} {rows.length}</p>
      {!rows.length && <p className="c3-empty" role="status">{v3("reportsEmpty")}</p>}
      <ul className="c3-arrange-list">
        {sums.map((row) => <li key={row.currency}>{row.currency} · {row.count} · {money(row.amount, row.currency, locale)}</li>)}
      </ul>
      <ul className="c3-arrange-list">{rows.slice(0, 6).map((row) => <li key={row.id}>{row.name || row.kind || row.id} · {row.currency ? money(row.amount, row.currency, locale) : "—"} · {row.status || "—"}</li>)}</ul>
      <div className="c3-tools c3-report-tools">
        <button type="button" className="c3-btn" onClick={() => void saveCsv(kind, filename, ["name", "amount", "currency", "status", "at"], rows.map((row) => [String(row.name || row.kind || ""), String(row.amount ?? ""), String(row.currency || ""), String(row.status || ""), String(row.createdAt || row.openedAt || "")]))}>{v3("reportsCsv")}</button>
        <button type="button" className="c3-btn" onClick={printReport}>{v3("reportsPrint")}</button>
      </div>
    </article>
  );
}
