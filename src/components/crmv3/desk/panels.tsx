"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  ageBuckets,
  ageHours,
  anomalyRows,
  bookTotals,
  campaignFunnel,
  campaignStats,
  categorize,
  changedKeys,
  completeness,
  countryHeat,
  cpl,
  cpa,
  deskRanks,
  detailPairs,
  docCounts,
  dueToday,
  duplicateEmails,
  exposureBySymbol,
  funnelOf,
  groupByAuthor,
  healthOf,
  hourHeat,
  isChurn,
  journeyOf,
  marginLevel,
  marginWatch,
  nextAction,
  noteDuplicate,
  orderNotes,
  parseOperators,
  pnlMovers,
  qualityRows,
  rankAffiliates,
  relativeFrom,
  riskScore,
  segmentHit,
  slaLeft,
  smartSplit,
  smsParts,
  snoozeUntil,
  sourceTrend,
  symbolPopularity,
  toIcs,
  winLoss,
  workloadOf,
  type AssignRule,
  type LeadRow,
  type SegmentRule,
} from "@/lib/crmv3/bridge";
import { Card, Lab, Msg, downloadCsv, sendJson, useJson, when, type Tx, type UserRow } from "../kit";
import { useLocal, useV3 } from "./store";

type Person = UserRow & { lastLoginAt?: string | null; lastSeenAt?: string | null };

