"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  anniversaries,
  campaignStats,
  cohortOf,
  cpa,
  cpl,
  funnelOf,
  heatDays,
  landingBreakdown,
  pacing,
  rankAffiliates,
  segmentHit,
  smsParts,
  sourceTrend,
  type LeadRow,
  type SegmentRule,
} from "@/lib/crmv4/round13";
import { downloadCsv, money, useJson, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const SPEND_KEY = "crmv4-campaign-spend";
const BUDGET_KEY = "crmv4-campaign-budget";
const SEG_KEY = "crmv4-segment-rules";
const NOTE_KEY = "crmv4-mkt-notes";
const WIN_KEY = "crmv4-winback";
const TAG_KEY = "crmv4-campaign-tags";
const SMS_KEY = "crmv4-sms-preview";

function asLead(row: UserRow): LeadRow {
  const extra = row as UserRow & { referralCodeUsed?: string | null; retentionFollowUpAt?: string | null; affiliateB?: string | null };
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    campaign: row.campaign,
    country: row.country,
    saleStatus: row.saleStatus,
    ftd: row.ftd,
    balance: row.balance ?? row.account?.balance,
    createdAt: row.createdAt,
    affiliateA: row.affiliateA,
    affiliateB: extra.affiliateB,
    referralCodeUsed: extra.referralCodeUsed,
    retentionFollowUpAt: extra.retentionFollowUpAt,
  };
}

export function useLeads() {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  return { rows: (data.data?.users || []).map(asLead), loading: data.loading };
}

export function MarketHero({ rows, v4, locale }: { rows: LeadRow[]; v4: V4; locale: string }) {
  const [spend, setSpend] = useState<Record<string, number>>({});
  useEffect(() => { setSpend(readJson(SPEND_KEY, {})); }, []);
  const stats = campaignStats(rows);
  const leads = rows.length;
  const ftd = rows.filter((row) => row.ftd).length;
  const totalSpend = stats.reduce((sum, row) => sum + (Number(spend[row.campaign]) || 0), 0);
  const cards = [
    [v4("campaigns"), String(stats.length)],
    [v4("cpl"), cpl(totalSpend, leads)?.toFixed(2) || "—"],
    [v4("cpa"), cpa(totalSpend, ftd)?.toFixed(2) || "—"],
    [v4("spend"), money(totalSpend, "USD", locale)],
  ];
  return (
    <section className="c4-mkt-hero" aria-label={v4("campaigns")}>
      {cards.map(([label, value]) => (
        <div key={label} className="c4-mkt-metric"><span>{label}</span><strong>{value}</strong></div>
      ))}
    </section>
  );
}

