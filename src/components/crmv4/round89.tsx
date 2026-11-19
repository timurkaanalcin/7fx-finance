"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CHECK_KEY,
  COUNTRY_KEY,
  activeCountry,
  addItem,
  countryLines,
  countryText,
  moveItem,
  namedCountries,
  readHiddenCountries,
  readItems,
  setItemDone,
  setItemHidden,
  toggleCountry,
  toggleItemPin,
  visibleCountries,
  visibleCustomers,
  visibleItems,
  type CheckMode,
  type CountryRow,
  type Item,
} from "@/lib/crmv4/round89";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Customer = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  registrationCountry?: string | null;
  region?: string | null;
};

type GlanceRow = CountryRow & { id: string };

const MODES: { id: CheckMode; key: CrmV4CopyKey }[] = [
  { id: "open", key: "chOpen" },
  { id: "done", key: "chDoneView" },
  { id: "hidden", key: "chHidden" },
];

export function DeskCheck({ v4 }: { v4: V4 }) {
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<CheckMode>("open");
  useEffect(() => {
    const next = readItems(readJson(CHECK_KEY, []));
    setItems(next);
    writeJson(CHECK_KEY, next);
  }, []);
  const shown = visibleItems(items, query, mode);

  function store(next: Item[]) {
    setItems(next);
    writeJson(CHECK_KEY, next);
  }

  return (
    <section className="c4-desk-check" aria-label={v4("chTitle")} data-desk-check="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("chSub")}</p>
          <h2 className="c4-title">{v4("chTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("chHint")}</p>
      <p className="c4-meta">{v4("chLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addItem(items, { id: `ch-${Date.now()}`, text });
        if (next.length === items.length) return;
        store(next);
        setText("");
        setMode("open");
      }}>
        <label className="c4-lab">
          <span>{v4("chText")}</span>
          <input className="c4-field" aria-label={v4("chText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("chAdd")}</button>
      </form>
      <p className="c4-meta">{v4("chBlank")}</p>
      <label className="c4-lab">
        <span>{v4("chSearch")}</span>
        <input className="c4-field" aria-label={v4("chSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("chOpen")}>
        {MODES.map((entry) => (
          <button key={entry.id} type="button" className="c4-chip" data-on={mode === entry.id ? "1" : "0"} aria-pressed={mode === entry.id} onClick={() => setMode(entry.id)}>{v4(entry.key)}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("chEmpty")}</p>}
      <ol className="c4-check-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-check-card" data-pinned={item.pinned ? "1" : "0"} data-done={item.done ? "1" : "0"}>
            <p>{item.text}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(setItemDone(items, item.id, !item.done))}>{item.done ? v4("chUndo") : v4("chDone")}</button>
              <button type="button" className="c4-btn" onClick={() => store(moveItem(items, item.id, -1))}>{v4("chUp")}</button>
              <button type="button" className="c4-btn" onClick={() => store(moveItem(items, item.id, 1))}>{v4("chDown")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleItemPin(items, item.id))}>{item.pinned ? v4("chUnpin") : v4("chPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setItemHidden(items, item.id, !item.hidden))}>{item.hidden ? v4("chShow") : v4("chHide")}</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CountryGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Customer[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenCountries, setHiddenCountries] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      country: { country: row.country, registrationCountry: row.registrationCountry, region: row.region },
      label: String(row.name || row.email || ""),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = countryLines(rows);
  const present = namedCountries(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.country)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenCountries(readJson(COUNTRY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenCountries(next);
    writeJson(COUNTRY_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleCountries(present, hiddenCountries, showHidden);
  const country = activeCountry(selected, chips);
  const shown = visibleCustomers(rows, country, blank, query);
  const namedLines = lines.filter((line) => line.country).slice(0, 4);
  const peak = Math.max(1, blankCount, ...namedLines.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenCountries(next);
    writeJson(COUNTRY_KEY, next);
    if (clear && activeCountry(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-country-glance c4-country-cloister" aria-label={v4("cyTitle")} data-country-glance="1" data-desk="cloister">
      <header className="c4-country-cloister-mast">
        <p className="c4-country-cloister-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-country-cloister-kicker">{v4("cyCloisterKicker")}</p>
          <h2 className="c4-title c4-country-cloister-title">{v4("cyTitle")}</h2>
          <p className="c4-country-cloister-lead">{v4("cyCloisterLead")}</p>
        </div>
        <p className="c4-country-cloister-count">{chips.length}</p>
      </header>
      <ol className="c4-country-cloister-index" aria-label={v4("cyTitle")}>
        <li data-tone="gold">{v4("cyCloisterNamed")}</li>
        <li data-tone="ink">{v4("cyCloisterBlank")}</li>
        <li data-tone="ivory">{v4("cyCloisterOpen")}</li>
      </ol>
      <p className="c4-meta c4-country-cloister-hint">{v4("cyHint")}</p>
      <p className="c4-meta">{v4("cyLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("cyBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("cyLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("cyFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("cyNone")}</p>}
      <div className="c4-country-cloister-chart" aria-label={v4("cyTitle")}>
        {namedLines.map((line) => (
          <button key={line.country} type="button" className="c4-country-cloister-column" data-on={country === line.country ? "1" : "0"} data-country={line.country} onClick={() => { setBlank(false); setSelected(country === line.country ? "" : line.country); }}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{line.country}</span>
          </button>
        ))}
        <button type="button" className="c4-country-cloister-column" data-on={blank ? "1" : "0"} data-country="blank" onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <i style={{ height: `${Math.max(18, Math.round((blankCount / peak) * 88))}px` }} />
          <strong>{blankCount}</strong>
          <span>{v4("cyCloisterBlank")}</span>
        </button>
      </div>
      {blankCount > 0 && (
        <button type="button" className="c4-country-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("cyBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("cyShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("cyShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("cyHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("cyTitle")}>
        <button type="button" className="c4-chip" data-on={!country && !blank ? "1" : "0"} aria-pressed={!country && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("cyAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-country-pair" data-country={item}>
            <button type="button" className="c4-chip" data-on={country === item ? "1" : "0"} aria-pressed={country === item} onClick={() => { setBlank(false); setSelected(country === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleCountry(hiddenCountries, item, present), showHidden ? "" : item)}>{showHidden ? v4("cyShow") : v4("cyHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("cySearch")}</span>
        <input className="c4-field" aria-label={v4("cySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("cyEmpty")}</p>}
      <ul className="c4-country-rows c4-country-cloister-list">
        {shown.map((row) => {
          const name = countryText(row.country);
          return (
            <li key={row.id} className="c4-country-cloister-card" data-country={name || "blank"} data-on={country && country === name ? "1" : "0"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("cyBlank")}</p>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("cyCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
