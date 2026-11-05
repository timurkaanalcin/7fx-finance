"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  KYC_STATUS_KEY,
  SUPPLY_KEY,
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
  visibleCustomers,
  visibleNotes,
  visibleStatuses,
  type Note,
  type StatusRow,
} from "@/lib/crmv4/round124";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  documentsStatus?: string | null;
};

type GlanceRow = StatusRow & { id: string };

export function SupplyNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [bin, setBin] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(SUPPLY_KEY, []));
    setNotes(next);
    writeJson(SUPPLY_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(SUPPLY_KEY, next);
  }

  return (
    <section className="c4-supply" aria-label={v4("splTitle")} data-supply="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-spl-logo" data-logo="mono">{v4("splLogo")}</p>
          <p className="c4-pay-kicker">{v4("splSub")}</p>
          <h2 className="c4-title">{v4("splTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("splHint")}</p>
      <p className="c4-meta">{v4("splLocal")}</p>
      <p className="c4-meta">{v4("splBlank")}</p>
      <p className="c4-meta">{v4("splBinBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `spl-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, bin });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setBin("");
      }}>
        <label className="c4-lab">
          <span>{v4("splText")}</span>
          <input className="c4-field" aria-label={v4("splText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("splBin")}</span>
          <input className="c4-field" aria-label={v4("splBin")} value={bin} maxLength={40} onChange={(event) => setBin(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("splAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("splReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("splSearch")}</span>
        <input className="c4-field" aria-label={v4("splSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("splTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("splOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("splHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("splEmpty")}</p>}
      <ul className="c4-spl-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.bin ? <p className="c4-meta">{note.bin}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("splUnpin") : v4("splPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("splShow") : v4("splHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KycStatuses({ base, v4 }: { base: string; v4: V4 }) {
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
      status: row.documentsStatus,
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
    const next = readHiddenStatuses(readJson(KYC_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(KYC_STATUS_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleCustomers(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(KYC_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-kyc-sg" aria-label={v4("kysTitle")} data-kyc-sg="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("kysSub")}</p>
          <h2 className="c4-title">{v4("kysTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("kysRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("kysHint")}</p>
      <p className="c4-meta">{v4("kysLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "kyc")}>{v4("kysBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("kysLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("kysFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("kysNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-kys-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("kysBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("kysShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("kysShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("kysHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("kysTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("kysAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c4-kys-pair" data-status={item}>
              <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("kysShow") : v4("kysHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("kysSearch")}</span>
        <input className="c4-field" aria-label={v4("kysSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("kysEmpty")}</p>}
      <ul className="c4-kys-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("kysBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
