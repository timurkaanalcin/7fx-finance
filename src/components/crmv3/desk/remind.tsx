"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  REMIND_KEY,
  SOURCE_KEY,
  activeSource,
  addReminder,
  namedSources,
  readHiddenSources,
  readReminders,
  setReminderHidden,
  sourceLines,
  sourceText,
  toggleReminderPin,
  toggleSource,
  visibleLeads,
  visibleReminders,
  visibleSources,
  type Reminder,
  type SourceRow,
} from "@/lib/crmv3/remind";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const PEOPLE = "/api/admin/users?take=40&meta=0&role=TRADER";

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  source?: string | null;
  leadSource?: string | null;
  campaign?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
  referralCodeUsed?: string | null;
};

type GlanceRow = SourceRow & { id: string };

export function ReminderChips() {
  const v3 = useV3();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readReminders(readJson(REMIND_KEY, []));
    setReminders(next);
    writeJson(REMIND_KEY, next);
  }, []);
  const shown = visibleReminders(reminders, query, hidden);

  function store(next: Reminder[]) {
    setReminders(next);
    writeJson(REMIND_KEY, next);
  }

  return (
    <section className="c3-reminder-chips" aria-label={v3("rmTitle")} data-reminder-chips="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("rmSub")}</p>
          <h2 className="c3-title">{v3("rmTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("rmHint")}</p>
      <p className="c3-muted">{v3("rmLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addReminder(reminders, { id: `rm-${Date.now()}`, text, time, at: new Date().toISOString() });
        if (next.length === reminders.length) return;
        store(next);
        setText("");
        setTime("");
      }}>
        <label className="c3-lab">
          <span>{v3("rmText")}</span>
          <input className="c3-field" aria-label={v3("rmText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("rmTime")}</span>
          <input className="c3-field" aria-label={v3("rmTime")} value={time} placeholder="14:30" inputMode="numeric" onChange={(event) => setTime(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("rmAdd")}</button>
      </form>
      <p className="c3-muted">{v3("rmBlank")}</p>
      <p className="c3-muted">{v3("rmClock")}</p>
      <label className="c3-lab">
        <span>{v3("rmSearch")}</span>
        <input className="c3-field" aria-label={v3("rmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("rmShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("rmShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("rmHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("rmEmpty")}</p>}
      <ul className="c3-reminder-list">
        {shown.map((reminder) => (
          <li key={reminder.id} className="c3-reminder-card" data-pinned={reminder.pinned ? "1" : "0"}>
            <p>{reminder.text}</p>
            {reminder.time && <p className="c3-muted">{reminder.time.replace("Z", "")} {v3("rmUtc")}</p>}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleReminderPin(reminders, reminder.id))}>{reminder.pinned ? v3("rmUnpin") : v3("rmPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setReminderHidden(reminders, reminder.id, !reminder.hidden))}>{reminder.hidden ? v3("rmShow") : v3("rmHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SourceGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>(PEOPLE);
  const [hiddenSources, setHiddenSources] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      source: row,
      label: String(row.name || row.email || ""),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = sourceLines(rows);
  const present = namedSources(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.source)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenSources(readJson(SOURCE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenSources(next);
    writeJson(SOURCE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleSources(present, hiddenSources, showHidden);
  const source = activeSource(selected, chips);
  const shown = visibleLeads(rows, source, blank, query);

  function store(next: string[], clear: string) {
    setHiddenSources(next);
    writeJson(SOURCE_KEY, next);
    if (clear && activeSource(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-source-glance" aria-label={v3("lsTitle")} data-source-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("lsSub")}</p>
          <h2 className="c3-title">{v3("lsTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("lsHint")}</p>
      <p className="c3-muted">{v3("lsLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "leads")}>{v3("lsBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("lsLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("lsFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("lsNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-source-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("lsBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("lsShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("lsShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("lsHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("lsTitle")}>
        <button type="button" className="c3-chip" data-on={!source && !blank ? "1" : "0"} aria-pressed={!source && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("lsAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-source-pair" data-source={item}>
            <button type="button" className="c3-chip" data-on={source === item ? "1" : "0"} aria-pressed={source === item} onClick={() => { setBlank(false); setSelected(source === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleSource(hiddenSources, item, present), showHidden ? "" : item)}>{showHidden ? v3("lsShow") : v3("lsHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("lsSearch")}</span>
        <input className="c3-field" aria-label={v3("lsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("lsEmpty")}</p>}
      <ul className="c3-source-rows">
        {shown.map((row) => {
          const name = sourceText(row.source);
          return (
            <li key={row.id} data-source={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("lsBlank")}</p>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("lsCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
