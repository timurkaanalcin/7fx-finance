"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { crmv2Text, type CrmV2CopyKey } from "@/lib/crmv2/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { cohortOf, filterQuery, gaps, onboardSteps, weekKey, type StaffPrefs } from "@/lib/crmv4/round24";
import { crmv4Href } from "@/lib/crmv4/sections";
import { densityMode, storeDensity } from "./round2";
import { useJson, when } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const PREF_KEY = "crmv4-staff-prefs";
const TABS = ["overview", "customers", "finance", "positions", "support"] as const;
const EMPTY: StaffPrefs = { displayName: "", defaultTab: "overview", filters: "", start: "09:00", end: "18:00" };

const STEP_LABEL: Record<string, CrmV4CopyKey> = {
  registered: "stepRegistered",
  kyc: "stepKycDone",
  firstDeposit: "stepFirstDeposit",
  firstTrade: "stepFirstTrade",
  secondDeposit: "stepSecondDeposit",
};

export function OnboardCard({ id, email, createdAt, documentsStatus, v4, locale }: {
  id: string;
  email: string;
  createdAt?: string | null;
  documentsStatus?: string | null;
  v4: V4;
  locale: string;
}) {
  const deposits = useJson<{ requests?: { createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null }[] }>(email ? `/api/admin/deposits?take=80&q=${encodeURIComponent(email)}` : null);
  const book = useJson<{ positions?: { openedAt?: string | null }[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=30`);
  const mine = (deposits.data?.requests || []).filter((row) => String(row.user?.id || row.userId || "") === id);
  const steps = onboardSteps({ createdAt, documentsStatus, deposits: mine, trades: book.data?.positions || [] });
  const spans = gaps(steps);
  const done = steps.filter((step) => step.done).length;
  return (
    <section className="c4-onboard-luxe" aria-label={v4("onboardCard")}>
      <h3 className="c4-title">{v4("onboardCard")}</h3>
      <p className="c4-muted">{v4("onboardHint")}</p>
      <div className="c4-onboard-meter" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label={v4("onboardCard")}>
        <span style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%` }} />
      </div>
      <ol className="c4-onboard-steps">
        {steps.map((step) => (
          <li key={step.key} data-done={step.done ? "1" : "0"}>
            <strong>{v4(STEP_LABEL[step.key])}</strong>
            <span>{step.done ? (step.at ? when(step.at, locale) : v4("stepNoDate")) : v4("stepOpen")}</span>
          </li>
        ))}
      </ol>
      <ul className="c4-onboard-gaps">
        {spans.map((span) => (
          <li key={`${span.from}-${span.to}`}>
            <span>{v4(STEP_LABEL[span.from])}</span>
            <span aria-hidden="true">·</span>
            <span>{v4(STEP_LABEL[span.to])}</span>
            <span>{span.days == null ? v4("stepNoDate") : `${span.days} ${v4("stepDays")}`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CohortBoard({ v4 }: { v4: V4 }) {
  const people = useJson<{ users?: { id: string; createdAt?: string | null; documentsStatus?: string | null; ftd?: boolean | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: { createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null }[] }>("/api/admin/deposits?take=80");
  const book = useJson<{ positions?: { userId?: string | null; openedAt?: string | null }[] }>("/api/admin/positions?take=80");
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
  const peak = Math.max(1, ...weeks.map((week) => week.registered));
  return (
    <section className="c4-cohort-luxe c4-cohort-gallery" aria-label={v4("cohortTitle")} data-cohort="1" data-desk="gallery">
      <header className="c4-cohort-gallery-mast">
        <p className="c4-cohort-gallery-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-cohort-gallery-kicker">{v4("cohGalKicker")}</p>
          <h3 className="c4-title">{v4("cohortTitle")}</h3>
        </div>
        <ol className="c4-cohort-gallery-index" aria-label={v4("cohortTitle")}>
          <li data-tone="ivory">{v4("cohGalIvory")}</li>
          <li data-tone="ink">{v4("cohGalGraphite")}</li>
          <li data-tone="gold">{v4("cohGalChampagne")}</li>
        </ol>
      </header>
      <p className="c4-cohort-gallery-lead">{v4("cohGalLead")}</p>
      <p className="c4-muted">{v4("cohortHint")}</p>
      {!weeks.length && <p className="c4-empty-gold c4-cohort-gallery-empty">{v4("cohortEmpty")}</p>}
      {weeks.length > 0 && (
        <div className="c4-cohort-gallery-chart" aria-label={v4("cohortTitle")}>
          {weeks.slice(0, 8).map((week) => (
            <div key={week.week} className="c4-cohort-gallery-column">
              <i style={{ height: `${Math.max(18, Math.round((week.registered / peak) * 88))}px` }} />
              <span>{week.week.slice(5)}</span>
            </div>
          ))}
        </div>
      )}
      <ul className="c4-cohort-list c4-cohort-gallery-list">
        {weeks.map((week) => (
          <li key={week.week} className="c4-cohort-gallery-card">
            <strong>{week.week}</strong>
            <span>{v4("stepRegistered")} {week.registered}</span>
            <span>{v4("stepKycDone")} {week.kyc}</span>
            <span>{v4("stepFirstDeposit")} {week.ftd}</span>
            <span>{v4("stepFirstTrade")} {week.traded}</span>
            <span>{v4("stepSecondDeposit")} {week.second}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StaffPage({ signInName, base, v4, locale }: { signInName: string; base: string; v4: V4; locale: string }) {
  const [prefs, setPrefs] = useState<StaffPrefs>(EMPTY);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    setPrefs({ ...EMPTY, ...readJson<Partial<StaffPrefs>>(PREF_KEY, {}) });
    setDensity(typeof window === "undefined" ? "comfortable" : densityMode());
    setTheme(window.localStorage.getItem("crmv4-theme-mode") || "light");
    const onTheme = () => setTheme(window.localStorage.getItem("crmv4-theme-mode") || "light");
    const onDensity = () => setDensity(densityMode());
    window.addEventListener("crmv4:theme-mode", onTheme);
    window.addEventListener("crmv4:density", onDensity);
    return () => {
      window.removeEventListener("crmv4:theme-mode", onTheme);
      window.removeEventListener("crmv4:density", onDensity);
    };
  }, []);
  function save(next: StaffPrefs) {
    setPrefs(next);
    writeJson(PREF_KEY, next);
    window.dispatchEvent(new Event("crmv4:staff-prefs"));
  }
  const filters = filterQuery(prefs.filters);
  return (
    <section className="c4-staff-luxe c4-staff-salon" aria-label={v4("staffProfile")} data-staff="1" data-desk="salon">
      <header className="c4-staff-salon-mast">
        <p className="c4-staff-salon-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-staff-salon-kicker">{v4("pcrSub")}</p>
          <h2 className="c4-title c4-staff-salon-title">{v4("staffProfile")}</h2>
        </div>
        <p className="c4-staff-salon-mark" aria-hidden="true">{(prefs.displayName || signInName || "7").slice(0, 1).toUpperCase()}</p>
      </header>
      <p className="c4-staff-name">{prefs.displayName || signInName || "—"}</p>
      {!prefs.displayName && !signInName && <p className="c4-staff-salon-empty">{v4("dtyEmpty")}</p>}
      <p className="c4-muted c4-staff-sign">{v4("signInName")} {signInName || "—"}</p>
      <p className="c4-muted">{v4("staffHint")}</p>
      <div className="c4-form">
        <label className="c4-lab"><span>{v4("shownName")}</span><input className="c4-field" aria-label={v4("shownName")} value={prefs.displayName} onChange={(event) => save({ ...prefs, displayName: event.target.value })} /></label>
        <label className="c4-lab"><span>{v4("defaultTab")}</span>
          <select className="c4-select" aria-label={v4("defaultTab")} value={prefs.defaultTab} onChange={(event) => save({ ...prefs, defaultTab: event.target.value })}>
            {TABS.map((tab) => <option key={tab} value={tab}>{crmv2Text(locale, tab as CrmV2CopyKey)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("defaultFilters")}</span><input className="c4-field" aria-label={v4("defaultFilters")} placeholder="saleStatus=NEW" value={prefs.filters} onChange={(event) => save({ ...prefs, filters: event.target.value })} /></label>
        <Link className="c4-btn" href={crmv4Href(base, prefs.defaultTab === "overview" ? "" : prefs.defaultTab)}>{v4("openTab")}</Link>
        <Link className="c4-btn" href={crmv4Href(base, "customers", filters)}>{v4("openFilters")}</Link>
        <label className="c4-lab"><span>{v4("workStart")}</span><input className="c4-field" type="time" aria-label={v4("workStart")} value={prefs.start} onChange={(event) => save({ ...prefs, start: event.target.value })} /></label>
        <label className="c4-lab"><span>{v4("workEnd")}</span><input className="c4-field" type="time" aria-label={v4("workEnd")} value={prefs.end} onChange={(event) => save({ ...prefs, end: event.target.value })} /></label>
        <p className="c4-muted">{v4("workHint")} {prefs.start}–{prefs.end}</p>
        <div className="c4-staff-shortcuts">
          <button type="button" className="c4-chip" data-on={density === "compact" ? "1" : "0"} onClick={() => {
            const next = density === "compact" ? "comfortable" : "compact";
            setDensity(next);
            storeDensity(next);
          }}>{v4("densityHere")}</button>
          <button type="button" className="c4-chip" data-on={theme === "dark" ? "1" : "0"} onClick={() => {
            const next = theme === "dark" ? "light" : "dark";
            setTheme(next);
            window.localStorage.setItem("crmv4-theme-mode", next);
            window.dispatchEvent(new Event("crmv4:theme-mode"));
          }}>{v4("themeHere")}</button>
          <LanguageSwitcher compact tone="crm" />
          <span className="c4-muted">{locale}</span>
        </div>
        <button type="button" className="c4-btn" onClick={() => { writeJson(PREF_KEY, EMPTY); setPrefs(EMPTY); window.dispatchEvent(new Event("crmv4:staff-prefs")); }}>{v4("resetPrefs")}</button>
      </div>
    </section>
  );
}
