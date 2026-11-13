"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { QUIET_KEY, readQuiet } from "@/lib/crmv4/round56";
import {
  NOTE_KEY,
  PAUSE_KEY,
  addSticky,
  pauseOn,
  readPause,
  readStickies,
  setStickyHidden,
  shieldOn,
  toggleStickyPin,
  tomorrowUtc,
  visibleStickies,
  type Sticky,
} from "@/lib/crmv4/round74";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = { id: string; name?: string | null; email?: string | null };

function publish() {
  window.dispatchEvent(new Event("crmv4:quiet"));
}

export function QuietShield({ v4, base = "/izcrm/crmv4" }: { v4: V4; base?: string }) {
  const [quiet, setQuiet] = useState({ start: "", end: "" });
  const [pause, setPause] = useState("");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setQuiet(readQuiet(readJson(QUIET_KEY, {})));
    setPause(readPause(readJson(PAUSE_KEY, "")));
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const on = shieldOn(quiet, pause, now);

  function storeQuiet(next: { start: string; end: string }) {
    const saved = readQuiet(next);
    setQuiet(saved);
    writeJson(QUIET_KEY, saved);
    publish();
  }

  function storePause(next: string) {
    setPause(next);
    writeJson(PAUSE_KEY, next);
    publish();
  }

  return (
    <section className="c4-shield-pad c4-shield-folio" aria-label={v4("qhTitle")} data-shield-pad="1" data-desk="folio" data-shield={on ? "1" : "0"}>
      <header className="c4-shield-folio-mast">
        <p className="c4-shield-folio-seal" data-logo="mono">7FX</p>
        <div className="c4-shield-folio-copy">
          <p className="c4-shield-folio-kicker">{v4("hygFolioKicker")}</p>
          <h2 className="c4-title c4-shield-folio-title">{v4("qhTitle")}</h2>
          <p className="c4-shield-folio-lead">{v4("hygFolioLead")}</p>
        </div>
        <p className="c4-shield-folio-state" data-on={on ? "1" : "0"}>{on ? v4("qhOn") : v4("qhOff")}</p>
      </header>
      <p className="c4-shield-folio-links">
        <Link href={crmv4Href(base, "hyg")}>{v4("hygFolioCards")}</Link>
        <Link href={crmv4Href(base, "stickies")}>{v4("cnTitle")}</Link>
      </p>
      <p className="c4-meta">{v4("qhHint")}</p>
      <p className="c4-meta">{v4("qhLocal")}</p>
      <p className="c4-meta">{v4("qhBoards")}</p>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("qhStart")}</span>
          <input className="c4-field" type="time" aria-label={v4("qhStart")} value={quiet.start} onChange={(event) => storeQuiet({ ...quiet, start: event.target.value })} />
        </label>
        <label className="c4-lab">
          <span>{v4("qhEnd")}</span>
          <input className="c4-field" type="time" aria-label={v4("qhEnd")} value={quiet.end} onChange={(event) => storeQuiet({ ...quiet, end: event.target.value })} />
        </label>
      </div>
      <p className="c4-meta">{v4("qhSame")}</p>
      <button type="button" className="c4-chip" data-pause="" data-on={pauseOn(pause, now) ? "1" : "0"} aria-pressed={pauseOn(pause, now)} onClick={() => storePause(pauseOn(pause, now) ? "" : tomorrowUtc(now))}>
        {pauseOn(pause, now) ? v4("qhPaused") : v4("qhPause")}
      </button>
    </section>
  );
}

export function StickyPad({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [notes, setNotes] = useState<Sticky[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => { setNotes(readStickies(readJson(NOTE_KEY, []))); }, []);
  const loaded = data.data?.users || [];
  const names: Record<string, string> = {};
  for (const person of loaded) names[person.id] = String(person.name || person.email || person.id);
  const shown = visibleStickies(notes, query, hidden);

  function store(next: Sticky[]) {
    setNotes(next);
    writeJson(NOTE_KEY, next);
  }

  return (
    <section className="c4-sticky-pad c4-sticky-folio" aria-label={v4("cnTitle")} data-sticky-pad="1" data-desk="folio">
      <header className="c4-sticky-folio-mast">
        <p className="c4-sticky-folio-seal" data-logo="mono">7FX</p>
        <div className="c4-sticky-folio-copy">
          <p className="c4-sticky-folio-kicker">{v4("hygFolioKicker")}</p>
          <h2 className="c4-title c4-sticky-folio-title">{v4("cnTitle")}</h2>
          <p className="c4-sticky-folio-lead">{v4("hygFolioLead")}</p>
        </div>
        <p className="c4-sticky-folio-count">{shown.length}</p>
      </header>
      <p className="c4-sticky-folio-links">
        <Link href={crmv4Href(base, "shield")}>{v4("qhTitle")}</Link>
        <Link href={crmv4Href(base, "rgs")}>{v4("hygFolioPlates")}</Link>
      </p>
      <p className="c4-meta">{v4("cnHint")}</p>
      <p className="c4-meta">{v4("cnLocal")}</p>
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("cnNone")}</p>}
      <label className="c4-lab">
        <span>{v4("cnCustomer")}</span>
        <select className="c4-select" aria-label={v4("cnCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">{v4("cnCustomer")}</option>
          {loaded.map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
        </select>
      </label>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addSticky(notes, { id: `note-${Date.now()}`, customerId, body, at: new Date().toISOString() });
        if (next.length === notes.length) return;
        store(next);
        setBody("");
      }}>
        <label className="c4-lab">
          <span>{v4("cnBody")}</span>
          <input className="c4-field" aria-label={v4("cnBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("cnAdd")}</button>
      </form>
      <p className="c4-meta">{v4("cnBlank")}</p>
      <label className="c4-lab">
        <span>{v4("cnSearch")}</span>
        <input className="c4-field" aria-label={v4("cnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cnOpen")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("cnOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("cnHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty c4-sticky-folio-empty">{v4("cnEmpty")}</p>}
      <ul className="c4-sticky-list">
        {shown.map((note) => (
          <li key={note.id} className="c4-sticky-card" data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.body}</p>
            <p className="c4-meta">{names[note.customerId] || note.customerId}</p>
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, `customers/${note.customerId}`)}>{v4("cnOpenCustomer")}</Link>
              <button type="button" className="c4-btn" onClick={() => store(toggleStickyPin(notes, note.id))}>{note.pinned ? v4("cnUnpin") : v4("cnPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setStickyHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("cnShow") : v4("cnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
