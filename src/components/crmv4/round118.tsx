"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  LEAD_SOURCE_KEY,
  PARK_KEY,
  activeSource,
  addNote,
  namedSources,
  readHiddenSources,
  readNotes,
  resetNotes,
  setNoteHidden,
  sourceLines,
  sourceText,
  toggleNotePin,
  toggleSource,
  visibleLeads,
  visibleNotes,
  visibleSources,
  type Note,
  type SourceRow,
} from "@/lib/crmv4/round118";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  campaign?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
  referralCodeUsed?: string | null;
};

type GlanceRow = SourceRow & { id: string };

export function ParkingNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [bay, setBay] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(PARK_KEY, []));
    setNotes(next);
    writeJson(PARK_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(PARK_KEY, next);
  }

  return (
    <section className="c4-park-spot" aria-label={v4("bayTitle")} data-park-spot="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-bay-logo" data-logo="mono">{v4("bayLogo")}</p>
          <p className="c4-pay-kicker">{v4("baySub")}</p>
          <h2 className="c4-title">{v4("bayTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("bayHint")}</p>
      <p className="c4-meta">{v4("bayLocal")}</p>
      <p className="c4-meta">{v4("bayBlank")}</p>
      <p className="c4-meta">{v4("bayPlaceBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `bay-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, bay });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setBay("");
      }}>
        <label className="c4-lab">
          <span>{v4("bayText")}</span>
          <input className="c4-field" aria-label={v4("bayText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bayPlace")}</span>
          <input className="c4-field" aria-label={v4("bayPlace")} value={bay} maxLength={40} onChange={(event) => setBay(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("bayAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("bayReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("baySearch")}</span>
        <input className="c4-field" aria-label={v4("baySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("bayTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("bayOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("bayHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("bayEmpty")}</p>}
      <ul className="c4-bay-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.bay ? <p className="c4-meta">{note.bay}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("bayUnpin") : v4("bayPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("bayShow") : v4("bayHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LeadSources({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenSources, setHiddenSources] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow => ({
    id: String(row.id || ""),
    label: String(row.name || row.email || "").trim(),
    source: {
      campaign: row.campaign,
      affiliateA: row.affiliateA,
      affiliateB: row.affiliateB,
      affiliateC: row.affiliateC,
      referralCodeUsed: row.referralCodeUsed,
    },
  })).filter((row) => row.id);
  const lines = sourceLines(rows);
  const present = namedSources(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.source)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenSources(readJson(LEAD_SOURCE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenSources(next);
    writeJson(LEAD_SOURCE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleSources(present, hiddenSources, showHidden);
  const source = activeSource(selected, chips);
  const shown = visibleLeads(rows, source, blank, query);

  function store(next: string[], clear: string) {
    setHiddenSources(next);
    writeJson(LEAD_SOURCE_KEY, next);
    if (clear && activeSource(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-lead-src" aria-label={v4("lsgTitle")} data-lead-src="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("lsgSub")}</p>
          <h2 className="c4-title">{v4("lsgTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("lsgRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("lsgHint")}</p>
      <p className="c4-meta">{v4("lsgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "leads")}>{v4("lsgLeads")}</Link>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("lsgCustomers")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("lsgLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("lsgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("lsgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-lsg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("lsgBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("lsgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("lsgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("lsgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("lsgTitle")}>
        <button type="button" className="c4-chip" data-on={!source && !blank ? "1" : "0"} aria-pressed={!source && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("lsgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.source === item)?.count || 0;
          return (
            <span key={item} className="c4-lsg-pair" data-source={item}>
              <button type="button" className="c4-chip" data-on={source === item ? "1" : "0"} aria-pressed={source === item} onClick={() => { setBlank(false); setSelected(source === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSource(hiddenSources, item, present), showHidden ? "" : item)}>{showHidden ? v4("lsgShow") : v4("lsgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("lsgSearch")}</span>
        <input className="c4-field" aria-label={v4("lsgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("lsgEmpty")}</p>}
      <ul className="c4-lsg-rows">
        {shown.map((row) => {
          const name = sourceText(row.source);
          return (
            <li key={row.id} data-source={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("lsgBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
