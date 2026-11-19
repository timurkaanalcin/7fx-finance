"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  COURIER_KEY,
  IB_COUNTRY_KEY,
  activeCountry,
  addNote,
  countryLines,
  countryText,
  namedCountries,
  partnerText,
  readHiddenCountries,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleCountry,
  toggleNotePin,
  visibleCountries,
  visibleNotes,
  visiblePartners,
  type CountryRow,
  type Note,
} from "@/lib/crmv4/round120";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  registrationCountry?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
};

type GlanceRow = CountryRow & { id: string; partner: string };

export function CourierNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [spot, setSpot] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(COURIER_KEY, []));
    setNotes(next);
    writeJson(COURIER_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);
  const openCount = notes.filter((note) => !note.hidden).length;
  const pinCount = notes.filter((note) => note.pinned).length;
  const hideCount = notes.filter((note) => note.hidden).length;
  const notePeak = Math.max(1, openCount, pinCount, hideCount);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(COURIER_KEY, next);
  }

  return (
    <section className="c4-courier c4-courier-narthex" aria-label={v4("crrTitle")} data-courier="1" data-desk="narthex">
      <header className="c4-courier-narthex-mast">
        <p className="c4-courier-narthex-seal" data-logo="mono">{v4("crrLogo")}</p>
        <div>
          <p className="c4-courier-narthex-kicker">{v4("crrNarthexKicker")}</p>
          <h2 className="c4-title c4-courier-narthex-title">{v4("crrTitle")}</h2>
          <p className="c4-courier-narthex-lead">{v4("crrNarthexLead")}</p>
        </div>
        <p className="c4-courier-narthex-count">{shown.length}</p>
      </header>
      <ol className="c4-courier-narthex-index" aria-label={v4("crrTitle")}>
        <li data-tone="gold">{v4("crrNarthexFocused")} {openCount}</li>
        <li data-tone="ink">{v4("crrNarthexListed")} {pinCount}</li>
        <li data-tone="ivory">{v4("crrNarthexOpen")} {hideCount}</li>
      </ol>
      <div className="c4-courier-narthex-chart" aria-label={v4("crrTitle")}>
        <button type="button" className="c4-courier-narthex-column" data-on={openCount ? "1" : "0"} onClick={() => setHidden(false)}>
          <i style={{ height: `${Math.max(18, Math.round((openCount / notePeak) * 88))}px` }} />
          <strong>{openCount}</strong>
          <span>{v4("crrNarthexFocused")}</span>
        </button>
        <button type="button" className="c4-courier-narthex-column" data-on={pinCount ? "1" : "0"} onClick={() => setHidden(false)}>
          <i style={{ height: `${Math.max(18, Math.round((pinCount / notePeak) * 88))}px` }} />
          <strong>{pinCount}</strong>
          <span>{v4("crrNarthexListed")}</span>
        </button>
        <button type="button" className="c4-courier-narthex-column" data-on={hideCount ? "1" : "0"} onClick={() => setHidden(true)}>
          <i style={{ height: `${Math.max(18, Math.round((hideCount / notePeak) * 88))}px` }} />
          <strong>{hideCount}</strong>
          <span>{v4("crrNarthexOpen")}</span>
        </button>
      </div>
      <p className="c4-meta c4-courier-narthex-hint">{v4("crrHint")}</p>
      <p className="c4-meta">{v4("crrLocal")}</p>
      <p className="c4-meta">{v4("crrBlank")}</p>
      <p className="c4-meta">{v4("crrSpotBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `crr-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, spot });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setSpot("");
      }}>
        <label className="c4-lab">
          <span>{v4("crrText")}</span>
          <input className="c4-field" aria-label={v4("crrText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("crrSpot")}</span>
          <input className="c4-field" aria-label={v4("crrSpot")} value={spot} maxLength={40} onChange={(event) => setSpot(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("crrAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("crrReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("crrSearch")}</span>
        <input className="c4-field" aria-label={v4("crrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("crrTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("crrOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("crrHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty c4-courier-narthex-empty">{v4("crrEmpty")}</p>}
      <ul className="c4-crr-rows c4-courier-narthex-list">
        {shown.map((note) => (
          <li key={note.id} className="c4-courier-narthex-card" data-pinned={note.pinned ? "1" : "0"} data-on={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.spot ? <p className="c4-meta">{note.spot}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("crrUnpin") : v4("crrPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("crrShow") : v4("crrHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IbCountries({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenCountries, setHiddenCountries] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    const partner = partnerText(row);
    if (!id || !partner) return null;
    return {
      id,
      partner,
      label: String(row.name || row.email || "").trim(),
      country: { country: row.country, registrationCountry: row.registrationCountry },
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = countryLines(rows);
  const present = namedCountries(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.country)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenCountries(readJson(IB_COUNTRY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenCountries(next);
    writeJson(IB_COUNTRY_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleCountries(present, hiddenCountries, showHidden);
  const country = activeCountry(selected, chips);
  const shown = visiblePartners(rows, country, blank, query);
  const peak = Math.max(1, ...lines.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenCountries(next);
    writeJson(IB_COUNTRY_KEY, next);
    if (clear && activeCountry(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-ib-ctry c4-partner-stoa" aria-label={v4("ibgTitle")} data-ib-ctry="1" data-desk="stoa">
      <header className="c4-partner-stoa-mast">
        <p className="c4-partner-stoa-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-partner-stoa-kicker">{v4("ibgStoaKicker")}</p>
          <h2 className="c4-title c4-partner-stoa-title">{v4("ibgTitle")}</h2>
          <p className="c4-partner-stoa-lead">{v4("ibgStoaLead")}</p>
        </div>
        <p className="c4-partner-stoa-count">{chips.length}</p>
      </header>
      <ol className="c4-partner-stoa-index" aria-label={v4("ibgTitle")}>
        <li data-tone="gold">{v4("ibgStoaShown")} {chips.length}</li>
        <li data-tone="ink">{v4("ibgStoaHidden")} {hiddenCountries.length}</li>
        <li data-tone="ivory">{v4("ibgStoaBlank")} {blankCount}</li>
      </ol>
      <div className="c4-partner-stoa-chart" aria-label={v4("ibgTitle")}>
        {lines.filter((line) => line.country).map((line) => (
          <button key={line.country} type="button" className="c4-partner-stoa-column" data-on={country === line.country ? "1" : "0"} data-country={line.country} onClick={() => { setBlank(false); setSelected(country === line.country ? "" : line.country); }}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{line.country}</span>
          </button>
        ))}
        {blankCount > 0 && (
          <button type="button" className="c4-partner-stoa-column" data-on={blank ? "1" : "0"} data-country="blank" onClick={() => { setBlank((value) => !value); setSelected(""); }}>
            <i style={{ height: `${Math.max(18, Math.round((blankCount / peak) * 88))}px` }} />
            <strong>{blankCount}</strong>
            <span>{v4("ibgStoaBlank")}</span>
          </button>
        )}
      </div>
      <p className="c4-meta c4-partner-stoa-hint">{v4("ibgHint")}</p>
      <p className="c4-meta">{v4("ibgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "ibpay")}>{v4("ibgBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ibgLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ibgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("ibgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-ibg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("ibgBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("ibgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ibgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ibgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ibgTitle")}>
        <button type="button" className="c4-chip" data-on={!country && !blank ? "1" : "0"} aria-pressed={!country && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("ibgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.country === item)?.count || 0;
          return (
            <span key={item} className="c4-ibg-pair" data-country={item}>
              <button type="button" className="c4-chip" data-on={country === item ? "1" : "0"} aria-pressed={country === item} onClick={() => { setBlank(false); setSelected(country === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleCountry(hiddenCountries, item, present), showHidden ? "" : item)}>{showHidden ? v4("ibgShow") : v4("ibgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("ibgSearch")}</span>
        <input className="c4-field" aria-label={v4("ibgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty c4-partner-stoa-empty">{v4("ibgEmpty")}</p>}
      <ul className="c4-ibg-rows c4-partner-stoa-list">
        {shown.map((row) => {
          const name = countryText(row.country);
          return (
            <li key={row.id} className="c4-partner-stoa-card" data-country={name || "blank"} data-on={country && country === name ? "1" : "0"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{row.partner}</p>
              <p className="c4-meta">{name || v4("ibgBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
