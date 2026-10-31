"use client";

import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  CHECK_KEY,
  EMPTY_CHECKS,
  auditLines,
  checkDone,
  docTimeline,
  docTypes,
  filterAudit,
  groupAudit,
  readCheckMap,
  type AuditLite,
  type KycChecks,
} from "@/lib/crmv3/gallery";
import { downloadCsv, sendJson, Sheet, State, Status, statusTone, useJson, when, type Tx } from "../kit";
import { PhoneSheet } from "./system";
import { useV3 } from "./store";

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

type OpenPreview = { title: string; src?: string; pdf?: boolean; id?: string; status?: string };

export function KycStudio({
  id, rows, loading, error, onRetry, uploads, filesLoading, tx, locale,
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
}) {
  const v3 = useV3();
  const [reason, setReason] = useState("");
  const [type, setType] = useState("");
  const [checks, setChecks] = useState<KycChecks>(EMPTY_CHECKS);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState<OpenPreview | null>(null);
  useEffect(() => {
    const saved = readCheckMap(readJson(CHECK_KEY, {}));
    setChecks(saved[id] || EMPTY_CHECKS);
  }, [id]);
  const types = docTypes(rows);
  const shown = type ? rows.filter((row) => row.docType === type) : rows;
  function saveChecks(next: KycChecks) {
    setChecks(next);
    const saved = readCheckMap(readJson(CHECK_KEY, {}));
    writeJson(CHECK_KEY, { ...saved, [id]: next });
  }
  async function review(docId: string, status: "APPROVED" | "REJECTED") {
    const note = reason.trim();
    const res = await sendJson("/api/admin/documents", "POST", { action: "review", id: docId, status, ...(note ? { note } : {}) });
    setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
    if (res.ok) onRetry();
    setOpen(null);
  }
  return (
    <section className="c3-gallery" aria-label={v3("kycTitle")} data-gallery="1">
      <h2 className="c3-title">{v3("kycTitle")}</h2>
      <p className="c3-muted">{v3("galHint")}</p>
      <State loading={loading} error={error} empty={false} tx={tx} onRetry={onRetry} />
      {!loading && !error && rows.length === 0 && <p className="c3-empty-card" role="status">{v3("kycNone")}</p>}
      {!loading && !error && rows.length > 0 && (
        <>
          <div className="c3-tools" role="group" aria-label={v3("kycTypeAll")}>
            <button type="button" className="c3-chip" data-on={type === "" ? "1" : "0"} onClick={() => setType("")}>{v3("kycTypeAll")}</button>
            {types.map((item) => (
              <button key={item} type="button" className="c3-chip" data-on={type === item ? "1" : "0"} onClick={() => setType(item)}>{item}</button>
            ))}
          </div>
          <fieldset className="c3-gallery-check">
            <legend>{v3("kycCheckCount")} · {checkDone(checks)}/3</legend>
            <p className="c3-muted">{v3("galCheckHint")}</p>
            {(["name", "photo", "expiry"] as const).map((key) => (
              <label key={key} className="c3-row">
                <input
                  type="checkbox"
                  checked={checks[key]}
                  onChange={(event) => saveChecks({ ...checks, [key]: event.target.checked })}
                />
                <span>{v3(key === "name" ? "galCheckName" : key === "photo" ? "galCheckPhoto" : "galCheckExpiry")}</span>
              </label>
            ))}
          </fieldset>
          <label className="c3-lab">
            <span>{v3("galReason")}</span>
            <input className="c3-field" aria-label={v3("galReason")} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("galReasonHint")}</p>
          {!shown.length && <p className="c3-empty-card" role="status">{v3("kycNone")}</p>}
          <ul className="c3-gallery-grid">
            {shown.map((row) => (
              <li key={row.id}>
                <div className="c3-row c3-between">
                  <strong>{row.name || row.id}</strong>
                  <Status tone={statusTone(row.status)}>{row.status || "—"}</Status>
                </div>
                <p className="c3-muted">{row.docType || "—"}</p>
                <ol className="c3-gallery-time">
                  {docTimeline(row).map((step) => (
                    <li key={step.key}>
                      <span>{v3(step.key === "received" ? "kycReceived" : "kycReviewed")}</span>
                      <span>{when(step.at, locale)}</span>
                    </li>
                  ))}
                </ol>
                <div className="c3-row">
                  <button type="button" className="c3-btn" onClick={() => setOpen({ title: `${row.name || ""} · ${row.docType || ""}`, id: row.id, status: row.status })}>{v3("galPreview")}</button>
                  {row.status === "PENDING" && (
                    <>
                      <button type="button" className="c3-btn c3-btn-hot" onClick={() => void review(row.id, "APPROVED")}>{tx("approve")}</button>
                      <button type="button" className="c3-btn" onClick={() => void review(row.id, "REJECTED")}>{tx("reject")}</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <h3 className="c3-title">{v3("kycFiles")}</h3>
      <p className="c3-muted">{v3("kycFileHint")}</p>
      {!filesLoading && uploads.length === 0 && <p className="c3-empty-card" role="status">{v3("kycNone")}</p>}
      <ul className="c3-gallery-grid">
        {uploads.map((row) => (
          <li key={row.id}>
            <strong>{row.title || row.fileName || row.id}</strong>
            <ol className="c3-gallery-time">
              {row.createdAt && (
                <li>
                  <span>{v3("kycReceived")}</span>
                  <span>{when(row.createdAt, locale)}</span>
                </li>
              )}
            </ol>
            <button
              type="button"
              className="c3-btn"
              onClick={() => setOpen({
                title: row.title || row.fileName || "",
                src: `/api/admin/customer-documents/${row.id}`,
                pdf: String(row.mime || row.fileName || "").toLowerCase().includes("pdf"),
              })}
            >{v3("galPreview")}</button>
          </li>
        ))}
      </ul>
      {msg && <p className="c3-muted" role="status">{msg}</p>}
      {open && (
        <Sheet title={open.title || v3("galPreview")} onClose={() => setOpen(null)} closeLabel={v3("kycClose")}>
          {open.src && open.pdf ? <iframe title={open.title} src={open.src} className="c3-kyc-frame" /> : null}
          {open.src && !open.pdf ? (
            // eslint-disable-next-line @next/next/no-img-element -- loaded customer file, not a bundled image
            <img className="c3-kyc-frame" alt={open.title} src={open.src} />
          ) : null}
          {!open.src && <p className="c3-kyc-empty" role="status">{v3("galNoFile")}</p>}
          {open.id && open.status === "PENDING" && (
            <div className="c3-row">
              <button type="button" className="c3-btn c3-btn-hot" onClick={() => void review(open.id || "", "APPROVED")}>{tx("approve")}</button>
              <button type="button" className="c3-btn" onClick={() => void review(open.id || "", "REJECTED")}>{tx("reject")}</button>
            </div>
          )}
        </Sheet>
      )}
    </section>
  );
}

export function AuditTimeline({ locale, tx }: { locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ rows?: AuditLite[] }>("/api/admin/control?part=logs&source=audit&level=all&take=40");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const loaded = data.data?.rows || [];
  const rows = filterAudit(loaded, { actor, action, entity });
  const days = groupAudit(rows);
  return (
    <section className="c3-audit" aria-label={v3("auditTitle")} data-audit="1">
      <h2 className="c3-title">{v3("auditTitle")}</h2>
      <p className="c3-muted">{v3("auditHint")}</p>
      <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
      {!data.loading && !data.error && loaded.length === 0 && <p className="c3-empty-card" role="status">{v3("auditEmpty")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && (
        <>
          <PhoneSheet title={v3("sheetFilters")}>
          <div className="c3-ledger-filters">
            <label className="c3-lab"><span>{v3("auditActor")}</span><input className="c3-field" aria-label={v3("auditActor")} value={actor} onChange={(event) => setActor(event.target.value)} /></label>
            <label className="c3-lab"><span>{v3("auditAction")}</span><input className="c3-field" aria-label={v3("auditAction")} value={action} onChange={(event) => setAction(event.target.value)} /></label>
            <label className="c3-lab"><span>{v3("auditEntity")}</span><input className="c3-field" aria-label={v3("auditEntity")} value={entity} onChange={(event) => setEntity(event.target.value)} /></label>
            <button type="button" className="c3-btn" onClick={() => downloadCsv("audit-loaded.csv", [v3("auditActor"), v3("auditAction"), v3("auditEntity"), "level", "at"], auditLines(rows))}>{v3("auditExport")}</button>
          </div>
          </PhoneSheet>
          <p className="c3-muted">{v3("auditCount")} · {rows.length}</p>
          {!rows.length && <p className="c3-empty-card" role="status">{v3("auditEmpty")}</p>}
          {days.map((group) => (
            <section key={group.day || "none"}>
              <h3 className="c3-title">{group.day || v3("auditNoDay")}</h3>
              <ul className="c3-audit-rows">
                {group.rows.map((row) => (
                  <li key={row.id}>
                    <div className="c3-row c3-between">
                      <strong>{row.action || "—"}</strong>
                      <Status tone={statusTone(row.level)}>{row.level || "—"}</Status>
                    </div>
                    <p>{row.actor || "—"} · {row.target || "—"}</p>
                    <p className="c3-muted">{when(row.at, locale)}</p>
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
