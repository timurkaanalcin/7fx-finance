"use client";

import { useEffect, useState } from "react";
import { crmv4Text } from "@/lib/crmv4/copy";
import { exportCurrent } from "../round1";
import { TemplatePreview } from "../round2";
import { AffiliateDetail } from "../round3";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { useI18n } from "@/lib/i18n/context";
import { PayoutCard } from "../round10";
import { AffiliateBoard, AnniversaryList, CampaignBoard, LeadFormPreview, MailGallery, MarketHero, MarketingNotes, ReferralList, RetentionHeat, SegmentBuilder, SmsPreview, TrendAndLanding, WeeklyDigest, WinbackBoard, useLeads } from "../round13";
import { SegmentDesk } from "../round38";
import { SegmentBoard } from "../round48";
import { Card, Lab, Msg, State, sendJson, useJson, type Tx } from "../kit";

type Template = { id: string; name?: string; subject?: string; body?: string; active?: boolean };

export default function Marketing({ tx }: { tx: Tx }) {
  const { locale } = useI18n();
  const aff = useJson<{ rows?: { name?: string; leads?: number; valid?: number; invalid?: number; deposits?: number }[] }>("/api/admin/analytics/affiliates?period=month");
  const mail = useJson<{ templates?: Template[] }>("/api/admin/mail");
  const rows = aff.data?.rows || [];
  const templates = mail.data?.templates || [];
  const [picked, setPicked] = useState("");
  const [openName, setOpenName] = useState("");
  const [detail, setDetail] = useState("");
  const [audience, setAudience] = useState("");
  const [msg, setMsg] = useState("");
  const current = templates.find((row) => row.id === picked) || null;
  const leads = useLeads();
  const v4 = (key: Parameters<typeof crmv4Text>[1]) => crmv4Text(locale, key);
  return (
    <div className="c4-stack c4-mkt c4-mkt-folio c4-mkt-salon c4-mkt-mount">
      <header className="c4-mkt-folio-mast c4-mkt-salon-mast c4-mkt-mount-mast">
        <div>
          <p className="c4-mkt-folio-kicker c4-mkt-salon-kicker c4-mkt-mount-kicker">{tx("marketing")}</p>
          <h2 className="c4-mkt-salon-title c4-mkt-mount-title">{tx("marketingLead")}</h2>
        </div>
        <p className="c4-mkt-folio-mark c4-mkt-salon-plate c4-mkt-mount-plate" data-logo="mono">7FX</p>
      </header>
      <ol className="c4-mkt-salon-index c4-mkt-mount-index" aria-label={tx("marketing")}>
        <li data-tone="gold">{tx("affiliates")}</li>
        <li data-tone="ink">{tx("templates")}</li>
        <li data-tone="mist">{tx("leads")}</li>
      </ol>
      <SegmentBoard v4={v4} />
      <SegmentDesk v4={v4} tx={tx} />
      <p className="c4-muted">{tx("marketingLead")}</p>
      <MarketHero rows={leads.rows} v4={v4} locale={locale} />
      <CampaignBoard rows={leads.rows} v4={v4} locale={locale} />
      <TrendAndLanding rows={leads.rows} v4={v4} />
      <div className="c4-mkt-grid">
        <LeadFormPreview v4={v4} />
        <SmsPreview v4={v4} />
        <SegmentBuilder rows={leads.rows} v4={v4} />
      </div>
      <MailGallery templates={templates} v4={v4} />
      <div className="c4-mkt-grid">
        <RetentionHeat rows={leads.rows} v4={v4} />
        <AnniversaryList rows={leads.rows} v4={v4} />
        <ReferralList rows={leads.rows} v4={v4} />
      </div>
      <WinbackBoard v4={v4} />
      <MarketingNotes v4={v4} />
      <WeeklyDigest rows={leads.rows} v4={v4} />
      <AffiliateBoard rows={rows} v4={v4} />
      <div className="c4-aff-luxe">
      <Card title={tx("affiliates")}>
        <State loading={aff.loading} error={aff.error} empty={!aff.loading && rows.length === 0} tx={tx} onRetry={aff.reload} />
        <div className="c4-tools">
          <button type="button" className="c4-btn" onClick={() => void exportCurrent("affiliates-page", "affiliates.csv", ["name", "leads", "valid", "invalid", "deposits"], rows.map((row) => [String(row.name || ""), String(row.leads ?? 0), String(row.valid ?? 0), String(row.invalid ?? 0), String(row.deposits ?? 0)]))}>{crmv4Text(locale, "exportCsv")}</button>
        </div>
        <ul>
          {rows.map((row) => {
            const total = Math.max(1, (row.leads ?? 0));
            const open = openName === row.name;
            return (
              <li key={row.name} className="c4-mkt-salon-row c4-mkt-mount-row">
                <button type="button" className="c4-row c4-between" onClick={() => { setOpenName(open ? "" : String(row.name || "")); setDetail(String(row.name || "")); }}>
                  <span>{row.name || "—"}</span>
                  <span className="c4-muted">{tx("leads")} {row.leads ?? 0} · {crmv4Text(locale, "drill")}</span>
                </button>
                {open && (
                  <div className="c4-bars">
                    <div><div className="c4-row c4-between"><span>{tx("valid")}</span><span>{row.valid ?? 0}</span></div><div className="c4-bar" style={{ width: `${Math.max(8, ((row.valid ?? 0) / total) * 100)}%` }} /></div>
                    <div><div className="c4-row c4-between"><span>{tx("invalid")}</span><span>{row.invalid ?? 0}</span></div><div className="c4-bar" style={{ width: `${Math.max(8, ((row.invalid ?? 0) / total) * 100)}%` }} /></div>
                    <div className="c4-muted">{tx("deposits")} {row.deposits ?? 0}</div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <PayoutCard amount={rows.reduce((sum, row) => sum + (Number(row.deposits) || 0), 0)} v4={(key) => crmv4Text(locale, key)} />
        {detail && <AffiliateDetail name={detail} v4={(key) => crmv4Text(locale, key)} tx={tx} onClose={() => setDetail("")} />}
      </Card>
      </div>
      <Card title={tx("templates")}>
        <State loading={mail.loading} error={mail.error} empty={!mail.loading && templates.length === 0} tx={tx} onRetry={mail.reload} />
        <ul>
          {templates.map((row) => (
            <li key={row.id} className="c4-row c4-mkt-salon-row">
              <button type="button" className="c4-btn" onClick={() => setPicked(row.id)}>{row.name} · {row.subject}</button>
              <button
                type="button"
                className="c4-btn"
                data-write="1"
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
          className="c4-form c4-form-2"
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
          <input name="name" required placeholder={tx("name")} aria-label={tx("name")} className="c4-field" />
          <LangFields tx={tx} />
          <button type="submit" className="c4-btn c4-btn-hot">{tx("createTemplate")}</button>
        </form>
        <Msg text={msg} />
      </Card>
      <section className="c4-card c4-soon" data-coming-soon="">
        <div className="c4-card-h">
          <h2 className="c4-title">{tx("campaignSend")}</h2>
          <span className="c4-status" data-tone="warn">{tx("cannotSend")}</span>
        </div>
        <div className="c4-stack" style={{ padding: 16 }}>
          <p>{tx("campaignIntro")}</p>
          <p className="c4-muted">{tx("campaignStub")}</p>
          <Lab label={tx("selectTemplate")}>
            <select className="c4-select" value={picked} onChange={(event) => setPicked(event.target.value)}>
              <option value="">{tx("selectTemplate")}</option>
              {templates.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </Lab>
          <Lab label={tx("campaignAudience")}>
            <input className="c4-field" value={audience} onChange={(event) => setAudience(event.target.value)} placeholder={tx("audiencePh")} />
          </Lab>
          {current && (
            <div className="c4-note">
              <TemplatePreview subject={current.subject || ""} body={current.body || ""} v4={(key) => crmv4Text(locale, key)} />
              <div>{tx("campaignPreview")}: {current.subject}</div>
              <p>{current.body}</p>
              {audience && <p className="c4-muted">{tx("campaignAudience")}: {audience}</p>}
            </div>
          )}
          <button type="button" className="c4-btn" disabled>{tx("send")}</button>
        </div>
      </section>
    </div>
  );
}

const LANGS = ["en", "tr", "de", "ru", "ar"] as const;
const LANG_KEY = "crmv4-template-langs";

function LangFields({ tx }: { tx: Tx }) {
  const { locale } = useI18n();
  const [lang, setLang] = useState<(typeof LANGS)[number]>("en");
  const [pack, setPack] = useState<Record<string, { subject: string; body: string }>>({});
  useEffect(() => {
    setPack(readJson(LANG_KEY, {}));
  }, []);
  const current = pack[lang] || { subject: "", body: "" };
  function update(partial: Partial<{ subject: string; body: string }>) {
    const next = { ...pack, [lang]: { ...current, ...partial } };
    setPack(next);
    writeJson(LANG_KEY, next);
  }
  return (
    <div className="c4-stack" style={{ gridColumn: "1 / -1" }}>
      <div className="c4-row" role="tablist" aria-label={crmv4Text(locale, "langTabs")}>
        {LANGS.map((code) => (
          <button key={code} type="button" className="c4-chip" data-on={lang === code ? "1" : "0"} onClick={() => setLang(code)}>{code.toUpperCase()}</button>
        ))}
      </div>
      <p className="c4-muted c4-meta">{crmv4Text(locale, "localOnly")}</p>
      <input name="subject" required value={current.subject} onChange={(event) => update({ subject: event.target.value })} placeholder={tx("subject")} aria-label={tx("subject")} className="c4-field" />
      <textarea name="body" required value={current.body} onChange={(event) => update({ body: event.target.value })} placeholder={tx("body")} aria-label={tx("body")} className="c4-field" rows={3} />
    </div>
  );
}
