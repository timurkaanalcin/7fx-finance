"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  POTENTIAL_KEY,
  VALET_KEY,
  activePotential,
  addNote,
  namedPotentials,
  notesCsv,
  potentialLines,
  potentialText,
  readHiddenPotentials,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleNotePin,
  togglePotential,
  visibleCustomers,
  visibleNotes,
  visiblePotentials,
  type Note,
  type PotentialRow,
} from "@/lib/crmv4/round131";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  potentialStatus?: string | null;
};

type GlanceRow = PotentialRow & { id: string };

export function ValetNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [stand, setStand] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(VALET_KEY, []));
    setNotes(next);
    writeJson(VALET_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(VALET_KEY, next);
  }

  function clearDraft() {
    setText("");
    setStand("");
  }

  function exportCsv() {
    const blob = new Blob([notesCsv(notes)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "valet-notes.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="c4-valet" aria-label={v4("vltTitle")} data-valet="1">
      <header className="c4-vlt-head">
        <p className="c4-vlt-plate" data-logo="mono">{v4("vltLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("vltSub")}</p>
          <h2 className="c4-title">{v4("vltTitle")}</h2>
        </div>
        <p className="c4-vlt-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("vltHint")}</p>
      <p className="c4-meta">{v4("vltLocal")}</p>
      <p className="c4-meta">{v4("vltBlank")}</p>
      <p className="c4-meta">{v4("vltStandBlank")}</p>
      <p className="c4-meta">{v4("vltEscape")}</p>
      <form className="c4-vlt-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `vlt-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, stand });
        if (next.length === notes.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("vltText")}</span>
          <input className="c4-field" aria-label={v4("vltText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("vltStand")}</span>
          <input className="c4-field" aria-label={v4("vltStand")} value={stand} maxLength={24} onChange={(event) => setStand(event.target.value)} />
        </label>
        <div className="c4-row">
          <button type="submit" className="c4-btn">{v4("vltAdd")}</button>
          <button type="button" className="c4-btn" onClick={exportCsv}>{v4("vltCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("vltReset")}</button>
        </div>
      </form>
      <label className="c4-lab">
        <span>{v4("vltSearch")}</span>
        <input className="c4-field" aria-label={v4("vltSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("vltTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("vltOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("vltHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("vltEmpty")}</p>}
      <ul className="c4-vlt-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <span className="c4-vlt-perf" aria-hidden="true" />
            <div>
              <p>{note.text}</p>
              {note.stand ? <p className="c4-vlt-stand">{note.stand}</p> : null}
            </div>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("vltUnpin") : v4("vltPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("vltShow") : v4("vltHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PotentialStatuses({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenPotentials, setHiddenPotentials] = useState<string[]>([]);
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
      potential: row.potentialStatus,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = potentialLines(rows);
  const present = namedPotentials(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.potential)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenPotentials(readJson(POTENTIAL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenPotentials(next);
    writeJson(POTENTIAL_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visiblePotentials(present, hiddenPotentials, showHidden);
  const potential = activePotential(selected, chips);
  const shown = visibleCustomers(rows, potential, blank, query);

  function store(next: string[], clear: string) {
    setHiddenPotentials(next);
    writeJson(POTENTIAL_KEY, next);
    if (clear && activePotential(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-potential" aria-label={v4("potTitle")} data-potential="1">
      <header className="c4-pot-head">
        <div>
          <p className="c4-pay-kicker">{v4("potSub")}</p>
          <h2 className="c4-title">{v4("potTitle")}</h2>
        </div>
        <p className="c4-vlt-count">{v4("potRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("potHint")}</p>
      <p className="c4-meta">{v4("potLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("potBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("potLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("potFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("potNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-pot-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("potBlank")}</span>
          <span className="c4-vlt-count">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("potShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("potShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("potHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("potTitle")}>
        <button type="button" className="c4-chip" data-on={!potential && !blank ? "1" : "0"} aria-pressed={!potential && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("potAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.potential === item)?.count || 0;
          return (
            <span key={item} className="c4-pot-pair" data-potential={item}>
              <button type="button" className="c4-chip" data-on={potential === item ? "1" : "0"} aria-pressed={potential === item} onClick={() => { setBlank(false); setSelected(potential === item ? "" : item); }}>{item}</button>
              <span className="c4-vlt-count">{count}</span>
              <button type="button" className="c4-btn" onClick={() => store(togglePotential(hiddenPotentials, item, present), showHidden ? "" : item)}>{showHidden ? v4("potShow") : v4("potHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("potSearch")}</span>
        <input className="c4-field" aria-label={v4("potSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("potEmpty")}</p>}
      <ul className="c4-pot-rows">
        {shown.map((row) => {
          const name = potentialText(row.potential);
          return (
            <li key={row.id} data-potential={name || "blank"}>
              <span className="c4-pot-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("potBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
