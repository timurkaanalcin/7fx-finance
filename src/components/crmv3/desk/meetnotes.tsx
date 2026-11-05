"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  MEET_KEY,
  ORDER_STATUS_KEY,
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
  visibleOrders,
  visibleStatuses,
  type Note,
  type StatusRow,
} from "@/lib/crmv3/meetnotes";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

type Order = {
  id: string;
  symbol?: string | null;
  status?: string | null;
  traderName?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string };

export function MeetingNotes() {
  const v3 = useV3();
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [who, setWho] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(MEET_KEY, []));
    setNotes(next);
    writeJson(MEET_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(MEET_KEY, next);
  }

  return (
    <section className="c3-meet-notes" aria-label={v3("mnTitle")} data-meet-notes="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-mn-logo" data-logo="mono">{v3("mnLogo")}</p>
          <p className="c3-pay-kicker">{v3("mnSub")}</p>
          <h2 className="c3-title">{v3("mnTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("mnHint")}</p>
      <p className="c3-meta">{v3("mnLocal")}</p>
      <p className="c3-meta">{v3("mnBlank")}</p>
      <p className="c3-meta">{v3("mnWhoBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `mn-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, attendee: who });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setWho("");
      }}>
        <label className="c3-lab">
          <span>{v3("mnText")}</span>
          <input className="c3-field" aria-label={v3("mnText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("mnWho")}</span>
          <input className="c3-field" aria-label={v3("mnWho")} value={who} maxLength={40} onChange={(event) => setWho(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("mnAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetNotes())}>{v3("mnReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("mnSearch")}</span>
        <input className="c3-field" aria-label={v3("mnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("mnTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("mnOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("mnHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("mnEmpty")}</p>}
      <ul className="c3-mn-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.attendee ? <p className="c3-meta">{note.attendee}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v3("mnUnpin") : v3("mnPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v3("mnShow") : v3("mnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OrderStatuses({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ orders?: Order[] }>("/api/admin/positions?tab=orders&take=40");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.orders || []).map((row): GlanceRow => ({
    id: String(row.id || ""),
    label: `${row.symbol || ""} ${row.traderName || row.user?.name || row.user?.email || ""}`.trim(),
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
    const next = readHiddenStatuses(readJson(ORDER_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(ORDER_STATUS_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleOrders(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(ORDER_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-order-stat" aria-label={v3("jqTitle")} data-order-stat="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("jqSub")}</p>
          <h2 className="c3-title">{v3("jqTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("jqHint")}</p>
      <p className="c3-meta">{v3("jqLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "blotter")}>{v3("jqBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("jqLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("jqFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("jqNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-jq-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("jqBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("jqShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("jqShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("jqHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("jqTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("jqAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c3-jq-pair" data-status={item}>
              <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("jqShow") : v3("jqHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("jqSearch")}</span>
        <input className="c3-field" aria-label={v3("jqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("jqEmpty")}</p>}
      <ul className="c3-jq-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("jqBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
