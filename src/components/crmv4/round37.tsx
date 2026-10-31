"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  EMPTY_CHECKS,
  auditLines,
  checkDone,
  docTimeline,
  docTypes,
  filterAudit,
  groupAudit,
  normalizeChecks,
  type AuditLite,
  type KycChecks,
} from "@/lib/crmv4/round37";
import { ReviewDialog } from "./round1";
import { downloadCsv, sendJson, State, Status, statusTone, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const CHECK_KEY = "crmv4-kyc-check";

type DocRow = {
  id: string;
  name?: string;
  docType?: string;
  status?: string;
  traderId?: string;
  createdAt?: string;
  reviewedAt?: string | null;
  note?: string | null;
};

type FileRow = { id: string; title?: string; fileName?: string; mime?: string; createdAt?: string };

export function KycStudio({
  id, rows, loading, error, onRetry, uploads, filesLoading, tx, locale, v4,
}: {
  id: string;
  rows: DocRow[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  uploads: FileRow[];
  filesLoading: boolean;
  tx: Tx;
  locale: string;
  v4: V4;
}) {
  const [reason, setReason] = useState("");
  const [type, setType] = useState("");
  const [checks, setChecks] = useState<KycChecks>(EMPTY_CHECKS);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState<null | { title: string; src?: string; pdf?: boolean; id?: string; status?: string }>(null);
  useEffect(() => { setChecks(normalizeChecks(readJson(CHECK_KEY + id, EMPTY_CHECKS))); }, [id]);
  const mine = rows;
  const types = docTypes(mine);
  const shown = type ? mine.filter((row) => row.docType === type) : mine;
  function saveChecks(next: KycChecks) {
    setChecks(next);
    writeJson(CHECK_KEY + id, next);
  }
  async function review(docId: string, status: "APPROVED" | "REJECTED") {
    const note = reason.trim();
    const res = await sendJson("/api/admin/documents", "POST", { action: "review", id: docId, status, ...(note ? { note } : {}) });
    setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
    if (res.ok) onRetry();
    setOpen(null);
  }
  return (
    <section className="c4-kyc-gallery" aria-label={v4("kycTitle")} data-kyc="1">
      <h2 className="c4-title">{v4("kycTitle")}</h2>
      <p className="c4-muted">{v4("kycHint")}</p>
      <State loading={loading} error={error} empty={!loading && !error && mine.length === 0} tx={tx} onRetry={onRetry} hint={v4("kycNone")} />
      {!loading && !error && mine.length > 0 && (
        <>
          <div className="c4-line-filters" role="group" aria-label={v4("kycTypeAll")}>
            <button type="button" className="c4-chip" data-on={type === "" ? "1" : "0"} onClick={() => setType("")}>{v4("kycTypeAll")}</button>
            {types.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={type === item ? "1" : "0"} onClick={() => setType(item)}>{item}</button>
            ))}
          </div>
          <fieldset className="c4-kyc-check">
            <legend>{v4("kycCheckCount")} · {checkDone(checks)}/3</legend>
            <p className="c4-muted">{v4("kycCheckHint")}</p>
            {(["name", "photo", "expiry"] as const).map((key) => (
              <label key={key}>
                <input type="checkbox" checked={checks[key]} onChange={(event) => saveChecks({ ...checks, [key]: event.target.checked })} />
                {v4(key === "name" ? "kycCheckName" : key === "photo" ? "kycCheckPhoto" : "kycCheckExpiry")}
              </label>
            ))}
          </fieldset>
          <label className="c4-lab">
            <span>{v4("kycReason")}</span>
            <input className="c4-field" aria-label={v4("kycReason")} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c4-muted">{v4("kycReasonHint")}</p>
          {!shown.length && <p className="c4-empty c4-empty-card">{v4("kycNone")}</p>}
          <ul className="c4-kyc-grid">
            {shown.map((row) => (
              <li key={row.id}>
                <div className="c4-row c4-between">
                  <strong>{row.name || row.id}</strong>
                  <Status tone={statusTone(row.status)}>{row.status || "—"}</Status>
                </div>
                <p className="c4-muted">{row.docType || "—"}</p>
                <ol className="c4-kyc-time">
                  {docTimeline(row).map((step) => (
                    <li key={step.key}>
                      <span>{v4(step.key === "received" ? "kycReceived" : "kycReviewed")}</span>
                      <span>{when(step.at, locale)}</span>
                    </li>
                  ))}
                </ol>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => setOpen({ title: `${row.name || ""} · ${row.docType || ""}`, id: row.id, status: row.status })}>{v4("kycPreview")}</button>
                  {row.status === "PENDING" && (
                    <>
                      <button type="button" className="c4-btn c4-btn-hot" onClick={() => void review(row.id, "APPROVED")}>{tx("approve")}</button>
                      <button type="button" className="c4-btn" onClick={() => void review(row.id, "REJECTED")}>{tx("reject")}</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <h3 className="c4-title">{v4("kycFiles")}</h3>
      <p className="c4-muted">{v4("kycFileHint")}</p>
      {!filesLoading && uploads.length === 0 && <p className="c4-empty c4-empty-card">{v4("kycNone")}</p>}
      <ul className="c4-kyc-grid">
        {uploads.map((row) => (
          <li key={row.id}>
            <strong>{row.title || row.fileName || row.id}</strong>
            <ol className="c4-kyc-time">
              {row.createdAt && (
                <li>
                  <span>{v4("kycReceived")}</span>
                  <span>{when(row.createdAt, locale)}</span>
                </li>
              )}
            </ol>
            <button
              type="button"
              className="c4-btn"
              onClick={() => setOpen({
                title: row.title || row.fileName || "",
                src: `/api/admin/customer-documents/${row.id}`,
                pdf: String(row.mime || row.fileName || "").toLowerCase().includes("pdf"),
              })}
            >{v4("kycPreview")}</button>
          </li>
        ))}
      </ul>
      {msg && <p className="c4-muted">{msg}</p>}
      {open && (
        <ReviewDialog
          title={open.title}
          src={open.src}
          pdf={open.pdf}
          v4={v4}
          tx={tx}
          onClose={() => setOpen(null)}
          onApprove={open.id && open.status === "PENDING" ? () => void review(open.id || "", "APPROVED") : undefined}
          onReject={open.id && open.status === "PENDING" ? () => void review(open.id || "", "REJECTED") : undefined}
        />
      )}
    </section>
  );
}

export function AuditTimeline({ v4, locale, tx }: { v4: V4; locale: string; tx: Tx }) {
  const data = useJson<{ rows?: AuditLite[] }>("/api/admin/control?part=logs&source=audit&level=all&take=40");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const loaded = data.data?.rows || [];
  const rows = filterAudit(loaded, { actor, action, entity });
  const days = groupAudit(rows);
  return (
    <section className="c4-audit-time" aria-label={v4("auditTitle")} data-audit="1">
      <h2 className="c4-title">{v4("auditTitle")}</h2>
      <p className="c4-muted">{v4("auditHint")}</p>
      <State loading={data.loading} error={data.error} empty={!data.loading && !data.error && loaded.length === 0} tx={tx} onRetry={data.reload} hint={v4("auditEmpty")} />
      {!data.loading && !data.error && loaded.length > 0 && (
        <>
          <div className="c4-ledger-filters">
            <label className="c4-lab"><span>{v4("auditActor")}</span><input className="c4-field" aria-label={v4("auditActor")} value={actor} onChange={(event) => setActor(event.target.value)} /></label>
            <label className="c4-lab"><span>{v4("auditAction")}</span><input className="c4-field" aria-label={v4("auditAction")} value={action} onChange={(event) => setAction(event.target.value)} /></label>
            <label className="c4-lab"><span>{v4("auditEntity")}</span><input className="c4-field" aria-label={v4("auditEntity")} value={entity} onChange={(event) => setEntity(event.target.value)} /></label>
            <button type="button" className="c4-btn" onClick={() => downloadCsv("audit-loaded.csv", [v4("auditActor"), v4("auditAction"), v4("auditEntity"), "level", "at"], auditLines(rows))}>{v4("auditExport")}</button>
          </div>
          <p className="c4-muted">{v4("auditCount")} · {rows.length}</p>
          {!rows.length && <p className="c4-empty c4-empty-card">{v4("auditEmpty")}</p>}
          {days.map((group) => (
            <section key={group.day || "none"}>
              <h3 className="c4-title">{group.day || v4("auditNoDay")}</h3>
              <ul>
                {group.rows.map((row) => (
                  <li key={row.id}>
                    <div className="c4-row c4-between">
                      <strong>{row.action || "—"}</strong>
                      <Status tone={statusTone(row.level)}>{row.level || "—"}</Status>
                    </div>
                    <p>{row.actor || "—"} · {row.target || "—"}</p>
                    <p className="c4-muted">{when(row.at, locale)}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </section>
  );
}
