"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { sparkPath } from "@/lib/crmv4/round4";
import {
  agingBucket,
  categorize,
  columnTotal,
  conversionDays,
  depositStreak,
  domainGroups,
  equityCurve,
  expirySoon,
  flagEmoji,
  formatAmount,
  formatPhone,
  redepositDue,
  riskScore,
  shareQuery,
  slaHeat,
  topDepositors,
  type Aging,
} from "@/lib/crmv4/round6";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, sendJson, useJson, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const CALL_KEY = "crmv4-call-target";
const RULE_KEY = "crmv4-ticket-rules";
const DEC_KEY = "crmv4-decimals";
const MOTION_KEY = "crmv4-motion";

const DEFAULT_RULES = [
  { word: "deposit", label: "deposit" },
  { word: "kyc", label: "kyc" },
  { word: "withdraw", label: "withdraw" },
];

export function QuickMenu({ id, phone, base, v4 }: { id: string; phone?: string | null; base: string; v4: V4 }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="c4-quick">
      <button type="button" className="c4-btn c4-press" aria-expanded={open} onClick={() => setOpen((on) => !on)}>{v4("quickMenu")}</button>
      {open && (
        <div className="c4-radial" role="menu">
          <Link href={crmv4Href(base, `customers/${id}`)}>{v4("deepLinks")}</Link>
          {phone && <a href={`tel:${phone}`}>{phone}</a>}
          <Link href={crmv4Href(base, `customers/${id}`, { part: "notes" })}>{v4("teamThread")}</Link>
        </div>
      )}
    </div>
  );
}

export function RiskBadge({ row, v4 }: { row: UserRow; v4: V4 }) {
  const score = riskScore({ active: row.active, documentsStatus: row.documentsStatus, balance: row.balance ?? row.account?.balance, equity: row.equity ?? row.account?.equity, ftd: row.ftd });
  const tone = score >= 60 ? "bad" : score >= 35 ? "warn" : "ok";
  return <span className="c4-status" data-tone={tone}>{v4("riskScore")} {score}</span>;
}

export function EquityCurve({ id, v4 }: { id: string; v4: V4 }) {
  const data = useJson<{ transactions?: { amount?: number; balanceAfter?: number | null; createdAt?: string }[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=40`);
  const points = equityCurve(data.data?.transactions || []);
  const path = sparkPath(points);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("equityCurve")}</h3></div>
      {path ? <svg className="c4-spark" viewBox="0 0 120 32" role="img" aria-label={v4("equityCurve")}><path d={path} /></svg> : <p className="c4-muted c4-pad">—</p>}
    </section>
  );
}

export function StreakBoard({ v4 }: { v4: V4 }) {
  const data = useJson<{ requests?: { createdAt?: string; user?: { id?: string; name?: string }; createdAtUser?: string }[] }>("/api/admin/deposits?take=80&status=APPROVED");
  const dates = (data.data?.requests || []).map((row) => row.createdAt);
  const streak = depositStreak(dates);
  const byUser = new Map<string, { id: string; name: string; last: string; ftd: boolean }>();
  for (const row of data.data?.requests || []) {
    const id = row.user?.id || row.user?.name || "";
    if (!id || !row.createdAt) continue;
    const prev = byUser.get(id);
    if (!prev || row.createdAt > prev.last) byUser.set(id, { id, name: row.user?.name || id, last: row.createdAt, ftd: true });
  }
  const due = redepositDue(Array.from(byUser.values()).map((row) => ({ id: row.id, ftd: true, lastDepositAt: row.last })));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("streak")}</h3></div>
      <p className="c4-pad">{streak}</p>
      <h4 className="c4-pad">{v4("redeposit")}</h4>
      {due.slice(0, 6).map((row) => <p key={row.id} className="c4-pad">{byUser.get(row.id)?.name}</p>)}
    </section>
  );
}

export function readCallTarget(): { day: string; count: number; target: number } {
  const today = new Date().toISOString().slice(0, 10);
  const stored = readJson(CALL_KEY, { day: today, count: 0, target: 20 });
  if (stored.day !== today) return { day: today, count: 0, target: stored.target || 20 };
  return stored;
}

export function CallTarget({ v4 }: { v4: V4 }) {
  const [state, setState] = useState({ day: "", count: 0, target: 20 });
  useEffect(() => { setState(readCallTarget()); }, []);
  function save(next: { day: string; count: number; target: number }) {
    setState(next);
    writeJson(CALL_KEY, next);
  }
  return (
    <div className="c4-call-target">
      <span>{v4("callTarget")} {state.count}/{state.target}</span>
      <button type="button" className="c4-btn c4-press" onClick={() => save({ ...state, day: new Date().toISOString().slice(0, 10), count: state.count + 1 })}>+1</button>
    </div>
  );
}

export function TeamThread({ id, name, v4, tx }: { id: string; name: string; v4: V4; tx: Tx }) {
  const data = useJson<{ notes?: { id: string; body?: string; authorName?: string | null }[]; writableTeams?: string[] }>(`/api/admin/users/${encodeURIComponent(id)}/team-notes?take=30`);
  const [body, setBody] = useState("");
  const team = (data.data?.writableTeams || ["SALE"])[0] || "SALE";
  const notes = data.data?.notes || [];
  return (
    <section className="c4-card c4-thread">
      <div className="c4-card-h"><h3 className="c4-title">{v4("teamThread")}</h3></div>
      <ul>
        {notes.map((row) => (
          <li key={row.id} className="c4-bubble" data-mine={row.authorName && row.authorName === name ? "1" : "0"}>
            <strong>{row.authorName || "—"}</strong>
            <div>{row.body}</div>
          </li>
        ))}
      </ul>
      <form className="c4-row c4-pad" onSubmit={async (event) => {
        event.preventDefault();
        const text = body.trim();
        if (!text) return;
        const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}/team-notes`, "POST", { team, body: text });
        if (res.ok) { setBody(""); data.reload(); }
      }}>
        <input className="c4-field" aria-label={v4("teamThread")} value={body} onChange={(event) => setBody(event.target.value)} />
        <button type="submit" className="c4-btn c4-btn-hot">{tx("addNote")}</button>
      </form>
    </section>
  );
}

