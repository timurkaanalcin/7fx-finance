"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  DOC_STATUS_KEY,
  VISIT_KEY,
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
  visibleDocs,
  visibleNotes,
  visibleStatuses,
  type Note,
  type StatusRow,
} from "@/lib/crmv4/round117";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type DocumentRow = {
  id: string;
  status?: string | null;
  name?: string | null;
  trader?: string | null;
};

type GlanceRow = StatusRow & { id: string };

export function VisitLog({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [place, setPlace] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(VISIT_KEY, []));
    setNotes(next);
    writeJson(VISIT_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(VISIT_KEY, next);
  }

  return (
    <section className="c4-visit-log" aria-label={v4("vlTitle")} data-visit-log="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-vl-logo" data-logo="mono">{v4("vlLogo")}</p>
          <p className="c4-pay-kicker">{v4("vlSub")}</p>
          <h2 className="c4-title">{v4("vlTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("vlHint")}</p>
      <p className="c4-meta">{v4("vlLocal")}</p>
      <p className="c4-meta">{v4("vlBlank")}</p>
      <p className="c4-meta">{v4("vlPlaceBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `vl-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, place });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setPlace("");
      }}>
        <label className="c4-lab">
          <span>{v4("vlText")}</span>
          <input className="c4-field" aria-label={v4("vlText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("vlPlace")}</span>
          <input className="c4-field" aria-label={v4("vlPlace")} value={place} maxLength={40} onChange={(event) => setPlace(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("vlAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("vlReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("vlSearch")}</span>
        <input className="c4-field" aria-label={v4("vlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("vlTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("vlOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("vlHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("vlEmpty")}</p>}
      <ul className="c4-vl-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.place ? <p className="c4-meta">{note.place}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("vlUnpin") : v4("vlPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("vlShow") : v4("vlHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DocumentStatuses({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ documents?: DocumentRow[] }>("/api/admin/documents?take=40");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.documents || []).map((row): GlanceRow => ({
    id: String(row.id || ""),
    label: String(row.name || row.trader || "").trim(),
    status: row.status,
  })).filter((row) => row.id);
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenStatuses(readJson(DOC_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(DOC_STATUS_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleDocs(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(DOC_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-kyc-stat" aria-label={v4("ydTitle")} data-kyc-stat="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("ydSub")}</p>
          <h2 className="c4-title">{v4("ydTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("ydHint")}</p>
      <p className="c4-meta">{v4("ydLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "kyc")}>{v4("ydBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ydLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ydFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("ydNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-yd-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("ydBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("ydShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ydShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ydHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ydTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("ydAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c4-yd-pair" data-status={item}>
              <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("ydShow") : v4("ydHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("ydSearch")}</span>
        <input className="c4-field" aria-label={v4("ydSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("ydEmpty")}</p>}
      <ul className="c4-yd-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("ydBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
