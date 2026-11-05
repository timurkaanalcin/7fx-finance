"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { QUIET_KEY, readQuiet } from "@/lib/crmv3/leads";
import { crmv3Href } from "@/lib/crmv3/sections";
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
} from "@/lib/crmv3/shield";
import { useJson } from "../kit";
import { useV3 } from "./store";

type Person = { id: string; name?: string | null; email?: string | null };

function publish() {
  window.dispatchEvent(new Event("crmv3:quiet"));
}

export function QuietShield() {
  const v3 = useV3();
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
    <section className="c3-shield-pad" aria-label={v3("qhTitle")} data-shield-pad="1" data-shield={on ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("qhSub")}</p>
          <h2 className="c3-title">{v3("qhTitle")}</h2>
        </div>
        <p className="c3-muted">{on ? v3("qhOn") : v3("qhOff")}</p>
      </header>
      <p className="c3-muted">{v3("qhHint")}</p>
      <p className="c3-muted">{v3("qhLocal")}</p>
      <p className="c3-muted">{v3("qhBoards")}</p>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("qhStart")}</span>
          <input className="c3-field" type="time" aria-label={v3("qhStart")} value={quiet.start} onChange={(event) => storeQuiet({ ...quiet, start: event.target.value })} />
        </label>
        <label className="c3-lab">
          <span>{v3("qhEnd")}</span>
          <input className="c3-field" type="time" aria-label={v3("qhEnd")} value={quiet.end} onChange={(event) => storeQuiet({ ...quiet, end: event.target.value })} />
        </label>
      </div>
      <p className="c3-muted">{v3("qhSame")}</p>
      <button type="button" className="c3-chip" data-pause="" data-on={pauseOn(pause, now) ? "1" : "0"} aria-pressed={pauseOn(pause, now)} onClick={() => storePause(pauseOn(pause, now) ? "" : tomorrowUtc(now))}>
        {pauseOn(pause, now) ? v3("qhPaused") : v3("qhPause")}
      </button>
    </section>
  );
}

export function StickyPad({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-sticky-pad" aria-label={v3("cnTitle")} data-sticky-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("cnSub")}</p>
          <h2 className="c3-title">{v3("cnTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("cnHint")}</p>
      <p className="c3-muted">{v3("cnLocal")}</p>
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("cnNone")}</p>}
      <label className="c3-lab">
        <span>{v3("cnCustomer")}</span>
        <select className="c3-select" aria-label={v3("cnCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">{v3("cnCustomer")}</option>
          {loaded.map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
        </select>
      </label>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("cnBody")}</span>
          <input className="c3-field" aria-label={v3("cnBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const next = addSticky(notes, { id: `note-${Date.now()}`, customerId, body, at: new Date().toISOString() });
          if (next.length === notes.length) return;
          store(next);
          setBody("");
        }}>{v3("cnAdd")}</button>
      </div>
      <p className="c3-muted">{v3("cnBlank")}</p>
      <label className="c3-lab">
        <span>{v3("cnSearch")}</span>
        <input className="c3-field" aria-label={v3("cnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("cnOpen")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("cnOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("cnHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("cnEmpty")}</p>}
      <ul className="c3-sticky-list">
        {shown.map((note) => (
          <li key={note.id} className="c3-sticky-card" data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.body}</p>
            <p className="c3-muted">{names[note.customerId] || note.customerId}</p>
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, `customers/${note.customerId}`)}>{v3("cnOpenCustomer")}</Link>
              <button type="button" className="c3-btn" onClick={() => store(toggleStickyPin(notes, note.id))}>{note.pinned ? v3("cnUnpin") : v3("cnPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setStickyHidden(notes, note.id, !note.hidden))}>{note.hidden ? v3("cnShow") : v3("cnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