export function useHomeCards({ base, locale }: { base: string; locale: string }) {
  const v3 = useV3();
  const users = useJson<{ users?: Person[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const day = useJson<{ reminders?: { id: string; body?: string; remindAt?: string }[] }>("/api/admin/calendar?take=40");
  const quote = useJson<{ quotes?: { symbol?: string; bid?: number; price?: number }[] }>("/api/market/quote?symbols=USDTRY");
  const [target, setTarget] = useLocal<number>("crmv3-goal", 10);
  const [pins] = useLocal<string[]>("crmv3-pins", []);
  const [refreshed, setRefreshed] = useState("");
  useEffect(() => { setRefreshed(new Date().toISOString()); }, [users.data]);
  const rows = users.data?.users || [];
  const funnel = funnelOf(rows);
  const heat = countryHeat(rows).slice(0, 6);
  const ranks = deskRanks(rows).slice(0, 6);
  const load = workloadOf(rows).slice(0, 6);
  const churn = rows.filter((row) => isChurn(row));
  const next = { call: 0, kyc: 0, retain: 0 };
  for (const row of rows) {
    const kind = nextAction(row);
    if (kind === "call" || kind === "kyc" || kind === "retain") next[kind] += 1;
  }
  const today = new Date().toISOString().slice(0, 10);
  const mine = (day.data?.reminders || []).filter((row) => String(row.remindAt || "").slice(0, 10) === today);
  const progress = target > 0 ? Math.min(100, Math.round((funnel.ftd / target) * 100)) : 0;
  const pinned = rows.filter((row) => pins.includes(row.id));
  const rate = Number(quote.data?.quotes?.[0]?.bid || quote.data?.quotes?.[0]?.price || 0);
  const hours = hourHeat(rows.map((row) => row.createdAt));
  return {
    goal: (
      <Card title={v3("deskGoal")}>
        <div className="c3-pad c3-stack">
          <p className="c3-muted">{v3("goalLocal")}</p>
          <div className="c3-meter" aria-hidden><span style={{ width: `${progress}%` }} /></div>
          <p>{v3("goalProgress")} {progress}% · {v3("funnelFtd")} {funnel.ftd}</p>
          <label className="c3-lab">
            <span>{v3("goalTarget")}</span>
            <input className="c3-field" inputMode="numeric" aria-label={v3("goalTarget")} value={String(target)} onChange={(event) => setTarget(Math.max(0, Number(event.target.value) || 0))} />
          </label>
          <p className="c3-muted">{v3("lastRefresh")} {refreshed ? when(refreshed, locale) : "—"}</p>
          {rate > 0 && <p className="c3-muted">{v3("quoteTry")} {rate} · {v3("tryHint")}</p>}
        </div>
      </Card>
    ),
    funnel: (
      <Card title={v3("funnelLeads")}>
        <div className="c3-kpis">
          <div className="c3-kpi"><p className="c3-kpi-label">{v3("funnelLeads")}</p><p className="c3-kpi-value">{funnel.leads}</p></div>
          <div className="c3-kpi"><p className="c3-kpi-label">{v3("funnelFtd")}</p><p className="c3-kpi-value">{funnel.ftd}</p></div>
          <div className="c3-kpi"><p className="c3-kpi-label">{v3("redepositWord")}</p><p className="c3-kpi-value">{funnel.redeposit}</p></div>
          <div className="c3-kpi"><p className="c3-kpi-label">{v3("pageOnly")}</p><p className="c3-kpi-value">{rows.length}</p></div>
        </div>
        <div className="c3-tools">
          <span className="c3-chip" data-on="1">{v3("nextCall")} {next.call}</span>
          <span className="c3-chip" data-on="1">{v3("nextKyc")} {next.kyc}</span>
          <span className="c3-chip" data-on="1">{v3("nextRetain")} {next.retain}</span>
        </div>
      </Card>
    ),
    tasks: (
      <Card title={v3("myDay")}>
        <p className="c3-muted c3-pad">{v3("dueAnnounce")} {dueToday(day.data?.reminders || [])}</p>
        {!mine.length && <p className="c3-muted c3-pad">{v3("myDayEmpty")}</p>}
        <ul>
          {mine.map((row) => (
            <li key={row.id} className="c3-pad">{row.body} · {when(row.remindAt, locale)}</li>
          ))}
        </ul>
        <p className="c3-pad"><Link href={crmv3Href(base, "settings", { area: "calendar" })}>{v3("goTasks")}</Link></p>
      </Card>
    ),
    churn: (
      <Card title={v3("churnRisk")}>
        <p className="c3-muted c3-pad">{v3("churnHint")}</p>
        {!churn.length && <p className="c3-muted c3-pad">{v3("churnNone")}</p>}
        <ul>
          {churn.slice(0, 8).map((row) => (
            <li key={row.id} className="c3-pad"><Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || row.email}</Link></li>
          ))}
        </ul>
      </Card>
    ),
    pins: (
      <Card title={v3("pinnedList")}>
        {!pinned.length && <p className="c3-muted c3-pad">{v3("pinNone")}</p>}
        <ul>
          {pinned.map((row) => (
            <li key={row.id} className="c3-pad"><Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || row.email}</Link></li>
          ))}
        </ul>
      </Card>
    ),
    cities: (
      <Card title={v3("countryHeat")}>
        <ul>
          {heat.map((row) => (
            <li key={row.country} className="c3-row c3-between c3-pad"><span>{row.country}</span><span>{row.count}</span></li>
          ))}
        </ul>
      </Card>
    ),
    book: (
      <Card title={v3("deskBoard")}>
        <ul>
          {ranks.map((row) => (
            <li key={row.desk} className="c3-pad">{row.desk} · {row.traders} · {row.ftd} · {row.balance}</li>
          ))}
        </ul>
      </Card>
    ),
    workload: (
      <Card title={v3("workloadWord")}>
        <ul>
          {load.map((row) => (
            <li key={row.name} className="c3-pad">{row.name} · {row.count} · {row.share}%</li>
          ))}
        </ul>
      </Card>
    ),
    heat: (
      <Card title={v3("hourHeat")}>
        <div className="c3-hours" aria-label={v3("hourHeat")}>
          {hours.map((count, hour) => <span key={hour} title={`${hour}: ${count}`}>{count}</span>)}
        </div>
      </Card>
    ),
  };
}

export function customerTools(rows: UserRow[], ops: string, smart: "" | "quiet" | "funded" | "kyc"): UserRow[] {
  const parsed = parseOperators(ops);
  const operated = rows.filter((row) => {
    const bag = row as unknown as Record<string, unknown>;
    const aliases: Record<string, string> = { sale: "saleStatus", retention: "retentionStatus" };
    const opsOk = Object.entries(parsed.ops).every(([key, value]) => String(bag[aliases[key] || key] ?? "").toLowerCase().includes(value.toLowerCase()));
    if (!opsOk) return false;
    if (!parsed.text) return true;
    return `${row.name || ""} ${row.email || ""}`.toLowerCase().includes(parsed.text.toLowerCase());
  });
  if (!smart) return operated;
  const split = smartSplit(operated);
  if (smart === "quiet") return split.inactive as UserRow[];
  if (smart === "funded") return split.richIdle as UserRow[];
  return split.kycStale as UserRow[];
}

