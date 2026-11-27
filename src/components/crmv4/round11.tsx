"use client";

import { useEffect, useState } from "react";
import { crmv4Href } from "@/lib/crmv4/sections";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  backlogDays,
  cityOf,
  emailHint,
  fillGreeting,
  isChurn,
  meanMinutes,
  qualityRows,
  similarCustomers,
  tryAmount,
  wordCloud,
  type DeskRow,
} from "@/lib/crmv4/round11";
import { fmtNum, money, sendJson, useJson, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const EDIT_KEY = "crmv4-edit-log";
const SHIFT_KEY = "crmv4-shifts";
const FEED_KEY = "crmv4-announce-feed";
const CCY_KEY = "crmv4-display-ccy";
const RATE_KEY = "crmv4-usdtry-quote";
const PIN_KEY = "crmv4-pins";

type EditEntry = { at: string; id: string; field: string; from: string; to: string };
type Shift = { id: string; name: string; day: string; start: string; end: string };
type FeedItem = { id: string; text: string; at: string };
type MoneyRow = { openedAt?: string | null; closedAt?: string | null; status?: string | null; kind?: string };

export function pushEdit(entry: EditEntry) {
  const list = readJson<EditEntry[]>(EDIT_KEY, []);
  writeJson(EDIT_KEY, [entry, ...list].slice(0, 40));
  window.dispatchEvent(new Event("crmv4:edits"));
}

export function readCcy(): "USD" | "TRY" {
  return readJson<string>(CCY_KEY, "USD") === "TRY" ? "TRY" : "USD";
}

export function readQuote(): number {
  return Number(readJson(RATE_KEY, 0)) || 0;
}

function asDesk(row: UserRow): DeskRow {
  const extra = row as UserRow & { lastLoginAt?: string | null; equity?: number | null; address?: string | null; city?: string | null };
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    country: row.country,
    desk: row.desk,
    campaign: row.campaign,
    address: extra.address,
    city: extra.city,
    balance: row.balance ?? row.account?.balance,
    equity: extra.equity ?? row.account?.equity,
    lastLoginAt: extra.lastLoginAt,
    createdAt: row.createdAt,
  };
}

