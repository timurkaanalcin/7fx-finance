"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { crmv4Href } from "@/lib/crmv4/sections";
import { methodName } from "@/lib/crmv4/round15";
import {
  barShare,
  firstTradesInPeriod,
  funnelCounts,
  keyTitle,
  listedKeys,
  moneyGroups,
  type PeriodDays,
  type PrefLocale,
} from "@/lib/crmv4/round32";
import { money, useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const DAYS: PeriodDays[] = [7, 30, 90];

type Person = { id: string; createdAt?: string | null; documentsStatus?: string | null; ftd?: boolean | null; country?: string | null };
type Deposit = { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; method?: unknown; user?: { id?: string | null } | null };

function Bars({ label, rows }: { label: string; rows: { name: string; text: string; share: number }[] }) {
  return (
    <div className="c4-bars" role="img" aria-label={label}>
      {rows.map((row) => (
        <div key={row.name} className="c4-bar-row">
          <span>{row.name}</span>
          <span className="c4-bar-track"><span className="c4-bar-fill" style={{ width: `${row.share}%` }} /></span>
          <span>{row.text}</span>
        </div>
      ))}
    </div>
  );
}

export function InsightsHome({ base = "/izcrm/crmv4", v4, locale }: { base?: string; v4: V4; locale: string }) {
  const [days, setDays] = useState<PeriodDays>(30);
  const [query, setQuery] = useState("");
  const now = Date.now();
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: Deposit[] }>("/api/admin/deposits?take=80");
  const positions = useJson<{ positions?: { userId?: string | null; openedAt?: string | null }[] }>("/api/admin/positions?status=ALL&take=80");
  const loading = people.loading || deposits.loading || positions.loading;
  const users = people.data?.users || [];
  const countries = new Map(users.map((row) => [row.id, row.country || ""]));
  const trades = firstTradesInPeriod(positions.data?.positions || [], days, now);
  const funnel = funnelCounts(users, trades, days, now);
  const steps = [
    { key: "registered" as const, name: v4("insRegistered") },
    { key: "kyc" as const, name: v4("insKyc") },
    { key: "deposit" as const, name: v4("insDeposit") },
    { key: "trade" as const, name: v4("insTrade") },
  ];
  const top = funnel.registered || 1;
  const needle = query.trim().toLowerCase();
  const shownSteps = steps.filter((step) => !needle || step.name.toLowerCase().includes(needle));
  const cash = (deposits.data?.requests || []).map((row) => ({
    amount: row.amount,
    currency: row.currency,
    at: row.createdAt,
    method: methodName(row.method),
    country: countries.get(String(row.user?.id || "")) || "",
  }));
  const byMethod = moneyGroups(cash.map((row) => ({ ...row, label: row.method })), days, now);
  const byCountry = moneyGroups(cash.map((row) => ({ ...row, label: row.country || v4("insNoCountry") })), days, now);
  return (
    <section className="c4-insight-luxe c4-insight-observatory" aria-label={v4("insTitle")} data-insights="1" data-desk="observatory">
      <header className="c4-insight-observatory-mast">
        <p className="c4-insight-observatory-plate" data-logo="mono">7FX</p>
        <div>
          <p className="c4-insight-observatory-kicker">{v4("insHint")}</p>
          <h2 className="c4-title c4-insight-observatory-title">{v4("insTitle")}</h2>
        </div>
        <ol className="c4-insight-observatory-index" aria-label={v4("insTitle")}>
          <li data-tone="gold">{v4("insRegistered")}</li>
          <li data-tone="ink">{v4("insKyc")}</li>
          <li data-tone="ivory">{v4("insTrade")}</li>
        </ol>
        <p className="c4-insight-observatory-links">
          <Link href={crmv4Href(base, "obv")}>{v4("obvTitle")}</Link>
          <Link href={crmv4Href(base, "psr")}>{v4("psrTitle")}</Link>
        </p>
      </header>
      <p className="c4-muted c4-insight-observatory-lead">{v4("insHint")}</p>
      <label className="c4-lab"><span>{v4("insFunnel")}</span><input className="c4-field c4-insight-observatory-search" aria-label={v4("insFunnel")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-line-filters c4-insight-observatory-tools" role="group" aria-label={v4("insDays")}>
        {DAYS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={days === item ? "1" : "0"} onClick={() => setDays(item)}>{item} {v4("insDays")}</button>
        ))}
      </div>
      <h3 className="c4-title">{v4("insFunnel")}</h3>
      <p className="c4-muted">{v4("insFunnelHint")}</p>
      {!loading && !funnel.registered && <p className="c4-empty-gold">{v4("insEmpty")}</p>}
      <Bars
        label={shownSteps.map((step) => `${step.name} ${funnel[step.key]}`).join(", ")}
        rows={shownSteps.map((step) => ({ name: step.name, text: String(funnel[step.key]), share: Math.round((funnel[step.key] / top) * 100) }))}
      />
      <table className="c4-table c4-insight-observatory-table">
        <caption className="c4-muted">{v4("insTable")}</caption>
        <thead><tr><th>{v4("insFunnel")}</th><th>{v4("insCount")}</th></tr></thead>
        <tbody>
          {shownSteps.map((step) => <tr key={step.key}><td>{step.name}</td><td>{funnel[step.key]}</td></tr>)}
        </tbody>
      </table>
      <MoneyBlock title={v4("insByMethod")} groups={byMethod} v4={v4} locale={locale} empty={v4("insEmpty")} loading={loading} />
      <MoneyBlock title={v4("insByCountry")} groups={byCountry} v4={v4} locale={locale} empty={v4("insEmpty")} loading={loading} />
    </section>
  );
}

