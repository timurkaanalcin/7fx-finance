"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  CALLBACK_KEY,
  PRIORITY_HIDE_KEY,
  activePriority,
  addNote,
  namedPriorities,
  priorityLines,
  priorityText,
  readHiddenPriorities,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleNotePin,
  togglePriority,
  visibleCases,
  visibleNotes,
  visiblePriorities,
  type Note,
  type PriorityRow,
} from "@/lib/crmv3/callbackqueue";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useV3 } from "./store";
import { useJson } from "../kit";


type Ticket = {
  id: string;
  customer?: string | null;
  customerEmail?: string | null;
  priority?: string | number | null;
};

type GlanceRow = PriorityRow & { id: string };

export function CallbackQueue() {
  const v3 = useV3();
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(CALLBACK_KEY, []));
    setNotes(next);
    writeJson(CALLBACK_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(CALLBACK_KEY, next);
  }

  return (
    <section className="c3-callback-queue" aria-label={v3("cbTitle")} data-callback-queue="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-cb-logo" data-logo="mono">{v3("cbLogo")}</p>
          <p className="c3-pay-kicker">{v3("cbSub")}</p>
          <h2 className="c3-title">{v3("cbTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("cbHint")}</p>
      <p className="c3-meta">{v3("cbLocal")}</p>
      <p className="c3-meta">{v3("cbBlank")}</p>
      <p className="c3-meta">{v3("cbWhenBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `cb-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, when });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setWhen("");
      }}>
        <label className="c3-lab">
          <span>{v3("cbText")}</span>
          <input className="c3-field" aria-label={v3("cbText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("cbWhen")}</span>
          <input className="c3-field" aria-label={v3("cbWhen")} value={when} maxLength={40} onChange={(event) => setWhen(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("cbAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetNotes())}>{v3("cbReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("cbSearch")}</span>
        <input className="c3-field" aria-label={v3("cbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("cbTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("cbOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("cbHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("cbEmpty")}</p>}
      <ul className="c3-cb-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.when ? <p className="c3-meta">{note.when}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v3("cbUnpin") : v3("cbPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v3("cbShow") : v3("cbHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CasePriorities({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?take=40");
  const [hiddenPriorities, setHiddenPriorities] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.tickets || []).map((row): GlanceRow => ({
    id: String(row.id || ""),
    label: String(row.customer || row.customerEmail || "").trim(),
    priority: row.priority,
  })).filter((row) => row.id);
  const lines = priorityLines(rows);
  const present = namedPriorities(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.priority)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenPriorities(readJson(PRIORITY_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenPriorities(next);
    writeJson(PRIORITY_HIDE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visiblePriorities(present, hiddenPriorities, showHidden);
  const priority = activePriority(selected, chips);
  const shown = visibleCases(rows, priority, blank, query);

  function store(next: string[], clear: string) {
    setHiddenPriorities(next);
    writeJson(PRIORITY_HIDE_KEY, next);
    if (clear && activePriority(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-case-prio" aria-label={v3("zpTitle")} data-case-prio="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("zpSub")}</p>
          <h2 className="c3-title">{v3("zpTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("zpHint")}</p>
      <p className="c3-meta">{v3("zpLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "support")}>{v3("zpBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("zpLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("zpFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("zpNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-zp-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("zpBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("zpShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("zpShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("zpHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("zpTitle")}>
        <button type="button" className="c3-chip" data-on={!priority && !blank ? "1" : "0"} aria-pressed={!priority && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("zpAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.priority === item)?.count || 0;
          return (
            <span key={item} className="c3-zp-pair" data-priority={item}>
              <button type="button" className="c3-chip" data-on={priority === item ? "1" : "0"} aria-pressed={priority === item} onClick={() => { setBlank(false); setSelected(priority === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(togglePriority(hiddenPriorities, item, present), showHidden ? "" : item)}>{showHidden ? v3("zpShow") : v3("zpHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("zpSearch")}</span>
        <input className="c3-field" aria-label={v3("zpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("zpEmpty")}</p>}
      <ul className="c3-zp-rows">
        {shown.map((row) => {
          const name = priorityText(row.priority);
          return (
            <li key={row.id} data-priority={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("zpBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
