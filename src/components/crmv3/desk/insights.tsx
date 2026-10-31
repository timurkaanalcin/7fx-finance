"use client";

import { useEffect, useState } from "react";
import { methodName } from "@/lib/crmv3/bridge";
import {
  barShare,
  firstTradesInPeriod,
  funnelCounts,
  keyTitle,
  listedKeys,
  moneyGroups,
  type PeriodDays,
  type PrefLocale,
} from "@/lib/crmv3/insights";
import { money, useJson } from "../kit";
import { useV3, type V3 } from "./store";

const DAYS: PeriodDays[] = [7, 30, 90];

type Person = { id: string; createdAt?: string | null; documentsStatus?: string | null; ftd?: boolean | null; country?: string | null };
type Deposit = { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; method?: unknown; user?: { id?: string | null } | null };

function Bars({ label, rows }: { label: string; rows: { name: string; text: string; share: number }[] }) {
  return (
    <div className="c3-bars" role="img" aria-label={label}>
      {rows.map((row) => (
        <div key={row.name} className="c3-bar-row">
          <span>{row.name}</span>
          <span className="c3-bar-track"><span className="c3-bar-fill" style={{ width: `${row.share}%` }} /></span>
          <span>{row.text}</span>
        </div>
      ))}
    </div>
  );
}

export function InsightsHome({ locale }: { locale: string }) {
  const v3 = useV3();
  const [days, setDays] = useState<PeriodDays>(30);
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
    { key: "registered" as const, name: v3("insRegistered") },
    { key: "kyc" as const, name: v3("insKyc") },
    { key: "deposit" as const, name: v3("insDeposit") },
    { key: "trade" as const, name: v3("insTrade") },
  ];
  const top = funnel.registered || 1;
  const cash = (deposits.data?.requests || []).map((row) => ({
    amount: row.amount,
    currency: row.currency,
    at: row.createdAt,
    method: methodName(row.method),
    country: countries.get(String(row.user?.id || "")) || "",
  }));
  const byMethod = moneyGroups(cash.map((row) => ({ ...row, label: row.method })), days, now);
  const byCountry = moneyGroups(cash.map((row) => ({ ...row, label: row.country || v3("insNoCountry") })), days, now);
  return (
    <section className="c3-insight" aria-label={v3("insTitle")} data-insights="1">
      <h2 className="c3-title">{v3("insTitle")}</h2>
      <p className="c3-muted">{v3("insHint")}</p>
      <div className="c3-tools" role="group" aria-label={v3("insDays")}>
        {DAYS.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={days === item ? "1" : "0"} onClick={() => setDays(item)}>{item} {v3("insDays")}</button>
        ))}
      </div>
      <h3 className="c3-title">{v3("insFunnel")}</h3>
      <p className="c3-muted">{v3("insFunnelHint")}</p>
      {!loading && !funnel.registered && <p className="c3-muted">{v3("insEmpty")}</p>}
      <Bars
        label={steps.map((step) => `${step.name} ${funnel[step.key]}`).join(", ")}
        rows={steps.map((step) => ({ name: step.name, text: String(funnel[step.key]), share: Math.round((funnel[step.key] / top) * 100) }))}
      />
      <table className="c3-table">
        <caption className="c3-muted">{v3("insTable")}</caption>
        <thead><tr><th>{v3("insFunnel")}</th><th>{v3("insCount")}</th></tr></thead>
        <tbody>
          {steps.map((step) => <tr key={step.key}><td>{step.name}</td><td>{funnel[step.key]}</td></tr>)}
        </tbody>
      </table>
      <MoneyBlock title={v3("insByMethod")} groups={byMethod} v3={v3} locale={locale} empty={v3("insEmpty")} loading={loading} />
      <MoneyBlock title={v3("insByCountry")} groups={byCountry} v3={v3} locale={locale} empty={v3("insEmpty")} loading={loading} />
    </section>
  );
}

function MoneyBlock({ title, groups, v3, locale, empty, loading }: { title: string; groups: ReturnType<typeof moneyGroups>; v3: V3; locale: string; empty: string; loading: boolean }) {
  return (
    <div className="c3-stack">
      <h3 className="c3-title">{title}</h3>
      {!loading && !groups.length && <p className="c3-muted">{empty}</p>}
      {groups.map((group) => {
        const shares = barShare(group.rows);
        return (
          <section key={group.currency} aria-label={group.currency} className="c3-stack">
            <h4 className="c3-title">{group.currency}</h4>
            <Bars
              label={group.rows.map((row) => `${row.label} ${row.amount} ${group.currency}`).join(", ")}
              rows={group.rows.map((row, index) => ({ name: row.label, text: `${money(row.amount, group.currency, locale)} · ${row.count}`, share: shares[index] || 0 }))}
            />
            <table className="c3-table">
              <caption className="c3-muted">{v3("insTable")} · {group.currency}</caption>
              <thead><tr><th>{title}</th><th>{v3("insCount")}</th><th>{v3("insAmount")}</th></tr></thead>
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

export function PrefsHub({ locale }: { locale: string }) {
  const v3 = useV3();
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
    <section className="c3-prefs" aria-label={v3("prefTitle")} data-prefs="1">
      <h2 className="c3-title">{v3("prefTitle")}</h2>
      <p className="c3-muted">{v3("prefHint")}</p>
      <p className="c3-muted">{v3("prefKept")}</p>
      <label className="c3-lab"><span>{v3("prefSearch")}</span><input className="c3-field" aria-label={v3("prefSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      {!shown.length && <p className="c3-muted">{v3("prefNone")}</p>}
      <ul className="c3-pref-rows">
        {shown.map((row) => {
          const title = keyTitle(row.key, lang);
          const id = `${row.where}-${row.key}`;
          return (
            <li key={id}>
              <strong>{title || v3("prefNoName")}</strong>
              <span className="c3-muted">{row.key}</span>
              <span>{v3("prefSize")} {row.bytes}</span>
              <span>{row.where === "tab" ? v3("prefTab") : v3("prefBrowser")}</span>
              <button type="button" className="c3-btn" onClick={() => setOpen(open === id ? "" : id)}>{open === id ? v3("prefHide") : v3("prefView")}</button>
              <button type="button" className="c3-btn" onClick={() => {
                const blob = new Blob([JSON.stringify({ key: row.key, value: row.value }, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${row.key}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}>{v3("prefExport")}</button>
              <button type="button" className="c3-btn" onClick={() => {
                if (!window.confirm(v3("prefResetAsk"))) return;
                storeOf(row.where).removeItem(row.key);
                setMsg(v3("prefAfter"));
                refresh();
              }}>{v3("prefReset")}</button>
              {open === id && <pre className="c3-pref-view">{row.value || "—"}</pre>}
            </li>
          );
        })}
      </ul>
      <button type="button" className="c3-btn" onClick={() => {
        if (!window.confirm(v3("prefResetAllAsk"))) return;
        for (const row of listedKeys(readStores())) storeOf(row.where).removeItem(row.key);
        window.location.reload();
      }}>{v3("prefResetAll")}</button>
      {msg && <p className="c3-muted" role="status">{msg}</p>}
    </section>
  );
}
