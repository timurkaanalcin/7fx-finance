"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CONCIERGE_KEY,
  RETAIN_KEY,
  activeRetain,
  addNote,
  namedRetains,
  readHiddenRetains,
  readNotes,
  resetNotes,
  retainLines,
  retainText,
  setNoteHidden,
  toggleNotePin,
  toggleRetain,
  visibleCustomers,
  visibleNotes,
  visibleRetains,
  type Note,
  type RetainRow,
} from "@/lib/crmv4/round130";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  retentionStatus?: string | null;
};

type GlanceRow = RetainRow & { id: string };

export function ConciergeNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [errand, setErrand] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(CONCIERGE_KEY, []));
    setNotes(next);
    writeJson(CONCIERGE_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(CONCIERGE_KEY, next);
  }

  return (
    <section className="c4-concierge" aria-label={v4("cncTitle")} data-concierge="1">
      <header className="c4-cnc-head">
        <p className="c4-cnc-seal" data-logo="mono">{v4("cncLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("cncSub")}</p>
          <h2 className="c4-title">{v4("cncTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("cncHint")}</p>
      <p className="c4-meta">{v4("cncLocal")}</p>
      <p className="c4-meta">{v4("cncBlank")}</p>
      <p className="c4-meta">{v4("cncErrandBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `cnc-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, errand });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setErrand("");
      }}>
        <label className="c4-lab">
          <span>{v4("cncText")}</span>
          <input className="c4-field" aria-label={v4("cncText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cncErrand")}</span>
          <input className="c4-field" aria-label={v4("cncErrand")} value={errand} maxLength={40} onChange={(event) => setErrand(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("cncAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("cncReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("cncSearch")}</span>
        <input className="c4-field" aria-label={v4("cncSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cncTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("cncOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("cncHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("cncEmpty")}</p>}
      <ul className="c4-cnc-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <div>
              <p>{note.text}</p>
              {note.errand ? <p className="c4-cnc-errand">{note.errand}</p> : null}
            </div>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("cncUnpin") : v4("cncPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("cncShow") : v4("cncHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RetentionStatuses({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenRetains, setHiddenRetains] = useState<string[]>([]);
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
      retain: row.retentionStatus,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = retainLines(rows);
  const present = namedRetains(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.retain)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenRetains(readJson(RETAIN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenRetains(next);
    writeJson(RETAIN_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleRetains(present, hiddenRetains, showHidden);
  const retain = activeRetain(selected, chips);
  const shown = visibleCustomers(rows, retain, blank, query);

  function store(next: string[], clear: string) {
    setHiddenRetains(next);
    writeJson(RETAIN_KEY, next);
    if (clear && activeRetain(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-retain" aria-label={v4("rtnTitle")} data-retain="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("rtnSub")}</p>
          <h2 className="c4-title">{v4("rtnTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("rtnRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("rtnHint")}</p>
      <p className="c4-meta">{v4("rtnLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("rtnBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("rtnLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("rtnFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("rtnNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-rtn-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("rtnBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("rtnShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("rtnShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("rtnHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("rtnTitle")}>
        <button type="button" className="c4-chip" data-on={!retain && !blank ? "1" : "0"} aria-pressed={!retain && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("rtnAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.retain === item)?.count || 0;
          return (
            <span key={item} className="c4-rtn-pair" data-retain={item}>
              <button type="button" className="c4-chip" data-on={retain === item ? "1" : "0"} aria-pressed={retain === item} onClick={() => { setBlank(false); setSelected(retain === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleRetain(hiddenRetains, item, present), showHidden ? "" : item)}>{showHidden ? v4("rtnShow") : v4("rtnHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("rtnSearch")}</span>
        <input className="c4-field" aria-label={v4("rtnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("rtnEmpty")}</p>}
      <ul className="c4-rtn-rows">
        {shown.map((row) => {
          const name = retainText(row.retain);
          return (
            <li key={row.id} data-retain={name || "blank"}>
              <span className="c4-rtn-rail" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("rtnBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