export function ExecHero({ name, customers, aum, volume, pending, locale, labels, v4 }: { name: string; customers?: number; aum?: number; volume?: number; pending?: number; locale: string; labels: { customers: string; aum: string; volume: string; pending: string }; v4: V4 }) {
  const [ccy, setCcy] = useState<"USD" | "TRY">("USD");
  const [rate, setRate] = useState(0);
  useEffect(() => {
    const load = () => { setCcy(readCcy()); setRate(readQuote()); };
    load();
    window.addEventListener("crmv4:ccy", load);
    return () => window.removeEventListener("crmv4:ccy", load);
  }, []);
  const aumShown = ccy === "TRY" && rate > 0 ? tryAmount(Number(aum) || 0, rate) : aum;
  const unit = ccy === "TRY" && rate > 0 ? "TRY" : "USD";
  const metrics = [
    { key: labels.customers, value: fmtNum(customers, locale), tip: v4("glossFtd") },
    { key: labels.aum, value: money(aumShown, unit, locale), tip: v4("glossAum") },
    { key: labels.volume, value: fmtNum(volume, locale), tip: v4("hoverTip") },
    { key: labels.pending, value: fmtNum(pending, locale), tip: v4("glossEquity") },
  ];
  return (
    <section className="c4-exec-hero">
      <div>
        <p className="c4-exec-kicker">7FX</p>
        <h2 className="c4-exec-title">{name || "Desk"}</h2>
        <CurrencyToggle v4={v4} />
      </div>
      <div className="c4-exec-metrics">
        {metrics.map((item) => (
          <div key={item.key} className="c4-exec-metric" tabIndex={0}>
            <span>{item.key}</span>
            <strong>{item.value}</strong>
            <em className="c4-hover-tip">{item.tip}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CurrencyToggle({ v4 }: { v4: V4 }) {
  const [ccy, setCcy] = useState<"USD" | "TRY">("USD");
  const [rate, setRate] = useState(0);
  useEffect(() => { setCcy(readCcy()); setRate(readQuote()); }, []);
  useEffect(() => {
    let live = true;
    void fetch("/api/market/quote?symbols=USDTRY", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
      .then((body: { prices?: { mid?: number; bid?: number }[] } | null) => {
        const price = Number(body?.prices?.[0]?.mid || body?.prices?.[0]?.bid || 0);
        if (!live || !(price > 0)) return;
        writeJson(RATE_KEY, price);
        setRate(price);
        window.dispatchEvent(new Event("crmv4:ccy"));
      })
      .catch(() => { if (live) setRate(0); });
    return () => { live = false; };
  }, []);
  return (
    <div className="c4-row">
      <button type="button" className="c4-chip" data-on={ccy === "USD" ? "1" : "0"} onClick={() => { writeJson(CCY_KEY, "USD"); setCcy("USD"); window.dispatchEvent(new Event("crmv4:ccy")); }}>USD</button>
      <button type="button" className="c4-chip" data-on={ccy === "TRY" ? "1" : "0"} onClick={() => { writeJson(CCY_KEY, "TRY"); setCcy("TRY"); window.dispatchEvent(new Event("crmv4:ccy")); }}>{v4("ccyToggle")}</button>
      <span className="c4-muted">{rate > 0 ? rate.toFixed(2) : v4("rateMissing")}</span>
    </div>
  );
}

export function PinnedHome({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => { setPins(readJson(PIN_KEY, [])); }, []);
  const rows = (data.data?.users || []).filter((row) => pins.includes(row.id));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("pinnedHome")}</h3></div>
      {rows.map((row) => <a key={row.id} className="c4-pad c4-rich-item" href={crmv4Href(base, `customers/${row.id}`)}>{row.name || row.email}</a>)}
      {!rows.length && <p className="c4-muted c4-pad">{v4("pinnedHome")}</p>}
    </section>
  );
}

export function ChurnBoard({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const rows = (data.data?.users || []).map(asDesk).filter((row) => isChurn(row));
  return (
    <div className="c4-book-grid">
      <section className="c4-card">
        <div className="c4-card-h"><h3 className="c4-title">{v4("churnRisk")}</h3></div>
        {rows.map((row) => <p key={row.id} className="c4-pad">{row.name || row.email}</p>)}
        {!rows.length && <p className="c4-muted c4-pad">{v4("churnRisk")}</p>}
      </section>
      <section className="c4-card">
        <div className="c4-card-h"><h3 className="c4-title">{v4("reengage")}</h3></div>
        {rows.map((row) => <a key={row.id} className="c4-pad c4-rich-item" href={crmv4Href(base, `customers/${row.id}`)}>{row.name || row.email}</a>)}
        {!rows.length && <p className="c4-muted c4-pad">{v4("reengage")}</p>}
      </section>
    </div>
  );
}

export function CityMap({ v4 }: { v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const map = new Map<string, number>();
  for (const row of data.data?.users || []) {
    const city = cityOf(asDesk(row));
    if (!city) continue;
    map.set(city, (map.get(city) || 0) + 1);
  }
  const rows = Array.from(map.entries());
  return (
    <section className="c4-desk-city-scotia" aria-label={v4("cityMap")} data-desk-city-scotia="1">
      <header className="c4-desk-city-scotia-mast">
        <p className="c4-desk-city-scotia-seal" data-logo="mono">{v4("cityScotiaLogo")}</p>
        <div>
          <p className="c4-desk-city-scotia-kicker">{v4("cityScotiaKicker")}</p>
          <h3 className="c4-title">{v4("cityMap")}</h3>
          <p className="c4-desk-city-scotia-lead">{v4("cityScotiaLead")}</p>
        </div>
        <p className="c4-desk-city-scotia-count">{rows.length}</p>
      </header>
      <ul className="c4-desk-city-scotia-rows">
        {rows.map(([city, count]) => <li key={city}><span>{city}</span><strong>{count}</strong></li>)}
      </ul>
      {!rows.length && <p className="c4-desk-city-scotia-empty">{v4("cityEmpty")}</p>}
    </section>
  );
}

export function ShiftBoard({ v4 }: { v4: V4 }) {
  const [rows, setRows] = useState<Shift[]>([]);
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  useEffect(() => { setRows(readJson(SHIFT_KEY, [])); }, []);
  return (
    <section className="c4-desk-shift-torus" aria-label={v4("shiftBoard")} data-desk-shift-torus="1">
      <header className="c4-desk-shift-torus-mast">
        <p className="c4-desk-shift-torus-seal" data-logo="mono">{v4("shiftTorusLogo")}</p>
        <div>
          <p className="c4-desk-shift-torus-kicker">{v4("shiftTorusKicker")}</p>
          <h3 className="c4-title">{v4("shiftBoard")}</h3>
          <p className="c4-desk-shift-torus-lead">{v4("shiftTorusLead")}</p>
        </div>
        <p className="c4-desk-shift-torus-count">{rows.length}</p>
      </header>
      <form className="c4-row c4-pad c4-desk-shift-torus-fields" onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim() || !day.trim()) return;
        const next = [...rows, { id: String(Date.now()), name: name.trim(), day: day.trim(), start: "09:00", end: "17:00" }];
        setRows(next);
        writeJson(SHIFT_KEY, next);
        setName("");
        setDay("");
      }}>
        <input className="c4-field" aria-label={v4("shiftBoard")} value={name} onChange={(event) => setName(event.target.value)} />
        <input className="c4-field" aria-label={v4("shiftBoard")} value={day} onChange={(event) => setDay(event.target.value)} />
        <button type="submit" className="c4-btn">{v4("shiftBoard")}</button>
      </form>
      <ul className="c4-desk-shift-torus-rows">
        {rows.map((row) => <li key={row.id}><i aria-hidden="true" />{row.name} · {row.day} · {row.start}–{row.end}</li>)}
      </ul>
    </section>
  );
}

export function AnnounceFeed({ v4 }: { v4: V4 }) {
  const [rows, setRows] = useState<FeedItem[]>([]);
  const [text, setText] = useState("");
  useEffect(() => { setRows(readJson(FEED_KEY, [])); }, []);
  return (
    <section className="c4-announce-crocket" aria-label={v4("announceFeed")} data-announce-crocket="1">
      <header className="c4-announce-crocket-mast">
        <p className="c4-announce-crocket-seal" data-logo="mono">{v4("announceCrocketLogo")}</p>
        <div>
          <p className="c4-announce-crocket-kicker">{v4("announceCrocketKicker")}</p>
          <h3 className="c4-title">{v4("announceFeed")}</h3>
          <p className="c4-announce-crocket-lead">{v4("announceCrocketLead")}</p>
        </div>
        <p className="c4-announce-crocket-count">{rows.length}</p>
      </header>
      <form className="c4-row c4-pad" onSubmit={(event) => {
        event.preventDefault();
        const body = text.trim();
        if (!body) return;
        const next = [{ id: String(Date.now()), text: body, at: new Date().toISOString() }, ...rows].slice(0, 8);
        setRows(next);
        writeJson(FEED_KEY, next);
        setText("");
      }}>
        <input className="c4-field" aria-label={v4("announceFeed")} value={text} onChange={(event) => setText(event.target.value)} />
        <button type="submit" className="c4-btn">{v4("announceFeed")}</button>
      </form>
      <ul className="c4-announce-crocket-rows">
        {rows.map((row) => <li key={row.id}><i aria-hidden="true" />{row.text}</li>)}
      </ul>
    </section>
  );
}

export function GreetingPreview({ v4 }: { v4: V4 }) {
  const [name, setName] = useState("");
  const [holiday, setHoliday] = useState("");
  const template = "Happy {{holiday}}, {{name}}.";
  return (
    <section className="c4-greeting-quatrefoil" aria-label={v4("greeting")} data-greeting-quatrefoil="1">
      <header className="c4-greeting-quatrefoil-mast">
        <p className="c4-greeting-quatrefoil-seal" data-logo="mono">{v4("greetingQuatrefoilLogo")}</p>
        <div>
          <p className="c4-greeting-quatrefoil-kicker">{v4("greetingQuatrefoilKicker")}</p>
          <h3 className="c4-title">{v4("greeting")}</h3>
          <p className="c4-greeting-quatrefoil-lead">{v4("greetingQuatrefoilLead")}</p>
        </div>
      </header>
      <div className="c4-row c4-pad c4-greeting-quatrefoil-fields">
        <input className="c4-field" aria-label={v4("greeting")} value={name} onChange={(event) => setName(event.target.value)} />
        <input className="c4-field" aria-label={v4("greeting")} value={holiday} onChange={(event) => setHoliday(event.target.value)} />
      </div>
      <p className="c4-greeting-quatrefoil-preview">{fillGreeting(template, { name, holiday })}</p>
    </section>
  );
}

export function QualityReport({ v4 }: { v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const rows = qualityRows((data.data?.users || []).map(asDesk));
  return (
    <section className="c4-quality-billet" aria-label={v4("quality")} data-quality-billet="1">
      <header className="c4-quality-billet-mast">
        <p className="c4-quality-billet-seal" data-logo="mono">{v4("qualityBilletLogo")}</p>
        <div>
          <p className="c4-quality-billet-kicker">{v4("qualityBilletKicker")}</p>
          <h3 className="c4-title">{v4("quality")}</h3>
          <p className="c4-quality-billet-lead">{v4("qualityBilletLead")}</p>
        </div>
        <p className="c4-quality-billet-count">{rows.length}</p>
      </header>
      <ul className="c4-quality-billet-rows">
        {rows.map((row) => <li key={row.id}><i aria-hidden="true" /><span>{row.label}</span><strong>{row.problems.join(", ")}</strong></li>)}
      </ul>
      {!rows.length && <p className="c4-quality-billet-empty">{v4("quality")}</p>}
    </section>
  );
}

export function DailyClose({ locale, v4 }: { locale: string; v4: V4 }) {
  const finance = useJson<{ kpis?: { income?: number; outcome?: number; net?: number } }>("/api/admin/analytics/finance");
  const k = finance.data?.kpis || {};
  const [ccy, setCcy] = useState<"USD" | "TRY">("USD");
  const [rate, setRate] = useState(0);
  useEffect(() => {
    const load = () => { setCcy(readCcy()); setRate(readQuote()); };
    load();
    window.addEventListener("crmv4:ccy", load);
    return () => window.removeEventListener("crmv4:ccy", load);
  }, []);
  const unit = ccy === "TRY" && rate > 0 ? "TRY" : "USD";
  const show = (value?: number) => money(ccy === "TRY" && rate > 0 ? tryAmount(Number(value) || 0, rate) : value, unit, locale);
  return (
    <section className="c4-card c4-close">
      <div className="c4-card-h">
        <h3 className="c4-title">{v4("dailyClose")}</h3>
        <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("dailyClose")}</button>
      </div>
      <p className="c4-pad">{show(k.income)} · {show(k.outcome)} · {show(k.net)}</p>
    </section>
  );
}

export function BacklogTrend({ v4 }: { v4: V4 }) {
  const data = useJson<{ tickets?: MoneyRow[] }>("/api/admin/tickets?take=80");
  const days = backlogDays(data.data?.tickets || []);
  return (
    <section className="c4-backlog-chevron" aria-label={v4("backlog")} data-backlog-chevron="1">
      <header className="c4-backlog-chevron-mast">
        <p className="c4-backlog-chevron-seal" data-logo="mono">{v4("backlogChevronLogo")}</p>
        <div>
          <p className="c4-backlog-chevron-kicker">{v4("backlogChevronKicker")}</p>
          <h3 className="c4-title">{v4("backlog")}</h3>
          <p className="c4-backlog-chevron-lead">{v4("backlogChevronLead")}</p>
        </div>
        <p className="c4-backlog-chevron-count">{days.length}</p>
      </header>
      <ul className="c4-backlog-chevron-rows">
        {days.map((row) => <li key={row.day}><i aria-hidden="true" /><span>{row.day}</span><strong>{row.count}</strong></li>)}
      </ul>
      {!days.length && <p className="c4-backlog-chevron-empty">{v4("backlog")}</p>}
    </section>
  );
}

export function ApprovalTimes({ v4 }: { v4: V4 }) {
  const data = useJson<{ tickets?: MoneyRow[] }>("/api/admin/tickets?take=80");
  const tickets = data.data?.tickets || [];
  const deposits = meanMinutes(tickets.filter((row) => row.kind === "DEPOSIT"));
  const withdrawals = meanMinutes(tickets.filter((row) => row.kind === "WITHDRAW"));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("depositTime")}</h3></div>
      <p className="c4-pad">{v4("depositTime")} {deposits == null ? "—" : `${deposits} ${v4("minutesShort")}`}</p>
      <p className="c4-pad">{v4("withdrawTime")} {withdrawals == null ? "—" : `${withdrawals} ${v4("minutesShort")}`}</p>
    </section>
  );
}

export function Glossary({ v4 }: { v4: V4 }) {
  const [open, setOpen] = useState(true);
  const lines = [v4("glossAum"), v4("glossChurn"), v4("glossEquity"), v4("glossFtd")];
  return (
    <section className="c4-glossary-keystone" aria-label={v4("glossary")} data-glossary-keystone="1">
      <header className="c4-glossary-keystone-mast">
        <p className="c4-glossary-keystone-seal" data-logo="mono">{v4("glossaryKeystoneLogo")}</p>
        <div>
          <p className="c4-glossary-keystone-kicker">{v4("glossaryKeystoneKicker")}</p>
          <h3 className="c4-title">{v4("glossary")}</h3>
          <p className="c4-glossary-keystone-lead">{v4("glossaryKeystoneLead")}</p>
        </div>
        <p className="c4-glossary-keystone-count">{lines.length}</p>
      </header>
      <button type="button" className="c4-btn c4-glossary-keystone-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{v4("glossary")}</button>
      {open && (
        <ul className="c4-glossary-keystone-rows">
          {lines.map((line) => <li key={line}>{line}</li>)}
        </ul>
      )}
    </section>
  );
}

export function WhatsNew({ v4 }: { v4: V4 }) {
  const lines = [v4("whats1"), v4("whats2"), v4("whats3"), v4("whats4"), v4("whats5"), v4("whats6"), v4("whats7"), v4("whats8"), v4("whats9"), v4("whats10"), v4("whats11")];
  return (
    <section className="c4-whats-patera" aria-label={v4("whatsNew")} data-whats-patera="1">
      <header className="c4-whats-patera-mast">
        <p className="c4-whats-patera-seal" data-logo="mono">{v4("whatsPateraLogo")}</p>
        <div>
          <p className="c4-whats-patera-kicker">{v4("whatsPateraKicker")}</p>
          <h3 className="c4-title">{v4("whatsNew")}</h3>
          <p className="c4-whats-patera-lead">{v4("whatsPateraLead")}</p>
        </div>
        <p className="c4-whats-patera-count">{lines.length}</p>
      </header>
      <ul className="c4-whats-patera-rows">
        {lines.map((line) => <li key={line}><i aria-hidden="true" />{line}</li>)}
      </ul>
    </section>
  );
}

export function SimilarList({ row, v4 }: { row: UserRow; v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const matches = similarCustomers(asDesk(row), (data.data?.users || []).map(asDesk));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("similarCustomers")}</h3></div>
      {matches.map((item) => <p key={item.id} className="c4-pad">{item.name || item.email}</p>)}
      {!matches.length && <p className="c4-muted c4-pad">{v4("similarCustomers")}</p>}
    </section>
  );
}