export function SlaHeat({ v4 }: { v4: V4 }) {
  const data = useJson<{ tickets?: { openedAt?: string }[] }>("/api/admin/tickets?status=PENDING");
  const buckets = slaHeat((data.data?.tickets || []).map((row) => row.openedAt));
  const max = Math.max(1, ...buckets);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("slaHeat")}</h3></div>
      <div className="c4-sla" aria-label={v4("slaHeat")}>
        {buckets.map((count, index) => <span key={index} style={{ opacity: 0.3 + (count / max) * 0.7 }}>{count}</span>)}
      </div>
    </section>
  );
}

export function ticketCategory(text: string): string {
  return categorize(text, readJson(RULE_KEY, DEFAULT_RULES));
}

export function CategoryRules({ v4 }: { v4: V4 }) {
  const [rules, setRules] = useState(DEFAULT_RULES);
  useEffect(() => { setRules(readJson(RULE_KEY, DEFAULT_RULES)); }, []);
  return (
    <div className="c4-stack">
      <h3 className="c4-title">{v4("autoCategory")}</h3>
      {rules.map((rule, index) => (
        <div key={rule.label} className="c4-row">
          <input className="c4-field" aria-label={v4("autoCategory")} value={rule.word} onChange={(event) => {
            const next = rules.map((item, i) => i === index ? { ...item, word: event.target.value } : item);
            setRules(next);
            writeJson(RULE_KEY, next);
          }} />
          <span>{rule.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DocGallery({ id, v4 }: { id: string; v4: V4 }) {
  const files = useJson<{ documents?: { id: string; title?: string; fileName?: string; mime?: string }[] }>(`/api/admin/customer-documents?userId=${encodeURIComponent(id)}&take=24`);
  const rows = files.data?.documents || [];
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("gallery")}</h3></div>
      <div className="c4-gallery">
        {rows.map((row) => (
          <figure key={row.id} data-image={String(row.mime || "").startsWith("image/") ? "1" : "0"}>
            <figcaption>{row.title || row.fileName || row.id}</figcaption>
          </figure>
        ))}
      </div>
      {!rows.length && !files.loading && <p className="c4-muted c4-pad">{v4("gallery")}</p>}
    </section>
  );
}

export function ExpiryNote({ expiresAt, v4 }: { expiresAt?: string | null; v4: V4 }) {
  const kind = expirySoon(expiresAt);
  if (!expiresAt) return <p className="c4-muted">{v4("noExpiry")}</p>;
  if (!kind) return null;
  return <p className="c4-status" data-tone={kind === "expired" ? "bad" : "warn"}>{v4("expiryWarn")} · {expiresAt.slice(0, 10)}</p>;
}

export function CountryFlag({ country }: { country?: string | null }) {
  const flag = flagEmoji(country);
  if (!flag) return null;
  return <span className="c4-flag" aria-hidden>{flag}</span>;
}

export function PhoneText({ phone, country }: { phone?: string | null; country?: string | null }) {
  const text = formatPhone(phone, country);
  if (!text) return null;
  return <a href={`tel:${phone}`}>{text}</a>;
}

export function DomainBoard({ rows, v4 }: { rows: { email?: string | null }[]; v4: V4 }) {
  const groups = domainGroups(rows).slice(0, 6);
  if (!groups.length) return null;
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("domains")}</h3></div>
      {groups.map((row) => <p key={row.domain} className="c4-pad">{row.domain} · {row.count}</p>)}
    </section>
  );
}

const AGE_KEY: Record<Aging, CrmV4CopyKey> = { fresh: "ageFresh", week: "ageWeek", month: "ageMonth", old: "ageOld" };

export function AgingBoard({ rows, v4 }: { rows: { createdAt?: string | null }[]; v4: V4 }) {
  const counts: Record<Aging, number> = { fresh: 0, week: 0, month: 0, old: 0 };
  for (const row of rows) counts[agingBucket(row.createdAt)] += 1;
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("aging")}</h3></div>
      {(Object.keys(counts) as Aging[]).map((key) => <p key={key} className="c4-pad">{v4(AGE_KEY[key])} · {counts[key]}</p>)}
    </section>
  );
}

