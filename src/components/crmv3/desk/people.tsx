"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { manyWithdrawals, missingKyc, rapidDeposits } from "@/lib/crmv3/watch";
import {
  ALERT_DEFAULTS,
  followAlerts,
  largeAlerts,
  lastStamp,
  quietAlerts,
  sameCurrencyHigher,
  slaAlerts,
  visibleAlerts,
  type AlertRule,
  type AlertSettings,
} from "@/lib/crmv3/alerts";
import { cohortOf, filterQuery, gaps, onboardSteps, weekKey, type StaffPrefs } from "@/lib/crmv3/cohort";
import { byCurrency } from "@/lib/crmv3/statement";
import { readJson, stageFor, writeJson } from "@/lib/crmv3/bridge";
import { crmv3Href } from "@/lib/crmv3/sections";
import { crmv2Text, type CrmV2CopyKey } from "@/lib/crmv2/copy";
import { money, useJson, when, type UserRow } from "../kit";
import { useV3 } from "./store";

const RULE_KEY = "crmv3-alert-rules";
const FOLLOW_KEY = "crmv3-lead-follow";
const HEAT_KEY = "crmv3-lead-heat";
const STAGE_KEY = "crmv3-lead-stage";
const CALL_KEY = "crmv3-call-log";
const PREF_KEY = "crmv3-staff-prefs";
const DENSE_KEY = "crmv3-list-state:customers";
const RULES: AlertRule[] = ["large", "sla", "follow", "watch", "quiet"];
const LABEL = {
  large: "alertLarge",
  sla: "alertSla",
  follow: "alertFollow",
  watch: "alertWatch",
  quiet: "alertQuiet",
} as const;
const STEP_LABEL = {
  registered: "stepRegistered",
  kyc: "stepKycDone",
  firstDeposit: "stepFirstDeposit",
  firstTrade: "stepFirstTrade",
  secondDeposit: "stepSecondDeposit",
} as const;
const TABS = ["overview", "customers", "finance", "positions", "support"] as const;
const EMPTY: StaffPrefs = { displayName: "", defaultTab: "overview", filters: "", start: "09:00", end: "18:00" };
const LIST_COLUMNS = ["customer", "country", "desk", "sale", "retention", "balance", "status"];

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function AlertCenter({ base }: { base: string }) {
  const v3 = useV3();
  const people = useJson<{ users?: { id: string; name?: string | null; email?: string | null; documentsStatus?: string | null; createdAt?: string | null; retentionFollowUpAt?: string | null }[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: { id: string; amount?: number | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null } | null }[] }>("/api/admin/deposits?take=80");
  const withdrawals = useJson<{ requests?: { id: string; amount?: number | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null } | null }[] }>("/api/admin/withdrawals?take=80");
  const tickets = useJson<{ tickets?: { id: string; customer?: string | null; openedAt?: string | null; status?: string | null }[] }>("/api/admin/tickets");
  const [settings, setSettings] = useState<AlertSettings>(ALERT_DEFAULTS);
  const [followMap, setFollowMap] = useState<Record<string, string>>({});
  const [rule, setRule] = useState<"" | AlertRule>("");
  useEffect(() => {
    setSettings({ ...ALERT_DEFAULTS, ...readJson<Partial<AlertSettings>>(RULE_KEY, {}) });
    setFollowMap(readJson(FOLLOW_KEY, {}));
  }, []);
  function save(next: AlertSettings) {
    setSettings(next);
    writeJson(RULE_KEY, next);
  }
  const users = people.data?.users || [];
  const deps = deposits.data?.requests || [];
  const watch = [
    ...missingKyc(users).map((row) => ({ id: `watch:${row.id}`, rule: "watch" as const, name: row.name, detail: row.detail, userId: row.userId })),
    ...rapidDeposits(deps).map((row) => ({ id: `watch-rapid:${row.id}`, rule: "watch" as const, name: row.name, detail: row.detail, userId: row.userId })),
    ...manyWithdrawals(withdrawals.data?.requests || []).map((row) => ({ id: `watch-wd:${row.id}`, rule: "watch" as const, name: row.name, detail: row.detail, userId: row.userId })),
  ];
  const hits = visibleAlerts([
    ...largeAlerts(deps, settings.largeAt),
    ...slaAlerts(tickets.data?.tickets || [], settings.slaHours),
    ...followAlerts(users.map((row) => ({ id: row.id, name: row.name, follow: followMap[row.id] || row.retentionFollowUpAt || "" })), todayStamp()),
    ...watch,
    ...quietAlerts(users, deps),
  ], settings).filter((hit) => !rule || hit.rule === rule);
  return (
    <section className="c3-card" aria-label={v3("alertCenter")}>
      <div className="c3-kpis">
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("alertCenter")}</p><p className="c3-kpi-value">{hits.length}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("alertOn")}</p><p className="c3-kpi-value">{RULES.filter((item) => settings[item]).length}</p></div>
      </div>
      <p className="c3-muted c3-pad">{v3("alertHint")}</p>
      <div className="c3-tools">
        {RULES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={settings[item] ? "1" : "0"} onClick={() => save({ ...settings, [item]: !settings[item] })}>{v3(LABEL[item])}</button>
        ))}
      </div>
      <div className="c3-tools">
        <button type="button" className="c3-chip" data-on={rule === "" ? "1" : "0"} onClick={() => setRule("")}>{v3("alertOn")}</button>
        {RULES.map((item) => (
          <button key={`f-${item}`} type="button" className="c3-chip" data-on={rule === item ? "1" : "0"} onClick={() => setRule(item)}>{v3(LABEL[item])}</button>
        ))}
      </div>
      <div className="c3-tools">
        <label className="c3-lab"><span>{v3("alertLargeAt")}</span><input className="c3-field" inputMode="numeric" aria-label={v3("alertLargeAt")} value={String(settings.largeAt)} onChange={(event) => save({ ...settings, largeAt: Number(event.target.value) || 0 })} /></label>
        <label className="c3-lab"><span>{v3("alertSlaHours")}</span><input className="c3-field" inputMode="numeric" aria-label={v3("alertSlaHours")} value={String(settings.slaHours)} onChange={(event) => save({ ...settings, slaHours: Number(event.target.value) || 0 })} /></label>
      </div>
      <ul className="c3-alert-list">
        {hits.map((hit) => (
          <li key={hit.id} className="c3-feed" data-rule={hit.rule}>
            <strong>{v3(LABEL[hit.rule])}</strong>
            {hit.userId ? <Link href={crmv3Href(base, `customers/${hit.userId}`)}>{hit.name}</Link> : <span>{hit.name}</span>}
            <span className="c3-muted">{hit.detail}</span>
            <button type="button" className="c3-btn" onClick={() => save({ ...settings, muted: [...settings.muted, hit.id] })}>{v3("alertMute")}</button>
          </li>
        ))}
      </ul>
      {!hits.length && <p className="c3-empty" role="status">{v3("alertEmpty")}</p>}
    </section>
  );
}

