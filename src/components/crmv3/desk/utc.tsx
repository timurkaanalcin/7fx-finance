"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/utcmark";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const DEPOSITS = "/api/admin/deposits?take=40";

type Deposit = {
  id: string;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
  method?: { label?: string | null; type?: string | null } | null;
};

type GlanceRow = ChannelRow & { id: string; userId: string };

export function UtcMarks() {
  const v3 = useV3();
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
    <section className="c3-utc-marks" aria-label={v3("cdTitle")} data-utc-marks="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("cdSub")}</p>
          <h2 className="c3-title">{v3("cdTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("cdHint")}</p>
      <p className="c3-muted">{v3("cdLocal")}</p>
      {today && <p className="c3-muted" data-today-utc="">{v3("cdToday")} {today}</p>}
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addMark(marks, { id: `cd-${day || Date.now()}`, day, at: new Date().toISOString() });
        if (next.length === marks.length) return;
        store(next);
        setDay("");
      }}>
        <label className="c3-lab">
          <span>{v3("cdDate")}</span>
          <input className="c3-field" type="date" aria-label={v3("cdDate")} value={day} onChange={(event) => setDay(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("cdAdd")}</button>
      </form>
      <p className="c3-muted">{v3("cdBlank")}</p>
      <label className="c3-lab">
        <span>{v3("cdSearch")}</span>
        <input className="c3-field" aria-label={v3("cdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("cdShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("cdShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("cdHidden")}</button>
        <button type="button" className="c3-btn" onClick={jumpToday}>{v3("cdToday")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("cdEmpty")}</p>}
      <ul className="c3-utc-list">
        {shown.map((mark) => (
          <li key={mark.id} className="c3-utc-card" data-pinned={mark.pinned ? "1" : "0"} data-today={mark.day === today ? "1" : "0"}>
            <p>{mark.day}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleMarkPin(marks, mark.id))}>{mark.pinned ? v3("cdUnpin") : v3("cdPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setMarkHidden(marks, mark.id, !mark.hidden))}>{mark.hidden ? v3("cdShow") : v3("cdHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ChannelGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ requests?: Deposit[] }>(DEPOSITS);
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
    <section className="c3-channel-glance" aria-label={v3("dcTitle")} data-channel-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("dcSub")}</p>
          <h2 className="c3-title">{v3("dcTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("dcHint")}</p>
      <p className="c3-muted">{v3("dcLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "depboard")}>{v3("dcBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("dcLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("dcFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("dcNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-channel-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("dcBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("dcShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("dcShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("dcHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("dcTitle")}>
        <button type="button" className="c3-chip" data-on={!channel && !blank ? "1" : "0"} aria-pressed={!channel && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("dcAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-channel-pair" data-channel={item}>
            <button type="button" className="c3-chip" data-on={channel === item ? "1" : "0"} aria-pressed={channel === item} onClick={() => { setBlank(false); setSelected(channel === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleChannel(hiddenChannels, item, present), showHidden ? "" : item)}>{showHidden ? v3("dcShow") : v3("dcHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("dcSearch")}</span>
        <input className="c3-field" aria-label={v3("dcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("dcEmpty")}</p>}
      <ul className="c3-channel-rows">
        {shown.map((row) => {
          const name = channelText(row.method);
          return (
            <li key={row.id} data-channel={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("dcBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("dcCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