export function CampaignBoard({ rows, v4, locale }: { rows: LeadRow[]; v4: V4; locale: string }) {
  const stats = campaignStats(rows);
  const [spend, setSpend] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState<Record<string, number>>({});
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [pick, setPick] = useState("");
  const [other, setOther] = useState("");
  useEffect(() => {
    setSpend(readJson(SPEND_KEY, {}));
    setBudget(readJson(BUDGET_KEY, {}));
    setTags(readJson(TAG_KEY, {}));
  }, []);
  const left = stats.find((row) => row.campaign === pick) || stats[0];
  const right = stats.find((row) => row.campaign === other) || stats[1];
  const funnel = funnelOf(rows, left?.campaign || "");
  const cohort = cohortOf(rows, left?.campaign || "");
  const maxFunnel = Math.max(1, ...funnel.map((row) => row.count));
  return (
    <section className="c4-card c4-mkt-table">
      <div className="c4-card-h"><h3 className="c4-title">{v4("campaigns")}</h3></div>
      <table className="c4-table">
        <thead><tr><th>{v4("campaigns")}</th><th /><th>{v4("cpl")}</th><th>{v4("cpa")}</th><th>{v4("spend")}</th><th>{v4("budget")}</th><th>{v4("pacing")}</th></tr></thead>
        <tbody>
          {stats.map((row) => {
            const spent = Number(spend[row.campaign]) || 0;
            const cap = Number(budget[row.campaign]) || 0;
            const pace = pacing(spent, cap);
            return (
              <tr key={row.campaign}>
                <td>{row.campaign}<div className="c4-muted">{(tags[row.campaign] || []).join(" · ")}</div></td>
                <td>{row.leads} / {row.ftd}</td>
                <td>{cpl(spent, row.leads)?.toFixed(2) || "—"}</td>
                <td>{cpa(spent, row.ftd)?.toFixed(2) || "—"}</td>
                <td><input className="c4-field" type="number" min={0} aria-label={`${v4("spend")} ${row.campaign}`} defaultValue={spent || ""} onBlur={(event) => {
                  const next = { ...spend, [row.campaign]: Number(event.target.value) || 0 };
                  setSpend(next);
                  writeJson(SPEND_KEY, next);
                }} /></td>
                <td><input className="c4-field" type="number" min={0} aria-label={`${v4("budget")} ${row.campaign}`} defaultValue={cap || ""} onBlur={(event) => {
                  const next = { ...budget, [row.campaign]: Number(event.target.value) || 0 };
                  setBudget(next);
                  writeJson(BUDGET_KEY, next);
                }} /></td>
                <td>
                  <div className="c4-pace" aria-label={v4("pacing")}><i style={{ width: `${Math.max(0, Math.min(100, pace || 0))}%` }} /></div>
                  <span className="c4-muted">{pace == null ? "—" : `${pace}%`}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="c4-row c4-pad">
        <label className="c4-lab"><span>{v4("compare")}</span>
          <select className="c4-select" aria-label={v4("compare")} value={left?.campaign || ""} onChange={(event) => setPick(event.target.value)}>
            {stats.map((row) => <option key={row.campaign}>{row.campaign}</option>)}
          </select>
        </label>
        <select className="c4-select" aria-label={v4("compare")} value={right?.campaign || ""} onChange={(event) => setOther(event.target.value)}>
          {stats.map((row) => <option key={row.campaign}>{row.campaign}</option>)}
        </select>
        {left && right && <p>{left.campaign} {left.leads} · {money(left.balance, "USD", locale)} / {right.campaign} {right.leads} · {money(right.balance, "USD", locale)}</p>}
      </div>
      <div className="c4-mkt-grid">
        <div>
          <h3 className="c4-title c4-pad">{v4("funnel")} {left?.campaign || ""}</h3>
          {funnel.map((row) => <div key={row.status} className="c4-mkt-bar"><span>{row.status}</span><i style={{ width: `${(row.count / maxFunnel) * 100}%` }} /><em>{row.count}</em></div>)}
        </div>
        <div>
          <h3 className="c4-title c4-pad">{v4("cohort")}</h3>
          {cohort.map((row) => <p key={row.month} className="c4-pad">{row.month} · {row.count}</p>)}
        </div>
        <CampaignTags campaign={left?.campaign || ""} tags={tags} onChange={setTags} v4={v4} />
      </div>
    </section>
  );
}

function CampaignTags({ campaign, tags, onChange, v4 }: { campaign: string; tags: Record<string, string[]>; onChange: (next: Record<string, string[]>) => void; v4: V4 }) {
  const [value, setValue] = useState("");
  if (!campaign) return null;
  return (
    <div>
      <h3 className="c4-title c4-pad">{v4("campTags")}</h3>
      <form className="c4-row c4-pad" onSubmit={(event) => {
        event.preventDefault();
        const name = value.trim();
        if (!name) return;
        const next = { ...tags, [campaign]: [...(tags[campaign] || []).filter((item) => item !== name), name] };
        onChange(next);
        writeJson(TAG_KEY, next);
        setValue("");
      }}>
        <input className="c4-field" aria-label={v4("campTags")} value={value} onChange={(event) => setValue(event.target.value)} />
        <button type="submit" className="c4-btn">{v4("campTags")}</button>
      </form>
    </div>
  );
}

export function TrendAndLanding({ rows, v4 }: { rows: LeadRow[]; v4: V4 }) {
  const trend = sourceTrend(rows);
  const landing = landingBreakdown(rows);
  const max = Math.max(1, ...trend.map((row) => row.count));
  return (
    <div className="c4-mkt-grid">
      <section className="c4-card">
        <div className="c4-card-h"><h3 className="c4-title">{v4("sourceTrend")}</h3></div>
        {trend.map((row) => <div key={row.day} className="c4-mkt-bar"><span>{row.day}</span><i style={{ width: `${(row.count / max) * 100}%` }} /><em>{row.count}</em></div>)}
      </section>
      <section className="c4-card">
        <div className="c4-card-h"><h3 className="c4-title">{v4("landing")}</h3></div>
        {landing.map((row) => <p key={row.label} className="c4-pad">{row.label} · {row.count}</p>)}
        {!landing.length && <p className="c4-muted c4-pad">{v4("landing")}</p>}
      </section>
    </div>
  );
}

export function LeadFormPreview({ v4 }: { v4: V4 }) {
  const [preview, setPreview] = useState("");
  return (
    <form className="c4-card c4-pad" onSubmit={(event) => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      setPreview(`${fd.get("name") || ""} · ${fd.get("email") || ""} · ${fd.get("campaign") || ""}`);
    }}>
      <h3 className="c4-title">{v4("leadPreview")}</h3>
      <input className="c4-field" name="name" aria-label={v4("leadPreview")} />
      <input className="c4-field" name="email" type="email" aria-label={v4("leadPreview")} />
      <input className="c4-field" name="campaign" aria-label={v4("campaigns")} />
      <button type="submit" className="c4-btn">{v4("leadPreview")}</button>
      {preview && <p>{preview}</p>}
    </form>
  );
}

export function MailGallery({ templates, v4 }: { templates: { id: string; name?: string; subject?: string; body?: string }[]; v4: V4 }) {
  const [id, setId] = useState("");
  const current = templates.find((row) => row.id === id) || templates[0];
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("mailGallery")}</h3></div>
      <div className="c4-gallery">
        {templates.map((row) => (
          <button key={row.id} type="button" className="c4-mkt-tile" data-on={current?.id === row.id ? "1" : "0"} onClick={() => setId(row.id)}>
            <strong>{row.name}</strong>
            <span>{row.subject}</span>
          </button>
        ))}
      </div>
      {current && <p className="c4-pad">{current.body}</p>}
    </section>
  );
}

export function SmsPreview({ v4 }: { v4: V4 }) {
  const [text, setText] = useState("");
  useEffect(() => { setText(readJson<string>(SMS_KEY, "")); }, []);
  const count = smsParts(text);
  return (
    <section className="c4-card c4-pad">
      <h3 className="c4-title">{v4("smsPreview")}</h3>
      <textarea className="c4-field" rows={3} aria-label={v4("smsPreview")} value={text} onChange={(event) => {
        setText(event.target.value);
        writeJson(SMS_KEY, event.target.value);
      }} />
      <p className="c4-muted">{v4("smsCount")} {count.length} · {count.parts}</p>
    </section>
  );
}

export function SegmentBuilder({ rows, v4 }: { rows: LeadRow[]; v4: V4 }) {
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [name, setName] = useState("");
  const [field, setField] = useState<SegmentRule["field"]>("campaign");
  const [value, setValue] = useState("");
  useEffect(() => {
    const saved = readJson<unknown>(SEG_KEY, null);
    if (Array.isArray(saved)) { setRules(saved as SegmentRule[]); return; }
    const legacy = readJson<unknown>("crmv4-segments", null);
    if (Array.isArray(legacy)) {
      setRules(legacy as SegmentRule[]);
      writeJson(SEG_KEY, legacy);
    }
  }, []);
  const draft = { name: name || "draft", field, value };
  const size = value.trim() ? rows.filter((row) => segmentHit(row, draft)).length : 0;
  const saved = rules[0];
  const savedRows = saved ? rows.filter((row) => segmentHit(row, saved)) : [];
  return (
    <section className="c4-card c4-pad">
      <h3 className="c4-title">{v4("segmentBuilder")}</h3>
      <div className="c4-row">
        <input className="c4-field" aria-label={v4("segmentBuilder")} value={name} onChange={(event) => setName(event.target.value)} />
        <select className="c4-select" aria-label={v4("segmentBuilder")} value={field} onChange={(event) => setField(event.target.value as SegmentRule["field"])}>
          <option value="campaign">campaign</option>
          <option value="country">country</option>
          <option value="sale">sale</option>
          <option value="ftd">ftd</option>
        </select>
        <input className="c4-field" aria-label={v4("segmentSize")} value={value} onChange={(event) => setValue(event.target.value)} />
        <button type="button" className="c4-btn" onClick={() => {
          if (!name.trim() || !value.trim()) return;
          const next = [{ name: name.trim(), field, value: value.trim() }, ...rules.filter((row) => row.name !== name.trim())];
          setRules(next);
          writeJson(SEG_KEY, next);
        }}>{v4("segmentBuilder")}</button>
      </div>
      <p>{v4("segmentSize")} {size}</p>
      <button type="button" className="c4-btn" onClick={() => downloadCsv("segment.csv", ["name", "email", "campaign"], savedRows.map((row) => [String(row.name || ""), String(row.email || ""), String(row.campaign || "")]))}>{v4("segmentExport")}</button>
      {rules.map((row) => <span key={row.name} className="c4-chip">{row.name}</span>)}
    </section>
  );
}

export function RetentionHeat({ rows, v4 }: { rows: LeadRow[]; v4: V4 }) {
  const days = heatDays(rows);
  const labels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const max = Math.max(1, ...days);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("heat")}</h3></div>
      <div className="c4-heat">
        {days.map((count, index) => <div key={labels[index]} style={{ opacity: 0.35 + (count / max) * 0.65 }}><span>{labels[index]}</span><strong>{count}</strong></div>)}
      </div>
    </section>
  );
}

