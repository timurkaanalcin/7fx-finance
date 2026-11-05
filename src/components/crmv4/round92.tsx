"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round92";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

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

export function ReminderChips({ v4 }: { v4: V4 }) {
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
    <section className="c4-reminder-chips" aria-label={v4("rmTitle")} data-reminder-chips="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("rmSub")}</p>
          <h2 className="c4-title">{v4("rmTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("rmHint")}</p>
      <p className="c4-meta">{v4("rmLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addReminder(reminders, { id: `rm-${Date.now()}`, text, time, at: new Date().toISOString() });
        if (next.length === reminders.length) return;
        store(next);
        setText("");
        setTime("");
      }}>
        <label className="c4-lab">
          <span>{v4("rmText")}</span>
          <input className="c4-field" aria-label={v4("rmText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("rmTime")}</span>
          <input className="c4-field" aria-label={v4("rmTime")} value={time} placeholder="14:30" inputMode="numeric" onChange={(event) => setTime(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("rmAdd")}</button>
      </form>
      <p className="c4-meta">{v4("rmBlank")}</p>
      <p className="c4-meta">{v4("rmClock")}</p>
      <label className="c4-lab">
        <span>{v4("rmSearch")}</span>
        <input className="c4-field" aria-label={v4("rmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("rmShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("rmShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("rmHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("rmEmpty")}</p>}
      <ul className="c4-reminder-list">
        {shown.map((reminder) => (
          <li key={reminder.id} className="c4-reminder-card" data-pinned={reminder.pinned ? "1" : "0"}>
            <p>{reminder.text}</p>
            {reminder.time && <p className="c4-meta">{reminder.time.replace("Z", "")} {v4("rmUtc")}</p>}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleReminderPin(reminders, reminder.id))}>{reminder.pinned ? v4("rmUnpin") : v4("rmPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setReminderHidden(reminders, reminder.id, !reminder.hidden))}>{reminder.hidden ? v4("rmShow") : v4("rmHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SourceGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
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
    <section className="c4-source-glance" aria-label={v4("lsTitle")} data-source-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("lsSub")}</p>
          <h2 className="c4-title">{v4("lsTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("lsHint")}</p>
      <p className="c4-meta">{v4("lsLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "leads")}>{v4("lsBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("lsLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("lsFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("lsNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-source-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("lsBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("lsShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("lsShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("lsHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("lsTitle")}>
        <button type="button" className="c4-chip" data-on={!source && !blank ? "1" : "0"} aria-pressed={!source && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("lsAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-source-pair" data-source={item}>
            <button type="button" className="c4-chip" data-on={source === item ? "1" : "0"} aria-pressed={source === item} onClick={() => { setBlank(false); setSelected(source === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleSource(hiddenSources, item, present), showHidden ? "" : item)}>{showHidden ? v4("lsShow") : v4("lsHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("lsSearch")}</span>
        <input className="c4-field" aria-label={v4("lsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("lsEmpty")}</p>}
      <ul className="c4-source-rows">
        {shown.map((row) => {
          const name = sourceText(row.source);
          return (
            <li key={row.id} data-source={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("lsBlank")}</p>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("lsCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
