"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { DONE_KEY, isOverdue, readIds, shiftDay, toggleDone, utcToday, type DayItem } from "@/lib/crmv3/dense";
import { crmv3Href } from "@/lib/crmv3/sections";
import { SCALE_KEY, SCALES, readScale, weekBoard, weekStart, type PanelScale } from "@/lib/crmv3/week";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

const SCALE_LABEL: Record<PanelScale, CrmV3CopyKey> = {
  small: "tySmall",
  desk: "tyDesk",
  large: "tyLarge",
};

export function WeekAgenda({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
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
    <section className="c3-week-strip" aria-label={v3("wkTitle")} data-week-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("wkSub")}</p>
          <h2 className="c3-title">{v3("wkTitle")}</h2>
        </div>
        <p className="c3-muted">{start}</p>
      </header>
      <p className="c3-muted">{v3("wkHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => setCursor(shiftDay(start, -7))}>{v3("wkPrev")}</button>
        <button type="button" className="c3-btn" data-week-today="" onClick={() => setCursor(today)}>{v3("wkToday")}</button>
        <button type="button" className="c3-btn" onClick={() => setCursor(shiftDay(start, 7))}>{v3("wkNext")}</button>
      </div>
      <label className="c3-lab">
        <span>{v3("wkSearch")}</span>
        <input className="c3-field" aria-label={v3("wkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {(people.loading || calendar.loading) && !people.data && !calendar.data && <p className="c3-muted">{v3("wkLoading")}</p>}
      {(people.error || calendar.error) && <p className="c3-muted">{v3("wkFailed")} {tx("failed")}</p>}
      <ul className="c3-week-list">
        {days.map((day) => (
          <li key={day.day} className="c3-week-card" data-today={day.day === today ? "1" : "0"} data-empty={day.items.length ? "0" : "1"}>
            <h3 className="c3-title">{new Date(`${day.day}T00:00:00Z`).toLocaleDateString(locale || "en", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</h3>
            {isOverdue(day.day, today) && <p className="c3-muted">{v3("wkOverdue")}</p>}
            {!day.items.length && <p className="c3-muted">{v3("wkEmpty")}</p>}
            <ul className="c3-week-items">
              {day.items.map((item) => (
                <WeekLine key={item.id} base={base} item={item} done={done.includes(item.id)} onDone={() => mark(item.id)} />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeekLine({ base, item, done, onDone }: { base: string; item: DayItem; done: boolean; onDone: () => void }) {
  const v3 = useV3();
  const followId = item.kind === "follow" ? item.id.slice("follow:".length) : "";
  return (
    <li data-done={done ? "1" : "0"} data-kind={item.kind}>
      <p className="c3-muted">{item.kind === "follow" ? v3("wkFollow") : v3("wkTask")}</p>
      {followId ? <Link className="c3-btn" href={crmv3Href(base, `customers/${followId}`)}>{v3("wkOpen")} {item.name}</Link> : <p>{item.name}</p>}
      <button type="button" className="c3-btn" data-week-done="" aria-pressed={done} onClick={onDone}>{done ? v3("wkUndo") : v3("wkDone")}</button>
    </li>
  );
}

export function FontScale() {
  const v3 = useV3();
  const [scale, setScale] = useState<PanelScale>("desk");
  useEffect(() => { setScale(readScale(readJson(SCALE_KEY, "desk"))); }, []);

  function choose(next: PanelScale) {
    setScale(next);
    writeJson(SCALE_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv3:scale", { detail: next }));
  }

  return (
    <section className="c3-scale-strip" aria-label={v3("tyTitle")} data-scale-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("tySub")}</p>
          <h2 className="c3-title">{v3("tyTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("tyHint")}</p>
      <p className="c3-muted">{v3("tyLocal")}</p>
      <p className="c3-muted">{v3("tyPad")}</p>
      <div className="c3-row" role="group" aria-label={v3("tyTitle")}>
        {SCALES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-scale={item} data-on={scale === item ? "1" : "0"} aria-pressed={scale === item} onClick={() => choose(item)}>
            {v3(SCALE_LABEL[item])}
          </button>
        ))}
      </div>
      <p className="c3-scale-preview" data-scale-preview="">{v3("tyPreview")}</p>
    </section>
  );
}