export function rowHealth(row: UserRow) {
  return healthOf(row);
}

export function rowRisk(row: UserRow) {
  return riskScore({ active: row.active, documentsStatus: row.documentsStatus, balance: Number(row.balance ?? row.account?.balance ?? 0), equity: row.equity ?? row.account?.equity, ftd: row.ftd });
}

export function rowAgeLabel(value?: string | null) {
  return relativeFrom(value);
}

export function duplicateSet(rows: UserRow[]) {
  return duplicateEmails(rows);
}

export function QualityList({ rows }: { rows: UserRow[] }) {
  const v3 = useV3();
  const found = qualityRows(rows);
  if (!found.length) return null;
  return (
    <Card title={v3("qualityWord")}>
      <p className="c3-muted c3-pad">{v3("qualityHint")}</p>
      <ul>
        {found.slice(0, 8).map((row) => <li key={row.id} className="c3-pad">{row.label} · {row.problems.join(", ")}</li>)}
      </ul>
    </Card>
  );
}

export function BookDesk({ rows, onMore, more }: { rows: { symbol?: string; side?: string; volume?: number; profit?: number; status?: string; openedAt?: string; traderName?: string; user?: { name?: string } }[]; onMore?: () => void; more?: boolean }) {
  const v3 = useV3();
  const open = rows.filter((row) => String(row.status || "OPEN").toUpperCase() === "OPEN");
  const book = bookTotals(open);
  const exposure = exposureBySymbol(open).slice(0, 6);
  const ages = ageBuckets(open.map((row) => row.openedAt));
  const movers = pnlMovers(open, 5);
  const popular = symbolPopularity(rows).slice(0, 6);
  const ratio = winLoss(rows);
  const [symbol, setSymbol] = useState("");
  const picked = symbol || exposure[0]?.symbol || "";
  const holders = open.filter((row) => (row.symbol || "") === picked).slice(0, 6);
  return (
    <Card title={v3("exposureWord")}>
      <p className="c3-muted c3-pad">{v3("bookHint")}</p>
      <div className="c3-kpis">
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("bookWord")}</p><p className="c3-kpi-value">{book.open}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("exposureWord")}</p><p className="c3-kpi-value">{book.exposure}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("winLoss")}</p><p className="c3-kpi-value">{ratio.ratio}%</p></div>
      </div>
      <ul>
        {exposure.map((row) => <li key={row.symbol} className="c3-pad">{row.symbol} · {row.exposure} · {row.pnl}</li>)}
      </ul>
      <div className="c3-tools">
        {ages.map((row) => <span key={row.label} className="c3-chip">{row.label} {row.count}</span>)}
      </div>
      <p className="c3-kicker c3-pad">{v3("moversWord")}</p>
      <ul>
        {movers.map((row, index) => <li key={`${row.symbol}-${index}`} className="c3-pad">{row.symbol} · {row.profit}</li>)}
      </ul>
      <p className="c3-kicker c3-pad">{v3("popularWord")}</p>
      <ul>
        {popular.map((row) => <li key={row.symbol} className="c3-pad">{row.symbol} · {row.count}</li>)}
      </ul>
      <label className="c3-lab c3-pad">
        <span>{v3("holders")}</span>
        <select className="c3-select" aria-label={v3("holders")} value={picked} onChange={(event) => setSymbol(event.target.value)}>
          {exposure.map((row) => <option key={row.symbol}>{row.symbol}</option>)}
        </select>
      </label>
      <ul>
        {holders.map((row, index) => <li key={index} className="c3-pad">{row.traderName || row.user?.name || "—"}</li>)}
      </ul>
      {onMore && <div className="c3-pad"><button type="button" className="c3-btn" disabled={!more} onClick={onMore}>{v3("loadMore")}</button><p className="c3-muted">{v3("loadHint")}</p></div>}
    </Card>
  );
}

export function MarginWatchList({ rows, base }: { rows: Person[]; base: string }) {
  const v3 = useV3();
  const watch = marginWatch(rows.map((row) => ({ ...row, balance: Number(row.balance ?? row.account?.balance ?? 0), equity: Number(row.equity ?? row.account?.equity ?? row.balance ?? 0) })));
  if (!watch.length) return null;
  return (
    <Card title={v3("marginList")}>
      <ul>
        {watch.slice(0, 8).map((row) => <li key={row.id} className="c3-pad"><Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || row.id}</Link></li>)}
      </ul>
    </Card>
  );
}

