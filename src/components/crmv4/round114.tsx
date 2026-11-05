"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round114";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Order = {
  id: string;
  symbol?: string | null;
  status?: string | null;
  traderName?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string };

export function MeetingNotes({ v4 }: { v4: V4 }) {
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
    <section className="c4-meet-notes" aria-label={v4("mnTitle")} data-meet-notes="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-mn-logo" data-logo="mono">{v4("mnLogo")}</p>
          <p className="c4-pay-kicker">{v4("mnSub")}</p>
          <h2 className="c4-title">{v4("mnTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("mnHint")}</p>
      <p className="c4-meta">{v4("mnLocal")}</p>
      <p className="c4-meta">{v4("mnBlank")}</p>
      <p className="c4-meta">{v4("mnWhoBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `mn-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, attendee: who });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setWho("");
      }}>
        <label className="c4-lab">
          <span>{v4("mnText")}</span>
          <input className="c4-field" aria-label={v4("mnText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("mnWho")}</span>
          <input className="c4-field" aria-label={v4("mnWho")} value={who} maxLength={40} onChange={(event) => setWho(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("mnAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("mnReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("mnSearch")}</span>
        <input className="c4-field" aria-label={v4("mnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("mnTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("mnOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("mnHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("mnEmpty")}</p>}
      <ul className="c4-mn-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.attendee ? <p className="c4-meta">{note.attendee}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("mnUnpin") : v4("mnPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("mnShow") : v4("mnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OrderStatuses({ base, v4 }: { base: string; v4: V4 }) {
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
    <section className="c4-order-stat" aria-label={v4("jqTitle")} data-order-stat="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("jqSub")}</p>
          <h2 className="c4-title">{v4("jqTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("jqHint")}</p>
      <p className="c4-meta">{v4("jqLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "blotter")}>{v4("jqBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("jqLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("jqFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("jqNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-jq-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("jqBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("jqShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("jqShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("jqHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("jqTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("jqAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c4-jq-pair" data-status={item}>
              <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("jqShow") : v4("jqHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("jqSearch")}</span>
        <input className="c4-field" aria-label={v4("jqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("jqEmpty")}</p>}
      <ul className="c4-jq-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("jqBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
