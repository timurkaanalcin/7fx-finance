"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  CHANNEL_KEY,
  JUMP_KEY,
  activeChannel,
  channelLines,
  channelText,
  clearVisits,
  namedChannels,
  readHiddenChannels,
  readVisits,
  sectionPath,
  toggleChannel,
  visibleChannels,
  visibleTickets,
  type ChannelRow,
  type Visit,
} from "@/lib/crmv3/jumps";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const TICKETS = "/api/admin/tickets?take=40";

type Ticket = {
  id: string;
  customer?: string | null;
  customerId?: string | null;
  channel?: unknown;
  method?: unknown;
};

type GlanceRow = ChannelRow & { id: string; userId: string };

export function RecentJumps({ base }: { base: string }) {
  const v3 = useV3();
  const [visits, setVisits] = useState<Visit[]>([]);
  function load() {
    const next = readVisits(readJson(JUMP_KEY, []));
    setVisits(next);
  }
  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("crmv3:recent-jumps", onChange);
    return () => window.removeEventListener("crmv3:recent-jumps", onChange);
  }, []);

  return (
    <section className="c3-recent-jumps" aria-label={v3("jvTitle")} data-recent-jumps="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("jvSub")}</p>
          <h2 className="c3-title">{v3("jvTitle")}</h2>
        </div>
        <p className="c3-muted">{visits.length}</p>
      </header>
      <p className="c3-muted">{v3("jvHint")}</p>
      <p className="c3-muted">{v3("jvLocal")}</p>
      <p className="c3-muted">{v3("jvUnknown")}</p>
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => {
          writeJson(JUMP_KEY, clearVisits());
          setVisits([]);
        }}>{v3("jvClear")}</button>
      </div>
      {!visits.length && <p className="c3-empty">{v3("jvEmpty")}</p>}
      <ol className="c3-jump-list">
        {visits.map((visit) => (
          <li key={visit.section} className="c3-jump-card" data-section={visit.section}>
            <p>{visit.section}</p>
            {visit.at && <p className="c3-muted">{visit.at}</p>}
            <Link className="c3-btn" href={crmv3Href(base, sectionPath(visit.section))}>{v3("jvJump")}</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TicketChannels({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ tickets?: Ticket[] }>(TICKETS);
  const [hiddenChannels, setHiddenChannels] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.tickets || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      channel: { channel: row.channel, method: row.method },
      label: String(row.customer || ""),
      userId: String(row.customerId || "").trim(),
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
  const shown = visibleTickets(rows, channel, blank, query);

  function store(next: string[], clear: string) {
    setHiddenChannels(next);
    writeJson(CHANNEL_KEY, next);
    if (clear && activeChannel(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-ticket-channel" aria-label={v3("tcTitle")} data-ticket-channel="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("tcSub")}</p>
          <h2 className="c3-title">{v3("tcTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("tcHint")}</p>
      <p className="c3-muted">{v3("tcLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "support")}>{v3("tcBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("tcLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("tcFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("tcNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-ticket-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("tcBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("tcShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("tcShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("tcHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("tcTitle")}>
        <button type="button" className="c3-chip" data-on={!channel && !blank ? "1" : "0"} aria-pressed={!channel && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("tcAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-ticket-pair" data-channel={item}>
            <button type="button" className="c3-chip" data-on={channel === item ? "1" : "0"} aria-pressed={channel === item} onClick={() => { setBlank(false); setSelected(channel === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleChannel(hiddenChannels, item, present), showHidden ? "" : item)}>{showHidden ? v3("tcShow") : v3("tcHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("tcSearch")}</span>
        <input className="c3-field" aria-label={v3("tcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("tcEmpty")}</p>}
      <ul className="c3-ticket-rows">
        {shown.map((row) => {
          const name = channelText(row.channel);
          return (
            <li key={row.id} data-channel={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("tcBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("tcCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