export function MarketDesk() {
  const v3 = useV3();
  const users = useJson<{ users?: (LeadRow & { id: string })[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const aff = useJson<{ rows?: { name?: string; leads?: number; deposits?: number }[] }>("/api/admin/analytics/affiliates?period=month");
  const rows = users.data?.users || [];
  const stats = campaignStats(rows);
  const trend = sourceTrend(rows).slice(-7);
  const ranked = rankAffiliates(aff.data?.rows || []);
  const [spend, setSpend] = useLocal<Record<string, number>>("crmv3-campaign-spend", {});
  const [rule, setRule] = useLocal<SegmentRule>("crmv3-segments", { name: "", field: "country", value: "" });
  const [sms, setSms] = useLocal<string>("crmv3-sms-preview", "");
  const [aid, setAid] = useState("");
  const [msg, setMsg] = useState("");
  const matched = rows.filter((row) => rule.value && segmentHit(row, rule));
  const link = aid ? `/register?aid=${encodeURIComponent(aid)}` : "";
  const parts = smsParts(sms);
  return (
    <div className="c3-stack">
      <Card title={v3("campaignsWord")}>
        <p className="c3-muted c3-pad">{v3("pageOnly")}</p>
        <ul>
          {stats.map((row) => (
            <li key={row.campaign} className="c3-pad">
              {row.campaign} · {row.leads} · {v3("fundedCount")} {row.ftd} · {row.balance}
              <div className="c3-muted">{v3("cplWord")} {cpl(spend[row.campaign] || 0, row.leads) ?? "—"} · {v3("cpaWord")} {cpa(spend[row.campaign] || 0, row.ftd) ?? "—"}</div>
              <input className="c3-field" inputMode="decimal" aria-label={v3("costWord")} value={spend[row.campaign] ? String(spend[row.campaign]) : ""} onChange={(event) => setSpend({ ...spend, [row.campaign]: Number(event.target.value) || 0 })} />
            </li>
          ))}
        </ul>
        <p className="c3-muted c3-pad">{v3("spendHint")}</p>
        <p className="c3-kicker c3-pad">{v3("trendWord")}</p>
        <ul>{trend.map((row) => <li key={row.day} className="c3-pad">{row.day} · {row.count}</li>)}</ul>
      </Card>
      <Card title={v3("segmentName")}>
        <div className="c3-form c3-form-2 c3-pad">
          <input className="c3-field" aria-label={v3("segmentName")} value={rule.name} onChange={(event) => setRule({ ...rule, name: event.target.value })} />
          <select className="c3-select" aria-label={v3("segmentName")} value={rule.field} onChange={(event) => setRule({ ...rule, field: event.target.value as SegmentRule["field"] })}>
            <option value="country">country</option>
            <option value="campaign">campaign</option>
            <option value="sale">sale</option>
            <option value="ftd">ftd</option>
          </select>
          <input className="c3-field" aria-label={v3("segmentSize")} value={rule.value} onChange={(event) => setRule({ ...rule, value: event.target.value })} />
          <p className="c3-muted">{v3("segmentSize")} {rule.value ? matched.length : "—"}</p>
          <p className="c3-muted">{v3("segmentHint")}</p>
          <button type="button" className="c3-btn" onClick={() => downloadCsv("segment.csv", ["name", "email", "country", "campaign"], matched.map((row) => [String(row.name || ""), String(row.email || ""), String(row.country || ""), String(row.campaign || "")]))}>{v3("exportSegment")}</button>
        </div>
      </Card>
      <Card title={v3("rankWord")}>
        <p className="c3-muted c3-pad">{v3("rankHint")}</p>
        <ul>{ranked.slice(0, 8).map((row) => <li key={row.name} className="c3-pad">{row.name} · {row.leads ?? 0} · {row.deposits ?? 0}</li>)}</ul>
        <div className="c3-form c3-pad">
          <Lab label={v3("affLink")}><input className="c3-field" value={aid} onChange={(event) => setAid(event.target.value)} /></Lab>
          {link && <p className="c3-muted">{link}</p>}
          <button type="button" className="c3-btn" disabled={!link} onClick={() => { void navigator.clipboard.writeText(link); setMsg(v3("copiedLink")); }}>{v3("copyLink")}</button>
          <p className="c3-muted">{v3("linkHint")}</p>
          <Msg text={msg} />
        </div>
      </Card>
      <Card title={v3("smsPreview")}>
        <textarea className="c3-field" rows={3} aria-label={v3("smsPreview")} value={sms} onChange={(event) => setSms(event.target.value)} />
        <p className="c3-muted c3-pad">{v3("smsCount")} {parts.parts} · {parts.length}</p>
        <p className="c3-muted c3-pad">{v3("smsHint")}</p>
        <button type="button" className="c3-btn" onClick={() => window.print()}>{v3("printDigest")}</button>
      </Card>
      <Card title={v3("mailHint")}>
        <p className="c3-muted c3-pad">{v3("mailHint")}</p>
      </Card>
      {stats[0] && (
        <Card title={v3("funnelLeads")}>
          <ul>{campaignFunnel(rows, stats[0].campaign).map((row) => <li key={row.status} className="c3-pad">{row.status} · {row.count}</li>)}</ul>
        </Card>
      )}
    </div>
  );
}

export function TaskDesk({ locale, tx }: { locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ reminders?: { id: string; body?: string; remindAt?: string }[] }>("/api/admin/calendar?take=80");
  const [dueOnly, setDueOnly] = useState(false);
  const [msg, setMsg] = useState("");
  const [holidays, setHolidays] = useLocal<string>("crmv3-holidays", "");
  const rows = data.data?.reminders || [];
  const today = new Date().toISOString().slice(0, 10);
  const shown = dueOnly ? rows.filter((row) => String(row.remindAt || "").slice(0, 10) === today) : rows;
  const count = dueToday(rows);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      if (event.key === "d") setDueOnly((on) => !on);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function snooze(id: string, body: string, preset: "15m" | "tomorrow") {
    const remindAt = snoozeUntil(preset);
    const created = await sendJson("/api/admin/calendar", "POST", { body, remindAt });
    if (!created.ok) { setMsg(created.error || tx("failed")); return; }
    const removed = await sendJson("/api/admin/calendar", "POST", { action: "delete", id });
    setMsg(removed.ok ? tx("saved") : removed.error || tx("failed"));
    if (removed.ok) data.reload();
  }

  return (
    <Card title={v3("taskDesk")}>
      <div id="c3-tasks" className="c3-pad c3-stack">
        <p aria-live="polite">{v3("dueAnnounce")} {count}</p>
        <p className="c3-muted">{v3("recurHint")}</p>
        <div className="c3-tools">
          <button type="button" className="c3-chip" data-on={dueOnly ? "1" : "0"} onClick={() => setDueOnly((on) => !on)}>{v3("dueOnly")}</button>
          <button type="button" className="c3-btn" onClick={() => {
            const file = new Blob([toIcs(rows)], { type: "text/calendar" });
            const url = URL.createObjectURL(file);
            const a = document.createElement("a");
            a.href = url;
            a.download = "reminders.ics";
            a.click();
            URL.revokeObjectURL(url);
          }}>{v3("icsFile")}</button>
        </div>
        <p className="c3-muted">{v3("icsHint")}</p>
        {!shown.length && <p className="c3-muted">{v3("taskEmpty")}</p>}
        <ul>
          {shown.map((row) => (
            <li key={row.id} className="c3-pad">
              <div>{row.body}</div>
              <div className="c3-muted">{when(row.remindAt, locale)}</div>
              <div className="c3-row">
                <button type="button" className="c3-btn" onClick={() => void snooze(row.id, row.body || v3("taskDesk"), "15m")}>{v3("snooze15")}</button>
                <button type="button" className="c3-btn" onClick={() => void snooze(row.id, row.body || v3("taskDesk"), "tomorrow")}>{v3("snoozeMorning")}</button>
              </div>
            </li>
          ))}
        </ul>
        <p className="c3-muted">{v3("snoozeLocal")}</p>
        <form className="c3-form" onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const res = await sendJson("/api/admin/calendar", "POST", { body: fd.get("body"), remindAt: new Date(Date.now() + 3600000).toISOString() });
          setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
          if (res.ok) data.reload();
        }}>
          <Lab label={v3("taskTemplate")}>
            <select name="body" className="c3-select" aria-label={v3("taskTemplate")}>
              <option value={v3("templateCall")}>{v3("templateCall")}</option>
              <option value={v3("templateKyc")}>{v3("templateKyc")}</option>
            </select>
          </Lab>
          <button type="submit" className="c3-btn">{v3("makeNext")}</button>
          <p className="c3-muted">{v3("templateHint")}</p>
        </form>
        <Lab label={v3("holidayList")}>
          <input className="c3-field" aria-label={v3("holidayList")} value={holidays} onChange={(event) => setHolidays(event.target.value)} placeholder="2026-01-01" />
        </Lab>
        <p className="c3-muted">{v3("holidayHint")}</p>
        <Msg text={msg} />
      </div>
    </Card>
  );
}

