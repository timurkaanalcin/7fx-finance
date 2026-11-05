"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/mailroom";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useV3 } from "./store";
import { useJson } from "../kit";


type Withdrawal = {
  id: string;
  status?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string };

export function MailNotes() {
  const v3 = useV3();
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
    <section className="c3-mail-room" aria-label={v3("mlrTitle")} data-mail-room="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-mlr-logo" data-logo="mono">{v3("mlrLogo")}</p>
          <p className="c3-pay-kicker">{v3("mlrSub")}</p>
          <h2 className="c3-title">{v3("mlrTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("mlrHint")}</p>
      <p className="c3-meta">{v3("mlrLocal")}</p>
      <p className="c3-meta">{v3("mlrBlank")}</p>
      <p className="c3-meta">{v3("mlrSlotBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `mlr-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, slot });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setSlot("");
      }}>
        <label className="c3-lab">
          <span>{v3("mlrText")}</span>
          <input className="c3-field" aria-label={v3("mlrText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("mlrSlot")}</span>
          <input className="c3-field" aria-label={v3("mlrSlot")} value={slot} maxLength={40} onChange={(event) => setSlot(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("mlrAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetNotes())}>{v3("mlrReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("mlrSearch")}</span>
        <input className="c3-field" aria-label={v3("mlrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("mlrTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("mlrOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("mlrHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("mlrEmpty")}</p>}
      <ul className="c3-mlr-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.slot ? <p className="c3-meta">{note.slot}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v3("mlrUnpin") : v3("mlrPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v3("mlrShow") : v3("mlrHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WithdrawalStatuses({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-wd-stat" aria-label={v3("wsgTitle")} data-wd-stat="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("wsgSub")}</p>
          <h2 className="c3-title">{v3("wsgTitle")}</h2>
        </div>
        <p className="c3-meta">{v3("wsgRows")} {rows.length}</p>
      </header>
      <p className="c3-meta">{v3("wsgHint")}</p>
      <p className="c3-meta">{v3("wsgLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "withdraw")}>{v3("wsgBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("wsgLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("wsgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("wsgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-wsg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("wsgBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("wsgShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("wsgShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("wsgHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("wsgTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("wsgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c3-wsg-pair" data-status={item}>
              <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("wsgShow") : v3("wsgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("wsgSearch")}</span>
        <input className="c3-field" aria-label={v3("wsgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("wsgEmpty")}</p>}
      <ul className="c3-wsg-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("wsgBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
