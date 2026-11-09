"use client";

import Link from "next/link";
import { Component, type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  accentOf,
  countryHeat,
  hourHeat,
  lifetimeValue,
  mergeSuggestions,
  methodMix,
  nextAction,
  smartSplit,
  sparkPath,
  withdrawalFlags,
  workloadOf,
  type Accent,
  type MoneyLine,
  type Person,
} from "@/lib/crmv4/round4";
import { presenceOf } from "@/lib/crmv4/round3";
import { crmv4Href } from "@/lib/crmv4/sections";
import { exportCurrent } from "./round1";
import { money, useJson, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const BANNER_KEY = "crmv4-banner";
const ACCENT_KEY = "crmv4-accent";
const INTERVAL_KEY = "crmv4-refresh-sec";
const CSAT_KEY = "crmv4-csat";
const WORK_KEY = "crmv4-workspace";

function asPeople(rows: UserRow[]): Person[] {
  return rows.map((row) => {
    const extra = row as UserRow & { lastSeenAt?: string | null; lastLoginAt?: string | null };
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      country: row.country,
      balance: row.balance ?? row.account?.balance,
      createdAt: row.createdAt,
      lastSeenAt: extra.lastSeenAt,
      lastLoginAt: extra.lastLoginAt,
      documentsStatus: row.documentsStatus,
      ftd: row.ftd,
      saleStatus: row.saleStatus,
      retentionStatus: row.retentionStatus,
      retentionFollowUpAt: row.retentionFollowUpAt,
      assigneeName: row.assigneeName,
    };
  });
}

export function DeskLanding({ name, v4 }: { name: string; v4: V4 }) {
  return (
    <section className="c4-landing">
      <p className="c4-landing-kicker">7FX</p>
      <h2>{v4("deskEnter")}</h2>
      <p className="c4-muted">{v4("signedDesk")} · {name || "—"}</p>
    </section>
  );
}

export function readBanner(): string {
  return readJson<{ text?: string }>(BANNER_KEY, {}).text || "";
}

export function AnnounceBar() {
  const [text, setText] = useState("");
  useEffect(() => {
    const load = () => setText(readBanner());
    load();
    window.addEventListener("crmv4:banner", load);
    return () => window.removeEventListener("crmv4:banner", load);
  }, []);
  if (!text) return null;
  return <p className="c4-banner-note" role="status">{text}</p>;
}

export function AnnounceEditor({ v4 }: { v4: V4 }) {
  const [text, setText] = useState("");
  useEffect(() => { setText(readBanner()); }, []);
  return (
    <div className="c4-stack">
      <h3 className="c4-title">{v4("announce")}</h3>
      <textarea className="c4-field" rows={2} value={text} aria-label={v4("announce")} onChange={(event) => setText(event.target.value)} />
      <button type="button" className="c4-btn" onClick={() => {
        writeJson(BANNER_KEY, { text: text.trim() });
        window.dispatchEvent(new Event("crmv4:banner"));
      }}>{v4("announceSave")}</button>
    </div>
  );
}

export function storedAccent(): Accent {
  if (typeof window === "undefined") return "champagne";
  return accentOf(window.localStorage.getItem(ACCENT_KEY));
}

export function AccentPicker({ v4 }: { v4: V4 }) {
  const [accent, setAccent] = useState<Accent>("champagne");
  useEffect(() => { setAccent(storedAccent()); }, []);
  function pick(next: Accent) {
    setAccent(next);
    window.localStorage.setItem(ACCENT_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:accent", { detail: next }));
  }
  const labels: Record<Accent, CrmV4CopyKey> = { champagne: "accentChampagne", ivory: "accentIvory", graphite: "accentGraphite" };
  return (
    <div className="c4-row">
      <span>{v4("accent")}</span>
      {(["champagne", "ivory", "graphite"] as const).map((item) => (
        <button key={item} type="button" className="c4-chip" data-on={accent === item ? "1" : "0"} onClick={() => pick(item)}>{v4(labels[item])}</button>
      ))}
    </div>
  );
}

export function storedInterval(): number {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(INTERVAL_KEY) || 0);
  return value === 30 || value === 60 ? value : 0;
}

