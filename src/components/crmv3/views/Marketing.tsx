"use client";

import { useState } from "react";
import { Card, Lab, Msg, State, sendJson, useJson, type Tx } from "../kit";
import { MarketDesk } from "../desk/panels";

type Template = { id: string; name?: string; subject?: string; body?: string; active?: boolean };

export default function Marketing({ tx }: { tx: Tx }) {
  const aff = useJson<{ rows?: { name?: string; leads?: number; valid?: number; invalid?: number; deposits?: number }[] }>("/api/admin/analytics/affiliates?period=month");
  const mail = useJson<{ templates?: Template[] }>("/api/admin/mail");
  const rows = aff.data?.rows || [];
  const templates = mail.data?.templates || [];
  const [picked, setPicked] = useState("");
  const [audience, setAudience] = useState("");
  const [msg, setMsg] = useState("");
  const current = templates.find((row) => row.id === picked) || null;
  return (
    <div className="c3-stack">
      <p className="c3-muted">{tx("marketingLead")}</p>
      <MarketDesk />
      <Card title={tx("affiliates")}>
        <State loading={aff.loading} error={aff.error} empty={!aff.loading && rows.length === 0} tx={tx} onRetry={aff.reload} />
        <ul>
          {rows.map((row) => (
            <li key={row.name} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
              <span>{row.name || "—"}</span>
              <span className="c3-muted">{tx("leads")} {row.leads ?? 0} · {tx("valid")} {row.valid ?? 0} · {tx("invalid")} {row.invalid ?? 0} · {tx("deposits")} {row.deposits ?? 0}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={tx("templates")}>
        <State loading={mail.loading} error={mail.error} empty={!mail.loading && templates.length === 0} tx={tx} onRetry={mail.reload} />
        <ul>
          {templates.map((row) => (
            <li key={row.id} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
              <button type="button" className="c3-btn" onClick={() => setPicked(row.id)}>{row.name} · {row.subject}</button>
              <button
                type="button"
                className="c3-btn"
                onClick={async () => {
                  const res = await sendJson("/api/admin/mail", "POST", { action: "delete", id: row.id });
                  setMsg(res.ok ? tx("templateDeleted") : tx("failed"));
                  if (res.ok) mail.reload();
                }}
              >
                {tx("deleteTemplate")}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="c3-form c3-form-2"
          style={{ padding: 16 }}
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            const res = await sendJson("/api/admin/mail", "POST", { action: "create", name: fd.get("name"), subject: fd.get("subject"), body: fd.get("body") });
            setMsg(res.ok ? tx("templateSaved") : tx("failed"));
            if (res.ok) {
              event.currentTarget.reset();
              mail.reload();
            }
          }}
        >
          <input name="name" required placeholder={tx("name")} aria-label={tx("name")} className="c3-field" />
          <input name="subject" required placeholder={tx("subject")} aria-label={tx("subject")} className="c3-field" />
          <textarea name="body" required placeholder={tx("body")} aria-label={tx("body")} className="c3-field" rows={3} style={{ gridColumn: "1 / -1" }} />
          <button type="submit" className="c3-btn c3-btn-hot">{tx("createTemplate")}</button>
        </form>
        <Msg text={msg} />
      </Card>
      <section className="c3-card c3-soon" data-coming-soon="">
        <div className="c3-card-h">
          <h2 className="c3-title">{tx("campaignSend")}</h2>
          <span className="c3-status" data-tone="warn">{tx("cannotSend")}</span>
        </div>
        <div className="c3-stack" style={{ padding: 16 }}>
          <p>{tx("campaignIntro")}</p>
          <p className="c3-muted">{tx("campaignStub")}</p>
          <Lab label={tx("selectTemplate")}>
            <select className="c3-select" value={picked} onChange={(event) => setPicked(event.target.value)}>
              <option value="">{tx("selectTemplate")}</option>
              {templates.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </Lab>
          <Lab label={tx("campaignAudience")}>
            <input className="c3-field" value={audience} onChange={(event) => setAudience(event.target.value)} placeholder={tx("audiencePh")} />
          </Lab>
          {current && (
            <div className="c3-note">
              <div>{tx("campaignPreview")}: {current.subject}</div>
              <p>{current.body}</p>
              {audience && <p className="c3-muted">{tx("campaignAudience")}: {audience}</p>}
            </div>
          )}
          <button type="button" className="c3-btn" disabled>{tx("send")}</button>
        </div>
      </section>
    </div>
  );
}