function MoneyBlock({ title, groups, v4, locale, empty, loading }: { title: string; groups: ReturnType<typeof moneyGroups>; v4: V4; locale: string; empty: string; loading: boolean }) {
  return (
    <div>
      <h3 className="c4-title">{title}</h3>
      {!loading && !groups.length && <p className="c4-empty-gold">{empty}</p>}
      {groups.map((group) => {
        const shares = barShare(group.rows);
        return (
          <section key={group.currency} aria-label={group.currency}>
            <h4 className="c4-title">{group.currency}</h4>
            <Bars
              label={group.rows.map((row) => `${row.label} ${row.amount} ${group.currency}`).join(", ")}
              rows={group.rows.map((row, index) => ({ name: row.label, text: `${money(row.amount, group.currency, locale)} · ${row.count}`, share: shares[index] || 0 }))}
            />
            <table className="c4-table">
              <caption className="c4-muted">{v4("insTable")} · {group.currency}</caption>
              <thead><tr><th>{title}</th><th>{v4("insCount")}</th><th>{v4("insAmount")}</th></tr></thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.label}><td>{row.label}</td><td>{row.count}</td><td>{money(row.amount, group.currency, locale)}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

function readStores(): { key: string; value: string; where: "browser" | "tab" }[] {
  const out: { key: string; value: string; where: "browser" | "tab" }[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key) out.push({ key, value: window.localStorage.getItem(key) || "", where: "browser" });
  }
  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (key) out.push({ key, value: window.sessionStorage.getItem(key) || "", where: "tab" });
  }
  return out;
}

export function PrefsHub({ v4, locale }: { v4: V4; locale: string }) {
  const [rows, setRows] = useState<ReturnType<typeof listedKeys>>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState("");
  const [msg, setMsg] = useState("");
  function refresh() { setRows(listedKeys(readStores())); }
  useEffect(() => { refresh(); }, []);
  const lang = (["en", "tr", "de", "ru", "ar"].includes(locale) ? locale : "en") as PrefLocale;
  const shown = rows.filter((row) => {
    const text = query.trim().toLowerCase();
    if (!text) return true;
    return `${row.key} ${keyTitle(row.key, lang)}`.toLowerCase().includes(text);
  });
  function storeOf(where: "browser" | "tab") {
    return where === "tab" ? window.sessionStorage : window.localStorage;
  }
  return (
    <section className="c4-pref-luxe c4-pref-oratory" aria-label={v4("prefTitle")} data-prefs="1" data-desk="oratory">
      <header className="c4-pref-oratory-mast">
        <p className="c4-pref-oratory-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pref-oratory-kicker">{v4("prefSub")}</p>
          <h2 className="c4-title c4-pref-oratory-title">{v4("prefTitle")}</h2>
        </div>
        <ol className="c4-pref-oratory-index" aria-label={v4("prefTitle")}>
          <li data-tone="gold">{v4("prefBrowser")}</li>
          <li data-tone="ink">{v4("prefTab")}</li>
          <li data-tone="ivory">{v4("prefSearch")}</li>
        </ol>
      </header>
      <p className="c4-muted c4-pref-oratory-lead">{v4("prefHint")}</p>
      <p className="c4-muted">{v4("prefKept")}</p>
      <label className="c4-lab c4-pref-oratory-find"><span>{v4("prefSearch")}</span><input className="c4-field c4-pref-oratory-search" aria-label={v4("prefSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      {!shown.length && <p className="c4-empty-gold c4-pref-oratory-empty">{v4("prefNone")}</p>}
      <ul className="c4-pref-rows">
        {shown.map((row) => {
          const title = keyTitle(row.key, lang);
          return (
            <li key={`${row.where}-${row.key}`}>
              <strong>{title || v4("prefNoName")}</strong>
              <span className="c4-muted">{row.key}</span>
              <span>{v4("prefSize")} {row.bytes}</span>
              <span>{row.where === "tab" ? v4("prefTab") : v4("prefBrowser")}</span>
              <button type="button" className="c4-btn" onClick={() => setOpen(open === `${row.where}-${row.key}` ? "" : `${row.where}-${row.key}`)}>{open === `${row.where}-${row.key}` ? v4("prefHide") : v4("prefView")}</button>
              <button type="button" className="c4-btn" onClick={() => {
                const blob = new Blob([JSON.stringify({ key: row.key, value: row.value }, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${row.key}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}>{v4("prefExport")}</button>
              <button type="button" className="c4-btn" onClick={() => {
                if (!window.confirm(v4("prefResetAsk"))) return;
                storeOf(row.where).removeItem(row.key);
                setMsg(v4("prefAfter"));
                refresh();
              }}>{v4("prefReset")}</button>
              {open === `${row.where}-${row.key}` && <pre className="c4-pref-view">{row.value || "—"}</pre>}
            </li>
          );
        })}
      </ul>
      <button type="button" className="c4-btn" onClick={() => {
        if (!window.confirm(v4("prefResetAllAsk"))) return;
        for (const row of listedKeys(readStores())) storeOf(row.where).removeItem(row.key);
        window.location.reload();
      }}>{v4("prefResetAll")}</button>
      {msg && <p className="c4-muted" role="status">{msg}</p>}
    </section>
  );
}
