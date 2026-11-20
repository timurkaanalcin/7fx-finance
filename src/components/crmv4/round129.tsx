"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  COAT_KEY,
  KYC_FILE_KEY,
  activeFile,
  addNote,
  fileLines,
  fileText,
  namedFiles,
  readHiddenFiles,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleFile,
  toggleNotePin,
  visibleDocs,
  visibleFiles,
  visibleNotes,
  type FileRow,
  type Note,
} from "@/lib/crmv4/round129";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type DocumentRow = {
  id: string;
  name?: string | null;
  trader?: string | null;
  userDocumentsStatus?: string | null;
};

type GlanceRow = FileRow & { id: string };

export function CoatNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [hook, setHook] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(COAT_KEY, []));
    setNotes(next);
    writeJson(COAT_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);
  const openCount = notes.filter((note) => !note.hidden).length;
  const hideCount = notes.filter((note) => note.hidden).length;
  const hookCount = notes.filter((note) => !note.hook).length;
  const notePeak = Math.max(1, openCount, hideCount, hookCount);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(COAT_KEY, next);
  }

  return (
    <section className="c4-coat c4-coat-apodyterium" aria-label={v4("cctTitle")} data-coat="1" data-desk="apodyterium">
      <header className="c4-coat-apodyterium-mast">
        <p className="c4-coat-apodyterium-seal" data-logo="mono">{v4("cctApodyteriumLogo")}</p>
        <div>
          <p className="c4-coat-apodyterium-kicker">{v4("cctApodyteriumKicker")}</p>
          <h2 className="c4-title c4-coat-apodyterium-title">{v4("cctTitle")}</h2>
          <p className="c4-coat-apodyterium-lead">{v4("cctApodyteriumLead")}</p>
        </div>
        <p className="c4-coat-apodyterium-count">{shown.length}</p>
      </header>
      <ol className="c4-coat-apodyterium-index" aria-label={v4("cctTitle")}>
        <li data-tone="gold">{v4("cctApodyteriumShown")} {openCount}</li>
        <li data-tone="ink">{v4("cctApodyteriumHidden")} {hideCount}</li>
        <li data-tone="ivory">{v4("cctApodyteriumHook")} {hookCount}</li>
      </ol>
      <div className="c4-coat-apodyterium-chart" aria-label={v4("cctTitle")}>
        <button type="button" className="c4-coat-apodyterium-column" data-on={openCount ? "1" : "0"} onClick={() => setHidden(false)}>
          <i style={{ height: `${Math.max(18, Math.round((openCount / notePeak) * 88))}px` }} />
          <strong>{openCount}</strong>
          <span>{v4("cctApodyteriumShown")}</span>
        </button>
        <button type="button" className="c4-coat-apodyterium-column" data-on={hideCount ? "1" : "0"} onClick={() => setHidden(true)}>
          <i style={{ height: `${Math.max(18, Math.round((hideCount / notePeak) * 88))}px` }} />
          <strong>{hideCount}</strong>
          <span>{v4("cctApodyteriumHidden")}</span>
        </button>
        <button type="button" className="c4-coat-apodyterium-column" data-on={hookCount ? "1" : "0"} onClick={() => setHidden(false)}>
          <i style={{ height: `${Math.max(18, Math.round((hookCount / notePeak) * 88))}px` }} />
          <strong>{hookCount}</strong>
          <span>{v4("cctApodyteriumHook")}</span>
        </button>
      </div>
      <p className="c4-meta c4-coat-apodyterium-hint">{v4("cctHint")}</p>
      <p className="c4-meta">{v4("cctLocal")}</p>
      <p className="c4-meta">{v4("cctBlank")}</p>
      <p className="c4-meta">{v4("cctHookBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `cct-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, hook });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setHook("");
      }}>
        <label className="c4-lab">
          <span>{v4("cctText")}</span>
          <input className="c4-field" aria-label={v4("cctText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cctHook")}</span>
          <input className="c4-field" aria-label={v4("cctHook")} value={hook} maxLength={40} onChange={(event) => setHook(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("cctAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("cctReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("cctSearch")}</span>
        <input className="c4-field" aria-label={v4("cctSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cctTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("cctOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("cctHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty c4-coat-apodyterium-empty">{v4("cctEmpty")}</p>}
      <ul className="c4-cct-rows c4-coat-apodyterium-list">
        {shown.map((note) => (
          <li key={note.id} className="c4-coat-apodyterium-card" data-pinned={note.pinned ? "1" : "0"} data-on={note.pinned ? "1" : "0"}>
            <div className="c4-cct-ticket">
              <p>{note.text}</p>
              {note.hook ? <p className="c4-cct-hook">{note.hook}</p> : null}
            </div>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("cctUnpin") : v4("cctPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("cctShow") : v4("cctHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KycFileStatuses({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ documents?: DocumentRow[] }>("/api/admin/documents?take=40");
  const [hiddenFiles, setHiddenFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.documents || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.trader || "").trim(),
      file: row.userDocumentsStatus,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = fileLines(rows);
  const present = namedFiles(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.file)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenFiles(readJson(KYC_FILE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenFiles(next);
    writeJson(KYC_FILE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleFiles(present, hiddenFiles, showHidden);
  const file = activeFile(selected, chips);
  const shown = visibleDocs(rows, file, blank, query);
  const peak = Math.max(1, ...lines.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenFiles(next);
    writeJson(KYC_FILE_KEY, next);
    if (clear && activeFile(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-kyc-file c4-kyc-file-officina" aria-label={v4("kflTitle")} data-kyc-file="1" data-desk="officina">
      <header className="c4-pay-head c4-kfl-officina-mast">
        <p className="c4-kfl-officina-seal" data-logo="mono">{v4("kflOfficinaLogo")}</p>
        <div>
          <p className="c4-kfl-officina-kicker">{v4("kflOfficinaKicker")}</p>
          <h2 className="c4-title c4-kfl-officina-title">{v4("kflTitle")}</h2>
          <p className="c4-kfl-officina-lead">{v4("kflOfficinaLead")}</p>
        </div>
        <p className="c4-kfl-officina-count">{shown.length}</p>
      </header>
      <ol className="c4-kfl-officina-index" aria-label={v4("kflOfficinaKicker")}>
        <li data-tone="gold">{v4("kflOfficinaRows")} {rows.length}</li>
        <li data-tone="ink">{v4("kflOfficinaShown")} {shown.length}</li>
        <li data-tone="ivory">{v4("kflOfficinaBlank")} {blankCount}</li>
      </ol>
      <div className="c4-kfl-officina-rail" aria-hidden="true">
        {lines.filter((line) => line.file).map((line) => (
          <i key={line.file} style={{ height: `${Math.max(12, Math.round((line.count / peak) * 52))}px` }} />
        ))}
      </div>
      <p className="c4-meta">{v4("kflHint")}</p>
      <p className="c4-meta">{v4("kflLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "kyc")}>{v4("kflBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("kflLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("kflFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("kflNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-kfl-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("kflBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("kflShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("kflShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("kflHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("kflTitle")}>
        <button type="button" className="c4-chip" data-on={!file && !blank ? "1" : "0"} aria-pressed={!file && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("kflAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.file === item)?.count || 0;
          return (
            <span key={item} className="c4-kfl-pair" data-file={item}>
              <button type="button" className="c4-chip c4-kfl-chip" data-on={file === item ? "1" : "0"} aria-pressed={file === item} onClick={() => { setBlank(false); setSelected(file === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleFile(hiddenFiles, item, present), showHidden ? "" : item)}>{showHidden ? v4("kflShow") : v4("kflHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("kflSearch")}</span>
        <input className="c4-field" aria-label={v4("kflSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("kflEmpty")}</p>}
      <ul className="c4-kfl-rows c4-kfl-officina-list">
        {shown.map((row) => {
          const name = fileText(row.file);
          return (
            <li key={row.id} className="c4-kfl-officina-card" data-file={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-kfl-stamp">{name || v4("kflBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
