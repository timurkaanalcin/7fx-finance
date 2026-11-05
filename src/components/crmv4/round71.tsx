"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { QUIET_KEY, readQuiet } from "@/lib/crmv4/round56";
import {
  CLOCK_KEY,
  DESK_ZONES,
  SNIP_KEY,
  addSnippet,
  deskClocks,
  readSnippets,
  readZones,
  setSnippetHidden,
  toggleSnippetPin,
  toggleZone,
  visibleSnippets,
  type SnipKind,
  type Snippet,
  type ZoneId,
} from "@/lib/crmv4/round71";

export type V4 = (key: CrmV4CopyKey) => string;

const ZONE_KEY: Record<ZoneId, CrmV4CopyKey> = {
  istanbul: "ckIstanbul",
  london: "ckLondon",
  berlin: "ckBerlin",
  moscow: "ckMoscow",
  dubai: "ckDubai",
  newyork: "ckNewYork",
  utc: "ckUtc",
};

export function DeskClocks({ v4 }: { v4: V4 }) {
  const [zones, setZones] = useState<ZoneId[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [quiet, setQuiet] = useState({ start: "", end: "" });
  useEffect(() => {
    setZones(readZones(readJson(CLOCK_KEY, [])));
    setQuiet(readQuiet(readJson(QUIET_KEY, null)));
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const clocks = deskClocks(zones, quiet, now);
  const quietOn = Boolean(quiet.start && quiet.end && quiet.start !== quiet.end);

  function store(next: ZoneId[]) {
    setZones(next);
    writeJson(CLOCK_KEY, next);
  }

  return (
    <section className="c4-clock-strip" aria-label={v4("ckTitle")} data-clock-strip="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("ckSub")}</p>
          <h2 className="c4-title">{v4("ckTitle")}</h2>
        </div>
        <p className="c4-meta">{clocks.length}</p>
      </header>
      <p className="c4-meta">{v4("ckHint")}</p>
      <p className="c4-meta">{quietOn ? `${v4("ckQuiet")} ${quiet.start}–${quiet.end}` : v4("ckNoQuiet")}</p>
      <div className="c4-row" role="group" aria-label={v4("ckSub")}>
        {DESK_ZONES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="c4-chip"
            data-on={zones.includes(item.id) ? "1" : "0"}
            aria-pressed={zones.includes(item.id)}
            onClick={() => store(toggleZone(zones, item.id))}
          >
            {v4(ZONE_KEY[item.id])}
          </button>
        ))}
      </div>
      {!clocks.length && <p className="c4-pay-empty">{v4("ckEmpty")}</p>}
      <ul className="c4-clock-list">
        {clocks.map((clock) => (
          <li key={clock.id} className="c4-clock-card" data-zone={clock.zone} data-quiet={clock.quiet ? "1" : "0"}>
            <p className="c4-meta">{v4(ZONE_KEY[clock.id])}</p>
            <p className="c4-clock-time">{clock.time}</p>
            <p className="c4-meta">{clock.zone}</p>
            {clock.quiet && <p className="c4-meta">{v4("ckQuietOn")}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SnippetPad({ v4 }: { v4: V4 }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [kind, setKind] = useState<SnipKind>("thanks");
  const [filter, setFilter] = useState<"" | SnipKind>("");
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => { setSnippets(readSnippets(readJson(SNIP_KEY, []))); }, []);
  const shown = visibleSnippets(snippets, filter, query, hidden);

  function store(next: Snippet[]) {
    setSnippets(next);
    writeJson(SNIP_KEY, next);
  }

  async function copyText(snippet: Snippet) {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(snippet.body);
      setCopied(snippet.id);
    } catch {
      setCopied("");
      setFailed(true);
    }
  }

  return (
    <section className="c4-snip-pad" aria-label={v4("snTitle")} data-snip-pad="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("snSub")}</p>
          <h2 className="c4-title">{v4("snTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("snHint")}</p>
      <p className="c4-meta">{v4("snLocal")}</p>
      <div className="c4-row" role="group" aria-label={v4("snThanks")}>
        <button type="button" className="c4-chip" data-on={kind === "thanks" ? "1" : "0"} aria-pressed={kind === "thanks"} onClick={() => setKind("thanks")}>{v4("snThanks")}</button>
        <button type="button" className="c4-chip" data-on={kind === "follow" ? "1" : "0"} aria-pressed={kind === "follow"} onClick={() => setKind("follow")}>{v4("snFollow")}</button>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addSnippet(snippets, { id: `snip-${Date.now()}`, kind, body, at: new Date().toISOString() });
        if (next.length === snippets.length) return;
        store(next);
        setBody("");
      }}>
        <label className="c4-lab">
          <span>{v4("snBody")}</span>
          <input className="c4-field" aria-label={v4("snBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("snAdd")}</button>
      </form>
      <p className="c4-meta">{v4("snBlank")}</p>
      <label className="c4-lab">
        <span>{v4("snSearch")}</span>
        <input className="c4-field" aria-label={v4("snSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("snAll")}>
        <button type="button" className="c4-chip" data-on={filter === "" ? "1" : "0"} aria-pressed={filter === ""} onClick={() => setFilter("")}>{v4("snAll")}</button>
        <button type="button" className="c4-chip" data-on={filter === "thanks" ? "1" : "0"} aria-pressed={filter === "thanks"} onClick={() => setFilter("thanks")}>{v4("snThanks")}</button>
        <button type="button" className="c4-chip" data-on={filter === "follow" ? "1" : "0"} aria-pressed={filter === "follow"} onClick={() => setFilter("follow")}>{v4("snFollow")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("snOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("snHidden")}</button>
      </div>
      {failed && <p className="c4-meta">{v4("snCopyFail")}</p>}
      {!shown.length && <p className="c4-pay-empty">{v4("snEmpty")}</p>}
      <ul className="c4-snip-list">
        {shown.map((snippet) => (
          <li key={snippet.id} className="c4-snip-card" data-kind={snippet.kind} data-pinned={snippet.pinned ? "1" : "0"}>
            <p className="c4-meta">{snippet.kind === "thanks" ? v4("snThanks") : v4("snFollow")}</p>
            <p>{snippet.body}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" data-snip-copy="" onClick={() => void copyText(snippet)}>{copied === snippet.id ? v4("snCopied") : v4("snCopy")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSnippetPin(snippets, snippet.id))}>{snippet.pinned ? v4("snUnpin") : v4("snPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setSnippetHidden(snippets, snippet.id, !snippet.hidden))}>{snippet.hidden ? v4("snShow") : v4("snHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