type Cash = { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null };

export function CompareDesk({ rows, base, locale }: { rows: UserRow[]; base: string; locale: string }) {
  const v3 = useV3();
  const picked = rows.slice(0, 3);
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?take=80");
  const withdrawals = useJson<{ requests?: Cash[] }>("/api/admin/withdrawals?take=80");
  const [stages, setStages] = useState<Record<string, string>>({});
  const [heat, setHeat] = useState<Record<string, string>>({});
  const [calls, setCalls] = useState<Record<string, { at?: string }[]>>({});
  useEffect(() => {
    setStages(readJson(STAGE_KEY, {}));
    setHeat(readJson(HEAT_KEY, {}));
    setCalls(readJson(CALL_KEY, {}));
  }, []);
  if (picked.length < 2) return null;
  const higher = sameCurrencyHigher(picked);
  return (
    <section className="c3-card" aria-label={v3("compareDesk")}>
      <h3 className="c3-title c3-pad">{v3("compareDesk")}</h3>
      <p className="c3-muted c3-pad">{v3("compareHint")}</p>
      <p className="c3-muted c3-pad c3-phone-only">{v3("compareSwipe")}</p>
      <div className="c3-compare-row">
        {picked.map((row) => {
          const id = row.id;
          const mine = (list: Cash[]) => list.filter((item) => String(item.user?.id || item.userId || "") === id);
          const deps = mine(deposits.data?.requests || []);
          const wds = mine(withdrawals.data?.requests || []);
          const stage = stageFor({ id, saleStatus: row.saleStatus }, stages);
          const last = lastStamp([
            (row as UserRow & { lastContactAt?: string | null }).lastContactAt,
            ...(calls[id] || []).map((item) => item.at),
          ]);
          return (
            <CompareCard
              key={id}
              row={row}
              base={base}
              locale={locale}
              higher={higher === id}
              stage={stage}
              heat={heat[id] || "—"}
              last={last}
              deposits={deps}
              withdrawals={wds}
            />
          );
        })}
      </div>
    </section>
  );
}

