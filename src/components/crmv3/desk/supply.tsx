"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/supply";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useV3 } from "./store";
import { useJson } from "../kit";

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  documentsStatus?: string | null;
};

type GlanceRow = StatusRow & { id: string };

export function SupplyNotes() {
  const v3 = useV3();
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
    <section className="c3-supply" aria-label={v3("splTitle")} data-supply="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-spl-logo" data-logo="mono">{v3("splLogo")}</p>
          <p className="c3-pay-kicker">{v3("splSub")}</p>
          <h2 className="c3-title">{v3("splTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("splHint")}</p>
      <p className="c3-meta">{v3("splLocal")}</p>
      <p className="c3-meta">{v3("splBlank")}</p>
      <p className="c3-meta">{v3("splBinBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `spl-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, bin });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setBin("");
      }}>
        <label className="c3-lab">
          <span>{v3("splText")}</span>
          <input className="c3-field" aria-label={v3("splText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("splBin")}</span>
          <input className="c3-field" aria-label={v3("splBin")} value={bin} maxLength={40} onChange={(event) => setBin(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("splAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetNotes())}>{v3("splReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("splSearch")}</span>
        <input className="c3-field" aria-label={v3("splSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("splTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("splOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("splHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("splEmpty")}</p>}
      <ul className="c3-spl-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.bin ? <p className="c3-meta">{note.bin}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v3("splUnpin") : v3("splPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v3("splShow") : v3("splHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KycStatuses({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-kyc-sg" aria-label={v3("kysTitle")} data-kyc-sg="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("kysSub")}</p>
          <h2 className="c3-title">{v3("kysTitle")}</h2>
        </div>
        <p className="c3-meta">{v3("kysRows")} {rows.length}</p>
      </header>
      <p className="c3-meta">{v3("kysHint")}</p>
      <p className="c3-meta">{v3("kysLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "kyc")}>{v3("kysBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("kysLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("kysFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("kysNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-kys-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("kysBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("kysShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("kysShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("kysHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("kysTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("kysAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c3-kys-pair" data-status={item}>
              <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("kysShow") : v3("kysHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("kysSearch")}</span>
        <input className="c3-field" aria-label={v3("kysSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("kysEmpty")}</p>}
      <ul className="c3-kys-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("kysBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
