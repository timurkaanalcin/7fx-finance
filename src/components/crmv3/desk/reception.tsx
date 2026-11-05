"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  RECEPTION_KEY,
  TICKET_STATUS_KEY,
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
  visibleNotes,
  visibleStatuses,
  visibleTickets,
  type Note,
  type StatusRow,
} from "@/lib/crmv3/reception";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useV3 } from "./store";
import { useJson } from "../kit";


type Ticket = {
  id: string;
  status?: string | null;
  customer?: string | null;
  customerEmail?: string | null;
};

type GlanceRow = StatusRow & { id: string };

export function ReceptionNotes() {
  const v3 = useV3();
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [pane, setPane] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(RECEPTION_KEY, []));
    setNotes(next);
    writeJson(RECEPTION_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(RECEPTION_KEY, next);
  }

  return (
    <section className="c3-reception" aria-label={v3("rxnTitle")} data-reception="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-rxn-logo" data-logo="mono">{v3("rxnLogo")}</p>
          <p className="c3-pay-kicker">{v3("rxnSub")}</p>
          <h2 className="c3-title">{v3("rxnTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("rxnHint")}</p>
      <p className="c3-meta">{v3("rxnLocal")}</p>
      <p className="c3-meta">{v3("rxnBlank")}</p>
      <p className="c3-meta">{v3("rxnPaneBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `rxn-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, pane });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setPane("");
      }}>
        <label className="c3-lab">
          <span>{v3("rxnText")}</span>
          <input className="c3-field" aria-label={v3("rxnText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("rxnPane")}</span>
          <input className="c3-field" aria-label={v3("rxnPane")} value={pane} maxLength={40} onChange={(event) => setPane(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("rxnAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetNotes())}>{v3("rxnReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("rxnSearch")}</span>
        <input className="c3-field" aria-label={v3("rxnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("rxnTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("rxnOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("rxnHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("rxnEmpty")}</p>}
      <ul className="c3-rxn-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.pane ? <p className="c3-meta">{note.pane}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v3("rxnUnpin") : v3("rxnPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v3("rxnShow") : v3("rxnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TicketStatuses({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?take=40");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.tickets || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.customer || row.customerEmail || "").trim(),
      status: row.status,
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
    const next = readHiddenStatuses(readJson(TICKET_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(TICKET_STATUS_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleTickets(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(TICKET_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-tkt-stat" aria-label={v3("tksTitle")} data-tkt-stat="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("tksSub")}</p>
          <h2 className="c3-title">{v3("tksTitle")}</h2>
        </div>
        <p className="c3-meta">{v3("tksRows")} {rows.length}</p>
      </header>
      <p className="c3-meta">{v3("tksHint")}</p>
      <p className="c3-meta">{v3("tksLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "support")}>{v3("tksBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("tksLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("tksFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("tksNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-tks-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("tksBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("tksShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("tksShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("tksHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("tksTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("tksAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c3-tks-pair" data-status={item}>
              <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("tksShow") : v3("tksHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("tksSearch")}</span>
        <input className="c3-field" aria-label={v3("tksSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("tksEmpty")}</p>}
      <ul className="c3-tks-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("tksBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