export function TicketExtras({ rows }: { rows: { id: string; kind: string; openedAt?: string; status?: string; customer?: string }[] }) {
  const v3 = useV3();
  const [hours, setHours] = useLocal<number>("crmv3-sla-hours", 24);
  const [priority, setPriority] = useLocal<Record<string, string>>("crmv3-ticket-priority", {});
  const [csat, setCsat] = useLocal<Record<string, number>>("crmv3-csat", {});
  const [words, setWords] = useLocal<{ word: string; label: string }[]>("crmv3-keywords", [{ word: "kyc", label: "kyc" }]);
  const [assign, setAssign] = useLocal<Record<string, string>>("crmv3-ticket-assign", {});
  const [unassigned, setUnassigned] = useState(false);
  const [word, setWord] = useState("");
  const shown = unassigned ? rows.filter((row) => !assign[`${row.kind}-${row.id}`]) : rows;
  return (
    <div className="c3-stack">
      <div className="c3-tools">
        <label className="c3-lab">
          <span>{v3("slaLimit")}</span>
          <input className="c3-field" inputMode="numeric" aria-label={v3("slaLimit")} value={String(hours)} onChange={(event) => setHours(Math.max(1, Number(event.target.value) || 1))} />
        </label>
        <button type="button" className="c3-chip" data-on={unassigned ? "1" : "0"} onClick={() => setUnassigned((on) => !on)}>{v3("unassignedOnly")}</button>
      </div>
      <p className="c3-muted c3-pad">{v3("unassignedHint")}</p>
      <ul>
        {shown.map((row) => {
          const key = `${row.kind}-${row.id}`;
          const left = slaLeft(row.openedAt, hours);
          const age = ageHours(row.openedAt);
          const label = categorize(`${row.customer || ""} ${row.kind}`, words);
          return (
            <li key={key} className="c3-feed" data-kind={row.status === "REJECTED" ? "status" : row.status === "APPROVED" ? "money" : "call"}>
              <div className="c3-row c3-between">
                <span>{row.customer || "—"} · {row.kind}</span>
                <span className="c3-status" data-tone={left != null && left < 0 ? "bad" : "warn"}>{left != null && left < 0 ? v3("overSla") : `${v3("slaLeft")} ${left ?? "—"}`}</span>
              </div>
              <p className="c3-muted">{v3("ticketHours")} {age ?? "—"} {label ? `· ${label}` : ""}</p>
              <div className="c3-row">
                <select className="c3-select" aria-label={v3("priorityWord")} value={priority[key] || ""} onChange={(event) => setPriority({ ...priority, [key]: event.target.value })}>
                  <option value="">{v3("priorityWord")}</option>
                  <option value="high">{v3("priorityHigh")}</option>
                  <option value="low">{v3("priorityLow")}</option>
                </select>
                <select className="c3-select" aria-label={v3("csatWord")} value={csat[key] ? String(csat[key]) : ""} onChange={(event) => setCsat({ ...csat, [key]: Number(event.target.value) || 0 })}>
                  <option value="">{v3("csatWord")}</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <input className="c3-field" aria-label={v3("ticketAssign")} placeholder={v3("ticketAssign")} value={assign[key] || ""} onChange={(event) => setAssign({ ...assign, [key]: event.target.value })} />
              </div>
            </li>
          );
        })}
      </ul>
      {!shown.length && <p className="c3-muted c3-pad">{v3("ticketEmpty")}</p>}
      <form className="c3-tools" onSubmit={(event) => { event.preventDefault(); if (!word.trim()) return; setWords([...words, { word: word.trim(), label: word.trim() }]); setWord(""); }}>
        <input className="c3-field" aria-label={v3("keywordRule")} value={word} onChange={(event) => setWord(event.target.value)} />
        <button type="submit" className="c3-btn">{v3("keywordWord")}</button>
      </form>
    </div>
  );
}

