"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  ACCOUNT_TYPE_KEY,
  PANTRY_KEY,
  activeType,
  addNote,
  namedTypes,
  readHiddenTypes,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleNotePin,
  toggleType,
  typeLines,
  typeText,
  visibleNotes,
  visibleTypes,
  visibleUsers,
  type Note,
  type TypeRow,
} from "@/lib/crmv4/round128";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  accountType?: string | null;
};

type GlanceRow = TypeRow & { id: string };

export function PantryNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [shelf, setShelf] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(PANTRY_KEY, []));
    setNotes(next);
    writeJson(PANTRY_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(PANTRY_KEY, next);
  }

  return (
    <section className="c4-pantry" aria-label={v4("pntTitle")} data-pantry="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pnt-logo" data-logo="mono">{v4("pntLogo")}</p>
          <p className="c4-pay-kicker">{v4("pntSub")}</p>
          <h2 className="c4-title">{v4("pntTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("pntHint")}</p>
      <p className="c4-meta">{v4("pntLocal")}</p>
      <p className="c4-meta">{v4("pntBlank")}</p>
      <p className="c4-meta">{v4("pntShelfBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `pnt-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, shelf });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setShelf("");
      }}>
        <label className="c4-lab">
          <span>{v4("pntText")}</span>
          <input className="c4-field" aria-label={v4("pntText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("pntShelf")}</span>
          <input className="c4-field" aria-label={v4("pntShelf")} value={shelf} maxLength={40} onChange={(event) => setShelf(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("pntAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("pntReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("pntSearch")}</span>
        <input className="c4-field" aria-label={v4("pntSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("pntTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("pntOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("pntHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("pntEmpty")}</p>}
      <ul className="c4-pnt-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.shelf ? <p className="c4-meta">{note.shelf}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("pntUnpin") : v4("pntPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("pntShow") : v4("pntHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AccountTypes({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);
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
      type: row.accountType,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = typeLines(rows);
  const present = namedTypes(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.type)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenTypes(readJson(ACCOUNT_TYPE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenTypes(next);
    writeJson(ACCOUNT_TYPE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleTypes(present, hiddenTypes, showHidden);
  const type = activeType(selected, chips);
  const shown = visibleUsers(rows, type, blank, query);

  function store(next: string[], clear: string) {
    setHiddenTypes(next);
    writeJson(ACCOUNT_TYPE_KEY, next);
    if (clear && activeType(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-acct-type" aria-label={v4("atyTitle")} data-acct-type="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("atySub")}</p>
          <h2 className="c4-title">{v4("atyTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("atyRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("atyHint")}</p>
      <p className="c4-meta">{v4("atyLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("atyBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("atyLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("atyFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("atyNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-aty-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("atyBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("atyShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("atyShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("atyHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("atyTitle")}>
        <button type="button" className="c4-chip" data-on={!type && !blank ? "1" : "0"} aria-pressed={!type && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("atyAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.type === item)?.count || 0;
          return (
            <span key={item} className="c4-aty-pair" data-type={item}>
              <button type="button" className="c4-chip" data-on={type === item ? "1" : "0"} aria-pressed={type === item} onClick={() => { setBlank(false); setSelected(type === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleType(hiddenTypes, item, present), showHidden ? "" : item)}>{showHidden ? v4("atyShow") : v4("atyHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("atySearch")}</span>
        <input className="c4-field" aria-label={v4("atySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("atyEmpty")}</p>}
      <ul className="c4-aty-rows">
        {shown.map((row) => {
          const name = typeText(row.type);
          return (
            <li key={row.id} data-type={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("atyBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
