"use client";

import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/clocks";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { QUIET_KEY, readQuiet } from "@/lib/crmv3/leads";
import { useV3 } from "./store";

const ZONE_KEY: Record<ZoneId, CrmV3CopyKey> = {
  istanbul: "ckIstanbul",
  london: "ckLondon",
  berlin: "ckBerlin",
  moscow: "ckMoscow",
  dubai: "ckDubai",
  newyork: "ckNewYork",
  utc: "ckUtc",
};

export function DeskClocks() {
  const v3 = useV3();
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
    <section className="c3-clock-strip" aria-label={v3("ckTitle")} data-clock-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("ckSub")}</p>
          <h2 className="c3-title">{v3("ckTitle")}</h2>
        </div>
        <p className="c3-muted">{clocks.length}</p>
      </header>
      <p className="c3-muted">{v3("ckHint")}</p>
      <p className="c3-muted">{quietOn ? `${v3("ckQuiet")} ${quiet.start}–${quiet.end}` : v3("ckNoQuiet")}</p>
      <div className="c3-row" role="group" aria-label={v3("ckSub")}>
        {DESK_ZONES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="c3-chip"
            data-on={zones.includes(item.id) ? "1" : "0"}
            aria-pressed={zones.includes(item.id)}
            onClick={() => store(toggleZone(zones, item.id))}
          >
            {v3(ZONE_KEY[item.id])}
          </button>
        ))}
      </div>
      {!clocks.length && <p className="c3-empty">{v3("ckEmpty")}</p>}
      <ul className="c3-clock-list">
        {clocks.map((clock) => (
          <li key={clock.id} className="c3-clock-card" data-zone={clock.zone} data-quiet={clock.quiet ? "1" : "0"}>
            <p className="c3-muted">{v3(ZONE_KEY[clock.id])}</p>
            <p className="c3-clock-time">{clock.time}</p>
            <p className="c3-muted">{clock.zone}</p>
            {clock.quiet && <p className="c3-muted">{v3("ckQuietOn")}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SnippetPad() {
  const v3 = useV3();
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
    <section className="c3-snip-pad" aria-label={v3("snTitle")} data-snip-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("snSub")}</p>
          <h2 className="c3-title">{v3("snTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("snHint")}</p>
      <p className="c3-muted">{v3("snLocal")}</p>
      <div className="c3-row" role="group" aria-label={v3("snThanks")}>
        <button type="button" className="c3-chip" data-on={kind === "thanks" ? "1" : "0"} aria-pressed={kind === "thanks"} onClick={() => setKind("thanks")}>{v3("snThanks")}</button>
        <button type="button" className="c3-chip" data-on={kind === "follow" ? "1" : "0"} aria-pressed={kind === "follow"} onClick={() => setKind("follow")}>{v3("snFollow")}</button>
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("snBody")}</span>
          <input className="c3-field" aria-label={v3("snBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const next = addSnippet(snippets, { id: `snip-${Date.now()}`, kind, body, at: new Date().toISOString() });
          if (next.length === snippets.length) return;
          store(next);
          setBody("");
        }}>{v3("snAdd")}</button>
      </div>
      <p className="c3-muted">{v3("snBlank")}</p>
      <label className="c3-lab">
        <span>{v3("snSearch")}</span>
        <input className="c3-field" aria-label={v3("snSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("snAll")}>
        <button type="button" className="c3-chip" data-on={filter === "" ? "1" : "0"} aria-pressed={filter === ""} onClick={() => setFilter("")}>{v3("snAll")}</button>
        <button type="button" className="c3-chip" data-on={filter === "thanks" ? "1" : "0"} aria-pressed={filter === "thanks"} onClick={() => setFilter("thanks")}>{v3("snThanks")}</button>
        <button type="button" className="c3-chip" data-on={filter === "follow" ? "1" : "0"} aria-pressed={filter === "follow"} onClick={() => setFilter("follow")}>{v3("snFollow")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("snOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("snHidden")}</button>
      </div>
      {failed && <p className="c3-muted">{v3("snCopyFail")}</p>}
      {!shown.length && <p className="c3-empty">{v3("snEmpty")}</p>}
      <ul className="c3-snip-list">
        {shown.map((snippet) => (
          <li key={snippet.id} className="c3-snip-card" data-kind={snippet.kind} data-pinned={snippet.pinned ? "1" : "0"}>
            <p className="c3-muted">{snippet.kind === "thanks" ? v3("snThanks") : v3("snFollow")}</p>
            <p>{snippet.body}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" data-snip-copy="" onClick={() => void copyText(snippet)}>{copied === snippet.id ? v3("snCopied") : v3("snCopy")}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleSnippetPin(snippets, snippet.id))}>{snippet.pinned ? v3("snUnpin") : v3("snPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setSnippetHidden(snippets, snippet.id, !snippet.hidden))}>{snippet.hidden ? v3("snShow") : v3("snHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
