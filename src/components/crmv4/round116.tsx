"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round116";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Ticket = {
  id: string;
  customer?: string | null;
  customerEmail?: string | null;
  priority?: string | number | null;
};

type GlanceRow = PriorityRow & { id: string };

export function CallbackQueue({ v4 }: { v4: V4 }) {
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
    <section className="c4-callback-queue" aria-label={v4("cbTitle")} data-callback-queue="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-cb-logo" data-logo="mono">{v4("cbLogo")}</p>
          <p className="c4-pay-kicker">{v4("cbSub")}</p>
          <h2 className="c4-title">{v4("cbTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("cbHint")}</p>
      <p className="c4-meta">{v4("cbLocal")}</p>
      <p className="c4-meta">{v4("cbBlank")}</p>
      <p className="c4-meta">{v4("cbWhenBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `cb-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, when });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setWhen("");
      }}>
        <label className="c4-lab">
          <span>{v4("cbText")}</span>
          <input className="c4-field" aria-label={v4("cbText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cbWhen")}</span>
          <input className="c4-field" aria-label={v4("cbWhen")} value={when} maxLength={40} onChange={(event) => setWhen(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("cbAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("cbReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("cbSearch")}</span>
        <input className="c4-field" aria-label={v4("cbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cbTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("cbOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("cbHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("cbEmpty")}</p>}
      <ul className="c4-cb-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.when ? <p className="c4-meta">{note.when}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("cbUnpin") : v4("cbPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("cbShow") : v4("cbHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CasePriorities({ base, v4 }: { base: string; v4: V4 }) {
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
    <section className="c4-case-prio" aria-label={v4("zpTitle")} data-case-prio="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("zpSub")}</p>
          <h2 className="c4-title">{v4("zpTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("zpHint")}</p>
      <p className="c4-meta">{v4("zpLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "support")}>{v4("zpBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("zpLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("zpFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("zpNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-zp-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("zpBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("zpShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("zpShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("zpHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("zpTitle")}>
        <button type="button" className="c4-chip" data-on={!priority && !blank ? "1" : "0"} aria-pressed={!priority && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("zpAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.priority === item)?.count || 0;
          return (
            <span key={item} className="c4-zp-pair" data-priority={item}>
              <button type="button" className="c4-chip" data-on={priority === item ? "1" : "0"} aria-pressed={priority === item} onClick={() => { setBlank(false); setSelected(priority === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(togglePriority(hiddenPriorities, item, present), showHidden ? "" : item)}>{showHidden ? v4("zpShow") : v4("zpHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("zpSearch")}</span>
        <input className="c4-field" aria-label={v4("zpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("zpEmpty")}</p>}
      <ul className="c4-zp-rows">
        {shown.map((row) => {
          const name = priorityText(row.priority);
          return (
            <li key={row.id} data-priority={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("zpBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