export function AuditBits({ detail }: { detail: unknown }) {
  const v3 = useV3();
  const parsed = useMemo(() => {
    if (detail && typeof detail === "object") return detail;
    if (typeof detail === "string") {
      try { return JSON.parse(detail) as unknown; } catch { return detail; }
    }
    return detail;
  }, [detail]);
  const changes = changedKeys(parsed);
  const pairs = detailPairs(parsed);
  if (!changes.length && !pairs.length) return <p className="c3-muted">{v3("auditNone")}</p>;
  return (
    <div>
      {changes.map((row) => <p key={row.key} className="c3-muted">{row.key}: {row.before} → {row.after}</p>)}
      {!changes.length && pairs.slice(0, 6).map((row) => <p key={row.key} className="c3-muted">{row.key}: {row.value}</p>)}
    </div>
  );
}

export function AnomalyList({ rows }: { rows: { actor?: string; detail?: unknown }[] }) {
  const v3 = useV3();
  const mapped = rows.map((row) => {
    let ip = "";
    const detail = row.detail;
    if (typeof detail === "string") {
      try { ip = String((JSON.parse(detail) as { ip?: string }).ip || ""); } catch { ip = ""; }
    } else if (detail && typeof detail === "object" && "ip" in detail) ip = String((detail as { ip?: string }).ip || "");
    return { actor: row.actor, ip };
  });
  const found = anomalyRows(mapped);
  return (
    <Card title={v3("anomalyWord")}>
      <p className="c3-muted c3-pad">{v3("anomalyHint")}</p>
      {!found.length && <p className="c3-muted c3-pad">{v3("anomalyNone")}</p>}
      <ul>{found.map((row) => <li key={row.actor} className="c3-pad">{row.actor} · {row.ips.join(", ")}</li>)}</ul>
    </Card>
  );
}