export function FreshnessBar({ v4 }: { v4: V4 }) {
  const [at, setAt] = useState<number | null>(null);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    setAt(Date.now());
    setSec(storedInterval());
    const mark = () => setAt(Date.now());
    window.addEventListener("crmv4:refresh", mark);
    return () => window.removeEventListener("crmv4:refresh", mark);
  }, []);
  useEffect(() => {
    if (!sec) return;
    const id = window.setInterval(() => window.dispatchEvent(new Event("crmv4:refresh")), sec * 1000);
    return () => window.clearInterval(id);
  }, [sec]);
  const label = at ? new Date(at).toISOString().slice(11, 16) : "—";
  return (
    <div className="c4-fresh c4-fresh-crest">
      <span className="c4-fresh-mark" aria-hidden="true" />
      <span className="c4-fresh-time">{v4("freshness")} {label}</span>
      <button type="button" className="c4-btn" onClick={() => window.dispatchEvent(new Event("crmv4:refresh"))}>{v4("refreshNow")}</button>
      <select className="c4-select" aria-label={v4("freshness")} value={String(sec)} onChange={(event) => {
        const next = Number(event.target.value) || 0;
        setSec(next);
        window.localStorage.setItem(INTERVAL_KEY, String(next));
      }}>
        <option value="0">{v4("offAuto")}</option>
        <option value="30">{v4("every30")}</option>
        <option value="60">{v4("every60")}</option>
      </select>
    </div>
  );
}

export function LuxeSkeleton() {
  return (
    <div className="c4-skel-luxe" aria-hidden>
      <span /><span /><span />
    </div>
  );
}

export class DeskBoundary extends Component<{ v4: V4; children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) {
      return (
        <section className="c4-card c4-retry">
          <p>{this.props.v4("retryCard")}</p>
          <button type="button" className="c4-btn" onClick={() => this.setState({ error: false })}>{this.props.v4("retryCard")}</button>
        </section>
      );
    }
    return this.props.children;
  }
}

export function ticketCsat(id: string): number {
  return readJson<Record<string, number>>(CSAT_KEY, {})[id] || 0;
}

export function CsatPicker({ id, v4 }: { id: string; v4: V4 }) {
  const [score, setScore] = useState(0);
  useEffect(() => { setScore(ticketCsat(id)); }, [id]);
  return (
    <div className="c4-row" role="group" aria-label={v4("csat")}>
      <span className="c4-muted">{v4("csat")}</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className="c4-chip" data-on={score === n ? "1" : "0"} onClick={() => {
          setScore(n);
          const map = readJson<Record<string, number>>(CSAT_KEY, {});
          map[id] = n;
          writeJson(CSAT_KEY, map);
        }}>{n}</button>
      ))}
    </div>
  );
}

export function readWorkspace(): { id: string; name: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(WORK_KEY) || "[]") as { id: string; name: string }[];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function pushWorkspace(row: { id: string; name: string }) {
  const next = [row, ...readWorkspace().filter((item) => item.id !== row.id)].slice(0, 5);
  window.sessionStorage.setItem(WORK_KEY, JSON.stringify(next));
}

export function WorkspaceTabs({ base, current, v4 }: { base: string; current: string; v4: V4 }) {
  const [rows, setRows] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => { setRows(readWorkspace()); }, [current]);
  if (rows.length < 2) return null;
  return (
    <nav className="c4-work" aria-label={v4("workspace")}>
      {rows.map((row) => (
        <Link key={row.id} href={crmv4Href(base, `customers/${row.id}`)} data-on={row.id === current ? "1" : "0"}>{row.name || row.id}</Link>
      ))}
    </nav>
  );
}

