"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { DONE_KEY, isOverdue, readIds, shiftDay, toggleDone, utcToday, type DayItem } from "@/lib/crmv4/round51";
import { SCALE_KEY, SCALES, readScale, weekBoard, weekStart, type PanelScale } from "@/lib/crmv4/round73";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const SCALE_LABEL: Record<PanelScale, CrmV4CopyKey> = {
  small: "tySmall",
  desk: "tyDesk",
  large: "tyLarge",
};

export function WeekAgenda({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
  const people = useJson<{ users?: { id: string; name?: string | null; retentionFollowUpAt?: string | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const calendar = useJson<{ reminders?: { id: string; body?: string | null; remindAt?: string | null }[] }>("/api/admin/calendar?take=80");
  const [cursor, setCursor] = useState(() => utcToday(Date.now()));
  const [query, setQuery] = useState("");
  const [done, setDone] = useState<string[]>([]);
  const today = utcToday(Date.now());
  useEffect(() => { setDone(readIds(readJson(DONE_KEY, []))); }, []);
  const days = weekBoard(
    (people.data?.users || []).map((row) => ({ id: row.id, name: row.name, at: row.retentionFollowUpAt })),
    (calendar.data?.reminders || []).map((row) => ({ id: row.id, name: row.body, at: row.remindAt })),
    cursor,
    query,
  );
  const start = weekStart(cursor);

  function mark(id: string) {
    const next = toggleDone(done, id);
    setDone(next);
    writeJson(DONE_KEY, next);
  }

  return (
    <section className="c4-week-strip" aria-label={v4("wkTitle")} data-week-strip="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("wkSub")}</p>
          <h2 className="c4-title">{v4("wkTitle")}</h2>
        </div>
        <p className="c4-meta">{start}</p>
      </header>
      <p className="c4-meta">{v4("wkHint")}</p>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setCursor(shiftDay(start, -7))}>{v4("wkPrev")}</button>
        <button type="button" className="c4-btn" data-week-today="" onClick={() => setCursor(today)}>{v4("wkToday")}</button>
        <button type="button" className="c4-btn" onClick={() => setCursor(shiftDay(start, 7))}>{v4("wkNext")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("wkSearch")}</span>
        <input className="c4-field" aria-label={v4("wkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {(people.loading || calendar.loading) && !people.data && !calendar.data && <p className="c4-meta">{v4("wkLoading")}</p>}
      {(people.error || calendar.error) && <p className="c4-meta">{v4("wkFailed")} {tx("failed")}</p>}
      <ul className="c4-week-list">
        {days.map((day) => (
          <li key={day.day} className="c4-week-card" data-today={day.day === today ? "1" : "0"} data-empty={day.items.length ? "0" : "1"}>
            <h3 className="c4-title">{new Date(`${day.day}T00:00:00Z`).toLocaleDateString(locale || "en", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</h3>
            {isOverdue(day.day, today) && <p className="c4-meta">{v4("wkOverdue")}</p>}
            {!day.items.length && <p className="c4-meta">{v4("wkEmpty")}</p>}
            <ul className="c4-week-items">
              {day.items.map((item) => (
                <WeekLine key={item.id} base={base} item={item} done={done.includes(item.id)} v4={v4} onDone={() => mark(item.id)} />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeekLine({ base, item, done, v4, onDone }: { base: string; item: DayItem; done: boolean; v4: V4; onDone: () => void }) {
  const followId = item.kind === "follow" ? item.id.slice("follow:".length) : "";
  return (
    <li data-done={done ? "1" : "0"} data-kind={item.kind}>
      <p className="c4-meta">{item.kind === "follow" ? v4("wkFollow") : v4("wkTask")}</p>
      {followId ? <Link className="c4-btn" href={crmv4Href(base, `customers/${followId}`)}>{v4("wkOpen")} {item.name}</Link> : <p>{item.name}</p>}
      <button type="button" className="c4-btn" data-week-done="" aria-pressed={done} onClick={onDone}>{done ? v4("wkUndo") : v4("wkDone")}</button>
    </li>
  );
}

export function FontScale({ v4 }: { v4: V4 }) {
  const [scale, setScale] = useState<PanelScale>("desk");
  useEffect(() => { setScale(readScale(readJson(SCALE_KEY, "desk"))); }, []);

  function choose(next: PanelScale) {
    setScale(next);
    writeJson(SCALE_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:scale", { detail: next }));
  }

  return (
    <section className="c4-scale-strip" aria-label={v4("tyTitle")} data-scale-strip="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("tySub")}</p>
          <h2 className="c4-title">{v4("tyTitle")}</h2>
        </div>
      </header>
      <p className="c4-meta">{v4("tyHint")}</p>
      <p className="c4-meta">{v4("tyLocal")}</p>
      <p className="c4-meta">{v4("tyPad")}</p>
      <div className="c4-row" role="group" aria-label={v4("tyTitle")}>
        {SCALES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-scale={item} data-on={scale === item ? "1" : "0"} aria-pressed={scale === item} onClick={() => choose(item)}>
            {v4(SCALE_LABEL[item])}
          </button>
        ))}
      </div>
      <p className="c4-scale-preview" data-scale-preview="">{v4("tyPreview")}</p>
    </section>
  );
}