export function ProfileBits({ user }: { user: UserRow }) {
  const v3 = useV3();
  const done = completeness(user);
  const journey = journeyOf({ createdAt: user.createdAt, documentsStatus: user.documentsStatus, ftd: user.ftd, trades: 0, withdrawals: 0 });
  const margin = marginLevel(user.equity ?? user.account?.equity, null);
  const steps: Record<string, string> = { signup: v3("stepSignup"), kyc: v3("stepKyc"), ftd: v3("stepFtd"), trades: v3("stepTrades"), cashout: v3("stepCash") };
  return (
    <div className="c3-stack">
      <p className="c3-muted">{v3("completeWord")} {done.score}%</p>
      <div className="c3-meter" aria-hidden><span style={{ width: `${done.score}%` }} /></div>
      {done.missing.length > 0 && <p className="c3-muted">{v3("missingBits")}: {done.missing.join(", ")}</p>}
      <p className="c3-muted">{v3("journeyWord")}: {journey.map((step) => `${steps[step.key] || step.key} ${step.done ? "●" : "○"}`).join(" · ")}</p>
      <p className="c3-muted">{v3("marginWord")} {margin == null ? "—" : `${margin}%`} · {v3("marginHint")}</p>
      <p className="c3-muted">{v3("riskWord")} {rowRisk(user)} · {v3("healthWord")} {rowHealth(user)}</p>
    </div>
  );
}