function CompareCard({ row, base, locale, higher, stage, heat, last, deposits, withdrawals }: {
  row: UserRow;
  base: string;
  locale: string;
  higher: boolean;
  stage: string;
  heat: string;
  last: string;
  deposits: Cash[];
  withdrawals: Cash[];
}) {
  const v3 = useV3();
  const book = useJson<{ positions?: { id: string }[] }>(`/api/admin/users/${encodeURIComponent(row.id)}?view=positions&take=20`);
  const positions = book.data?.positions || [];
  return (
    <article className="c3-compare-card" data-top={higher ? "1" : "0"}>
      <h4><Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || row.email || row.id}</Link></h4>
      {higher && <span className="c3-status" data-tone="ok">{v3("compareHigher")}</span>}
      <p>{v3("compareBalance")} {money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</p>
      <p>{v3("compareCash")} {byCurrency([...deposits, ...withdrawals]).map((item) => `${item.currency} ${item.total}`).join(" · ") || "—"}</p>
      <p>{v3("comparePositions")} {positions.length}</p>
      <p>{v3("compareStage")} {stage}</p>
      <p>{v3("compareHeat")} {heat}</p>
      <p>{v3("compareLast")} {last ? when(last, locale) : "—"}</p>
    </article>
  );
}

export function OnboardCard({ id, email, createdAt, documentsStatus, locale }: {
  id: string;
  email: string;
  createdAt?: string | null;
  documentsStatus?: string | null;
  locale: string;
}) {
  const v3 = useV3();
  const deposits = useJson<{ requests?: { createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null }[] }>(email ? `/api/admin/deposits?take=80&q=${encodeURIComponent(email)}` : null);
  const book = useJson<{ positions?: { openedAt?: string | null }[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=30`);
  const mine = (deposits.data?.requests || []).filter((row) => String(row.user?.id || row.userId || "") === id);
  const steps = onboardSteps({ createdAt, documentsStatus, deposits: mine, trades: book.data?.positions || [] });
  const spans = gaps(steps);
  const done = steps.filter((step) => step.done).length;
  return (
    <section className="c3-card" aria-label={v3("onboardCard")}>
      <h3 className="c3-title c3-pad">{v3("onboardCard")}</h3>
      <p className="c3-muted c3-pad">{v3("onboardHint")}</p>
      <div className="c3-meter" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label={v3("onboardCard")}>
        <span style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%` }} />
      </div>
      <ol className="c3-alert-list">
        {steps.map((step) => (
          <li key={step.key} className="c3-feed" data-done={step.done ? "1" : "0"}>
            <strong>{v3(STEP_LABEL[step.key])}</strong>
            <span className="c3-muted">{step.done ? (step.at ? when(step.at, locale) : v3("stepNoDate")) : v3("stepOpen")}</span>
          </li>
        ))}
      </ol>
      <ul className="c3-alert-list">
        {spans.map((span) => (
          <li key={`${span.from}-${span.to}`} className="c3-row c3-pad">
            <span>{v3(STEP_LABEL[span.from])}</span>
            <span aria-hidden="true">·</span>
            <span>{v3(STEP_LABEL[span.to])}</span>
            <span className="c3-muted">{span.days == null ? v3("stepNoDate") : `${span.days} ${v3("stepDays")}`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CohortBoard() {
  const v3 = useV3();
  const people = useJson<{ users?: { id: string; createdAt?: string | null; documentsStatus?: string | null; ftd?: boolean | null }[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: { createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null }[] }>("/api/admin/deposits?take=80");
  const book = useJson<{ positions?: { userId?: string | null }[] }>("/api/admin/positions?status=ALL&take=80");
  const depositCount = new Map<string, number>();
  for (const row of deposits.data?.requests || []) {
    const id = String(row.user?.id || row.userId || "");
    if (id) depositCount.set(id, (depositCount.get(id) || 0) + 1);
  }
  const traded = new Set((book.data?.positions || []).map((row) => String(row.userId || "")).filter(Boolean));
  const rows = (people.data?.users || []).map((user) => ({
    week: weekKey(user.createdAt),
    kyc: String(user.documentsStatus || "").toUpperCase() === "APPROVED",
    ftd: Boolean(user.ftd) || (depositCount.get(user.id) || 0) >= 1,
    traded: traded.has(user.id),
    second: (depositCount.get(user.id) || 0) >= 2,
  })).filter((row) => row.week);
  const weeks = cohortOf(rows);
  return (
    <section className="c3-card" aria-label={v3("cohortTitle")}>
      <h3 className="c3-title c3-pad">{v3("cohortTitle")}</h3>
      <p className="c3-muted c3-pad">{v3("cohortHint")}</p>
      {!weeks.length && <p className="c3-empty" role="status">{v3("cohortEmpty")}</p>}
      <ul className="c3-alert-list">
        {weeks.map((week) => (
          <li key={week.week} className="c3-feed">
            <strong>{week.week}</strong>
            <span>{v3("stepRegistered")} {week.registered}</span>
            <span>{v3("stepKycDone")} {week.kyc}</span>
            <span>{v3("stepFirstDeposit")} {week.ftd}</span>
            <span>{v3("stepFirstTrade")} {week.traded}</span>
            <span>{v3("stepSecondDeposit")} {week.second}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StaffPage({ signInName, base, locale }: { signInName: string; base: string; locale: string }) {
  const v3 = useV3();
  const [prefs, setPrefs] = useState<StaffPrefs>(EMPTY);
  const [density, setDensity] = useState(false);
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    setPrefs({ ...EMPTY, ...readJson<Partial<StaffPrefs>>(PREF_KEY, {}) });
    setDensity(Boolean(readJson<{ dense?: boolean }>(DENSE_KEY, {}).dense));
    setTheme(window.localStorage.getItem("crmv3-theme") || "light");
    const onTheme = () => setTheme(window.localStorage.getItem("crmv3-theme") || "light");
    window.addEventListener("crmv3:theme", onTheme);
    return () => window.removeEventListener("crmv3:theme", onTheme);
  }, []);
  function save(next: StaffPrefs) {
    setPrefs(next);
    writeJson(PREF_KEY, next);
    window.dispatchEvent(new Event("crmv3:staff-prefs"));
  }
  function tabLabel(tab: (typeof TABS)[number]) {
    if (tab === "finance") return v3("money");
    return crmv2Text(locale, tab as CrmV2CopyKey);
  }
  const filters = filterQuery(prefs.filters);
  return (
    <section className="c3-card" aria-label={v3("staffProfile")} data-staff="1">
      <h2 className="c3-title c3-pad">{v3("staffProfile")}</h2>
      <p className="c3-heading c3-pad">{prefs.displayName || signInName || "—"}</p>
      <p className="c3-muted c3-pad">{v3("signInName")} {signInName || "—"}</p>
      <p className="c3-muted c3-pad">{v3("staffHint")}</p>
      <form className="c3-form c3-pad" onSubmit={(event) => event.preventDefault()}>
        <label className="c3-lab"><span>{v3("shownName")}</span><input className="c3-field" aria-label={v3("shownName")} value={prefs.displayName} onChange={(event) => save({ ...prefs, displayName: event.target.value })} /></label>
        <label className="c3-lab"><span>{v3("defaultTab")}</span>
          <select className="c3-select" aria-label={v3("defaultTab")} value={prefs.defaultTab} onChange={(event) => save({ ...prefs, defaultTab: event.target.value })}>
            {TABS.map((tab) => <option key={tab} value={tab}>{tabLabel(tab)}</option>)}
          </select>
        </label>
        <label className="c3-lab"><span>{v3("defaultFilters")}</span><input className="c3-field" aria-label={v3("defaultFilters")} placeholder="saleStatus=NEW" value={prefs.filters} onChange={(event) => save({ ...prefs, filters: event.target.value })} /></label>
        <Link className="c3-btn" href={crmv3Href(base, prefs.defaultTab === "overview" ? "" : prefs.defaultTab)}>{v3("openTab")}</Link>
        <Link className="c3-btn" href={crmv3Href(base, "customers", filters)}>{v3("openFilters")}</Link>
        <label className="c3-lab"><span>{v3("workStart")}</span><input className="c3-field" type="time" aria-label={v3("workStart")} value={prefs.start} onChange={(event) => save({ ...prefs, start: event.target.value })} /></label>
        <label className="c3-lab"><span>{v3("workEnd")}</span><input className="c3-field" type="time" aria-label={v3("workEnd")} value={prefs.end} onChange={(event) => save({ ...prefs, end: event.target.value })} /></label>
        <p className="c3-muted">{v3("workHint")} {prefs.start}–{prefs.end}</p>
        <div className="c3-tools">
          <button type="button" className="c3-chip" data-on={density ? "1" : "0"} onClick={() => {
            const next = !density;
            const current = readJson<{ columns?: string[]; dense?: boolean }>(DENSE_KEY, {});
            writeJson(DENSE_KEY, { columns: current.columns?.length ? current.columns : LIST_COLUMNS, dense: next });
            setDensity(next);
          }}>{v3("densityHere")}</button>
          <button type="button" className="c3-chip" data-on={theme === "dark" ? "1" : "0"} onClick={() => {
            const next = theme === "dark" ? "light" : "dark";
            setTheme(next);
            window.localStorage.setItem("crmv3-theme", next);
            window.dispatchEvent(new Event("crmv3:theme"));
          }}>{v3("themeHere")}</button>
          <LanguageSwitcher compact tone={theme === "dark" ? "dark" : "crm"} />
          <span className="c3-muted">{locale}</span>
        </div>
        <button type="button" className="c3-btn" onClick={() => { writeJson(PREF_KEY, EMPTY); setPrefs(EMPTY); window.dispatchEvent(new Event("crmv3:staff-prefs")); }}>{v3("resetPrefs")}</button>
      </form>
    </section>
  );
}
