"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  LEAD_STATUS_KEY,
  LOUNGE_KEY,
  activeStatus,
  addNote,
  namedStatuses,
  readHiddenStatuses,
  readNotes,
  resetNotes,
  setNoteHidden,
  statusLines,
  statusText,
  toggleNotePin,
  toggleStatus,
  visibleLeads,
  visibleNotes,
  visibleStatuses,
  type Note,
  type StatusRow,
} from "@/lib/crmv4/round127";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  saleStatus?: string | null;
};

type GlanceRow = StatusRow & { id: string };

export function LoungeNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [zone, setZone] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(LOUNGE_KEY, []));
    setNotes(next);
    writeJson(LOUNGE_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(LOUNGE_KEY, next);
  }

  return (
    <section className="c4-lounge" aria-label={v4("lngTitle")} data-lounge="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-lng-logo" data-logo="mono">{v4("lngLogo")}</p>
          <p className="c4-pay-kicker">{v4("lngSub")}</p>
          <h2 className="c4-title">{v4("lngTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("lngHint")}</p>
      <p className="c4-meta">{v4("lngLocal")}</p>
      <p className="c4-meta">{v4("lngBlank")}</p>
      <p className="c4-meta">{v4("lngZoneBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `lng-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, zone });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setZone("");
      }}>
        <label className="c4-lab">
          <span>{v4("lngText")}</span>
          <input className="c4-field" aria-label={v4("lngText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("lngZone")}</span>
          <input className="c4-field" aria-label={v4("lngZone")} value={zone} maxLength={40} onChange={(event) => setZone(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("lngAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("lngReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("lngSearch")}</span>
        <input className="c4-field" aria-label={v4("lngSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("lngTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("lngOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("lngHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("lngEmpty")}</p>}
      <ul className="c4-lng-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.zone ? <p className="c4-meta">{note.zone}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("lngUnpin") : v4("lngPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("lngShow") : v4("lngHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LeadStatuses({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      status: row.saleStatus,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenStatuses(readJson(LEAD_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(LEAD_STATUS_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleLeads(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(LEAD_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-lead-stat" aria-label={v4("ldsTitle")} data-lead-stat="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("ldsSub")}</p>
          <h2 className="c4-title">{v4("ldsTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("ldsRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("ldsHint")}</p>
      <p className="c4-meta">{v4("ldsLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "leads")}>{v4("ldsBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ldsLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ldsFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("ldsNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-lds-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("ldsBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("ldsShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ldsShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ldsHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ldsTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("ldsAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c4-lds-pair" data-status={item}>
              <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("ldsShow") : v4("ldsHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("ldsSearch")}</span>
        <input className="c4-field" aria-label={v4("ldsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("ldsEmpty")}</p>}
      <ul className="c4-lds-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("ldsBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