export function AnniversaryList({ rows, v4 }: { rows: LeadRow[]; v4: V4 }) {
  const list = anniversaries(rows);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("anniversary")}</h3></div>
      {list.map((row) => <p key={row.id} className="c4-pad">{row.name || row.email}</p>)}
      {!list.length && <p className="c4-muted c4-pad">{v4("anniversary")}</p>}
    </section>
  );
}

export function WinbackBoard({ v4 }: { v4: V4 }) {
  const [rows, setRows] = useState<{ id: string; name: string; note: string }[]>([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { setRows(readJson(WIN_KEY, [])); }, []);
  return (
    <form className="c4-card c4-pad" onSubmit={(event) => {
      event.preventDefault();
      if (!name.trim()) return;
      const next = [{ id: String(Date.now()), name: name.trim(), note: note.trim() }, ...rows].slice(0, 8);
      setRows(next);
      writeJson(WIN_KEY, next);
      setName("");
      setNote("");
    }}>
      <h3 className="c4-title">{v4("winback")}</h3>
      <input className="c4-field" aria-label={v4("winback")} value={name} onChange={(event) => setName(event.target.value)} />
      <input className="c4-field" aria-label={v4("winback")} value={note} onChange={(event) => setNote(event.target.value)} />
      <button type="submit" className="c4-btn">{v4("winback")}</button>
      {rows.map((row) => <p key={row.id}>{row.name} · {row.note}</p>)}
    </form>
  );
}

export function ReferralList({ rows, v4 }: { rows: LeadRow[]; v4: V4 }) {
  const list = rows.filter((row) => row.referralCodeUsed);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("referral")}</h3></div>
      {list.map((row) => <p key={row.id} className="c4-pad">{row.name || row.email} · {row.referralCodeUsed}</p>)}
      {!list.length && <p className="c4-muted c4-pad">{v4("referral")}</p>}
    </section>
  );
}

