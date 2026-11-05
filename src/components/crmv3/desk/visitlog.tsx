"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/visitlog";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useV3 } from "./store";
import { useJson } from "../kit";


type DocumentRow = {
  id: string;
  status?: string | null;
  name?: string | null;
  trader?: string | null;
};

type GlanceRow = StatusRow & { id: string };

export function VisitLog() {
  const v3 = useV3();
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
    <section className="c3-visit-log" aria-label={v3("vlTitle")} data-visit-log="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-vl-logo" data-logo="mono">{v3("vlLogo")}</p>
          <p className="c3-pay-kicker">{v3("vlSub")}</p>
          <h2 className="c3-title">{v3("vlTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("vlHint")}</p>
      <p className="c3-meta">{v3("vlLocal")}</p>
      <p className="c3-meta">{v3("vlBlank")}</p>
      <p className="c3-meta">{v3("vlPlaceBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `vl-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, place });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setPlace("");
      }}>
        <label className="c3-lab">
          <span>{v3("vlText")}</span>
          <input className="c3-field" aria-label={v3("vlText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("vlPlace")}</span>
          <input className="c3-field" aria-label={v3("vlPlace")} value={place} maxLength={40} onChange={(event) => setPlace(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("vlAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetNotes())}>{v3("vlReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("vlSearch")}</span>
        <input className="c3-field" aria-label={v3("vlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("vlTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("vlOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("vlHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("vlEmpty")}</p>}
      <ul className="c3-vl-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.place ? <p className="c3-meta">{note.place}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v3("vlUnpin") : v3("vlPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v3("vlShow") : v3("vlHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DocumentStatuses({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-kyc-stat" aria-label={v3("ydTitle")} data-kyc-stat="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("ydSub")}</p>
          <h2 className="c3-title">{v3("ydTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("ydHint")}</p>
      <p className="c3-meta">{v3("ydLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "kyc")}>{v3("ydBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("ydLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("ydFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("ydNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-yd-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("ydBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("ydShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("ydShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("ydHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("ydTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("ydAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c3-yd-pair" data-status={item}>
              <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("ydShow") : v3("ydHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("ydSearch")}</span>
        <input className="c3-field" aria-label={v3("ydSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("ydEmpty")}</p>}
      <ul className="c3-yd-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("ydBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
