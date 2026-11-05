"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  MAIL_KEY,
  WD_STATUS_KEY,
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
  visibleWithdrawals,
  type Note,
  type StatusRow,
} from "@/lib/crmv4/round122";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Withdrawal = {
  id: string;
  status?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string };

export function MailNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [slot, setSlot] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(MAIL_KEY, []));
    setNotes(next);
    writeJson(MAIL_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(MAIL_KEY, next);
  }

  return (
    <section className="c4-mail-room" aria-label={v4("mlrTitle")} data-mail-room="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-mlr-logo" data-logo="mono">{v4("mlrLogo")}</p>
          <p className="c4-pay-kicker">{v4("mlrSub")}</p>
          <h2 className="c4-title">{v4("mlrTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("mlrHint")}</p>
      <p className="c4-meta">{v4("mlrLocal")}</p>
      <p className="c4-meta">{v4("mlrBlank")}</p>
      <p className="c4-meta">{v4("mlrSlotBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `mlr-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, slot });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setSlot("");
      }}>
        <label className="c4-lab">
          <span>{v4("mlrText")}</span>
          <input className="c4-field" aria-label={v4("mlrText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("mlrSlot")}</span>
          <input className="c4-field" aria-label={v4("mlrSlot")} value={slot} maxLength={40} onChange={(event) => setSlot(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("mlrAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("mlrReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("mlrSearch")}</span>
        <input className="c4-field" aria-label={v4("mlrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("mlrTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("mlrOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("mlrHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("mlrEmpty")}</p>}
      <ul className="c4-mlr-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.slot ? <p className="c4-meta">{note.slot}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("mlrUnpin") : v4("mlrPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("mlrShow") : v4("mlrHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WithdrawalStatuses({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ requests?: Withdrawal[] }>("/api/admin/withdrawals?take=40");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.requests || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.user?.name || row.user?.email || "").trim(),
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
    const next = readHiddenStatuses(readJson(WD_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(WD_STATUS_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleWithdrawals(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(WD_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-wd-stat" aria-label={v4("wsgTitle")} data-wd-stat="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("wsgSub")}</p>
          <h2 className="c4-title">{v4("wsgTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("wsgRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("wsgHint")}</p>
      <p className="c4-meta">{v4("wsgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "withdraw")}>{v4("wsgBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("wsgLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("wsgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("wsgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-wsg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("wsgBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("wsgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("wsgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("wsgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("wsgTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("wsgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c4-wsg-pair" data-status={item}>
              <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("wsgShow") : v4("wsgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("wsgSearch")}</span>
        <input className="c4-field" aria-label={v4("wsgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("wsgEmpty")}</p>}
      <ul className="c4-wsg-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("wsgBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