export function AffiliateBoard({ rows, v4 }: { rows: { name?: string; leads?: number; valid?: number; deposits?: number }[]; v4: V4 }) {
  const ranked = rankAffiliates(rows);
  const [code, setCode] = useState(ranked[0]?.name || "");
  const [link, setLink] = useState("");
  const [svg, setSvg] = useState("");
  const [copied, setCopied] = useState("");
  useEffect(() => {
    const origin = window.location.origin;
    const next = `${origin}/register?aid=${encodeURIComponent(code || "affiliate")}`;
    setLink(next);
    let live = true;
    type QrMod = { toString?: (text: string, options?: { type?: "svg"; margin?: number; width?: number }) => Promise<string>; default?: QrMod };
    void import("qrcode").then((mod) => {
      const qr = mod as QrMod;
      const api = typeof qr.toString === "function" ? qr : qr.default;
      return api?.toString ? api.toString(next, { type: "svg", margin: 1, width: 96 }) : "";
    }).then((out) => { if (live) setSvg(out || ""); }).catch(() => { if (live) setSvg(""); });
    return () => { live = false; };
  }, [code]);
  return (
    <section className="c4-card c4-aff-board">
      <div className="c4-card-h"><h3 className="c4-title">{v4("leaderboard")}</h3></div>
      <table className="c4-table">
        <tbody>
          {ranked.map((row, index) => (
            <tr key={row.name || index}><td>{index + 1}</td><td>{row.name || "—"}</td><td>{row.leads ?? 0}</td><td>{row.deposits ?? 0}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="c4-row c4-pad">
        <label className="c4-lab"><span>{v4("affLink")}</span>
          <input className="c4-field" aria-label={v4("affLink")} value={code} onChange={(event) => setCode(event.target.value)} />
        </label>
        <button type="button" className="c4-btn" onClick={async () => {
          try { await navigator.clipboard.writeText(link); setCopied(v4("affLink")); } catch { setCopied(link); }
        }}>{copied || v4("affLink")}</button>
      </div>
      <p className="c4-muted c4-pad">{link}</p>
      <div className="c4-pad" aria-label={v4("affQr")}>
        {/* eslint-disable-next-line react/no-danger -- QR SVG is produced locally by the qrcode library */}
        <div className="c4-qr" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </section>
  );
}

export function MarketingNotes({ v4 }: { v4: V4 }) {
  const [rows, setRows] = useState<{ id: string; text: string }[]>([]);
  const [text, setText] = useState("");
  useEffect(() => { setRows(readJson(NOTE_KEY, [])); }, []);
  return (
    <form className="c4-card c4-pad" onSubmit={(event) => {
      event.preventDefault();
      if (!text.trim()) return;
      const next = [{ id: String(Date.now()), text: text.trim() }, ...rows].slice(0, 8);
      setRows(next);
      writeJson(NOTE_KEY, next);
      setText("");
    }}>
      <h3 className="c4-title">{v4("mktNotes")}</h3>
      <input className="c4-field" aria-label={v4("mktNotes")} value={text} onChange={(event) => setText(event.target.value)} />
      <button type="submit" className="c4-btn">{v4("mktNotes")}</button>
      {rows.map((row) => <p key={row.id}>{row.text}</p>)}
    </form>
  );
}

export function WeeklyDigest({ rows, v4 }: { rows: LeadRow[]; v4: V4 }) {
  const stats = campaignStats(rows);
  return (
    <section className="c4-card c4-digest">
      <div className="c4-card-h">
        <h3 className="c4-title">{v4("digest")}</h3>
        <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("digest")}</button>
      </div>
      <p className="c4-pad">{rows.length} · {rows.filter((row) => row.ftd).length}</p>
      {stats.slice(0, 4).map((row) => <p key={row.campaign} className="c4-pad">{row.campaign} · {row.leads}</p>)}
    </section>
  );
}