export function CompareBoard({ rows, tx, v4, locale }: { rows: UserRow[]; tx: Tx; v4: V4; locale: string }) {
  const picked = rows.slice(0, 3);
  if (picked.length < 2) return null;
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("compareCustomers")}</h3></div>
      <div className="c4-compare-grid">
        {picked.map((row) => (
          <article key={row.id} className="c4-compare-card">
            <h4>{row.name || "—"}</h4>
            <p className="c4-muted">{row.country || "—"} · {row.desk || "—"}</p>
            <p>{tx("balance")} {money(row.balance ?? row.account?.balance, row.currency, locale)}</p>
            <p>{tx("sale")} {row.saleStatus || "—"}</p>
            <p>{tx("ftd")} {row.ftd ? tx("yes") : tx("no")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ValueSpark({ id, tx, v4, locale }: { id: string; tx: Tx; v4: V4; locale: string }) {
  const data = useJson<{ transactions?: MoneyLine[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=40`);
  if (data.loading) return <LuxeSkeleton />;
  const book = lifetimeValue(data.data?.transactions || []);
  const path = sparkPath(book.points);
  return (
    <section className="c4-card c4-spark-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("ltv")}</h3></div>
      <p className="c4-kpi-value">{money(book.net, "USD", locale)}</p>
      <p className="c4-muted c4-pad">{v4("netTrend")}</p>
      {path ? (
        <svg className="c4-spark" viewBox="0 0 120 32" role="img" aria-label={v4("netTrend")}>
          <path d={path} />
        </svg>
      ) : <p className="c4-muted c4-pad">{tx("noneYet")}</p>}
    </section>
  );
}

export function CountryHeat({ v4 }: { v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const rows = countryHeat(data.data?.users || []);
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("countryHeat")}</h3></div>
      {data.loading && <LuxeSkeleton />}
      <table className="c4-table">
        <tbody>
          {rows.slice(0, 8).map((row) => (
            <tr key={row.country}>
              <td>{row.country}</td>
              <td><div className="c4-heat" style={{ width: `${Math.max(8, (row.count / max) * 100)}%` }} /></td>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function HourHeat({ v4 }: { v4: V4 }) {
  const calls = useJson<{ communications?: { createdAt?: string }[] }>("/api/admin/communications?take=80");
  const moneyRows = useJson<{ requests?: { createdAt?: string }[] }>("/api/admin/deposits?take=80");
  const stamps = [
    ...(calls.data?.communications || []).map((row) => row.createdAt),
    ...(moneyRows.data?.requests || []).map((row) => row.createdAt),
  ];
  const buckets = hourHeat(stamps);
  const max = Math.max(1, ...buckets);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("hourHeat")}</h3></div>
      {(calls.loading || moneyRows.loading) && <LuxeSkeleton />}
      <div className="c4-hours" aria-label={v4("hourHeat")}>
        {buckets.map((count, hour) => (
          <span key={hour} title={`${hour}: ${count}`} style={{ opacity: 0.25 + (count / max) * 0.75 }}>{hour}</span>
        ))}
      </div>
    </section>
  );
}

export function WorkloadBoard({ v4 }: { v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const rows = workloadOf(data.data?.users || []);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("workload")}</h3></div>
      {data.loading && <LuxeSkeleton />}
      <ul className="c4-watch">
        {rows.slice(0, 6).map((row) => (
          <li key={row.name} className="c4-watch-row"><span>{row.name}</span><span>{row.count} · {row.share}%</span></li>
        ))}
      </ul>
    </section>
  );
}

export function SmartLists({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const split = smartSplit(asPeople(data.data?.users || []));
  const blocks: { key: CrmV4CopyKey; rows: Person[] }[] = [
    { key: "inactive30", rows: split.inactive },
    { key: "richIdle", rows: split.richIdle },
    { key: "kycStale", rows: split.kycStale },
  ];
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("smartLists")}</h3></div>
      {data.loading && <LuxeSkeleton />}
      <div className="c4-smart">
        {blocks.map((block) => (
          <div key={block.key}>
            <h4>{v4(block.key)} · {block.rows.length}</h4>
            {block.rows.slice(0, 4).map((row) => (
              <Link key={row.id} href={crmv4Href(base, `customers/${row.id}`)}>{row.name || row.email}</Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function NextQueue({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const rows = asPeople(data.data?.users || []).map((row) => ({ ...row, kind: nextAction(row) })).filter((row) => row.kind !== "wait").slice(0, 8);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("nextAction")}</h3></div>
      {data.loading && <LuxeSkeleton />}
      <ul>
        {rows.map((row) => (
          <li key={row.id} className="c4-pad c4-row c4-between">
            <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || row.email}</Link>
            <span className="c4-status" data-tone={row.kind === "kyc" ? "warn" : "info"}>{v4(row.kind === "kyc" ? "kycStale" : row.kind === "retain" ? "nextRetain" : "nextCall")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MergeList({ v4 }: { v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const groups = mergeSuggestions(asPeople(data.data?.users || []));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("mergeSuggest")}</h3></div>
      {data.loading && <LuxeSkeleton />}
      {groups.slice(0, 6).map((group) => <p key={group.key} className="c4-pad">{group.key} · {group.ids.length}</p>)}
      {!groups.length && !data.loading && <p className="c4-muted c4-pad">{v4("mergeSuggest")}</p>}
    </section>
  );
}

export function MethodChart({ rows, v4, locale }: { rows: MoneyLine[]; v4: V4; locale: string }) {
  const mix = methodMix(rows);
  const max = Math.max(1, ...mix.map((row) => row.amount));
  if (!mix.length) return null;
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("methodMix")}</h3></div>
      {mix.slice(0, 6).map((row) => (
        <div key={row.method} className="c4-funnel-row">
          <span>{row.method}</span>
          <div className="c4-risk-track"><div className="c4-bar" style={{ width: `${Math.max(8, (row.amount / max) * 100)}%` }} /></div>
          <span>{money(row.amount, "USD", locale)}</span>
        </div>
      ))}
    </section>
  );
}

export function WithdrawFlags({ v4 }: { v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const rows = asPeople(data.data?.users || []).map((row) => ({ ...row, flags: withdrawalFlags(row) })).filter((row) => row.flags.length);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("riskNew")}</h3></div>
      {data.loading && <LuxeSkeleton />}
      <ul>
        {rows.slice(0, 8).map((row) => (
          <li key={row.id} className="c4-pad">{row.name} · {row.flags.map((flag) => v4(flag === "new" ? "riskNew" : "riskKyc")).join(" · ")}</li>
        ))}
      </ul>
      {!rows.length && !data.loading && <p className="c4-muted c4-pad">{v4("riskNew")}</p>}
    </section>
  );
}

export function AuditExport({ rows, v4 }: { rows: { action?: string; actor?: string; target?: string; level?: string; at?: string }[]; v4: V4 }) {
  return (
    <button type="button" className="c4-btn" onClick={() => void exportCurrent("audit-log", "audit.csv", ["action", "actor", "target", "level", "at"], rows.map((row) => [String(row.action || ""), String(row.actor || ""), String(row.target || ""), String(row.level || ""), String(row.at || "")]))}>{v4("auditExport")}</button>
  );
}

export function StaffList({ v4 }: { v4: V4 }) {
  const data = useJson<{ workers?: { id: string; name?: string | null; email?: string | null; lastSeenAt?: string | null; lastLogin?: { at?: string | null } | null }[] }>("/api/admin/workers?take=20");
  const rows = data.data?.workers || [];
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("staffPresence")}</h3></div>
      {data.loading && <LuxeSkeleton />}
      <ul>
        {rows.map((row) => {
          const seen = row.lastSeenAt || row.lastLogin?.at || null;
          const kind = presenceOf(seen, row.lastLogin?.at || null);
          return (
            <li key={row.id} className="c4-pad c4-row c4-between">
              <span>{row.name || row.email}</span>
              <span className="c4-status" data-tone={kind === "online" ? "ok" : kind === "away" ? "warn" : "muted"}>{kind}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function QuickChips({ saleStatus, v4, onPick }: { saleStatus: string; v4: V4; onPick: (status: string) => void }) {
  const chips = [
    { id: "DEPOSITED", label: v4("chipDeposited") },
    { id: "CALLBACK", label: v4("chipCallback") },
    { id: "NO_ANSWER", label: v4("chipNoAnswer") },
  ];
  return (
    <div className="c4-tools" aria-label={v4("quickChips")}>
      {chips.map((chip) => (
        <button key={chip.id} type="button" className="c4-chip" data-on={saleStatus === chip.id ? "1" : "0"} onClick={() => onPick(saleStatus === chip.id ? "" : chip.id)}>{chip.label}</button>
      ))}
    </div>
  );
}

export function useInboxCursor(count: number, onEnter: (index: number) => void) {
  const [cursor, setCursor] = useState(0);
  const cursorRef = useRef(0);
  cursorRef.current = cursor;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "j") {
      event.preventDefault();
      setCursor((index) => Math.min(Math.max(count - 1, 0), index + 1));
    }
    if (event.key === "k") {
      event.preventDefault();
      setCursor((index) => Math.max(0, index - 1));
    }
    if (event.key === "Enter") onEnter(cursorRef.current);
  };
  return { cursor, onKeyDown };
}

export function PullSurface({ hint, onRefresh, children }: { hint: string; onRefresh: () => void; children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const start = useRef(0);
  return (
    <div
      onTouchStart={(event) => { start.current = event.touches[0].clientY; }}
      onTouchMove={(event) => setPull(Math.max(0, Math.min(72, event.touches[0].clientY - start.current)))}
      onTouchEnd={() => {
        if (pull >= 48) onRefresh();
        setPull(0);
      }}
    >
      <div className="c4-pull" data-on={pull > 8 ? "1" : "0"}>{hint}</div>
      {children}
    </div>
  );
}