export function HandoffNote({ id, v4, tx }: { id: string; v4: V4; tx: Tx }) {
  const staff = useJson<{ workers?: { id: string; name?: string }[] }>("/api/admin/workers?take=30");
  const [text, setText] = useState("");
  const [worker, setWorker] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <form className="c4-stack c4-pad" onSubmit={async (event) => {
      event.preventDefault();
      const body = text.trim();
      if (!body && !worker) return;
      const note = body ? await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { addNote: body }) : { ok: true, error: "" };
      const assign = worker ? await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { assigneeId: worker }) : { ok: true, error: "" };
      setMsg(note.ok && assign.ok ? tx("saved") : note.error || assign.error || tx("failed"));
      if (note.ok) setText("");
    }}>
      <h3 className="c4-title">{v4("handoff")}</h3>
      <textarea className="c4-field" rows={2} aria-label={v4("handoff")} value={text} onChange={(event) => setText(event.target.value)} />
      <select className="c4-select" aria-label={v4("handoff")} value={worker} onChange={(event) => setWorker(event.target.value)}>
        <option value="" />
        {(staff.data?.workers || []).map((row) => <option key={row.id} value={row.id}>{row.name || row.id}</option>)}
      </select>
      <button type="submit" className="c4-btn">{v4("handoff")}</button>
      {msg && <span className="c4-muted">{msg}</span>}
    </form>
  );
}

