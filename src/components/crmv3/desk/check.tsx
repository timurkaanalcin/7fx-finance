"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/deskcheck";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const CUSTOMERS = "/api/admin/users?take=40&meta=0&role=TRADER";

type Customer = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  registrationCountry?: string | null;
  region?: string | null;
};

type GlanceRow = CountryRow & { id: string };

const MODES: { id: CheckMode; key: "chOpen" | "chDoneView" | "chHidden" }[] = [
  { id: "open", key: "chOpen" },
  { id: "done", key: "chDoneView" },
  { id: "hidden", key: "chHidden" },
];

export function DeskCheck() {
  const v3 = useV3();
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
    <section className="c3-desk-check" aria-label={v3("chTitle")} data-desk-check="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("chSub")}</p>
          <h2 className="c3-title">{v3("chTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("chHint")}</p>
      <p className="c3-muted">{v3("chLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addItem(items, { id: `ch-${Date.now()}`, text });
        if (next.length === items.length) return;
        store(next);
        setText("");
        setMode("open");
      }}>
        <label className="c3-lab">
          <span>{v3("chText")}</span>
          <input className="c3-field" aria-label={v3("chText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("chAdd")}</button>
      </form>
      <p className="c3-muted">{v3("chBlank")}</p>
      <label className="c3-lab">
        <span>{v3("chSearch")}</span>
        <input className="c3-field" aria-label={v3("chSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("chOpen")}>
        {MODES.map((entry) => (
          <button key={entry.id} type="button" className="c3-chip" data-on={mode === entry.id ? "1" : "0"} aria-pressed={mode === entry.id} onClick={() => setMode(entry.id)}>{v3(entry.key)}</button>
        ))}
      </div>
      {!shown.length && <p className="c3-empty">{v3("chEmpty")}</p>}
      <ol className="c3-check-list">
        {shown.map((item) => (
          <li key={item.id} className="c3-check-card" data-pinned={item.pinned ? "1" : "0"} data-done={item.done ? "1" : "0"}>
            <p>{item.text}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(setItemDone(items, item.id, !item.done))}>{item.done ? v3("chUndo") : v3("chDone")}</button>
              <button type="button" className="c3-btn" onClick={() => store(moveItem(items, item.id, -1))}>{v3("chUp")}</button>
              <button type="button" className="c3-btn" onClick={() => store(moveItem(items, item.id, 1))}>{v3("chDown")}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleItemPin(items, item.id))}>{item.pinned ? v3("chUnpin") : v3("chPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setItemHidden(items, item.id, !item.hidden))}>{item.hidden ? v3("chShow") : v3("chHide")}</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CountryGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Customer[] }>(CUSTOMERS);
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

  function store(next: string[], clear: string) {
    setHiddenCountries(next);
    writeJson(COUNTRY_KEY, next);
    if (clear && activeCountry(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-country-glance" aria-label={v3("cyTitle")} data-country-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("cySub")}</p>
          <h2 className="c3-title">{v3("cyTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("cyHint")}</p>
      <p className="c3-muted">{v3("cyLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "customers")}>{v3("cyBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("cyLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("cyFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("cyNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-country-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("cyBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("cyShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("cyShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("cyHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("cyTitle")}>
        <button type="button" className="c3-chip" data-on={!country && !blank ? "1" : "0"} aria-pressed={!country && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("cyAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-country-pair" data-country={item}>
            <button type="button" className="c3-chip" data-on={country === item ? "1" : "0"} aria-pressed={country === item} onClick={() => { setBlank(false); setSelected(country === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleCountry(hiddenCountries, item, present), showHidden ? "" : item)}>{showHidden ? v3("cyShow") : v3("cyHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("cySearch")}</span>
        <input className="c3-field" aria-label={v3("cySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("cyEmpty")}</p>}
      <ul className="c3-country-rows">
        {shown.map((row) => {
          const name = countryText(row.country);
          return (
            <li key={row.id} data-country={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("cyBlank")}</p>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("cyCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
