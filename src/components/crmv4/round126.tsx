"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  AFF_CHANNEL_KEY,
  BREAK_KEY,
  activeChannel,
  addNote,
  channelLines,
  channelText,
  namedChannels,
  readHiddenChannels,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleChannel,
  toggleNotePin,
  visibleChannels,
  visibleNotes,
  visibleTraders,
  type ChannelRow,
  type Note,
} from "@/lib/crmv4/round126";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  campaign?: string | null;
};

type GlanceRow = ChannelRow & { id: string };

export function BreakNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [corner, setCorner] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(BREAK_KEY, []));
    setNotes(next);
    writeJson(BREAK_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(BREAK_KEY, next);
  }

  return (
    <section className="c4-break" aria-label={v4("brkTitle")} data-break="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-brk-logo" data-logo="mono">{v4("brkLogo")}</p>
          <p className="c4-pay-kicker">{v4("brkSub")}</p>
          <h2 className="c4-title">{v4("brkTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("brkHint")}</p>
      <p className="c4-meta">{v4("brkLocal")}</p>
      <p className="c4-meta">{v4("brkBlank")}</p>
      <p className="c4-meta">{v4("brkCornerBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `brk-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, corner });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setCorner("");
      }}>
        <label className="c4-lab">
          <span>{v4("brkText")}</span>
          <input className="c4-field" aria-label={v4("brkText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("brkCorner")}</span>
          <input className="c4-field" aria-label={v4("brkCorner")} value={corner} maxLength={40} onChange={(event) => setCorner(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("brkAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("brkReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("brkSearch")}</span>
        <input className="c4-field" aria-label={v4("brkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("brkTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("brkOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("brkHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("brkEmpty")}</p>}
      <ul className="c4-brk-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.corner ? <p className="c4-meta">{note.corner}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("brkUnpin") : v4("brkPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("brkShow") : v4("brkHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AffiliateChannels({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenChannels, setHiddenChannels] = useState<string[]>([]);
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
      channel: { campaign: row.campaign },
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = channelLines(rows);
  const present = namedChannels(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.channel)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenChannels(readJson(AFF_CHANNEL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenChannels(next);
    writeJson(AFF_CHANNEL_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleChannels(present, hiddenChannels, showHidden);
  const channel = activeChannel(selected, chips);
  const shown = visibleTraders(rows, channel, blank, query);

  function store(next: string[], clear: string) {
    setHiddenChannels(next);
    writeJson(AFF_CHANNEL_KEY, next);
    if (clear && activeChannel(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-aff-chan" aria-label={v4("acgTitle")} data-aff-chan="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("acgSub")}</p>
          <h2 className="c4-title">{v4("acgTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("acgRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("acgHint")}</p>
      <p className="c4-meta">{v4("acgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "affiliates")}>{v4("acgBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("acgLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("acgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("acgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-acg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("acgBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("acgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("acgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("acgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("acgTitle")}>
        <button type="button" className="c4-chip" data-on={!channel && !blank ? "1" : "0"} aria-pressed={!channel && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("acgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.channel === item)?.count || 0;
          return (
            <span key={item} className="c4-acg-pair" data-channel={item}>
              <button type="button" className="c4-chip" data-on={channel === item ? "1" : "0"} aria-pressed={channel === item} onClick={() => { setBlank(false); setSelected(channel === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleChannel(hiddenChannels, item, present), showHidden ? "" : item)}>{showHidden ? v4("acgShow") : v4("acgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("acgSearch")}</span>
        <input className="c4-field" aria-label={v4("acgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("acgEmpty")}</p>}
      <ul className="c4-acg-rows">
        {shown.map((row) => {
          const name = channelText(row.channel);
          return (
            <li key={row.id} data-channel={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("acgBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
