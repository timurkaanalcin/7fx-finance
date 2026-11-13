"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CHANNEL_KEY,
  MARK_KEY,
  activeChannel,
  addMark,
  channelLines,
  channelText,
  namedChannels,
  readHiddenChannels,
  readMarks,
  setMarkHidden,
  todayUtc,
  toggleChannel,
  toggleMarkPin,
  visibleChannels,
  visibleDeposits,
  visibleMarks,
  type ChannelRow,
  type Mark,
} from "@/lib/crmv4/round86";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Deposit = {
  id: string;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
  method?: { label?: string | null; type?: string | null } | null;
};

type GlanceRow = ChannelRow & { id: string; userId: string };

export function UtcMarks({ v4 }: { v4: V4 }) {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [day, setDay] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  const [today, setToday] = useState("");
  useEffect(() => {
    const next = readMarks(readJson(MARK_KEY, []));
    setMarks(next);
    writeJson(MARK_KEY, next);
    setToday(todayUtc(Date.now()));
  }, []);
  const shown = visibleMarks(marks, query, hidden);

  function store(next: Mark[]) {
    setMarks(next);
    writeJson(MARK_KEY, next);
  }

  function jumpToday() {
    const utc = todayUtc(Date.now());
    setToday(utc);
    const mark = marks.find((item) => item.day === utc);
    if (mark?.hidden) setHidden(true);
    else setHidden(false);
    setQuery(mark ? utc : "");
  }

  return (
    <section className="c4-utc-marks c4-date-rail" aria-label={v4("cdTitle")} data-utc-marks="1" data-desk="rail">
      <header className="c4-date-rail-mast">
        <p className="c4-date-rail-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-date-rail-kicker">{v4("cdRailKicker")}</p>
          <h2 className="c4-title c4-date-rail-title">{v4("cdTitle")}</h2>
          <p className="c4-date-rail-lead">{v4("cdRailLead")}</p>
        </div>
        <p className="c4-date-rail-count">{shown.length}</p>
      </header>
      <ol className="c4-date-rail-index" aria-label={v4("cdTitle")}>
        <li data-tone="gold">{v4("cdRailGold")}</li>
        <li data-tone="ink">{v4("cdRailInk")}</li>
        <li data-tone="ivory">{v4("cdRailIvory")}</li>
      </ol>
      <p className="c4-date-rail-hint">{v4("cdHint")}</p>
      <p className="c4-meta">{v4("cdLocal")}</p>
      {today && <p className="c4-meta" data-today-utc="">{v4("cdToday")} {today}</p>}
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addMark(marks, { id: `cd-${day || Date.now()}`, day, at: new Date().toISOString() });
        if (next.length === marks.length) return;
        store(next);
        setDay("");
      }}>
        <label className="c4-lab">
          <span>{v4("cdDate")}</span>
          <input className="c4-field" type="date" aria-label={v4("cdDate")} value={day} onChange={(event) => setDay(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("cdAdd")}</button>
      </form>
      <p className="c4-meta">{v4("cdBlank")}</p>
      <label className="c4-lab">
        <span>{v4("cdSearch")}</span>
        <input className="c4-field" aria-label={v4("cdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cdShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("cdShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("cdHidden")}</button>
        <button type="button" className="c4-btn" onClick={jumpToday}>{v4("cdToday")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("cdEmpty")}</p>}
      <ul className="c4-utc-list c4-date-rail-list">
        {shown.map((mark) => (
          <li key={mark.id} className="c4-utc-card c4-date-rail-card" data-pinned={mark.pinned ? "1" : "0"} data-today={mark.day === today ? "1" : "0"}>
            <p>{mark.day}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleMarkPin(marks, mark.id))}>{mark.pinned ? v4("cdUnpin") : v4("cdPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setMarkHidden(marks, mark.id, !mark.hidden))}>{mark.hidden ? v4("cdShow") : v4("cdHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ChannelGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ requests?: Deposit[] }>("/api/admin/deposits?take=40");
  const [hiddenChannels, setHiddenChannels] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.requests || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      method: row.method,
      label: String(row.user?.name || row.user?.email || ""),
      userId: String(row.user?.id || row.userId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = channelLines(rows);
  const present = namedChannels(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.channel)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenChannels(readJson(CHANNEL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenChannels(next);
    writeJson(CHANNEL_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleChannels(present, hiddenChannels, showHidden);
  const channel = activeChannel(selected, chips);
  const shown = visibleDeposits(rows, channel, blank, query);

  function store(next: string[], clear: string) {
    setHiddenChannels(next);
    writeJson(CHANNEL_KEY, next);
    if (clear && activeChannel(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-channel-glance" aria-label={v4("dcTitle")} data-channel-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("dcSub")}</p>
          <h2 className="c4-title">{v4("dcTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("dcHint")}</p>
      <p className="c4-meta">{v4("dcLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "depboard")}>{v4("dcBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("dcLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("dcFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("dcNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-channel-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("dcBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("dcShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("dcShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("dcHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dcTitle")}>
        <button type="button" className="c4-chip" data-on={!channel && !blank ? "1" : "0"} aria-pressed={!channel && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("dcAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-channel-pair" data-channel={item}>
            <button type="button" className="c4-chip" data-on={channel === item ? "1" : "0"} aria-pressed={channel === item} onClick={() => { setBlank(false); setSelected(channel === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleChannel(hiddenChannels, item, present), showHidden ? "" : item)}>{showHidden ? v4("dcShow") : v4("dcHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("dcSearch")}</span>
        <input className="c4-field" aria-label={v4("dcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("dcEmpty")}</p>}
      <ul className="c4-channel-rows">
        {shown.map((row) => {
          const name = channelText(row.method);
          return (
            <li key={row.id} data-channel={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("dcBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("dcCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