export function ConversionStat({ rows, v4 }: { rows: { createdAt?: string | null; ftdAt?: string | null; ftd?: boolean }[]; v4: V4 }) {
  const days = rows.map((row) => conversionDays(row.createdAt, row.ftdAt)).filter((value): value is number => value != null);
  const avg = days.length ? Math.round(days.reduce((sum, value) => sum + value, 0) / days.length) : null;
  return <p className="c4-muted c4-pad">{v4("conversion")} {avg == null ? "—" : avg}</p>;
}

export function DepositorBoard({ rows, v4, locale }: { rows: UserRow[]; v4: V4; locale: string }) {
  const top = topDepositors(rows.map((row) => ({ ...row, balance: row.balance ?? row.account?.balance })), 5);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("topDepositors")}</h3></div>
      {top.map((row) => <p key={row.id} className="c4-pad">{row.name || row.email} · {money(row.balance, row.currency, locale)}</p>)}
    </section>
  );
}

export function WeeklyDigest({ rows, v4, tx }: { rows: UserRow[]; v4: V4; tx: Tx }) {
  const ftd = rows.filter((row) => row.ftd).length;
  return (
    <section className="c4-card c4-digest">
      <div className="c4-card-h"><h3 className="c4-title">{v4("weeklyDigest")}</h3>
        <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("weeklyDigest")}</button>
      </div>
      <p className="c4-pad">{tx("customers")} {rows.length} · {tx("ftd")} {ftd}</p>
    </section>
  );
}

export async function copyFilterLink(params: Record<string, string>) {
  const path = `${window.location.pathname}${shareQuery(params)}`;
  try { await navigator.clipboard.writeText(`${window.location.origin}${path}`); } catch { /* link stays in the bar */ }
  return path;
}

export function DeepLinkList({ base, v4 }: { base: string; v4: V4 }) {
  const links = ["", "customers", "finance", "positions", "support", "marketing", "logs", "settings"];
  return (
    <div className="c4-deep">
      <p className="c4-muted">{v4("deepLinks")}</p>
      {links.map((path) => <Link key={path || "home"} href={crmv4Href(base, path)}>{path || "overview"}</Link>)}
    </div>
  );
}

export function readDecimals(): number {
  if (typeof window === "undefined") return 2;
  return window.localStorage.getItem(DEC_KEY) === "0" ? 0 : 2;
}

export function DecimalPref({ v4 }: { v4: V4 }) {
  const [places, setPlaces] = useState(2);
  useEffect(() => { setPlaces(readDecimals()); }, []);
  return (
    <label className="c4-lab"><span>{v4("decimals")}</span>
      <select className="c4-select" value={String(places)} onChange={(event) => {
        const next = Number(event.target.value) === 0 ? 0 : 2;
        setPlaces(next);
        window.localStorage.setItem(DEC_KEY, String(next));
      }}>
        <option value="2">2</option>
        <option value="0">0</option>
      </select>
      <span className="c4-muted">{formatAmount(1234.5, places)}</span>
    </label>
  );
}

export function storedMotion(): "system" | "reduce" {
  if (typeof window === "undefined") return "system";
  return window.localStorage.getItem(MOTION_KEY) === "reduce" ? "reduce" : "system";
}

export function MotionPref({ v4 }: { v4: V4 }) {
  const [mode, setMode] = useState<"system" | "reduce">("system");
  useEffect(() => { setMode(storedMotion()); }, []);
  return (
    <button type="button" className="c4-chip" data-on={mode === "reduce" ? "1" : "0"} onClick={() => {
      const next = mode === "reduce" ? "system" : "reduce";
      setMode(next);
      window.localStorage.setItem(MOTION_KEY, next);
      window.dispatchEvent(new CustomEvent("crmv4:motion", { detail: next }));
    }}>{v4("motionReduce")}</button>
  );
}

export function Fab({ v4, onCreate }: { v4: V4; onCreate: () => void }) {
  return (
    <div className="c4-fab">
      <button type="button" className="c4-fab-btn c4-press" aria-label={v4("quickPlus")} onClick={onCreate}>+</button>
    </div>
  );
}

export { columnTotal, flagEmoji, formatPhone };
