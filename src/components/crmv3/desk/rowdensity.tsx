"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { commissionRows, type Cash, type Person } from "@/lib/crmv3/introducer";
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
} from "@/lib/crmv3/rowdensity";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const DENSITY_LABEL: Record<RowDensity, CrmV3CopyKey> = {
  comfortable: "rdComfortable",
  compact: "rdCompact",
  dense: "rdDense",
};

type Member = Person & {
  country?: string | null;
  registrationCountry?: string | null;
  region?: string | null;
};

type GlanceRow = CountryRow & { id: string; userId: string };

export function RowDensityDesk() {
  const v3 = useV3();
  const [mode, setMode] = useState<RowDensity>("comfortable");
  useEffect(() => {
    const next = activeDensity(readJson(ROW_DENSITY_KEY, ""));
    setMode(next);
    if (!rowDensity(readJson(ROW_DENSITY_KEY, ""))) writeJson(ROW_DENSITY_KEY, next);
  }, []);

  function choose(next: RowDensity) {
    setMode(next);
    writeJson(ROW_DENSITY_KEY, next);
    window.dispatchEvent(new Event("crmv3:row-density"));
  }

  return (
    <section className="c3-row-density" aria-label={v3("rdTitle")} data-row-density-desk="1" data-mode={mode}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-density-logo" data-logo="mono">{v3("rdLogo")}</p>
          <p className="c3-pay-kicker">{v3("rdSub")}</p>
          <h2 className="c3-title">{v3("rdTitle")}</h2>
        </div>
        <p className="c3-meta">{v3(DENSITY_LABEL[mode])}</p>
      </header>
      <p className="c3-meta">{v3("rdHint")}</p>
      <p className="c3-meta">{v3("rdLocal")}</p>
      <p className="c3-meta">{v3("rdUnknown")}</p>
      <p className="c3-meta">{v3("rdCurrent")} {v3(DENSITY_LABEL[mode])}</p>
      <div className="c3-row" role="group" aria-label={v3("rdTitle")}>
        {ROW_DENSITIES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={mode === item ? "1" : "0"} aria-pressed={mode === item} onClick={() => choose(item)}>{v3(DENSITY_LABEL[item])}</button>
        ))}
        <button type="button" className="c3-btn" onClick={() => choose(resetDensity())}>{v3("rdReset")}</button>
      </div>
      <ul className="c3-density-rows">
        {ROW_DENSITIES.map((item) => (
          <li key={item} className="c3-density-card" data-sample={item}>{v3(DENSITY_LABEL[item])}</li>
        ))}
      </ul>
    </section>
  );
}

export function IbCountry({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-ib-country" aria-label={v3("icTitle")} data-ib-country="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("icSub")}</p>
          <h2 className="c3-title">{v3("icTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("icHint")}</p>
      <p className="c3-meta">{v3("icLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "ibpay")}>{v3("icBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("icLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("icFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("icNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-ic-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("icBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("icShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("icShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("icHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("icTitle")}>
        <button type="button" className="c3-chip" data-on={!country && !blank ? "1" : "0"} aria-pressed={!country && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("icAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.country === item)?.count || 0;
          return (
            <span key={item} className="c3-ic-pair" data-country={item}>
              <button type="button" className="c3-chip" data-on={country === item ? "1" : "0"} aria-pressed={country === item} onClick={() => { setBlank(false); setSelected(country === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleCountry(hiddenCountries, item, present), showHidden ? "" : item)}>{showHidden ? v3("icShow") : v3("icHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("icSearch")}</span>
        <input className="c3-field" aria-label={v3("icSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("icEmpty")}</p>}
      <ul className="c3-ic-rows">
        {shown.map((row) => {
          const name = countryText(row.country);
          return (
            <li key={row.id} data-country={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("icBlank")}</p>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("icCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