export function NoteCloud({ notes, v4 }: { notes: { body?: string | null }[]; v4: V4 }) {
  const words = wordCloud(notes.map((note) => note.body || "").join(" "));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("wordCloud")}</h3></div>
      <div className="c4-row c4-pad">{words.map((word) => <span key={word.word} className="c4-chip">{word.word} {word.count}</span>)}</div>
      {!words.length && <p className="c4-muted c4-pad">{v4("wordCloud")}</p>}
    </section>
  );
}

export function EmailHintLine({ email, v4 }: { email?: string | null; v4: V4 }) {
  const hint = emailHint(String(email || ""));
  if (!hint) return null;
  return <p className="c4-muted">{v4("emailHint")} {hint.fix || ""}</p>;
}

export function BulkRemind({ rows, v4 }: { rows: UserRow[]; v4: V4 }) {
  const [msg, setMsg] = useState("");
  if (!rows.length) return null;
  return (
    <button type="button" className="c4-btn" onClick={async () => {
      const remindAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      for (const row of rows) {
        await sendJson("/api/admin/calendar", "POST", { body: row.name || row.email || row.id, remindAt });
      }
      setMsg(v4("bulkRemind"));
    }}>{msg || v4("bulkRemind")}</button>
  );
}

export function EditLog({ id, v4 }: { id: string; v4: V4 }) {
  const [rows, setRows] = useState<EditEntry[]>([]);
  useEffect(() => {
    const load = () => setRows(readJson<EditEntry[]>(EDIT_KEY, []).filter((row) => row.id === id));
    load();
    window.addEventListener("crmv4:edits", load);
    return () => window.removeEventListener("crmv4:edits", load);
  }, [id]);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("editLog")}</h3></div>
      {rows.map((row) => <p key={`${row.at}-${row.field}`} className="c4-pad">{row.field}: {row.from || "—"} → {row.to}</p>)}
      {!rows.length && <p className="c4-muted c4-pad">{v4("editLog")}</p>}
    </section>
  );
}
