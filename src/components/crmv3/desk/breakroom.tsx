"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/breakroom";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useV3 } from "./store";
import { useJson } from "../kit";

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  campaign?: string | null;
};

type GlanceRow = ChannelRow & { id: string };

export function BreakNotes() {
  const v3 = useV3();
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
    <section className="c3-break" aria-label={v3("brkTitle")} data-break="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-brk-logo" data-logo="mono">{v3("brkLogo")}</p>
          <p className="c3-pay-kicker">{v3("brkSub")}</p>
          <h2 className="c3-title">{v3("brkTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("brkHint")}</p>
      <p className="c3-meta">{v3("brkLocal")}</p>
      <p className="c3-meta">{v3("brkBlank")}</p>
      <p className="c3-meta">{v3("brkCornerBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `brk-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, corner });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setCorner("");
      }}>
        <label className="c3-lab">
          <span>{v3("brkText")}</span>
          <input className="c3-field" aria-label={v3("brkText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("brkCorner")}</span>
          <input className="c3-field" aria-label={v3("brkCorner")} value={corner} maxLength={40} onChange={(event) => setCorner(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("brkAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetNotes())}>{v3("brkReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("brkSearch")}</span>
        <input className="c3-field" aria-label={v3("brkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("brkTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("brkOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("brkHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("brkEmpty")}</p>}
      <ul className="c3-brk-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.corner ? <p className="c3-meta">{note.corner}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v3("brkUnpin") : v3("brkPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v3("brkShow") : v3("brkHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AffiliateChannels({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-aff-chan" aria-label={v3("acgTitle")} data-aff-chan="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("acgSub")}</p>
          <h2 className="c3-title">{v3("acgTitle")}</h2>
        </div>
        <p className="c3-meta">{v3("acgRows")} {rows.length}</p>
      </header>
      <p className="c3-meta">{v3("acgHint")}</p>
      <p className="c3-meta">{v3("acgLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "affiliates")}>{v3("acgBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("acgLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("acgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("acgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-acg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("acgBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("acgShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("acgShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("acgHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("acgTitle")}>
        <button type="button" className="c3-chip" data-on={!channel && !blank ? "1" : "0"} aria-pressed={!channel && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("acgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.channel === item)?.count || 0;
          return (
            <span key={item} className="c3-acg-pair" data-channel={item}>
              <button type="button" className="c3-chip" data-on={channel === item ? "1" : "0"} aria-pressed={channel === item} onClick={() => { setBlank(false); setSelected(channel === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleChannel(hiddenChannels, item, present), showHidden ? "" : item)}>{showHidden ? v3("acgShow") : v3("acgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("acgSearch")}</span>
        <input className="c3-field" aria-label={v3("acgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("acgEmpty")}</p>}
      <ul className="c3-acg-rows">
        {shown.map((row) => {
          const name = channelText(row.channel);
          return (
            <li key={row.id} data-channel={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("acgBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
