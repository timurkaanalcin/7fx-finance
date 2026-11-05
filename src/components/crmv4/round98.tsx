"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round98";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Ticket = {
  id: string;
  customer?: string | null;
  customerId?: string | null;
  channel?: unknown;
  method?: unknown;
  kind?: string | null;
};

type GlanceRow = ChannelRow & { id: string; userId: string };

export function RecentJumps({ base, v4 }: { base: string; v4: V4 }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  function load() {
    const next = readVisits(readJson(JUMP_KEY, []));
    setVisits(next);
  }
  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("crmv4:jumps", onChange);
    return () => window.removeEventListener("crmv4:jumps", onChange);
  }, []);

  return (
    <section className="c4-recent-jumps" aria-label={v4("jvTitle")} data-recent-jumps="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("jvSub")}</p>
          <h2 className="c4-title">{v4("jvTitle")}</h2>
        </div>
        <p className="c4-meta">{visits.length}</p>
      </header>
      <p className="c4-meta">{v4("jvHint")}</p>
      <p className="c4-meta">{v4("jvLocal")}</p>
      <p className="c4-meta">{v4("jvUnknown")}</p>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => {
          writeJson(JUMP_KEY, clearVisits());
          setVisits([]);
        }}>{v4("jvClear")}</button>
      </div>
      {!visits.length && <p className="c4-pay-empty">{v4("jvEmpty")}</p>}
      <ol className="c4-jump-list">
        {visits.map((visit) => (
          <li key={visit.section} className="c4-jump-card" data-section={visit.section}>
            <p>{visit.section}</p>
            {visit.at && <p className="c4-meta">{visit.at}</p>}
            <Link className="c4-btn" href={crmv4Href(base, sectionPath(visit.section))}>{v4("jvJump")}</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ChannelGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?take=40");
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
    <section className="c4-ticket-channel" aria-label={v4("tcTitle")} data-ticket-channel="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("tcSub")}</p>
          <h2 className="c4-title">{v4("tcTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("tcHint")}</p>
      <p className="c4-meta">{v4("tcLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "support")}>{v4("tcBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("tcLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("tcFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("tcNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-ticket-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("tcBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("tcShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("tcShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("tcHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("tcTitle")}>
        <button type="button" className="c4-chip" data-on={!channel && !blank ? "1" : "0"} aria-pressed={!channel && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("tcAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-ticket-pair" data-channel={item}>
            <button type="button" className="c4-chip" data-on={channel === item ? "1" : "0"} aria-pressed={channel === item} onClick={() => { setBlank(false); setSelected(channel === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleChannel(hiddenChannels, item, present), showHidden ? "" : item)}>{showHidden ? v4("tcShow") : v4("tcHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("tcSearch")}</span>
        <input className="c4-field" aria-label={v4("tcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("tcEmpty")}</p>}
      <ul className="c4-ticket-rows">
        {shown.map((row) => {
          const name = channelText(row.channel);
          return (
            <li key={row.id} data-channel={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("tcBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("tcCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
