"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { commissionRows, type Cash, type Person as Introducer } from "@/lib/crmv4/round61";
import {
  IB_COUNTRY_KEY,
  ROW_DENSITIES,
  ROW_DENSITY_KEY,
  activeCountry,
  activeDensity,
  countryLines,
  countryText,
  namedCountries,
  readHiddenCountries,
  resetDensity,
  rowDensity,
  toggleCountry,
  visibleCountries,
  visibleIntroducers,
  type CountryRow,
  type RowDensity,
} from "@/lib/crmv4/round109";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const DENSITY_LABEL: Record<RowDensity, CrmV4CopyKey> = {
  comfortable: "rdComfortable",
  compact: "rdCompact",
  dense: "rdDense",
};

type Member = Introducer & {
  country?: string | null;
  registrationCountry?: string | null;
  region?: string | null;
};

type GlanceRow = CountryRow & { id: string; userId: string };

export function RowDensityDesk({ v4 }: { v4: V4 }) {
  const [mode, setMode] = useState<RowDensity>("comfortable");
  useEffect(() => {
    const next = activeDensity(readJson(ROW_DENSITY_KEY, ""));
    setMode(next);
    if (!rowDensity(readJson(ROW_DENSITY_KEY, ""))) writeJson(ROW_DENSITY_KEY, next);
  }, []);

  function choose(next: RowDensity) {
    setMode(next);
    writeJson(ROW_DENSITY_KEY, next);
    window.dispatchEvent(new Event("crmv4:row-density"));
  }

  return (
    <section className="c4-row-density" aria-label={v4("rdTitle")} data-row-density-desk="1" data-mode={mode}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-density-logo" data-logo="mono">{v4("rdLogo")}</p>
          <p className="c4-pay-kicker">{v4("rdSub")}</p>
          <h2 className="c4-title">{v4("rdTitle")}</h2>
        </div>
        <p className="c4-meta">{v4(DENSITY_LABEL[mode])}</p>
      </header>
      <p className="c4-meta">{v4("rdHint")}</p>
      <p className="c4-meta">{v4("rdLocal")}</p>
      <p className="c4-meta">{v4("rdUnknown")}</p>
      <p className="c4-meta">{v4("rdCurrent")} {v4(DENSITY_LABEL[mode])}</p>
      <div className="c4-row" role="group" aria-label={v4("rdTitle")}>
        {ROW_DENSITIES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={mode === item ? "1" : "0"} aria-pressed={mode === item} onClick={() => choose(item)}>{v4(DENSITY_LABEL[item])}</button>
        ))}
        <button type="button" className="c4-btn" onClick={() => choose(resetDensity())}>{v4("rdReset")}</button>
      </div>
      <ul className="c4-density-rows">
        {ROW_DENSITIES.map((item) => (
          <li key={item} className="c4-density-card" data-sample={item}>{v4(DENSITY_LABEL[item])}</li>
        ))}
      </ul>
    </section>
  );
}

export function IbCountry({ base, v4 }: { base: string; v4: V4 }) {
  const people = useJson<{ users?: Member[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?take=40");
  const [hiddenCountries, setHiddenCountries] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const byId = new Map((people.data?.users || []).map((row) => [String(row.id || "").trim(), row]));
  const rows = commissionRows(people.data?.users || [], deposits.data?.requests || []).map((row): GlanceRow => {
    const person = byId.get(row.userId);
    return {
      id: row.id,
      userId: row.userId,
      label: `${row.affiliate} ${row.name}`.trim(),
      country: { country: person?.country, registrationCountry: person?.registrationCountry, region: person?.region },
    };
  });
  const lines = countryLines(rows);
  const present = namedCountries(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.country)?.count || 0;
  const loading = (people.loading && !people.data) || (deposits.loading && !deposits.data);
  const failed = Boolean(people.error || deposits.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenCountries(readJson(IB_COUNTRY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenCountries(next);
    writeJson(IB_COUNTRY_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleCountries(present, hiddenCountries, showHidden);
  const country = activeCountry(selected, chips);
  const shown = visibleIntroducers(rows, country, blank, query);

  function store(next: string[], clear: string) {
    setHiddenCountries(next);
    writeJson(IB_COUNTRY_KEY, next);
    if (clear && activeCountry(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-ib-country" aria-label={v4("icTitle")} data-ib-country="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("icSub")}</p>
          <h2 className="c4-title">{v4("icTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("icHint")}</p>
      <p className="c4-meta">{v4("icLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "ibpay")}>{v4("icBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("icLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("icFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("icNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-ic-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("icBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("icShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("icShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("icHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("icTitle")}>
        <button type="button" className="c4-chip" data-on={!country && !blank ? "1" : "0"} aria-pressed={!country && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("icAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.country === item)?.count || 0;
          return (
            <span key={item} className="c4-ic-pair" data-country={item}>
              <button type="button" className="c4-chip" data-on={country === item ? "1" : "0"} aria-pressed={country === item} onClick={() => { setBlank(false); setSelected(country === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleCountry(hiddenCountries, item, present), showHidden ? "" : item)}>{showHidden ? v4("icShow") : v4("icHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("icSearch")}</span>
        <input className="c4-field" aria-label={v4("icSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("icEmpty")}</p>}
      <ul className="c4-ic-rows">
        {shown.map((row) => {
          const name = countryText(row.country);
          return (
            <li key={row.id} data-country={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("icBlank")}</p>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("icCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