export function NoteTools({ notes, locale }: { notes: { id: string; body?: string | null; authorName?: string | null; createdAt?: string | null }[]; locale: string }) {
  const v3 = useV3();
  const [newest, setNewest] = useState(true);
  const [marks, setMarks] = useLocal<Record<string, string>>("crmv3-note-marks", {});
  const ordered = orderNotes(notes, newest);
  const groups = groupByAuthor(ordered);
  return (
    <div>
      <div className="c3-tools">
        <button type="button" className="c3-chip" data-on={newest ? "1" : "0"} onClick={() => setNewest((on) => !on)}>{v3("newestFirst")}</button>
        <button type="button" className="c3-btn" onClick={() => downloadCsv("notes.csv", ["author", "body", "at"], ordered.map((row) => [String(row.authorName || ""), String(row.body || ""), String(row.createdAt || "")]))}>{v3("exportNotes")}</button>
      </div>
      <ul>
        {groups.map((group) => (
          <li key={group.author} className="c3-pad">
            <strong>{group.author}</strong>
            <ul>
              {group.rows.map((row) => (
                <li key={row.id}>
                  <div>{row.body}</div>
                  <div className="c3-muted">{when(row.createdAt, locale)}</div>
                  <button type="button" className="c3-btn" data-on={marks[row.id] ? "1" : "0"} onClick={() => setMarks({ ...marks, [row.id]: marks[row.id] ? "" : "1" })}>{v3("markNote")}</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function noteBlocked(body: string, notes: { body?: string | null }[]) {
  return noteDuplicate(body, notes);
}

export function DocTools({ rows }: { rows: { id: string; docType?: string; status?: string }[] }) {
  const v3 = useV3();
  const counts = docCounts(rows);
  const [type, setType] = useState("");
  const [chase, setChase] = useLocal<Record<string, string>>("crmv3-doc-chase", {});
  const [tags, setTags] = useLocal<Record<string, string>>("crmv3-doc-tags", {});
  const shown = type ? rows.filter((row) => String(row.docType || "") === type) : rows;
  const types = Array.from(new Set(rows.map((row) => row.docType).filter(Boolean))) as string[];
  return (
    <div>
      <div className="c3-kpis">
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("docPending")}</p><p className="c3-kpi-value">{counts.pending}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("docApproved")}</p><p className="c3-kpi-value">{counts.approved}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("docRejected")}</p><p className="c3-kpi-value">{counts.rejected}</p></div>
      </div>
      <div className="c3-tools">
        <button type="button" className="c3-chip" data-on={type === "" ? "1" : "0"} onClick={() => setType("")}>{v3("typeAll")}</button>
        {types.map((item) => <button key={item} type="button" className="c3-chip" data-on={type === item ? "1" : "0"} onClick={() => setType(item)}>{item}</button>)}
      </div>
      {!shown.length && <p className="c3-muted c3-pad">{v3("filesEmpty")}</p>}
      <ul>
        {shown.map((row) => (
          <li key={row.id} className="c3-pad">
            <label className="c3-lab"><span>{v3("chaseBy")}</span><input className="c3-field" type="date" aria-label={v3("chaseBy")} value={chase[row.id] || ""} onChange={(event) => setChase({ ...chase, [row.id]: event.target.value })} /></label>
            <label className="c3-lab"><span>{v3("docTag")}</span><input className="c3-field" aria-label={v3("docTag")} value={tags[row.id] || ""} onChange={(event) => setTags({ ...tags, [row.id]: event.target.value })} /></label>
          </li>
        ))}
      </ul>
      <p className="c3-muted c3-pad">{v3("chaseLocal")} · {v3("tagLocal")}</p>
    </div>
  );
}

export function AssignPreview({ rows }: { rows: UserRow[] }) {
  const v3 = useV3();
  const [rules, setRules] = useLocal<AssignRule[]>("crmv3-assign-rules", []);
  const [country, setCountry] = useState("");
  const [desk, setDesk] = useState("");
  return (
    <Card title={v3("assignPreview")}>
      <p className="c3-muted c3-pad">{v3("assignRule")}</p>
      <form className="c3-tools" onSubmit={(event) => { event.preventDefault(); if (!country || !desk) return; setRules([...rules, { country, desk }]); setCountry(""); setDesk(""); }}>
        <input className="c3-field" aria-label={v3("assignRule")} value={country} onChange={(event) => setCountry(event.target.value)} />
        <input className="c3-field" aria-label={v3("deskBoard")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        <button type="submit" className="c3-btn">{v3("previewOnly")}</button>
      </form>
      <ul>
        {rows.slice(0, 6).map((row) => {
          const hit = rules.find((rule) => rule.country.toLowerCase() === String(row.country || "").toLowerCase());
          return <li key={row.id} className="c3-pad">{row.name || row.email} · {hit ? hit.desk : row.desk || "—"}</li>;
        })}
      </ul>
    </Card>
  );
}
