"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LANTERN_KEY,
  RELAY_KEY,
  RELAY_VIEW_KEY,
  activeFlame,
  activeGlass,
  activeMark,
  activeMoon,
  activeRung,
  activeSeason,
  activeSteward,
  activeWick,
  addRelay,
  addRelayView,
  bedCounts,
  bedOf,
  bulkRelayPinned,
  bulkRelaySealed,
  clashRelayCount,
  dropRelayView,
  editRelay,
  flameArg,
  flameOf,
  glassArg,
  glassLines,
  glassOf,
  lanternShare,
  lanternsCsv,
  leadingMoon,
  leadingSeason,
  markArg,
  moonArg,
  moonLines,
  moonOf,
  namedGlasses,
  namedMoons,
  namedSeasons,
  nextRelay,
  reachOf,
  readHiddenSeasons,
  readRelayViews,
  readRelays,
  relayClashIds,
  relayCopy,
  relayCounts,
  relayFlames,
  relayGap,
  relayMarks,
  relayShare,
  relayStewards,
  relayTimeline,
  relayWicks,
  relaysCsv,
  resetRelays,
  rungArg,
  seasonArg,
  seasonLines,
  seasonOf,
  setRelayBanked,
  setRelayPinned,
  setRelaySealed,
  stepRelayFlame,
  stewardArg,
  toggleSeason,
  visibleLanternCustomers,
  visibleRelays,
  visibleSeasons,
  watchOf,
  wickArg,
  wickOf,
  type LanternGlass,
  type LanternMoon,
  type LanternRow,
  type LanternSeason,
  type RelayCard,
  type RelayFlame,
  type RelayTray,
  type RelayView,
  type RelayWick,
} from "@/lib/crmv4/round159";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastLoginAt?: string | null;
};

type GlanceRow = LanternRow & { id: string };

const BEDS = ["coal", "hearth", "stack", "crown"] as const;

function wickName(v4: V4, wick: RelayWick): string {
  if (wick === "flax") return v4("hrlWickFlax");
  if (wick === "bees") return v4("hrlWickBees");
  if (wick === "tallow") return v4("hrlWickTallow");
  if (wick === "rush") return v4("hrlWickRush");
  return v4("hrlBlankWick");
}

function flameName(v4: V4, flame: RelayFlame): string {
  if (flame === "ember") return v4("hrlFlameEmber");
  if (flame === "glow") return v4("hrlFlameGlow");
  if (flame === "blaze") return v4("hrlFlameBlaze");
  return v4("hrlBlankFlame");
}

function bedName(v4: V4, name: string): string {
  if (name === "coal") return v4("hrlCoal");
  if (name === "hearth") return v4("hrlHearth");
  if (name === "stack") return v4("hrlStack");
  if (name === "crown") return v4("hrlCrown");
  if (name === "close") return v4("hrlClose");
  if (name === "wide") return v4("hrlWide");
  if (/^(?:0?[1-9]|1[0-6])$/.test(name)) return String(Number(name));
  return v4("hrlBlankRung");
}

function seasonName(v4: V4, name: string): string {
  if (name === "frost") return v4("ltnFrost");
  if (name === "bloom") return v4("ltnBloom");
  if (name === "heat") return v4("ltnHeat");
  if (name === "harvest") return v4("ltnHarvest");
  return v4("ltnUnmarked");
}

function moonName(v4: V4, name: string): string {
  if (name === "new") return v4("ltnNew");
  if (name === "full") return v4("ltnFull");
  if (name === "old") return v4("ltnOld");
  return v4("ltnUnmarked");
}

function glassName(v4: V4, name: string): string {
  if (name === "brief") return v4("ltnBrief");
  if (name === "steady") return v4("ltnSteady");
  if (name === "late") return v4("ltnLate");
  return v4("ltnUnmarked");
}

function watchName(v4: V4, name: string): string {
  if (name === "desk") return v4("ltnDesk");
  if (name === "rest") return v4("ltnRest");
  return v4("ltnUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("hrlAuditSave");
  if (audit === "edit") return v4("hrlAuditEdit");
  if (audit === "raise") return v4("hrlAuditRaise");
  if (audit === "lower") return v4("hrlAuditLower");
  if (audit === "pin") return v4("hrlAuditPin");
  if (audit === "unpin") return v4("hrlAuditUnpin");
  if (audit === "bank") return v4("hrlAuditBank");
  if (audit === "free") return v4("hrlAuditFree");
  if (audit === "seal") return v4("hrlAuditSeal");
  if (audit === "unseal") return v4("hrlAuditUnseal");
  return "";
}

function rungLabel(rung: number | null): string {
  return rung === null ? "—" : String(rung);
}

function gapLabel(v4: V4, rung: number | null, desk: string): string {
  const gap = relayGap(rung, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("hrlPast")} ${gap}`;
  if (gap < 0) return `${v4("hrlAhead")} ${Math.abs(gap)}`;
  return v4("hrlDue");
}

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function typingTarget(event: KeyboardEvent): boolean {
  const tagName = (event.target as HTMLElement | null)?.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function marks(flame: string): number {
  if (flame === "blaze") return 3;
  if (flame === "glow") return 2;
  if (flame === "ember") return 1;
  return 0;
}

export function HearthRelays({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<RelayCard[]>([]);
  const [views, setViews] = useState<RelayView[]>([]);
  const [text, setText] = useState("");
  const [steward, setSteward] = useState("");
  const [rung, setRung] = useState("");
  const [wick, setWick] = useState("");
  const [mark, setMark] = useState("");
  const [flame, setFlame] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<RelayTray>("open");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [wickFilter, setWickFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [flameFilter, setFlameFilter] = useState("all");
  const [rungFilter, setRungFilter] = useState("all");
  const [blazeOnly, setBlazeOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readRelays(readJson(RELAY_KEY, []));
    const saved = readRelayViews(readJson(RELAY_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(RELAY_KEY, next);
    writeJson(RELAY_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        textRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const stewards = relayStewards(cards);
  const wicks = relayWicks(cards);
  const marksOn = relayMarks(cards);
  const flames = relayFlames(cards);
  const bars = bedCounts(cards);
  const stewardOn = activeSteward(stewardFilter, stewards);
  const wickOn = activeWick(wickFilter, wicks);
  const markOn = activeMark(markFilter, marksOn);
  const flameOn = activeFlame(flameFilter, flames);
  const rungOn = activeRung(rungFilter);
  const picked = rungArg(rungOn);
  const shown = visibleRelays(
    cards,
    tray,
    query,
    stewardArg(stewardOn),
    wickArg(wickOn),
    markArg(markOn),
    flameArg(flameOn),
    picked.exact,
    picked.band,
    blazeOnly,
    lateOnly,
    desk,
  );
  const timeline = relayTimeline(cards, query);
  const counts = relayCounts(cards, desk);
  const clashes = clashRelayCount(cards);
  const total = cards.length;
  const nextId = nextRelay(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);

  function store(next: RelayCard[]) {
    setCards(next);
    writeJson(RELAY_KEY, next);
  }

  function storeViews(next: RelayView[]) {
    setViews(next);
    writeJson(RELAY_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setSteward("");
    setRung("");
    setWick("");
    setMark("");
    setFlame("");
  }

  function copyCard(card: RelayCard) {
    const body = relayCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: RelayView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(activeSteward(view.steward, relayStewards(cards)));
    setWickFilter(activeWick(view.wick, relayWicks(cards)));
    setMarkFilter(activeMark(view.mark, relayMarks(cards)));
    setFlameFilter(activeFlame(view.flame, relayFlames(cards)));
    setRungFilter(activeRung(view.rung));
    setBoard("cards");
    setBlazeOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-hrl" aria-label={v4("hrlTitle")} data-relays="1" data-role={role}>
      <header className="c4-hrl-head">
        <p className="c4-hrl-plate" data-logo="mono">{v4("hrlLogo")}</p>
        <div>
          <p className="c4-hrl-kicker">{v4("hrlSub")}</p>
          <h2 className="c4-title">{v4("hrlTitle")}</h2>
        </div>
        <p className="c4-hrl-count">{shown.length}</p>
      </header>
      <details className="c4-hrl-rules">
        <summary>{v4("hrlRules")}</summary>
        <p className="c4-meta">{v4("hrlHint")}</p>
        <p className="c4-meta">{v4("hrlLocal")}</p>
        <p className="c4-meta">{v4("hrlBlank")}</p>
        <p className="c4-meta">{v4("hrlStewardBlank")}</p>
        <p className="c4-meta">{v4("hrlRungBlank")}</p>
        <p className="c4-meta">{v4("hrlWickBlank")}</p>
        <p className="c4-meta">{v4("hrlMarkBlank")}</p>
        <p className="c4-meta">{v4("hrlFlameBlank")}</p>
        <p className="c4-meta">{v4("hrlEscape")}</p>
        <p className="c4-meta">{v4("hrlSlash")}</p>
        <p className="c4-meta">{v4("hrlNew")}</p>
      </details>
      {viewer ? <p className="c4-hrl-notice" role="status">{v4("hrlViewer")}</p> : null}
      <p className="c4-hrl-notice" role="status">
        <span>{v4("hrlNotice")}</span>
        <span className="c4-hrl-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("hrlNoticeAll") : v4("hrlNoticeOpen")}
        </button>
      </p>
      <p className="c4-hrl-notice" role="status">
        <span>{v4("hrlClashNotice")}</span>
        <span className="c4-hrl-count">{clashes}</span>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-hrl-pins" aria-label={v4("hrlPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.text); setBoard("cards"); }}>{card.text}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-hrl-kpi" aria-label={v4("hrlKpi")}>
        {(["open", "banked", "sealed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = relayShare(count, total);
          const label = key === "open" ? v4("hrlOpen") : key === "banked" ? v4("hrlBanked") : key === "sealed" ? v4("hrlSealed") : v4("hrlPinned");
          return (
            <p key={key} className="c4-hrl-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("hrlShare")} {share}%</span>
              <span className="c4-hrl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-hrl-chart" aria-label={v4("hrlChart")}>
        <p className="c4-hrl-kicker">{v4("hrlChart")}</p>
        {BEDS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-hrl-col" data-on={rungOn === name ? "1" : "0"} aria-pressed={rungOn === name} onClick={() => setRungFilter(rungOn === name ? "all" : name)}>
              <span>{bedName(v4, name)}</span>
              <span className="c4-hrl-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-hrl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addRelay(cards, { id: `hrl-${Date.now()}`, text, steward, rung, wick, mark, flame });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("hrlText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("hrlText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("hrlSteward")}</span>
          <input className="c4-field" aria-label={v4("hrlSteward")} value={steward} disabled={viewer} onChange={(event) => setSteward(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("hrlRung")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("hrlRung")} value={rung} disabled={viewer} onChange={(event) => setRung(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("hrlWick")}</span>
          <select className="c4-select" aria-label={v4("hrlWick")} value={wick} disabled={viewer} onChange={(event) => setWick(event.target.value)}>
            <option value="">{v4("hrlBlankWick")}</option>
            <option value="flax">{v4("hrlWickFlax")}</option>
            <option value="bees">{v4("hrlWickBees")}</option>
            <option value="tallow">{v4("hrlWickTallow")}</option>
            <option value="rush">{v4("hrlWickRush")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("hrlMark")}</span>
          <input className="c4-field" aria-label={v4("hrlMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("hrlFlame")}</span>
          <select className="c4-select" aria-label={v4("hrlFlame")} value={flame} disabled={viewer} onChange={(event) => setFlame(event.target.value)}>
            <option value="">{v4("hrlBlankFlame")}</option>
            <option value="ember">{v4("hrlFlameEmber")}</option>
            <option value="glow">{v4("hrlFlameGlow")}</option>
            <option value="blaze">{v4("hrlFlameBlaze")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hrlAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("hrlTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("hrlOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "banked" ? "1" : "0"} aria-pressed={tray === "banked"} onClick={() => setTray("banked")}>{v4("hrlBanked")}</button>
        <button type="button" className="c4-chip" data-on={tray === "sealed" ? "1" : "0"} aria-pressed={tray === "sealed"} onClick={() => setTray("sealed")}>{v4("hrlSealed")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("hrlTimeline")}</button>
        <button type="button" className="c4-chip" data-on={blazeOnly ? "1" : "0"} aria-pressed={blazeOnly} onClick={() => setBlazeOnly((value) => !value)}>{v4("hrlBlaze")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hearth-relays.csv", relaysCsv(cards, desk))}>{v4("hrlCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkRelayPinned(cards, shown.map((card) => card.id), true))}>{v4("hrlBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkRelaySealed(cards, shown.map((card) => card.id), true))}>{v4("hrlBulkSeal")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetRelays()); setEditing(""); }}>{v4("hrlReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("hrlRungs")}>
        <button type="button" className="c4-chip" data-on={rungOn === "all" ? "1" : "0"} aria-pressed={rungOn === "all"} onClick={() => setRungFilter("all")}>{v4("hrlAllRungs")}</button>
        <button type="button" className="c4-chip" data-on={rungOn === "blank" ? "1" : "0"} aria-pressed={rungOn === "blank"} onClick={() => setRungFilter("blank")}>{v4("hrlBlankRung")}</button>
        <button type="button" className="c4-chip" data-on={rungOn === "close" ? "1" : "0"} aria-pressed={rungOn === "close"} onClick={() => setRungFilter("close")}>{v4("hrlClose")}</button>
        <button type="button" className="c4-chip" data-on={rungOn === "wide" ? "1" : "0"} aria-pressed={rungOn === "wide"} onClick={() => setRungFilter("wide")}>{v4("hrlWide")}</button>
        {["1", "5", "9", "13"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={rungOn === slot ? "1" : "0"} aria-pressed={rungOn === slot} onClick={() => setRungFilter(rungOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("hrlSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("hrlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-hrl-next">
        <label className="c4-lab">
          <span>{v4("hrlDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("hrlDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("hrlNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("hrlNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("hrlStewards")}</span>
          <select className="c4-select" aria-label={v4("hrlStewards")} value={stewardOn} onChange={(event) => setStewardFilter(event.target.value)}>
            <option value="all">{v4("hrlAllStewards")}</option>
            <option value="blank">{v4("hrlBlankSteward")}</option>
            {stewards.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("hrlWicks")}</span>
          <select className="c4-select" aria-label={v4("hrlWicks")} value={wickOn} onChange={(event) => setWickFilter(event.target.value)}>
            <option value="all">{v4("hrlAllWicks")}</option>
            <option value="blank">{v4("hrlBlankWick")}</option>
            {wicks.map((item) => <option key={item} value={item}>{wickName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("hrlMarks")}</span>
          <select className="c4-select" aria-label={v4("hrlMarks")} value={markOn} onChange={(event) => setMarkFilter(event.target.value)}>
            <option value="all">{v4("hrlAllMarks")}</option>
            <option value="blank">{v4("hrlBlankMark")}</option>
            {marksOn.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("hrlFlames")}</span>
          <select className="c4-select" aria-label={v4("hrlFlames")} value={flameOn} onChange={(event) => setFlameFilter(event.target.value)}>
            <option value="all">{v4("hrlAllFlames")}</option>
            <option value="blank">{v4("hrlBlankFlame")}</option>
            {flames.map((item) => <option key={item} value={item}>{flameName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-hrl-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addRelayView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          steward: stewardOn,
          wick: wickOn,
          mark: markOn,
          flame: flameOn,
          rung: rungOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("hrlViewName")}</span>
          <input className="c4-field" aria-label={v4("hrlViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hrlSaveView")}</button>
      </form>
      <section aria-label={v4("hrlViews")}>
        <p className="c4-hrl-kicker">{v4("hrlViews")}</p>
        {!views.length && <p className="c4-hrl-empty">{v4("hrlViewEmpty")}</p>}
        <ul className="c4-hrl-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropRelayView(views, view.id))}>{v4("hrlDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-hrl-empty">{v4("hrlEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-hrl-rows">
          {shown.map((card) => {
            const clashesOn = relayClashIds(cards, card.id);
            const gap = gapLabel(v4, card.rung, desk);
            const reach = reachOf(card.rung);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-flame={card.flame || "blank"} data-wick={card.wick || "blank"} data-bed={bedOf(card.rung)}>
                <span className="c4-hrl-folio" aria-hidden="true">{rungLabel(card.rung)}</span>
                <span className="c4-hrl-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.flame) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editRelay(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("hrlEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("hrlSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.steward || v4("hrlBlankSteward")}
                    {" · "}
                    {rungLabel(card.rung)}
                    {" · "}
                    {wickName(v4, wickOf(card.wick))}
                    {" · "}
                    {card.mark || v4("hrlBlankMark")}
                    {" · "}
                    {flameName(v4, flameOf(card.flame))}
                    {reach === "blank" ? "" : ` · ${reach === "close" ? v4("hrlClose") : v4("hrlWide")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("hrlAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("hrlClash")} ${clashesOn.length}` : v4("hrlClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("hrlCopied") : v4("hrlCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("hrlEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepRelayFlame(cards, card.id, 1))}>{v4("hrlRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepRelayFlame(cards, card.id, -1))}>{v4("hrlLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setRelayPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("hrlUnpin") : v4("hrlPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.banked} onClick={() => store(setRelayBanked(cards, card.id, !card.banked))}>{card.banked ? v4("hrlFree") : v4("hrlBank")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.sealed} onClick={() => store(setRelaySealed(cards, card.id, !card.sealed))}>{card.sealed ? v4("hrlUnseal") : v4("hrlSeal")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-hrl-time">
          {timeline.map((card) => (
            <li key={card.id} data-bed={bedOf(card.rung)}>
              <span className="c4-hrl-clock">{rungLabel(card.rung)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function LoginLanterns({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenSeasons, setHiddenSeasons] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [season, setSeason] = useState("all");
  const [moon, setMoon] = useState("all");
  const [glass, setGlass] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      lastLoginAt: row.lastLoginAt,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const seasons = seasonLines(rows);
  const moons = moonLines(rows);
  const glasses = glassLines(rows);
  const present = namedSeasons(rows);
  const presentKey = present.join("\n");
  const seasonNames = namedSeasons(rows);
  const moonNames = namedMoons(rows);
  const glassNames = namedGlasses(rows);
  const blankSeason = seasons.find((line) => !line.season)?.count || 0;
  const leadSeason = leadingSeason(rows);
  const leadMoon = leadingMoon(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenSeasons(readJson(LANTERN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenSeasons(next);
    writeJson(LANTERN_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleSeasons(present, hiddenSeasons, showHidden);
  const seasonOn = activeSeason(selected || season, selected ? chips : seasonNames);
  const moonOn = activeMoon(moon, moonNames);
  const glassOn = activeGlass(glass, glassNames);
  const shown = visibleLanternCustomers(
    rows,
    selected ? seasonArg(activeSeason(selected, chips)) : seasonArg(activeSeason(season, seasonNames)),
    moonArg(moonOn),
    glassArg(glassOn),
    query,
  );
  const widest = Math.max(1, ...seasons.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenSeasons(next);
    writeJson(LANTERN_KEY, next);
    if (clear && activeSeason(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-ltn" aria-label={v4("ltnTitle")} data-lanterns="1">
      <header className="c4-ltn-head">
        <div>
          <p className="c4-hrl-kicker">{v4("ltnSub")}</p>
          <h2 className="c4-title">{v4("ltnTitle")}</h2>
        </div>
        <p className="c4-hrl-count">{v4("ltnRows")} {rows.length}</p>
      </header>
      <details className="c4-hrl-rules">
        <summary>{v4("ltnRules")}</summary>
        <p className="c4-meta">{v4("ltnHint")}</p>
        <p className="c4-meta">{v4("ltnLocal")}</p>
        <p className="c4-meta">{v4("ltnEscape")}</p>
      </details>
      {leadSeason ? <p className="c4-ltn-lead"><span>{v4("ltnLeadSeason")}</span> {seasonName(v4, leadSeason)}</p> : null}
      {leadMoon ? <p className="c4-ltn-lead"><span>{v4("ltnLeadMoon")}</span> {moonName(v4, leadMoon)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("ltnBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("login-lanterns.csv", lanternsCsv(rows))}>{v4("ltnCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ltnLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ltnFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-hrl-empty">{v4("ltnNone")}</p>}
      {seasons.length > 0 && (
        <section className="c4-ltn-chart" aria-label={v4("ltnAllSeason")}>
          {seasons.map((line) => {
            const share = lanternShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.season || "blank";
            return (
              <p key={name} className="c4-ltn-col" data-season={line.season || "blank"}>
                <span>{seasonName(v4, line.season)}</span>
                <span className="c4-hrl-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("ltnShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-ltn-seasons" role="group" aria-label={v4("ltnAllSeason")}>
        <button type="button" className="c4-ltn-season" data-on={!selected && seasonOn === "all" ? "1" : "0"} aria-pressed={!selected && seasonOn === "all"} onClick={() => { setSelected(""); setSeason("all"); }}>
          <span>{v4("ltnAllSeason")}</span>
          <span className="c4-hrl-count">{rows.length}</span>
        </button>
        {blankSeason > 0 && (
          <button type="button" className="c4-ltn-season" data-on={!selected && season === "blank" ? "1" : "0"} aria-pressed={!selected && season === "blank"} onClick={() => { setSelected(""); setSeason(season === "blank" ? "all" : "blank"); }}>
            <span>{v4("ltnUnmarked")}</span>
            <span className="c4-hrl-count">{blankSeason}</span>
          </button>
        )}
        {seasonNames.map((item) => {
          const count = seasons.find((line) => line.season === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-ltn-season" data-on={!selected && season === item ? "1" : "0"} aria-pressed={!selected && season === item} onClick={() => { setSelected(""); setSeason(season === item ? "all" : item); }}>
              <span>{seasonName(v4, item)}</span>
              <span className="c4-hrl-count">{count}</span>
              <span>{v4("ltnShare")} {lanternShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ltnMoons")}>
        <button type="button" className="c4-chip" data-on={moonOn === "all" ? "1" : "0"} aria-pressed={moonOn === "all"} onClick={() => setMoon("all")}>{v4("ltnAllMoons")}</button>
        {moons.filter((line) => line.moon).map((line) => (
          <button key={line.moon} type="button" className="c4-chip" data-on={moonOn === line.moon ? "1" : "0"} aria-pressed={moonOn === line.moon} onClick={() => setMoon(moonOn === line.moon ? "all" : line.moon)}>
            {moonName(v4, line.moon)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ltnGlasses")}>
        <button type="button" className="c4-chip" data-on={glassOn === "all" ? "1" : "0"} aria-pressed={glassOn === "all"} onClick={() => setGlass("all")}>{v4("ltnGlasses")}</button>
        {glasses.filter((line) => line.glass).map((line) => (
          <button key={line.glass} type="button" className="c4-chip" data-on={glassOn === line.glass ? "1" : "0"} aria-pressed={glassOn === line.glass} onClick={() => setGlass(glassOn === line.glass ? "all" : line.glass)}>
            {glassName(v4, line.glass)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ltnShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ltnShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ltnHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ltnSeasons")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("ltnAll")}</button>
        {chips.map((item) => {
          const line = seasons.find((row) => row.season === item);
          const count = line?.count || 0;
          const share = lanternShare(count, rows.length);
          return (
            <span key={item} className="c4-ltn-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setSeason("all"); setSelected(selected === item ? "" : item); }}>{seasonName(v4, item)}</button>
              <span className="c4-hrl-count">{count}</span>
              <span className="c4-ltn-share">{v4("ltnShare")} {share}%</span>
              <span className="c4-hrl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleSeason(hiddenSeasons, item, present), showHidden ? "" : item)}>{showHidden ? v4("ltnShow") : v4("ltnHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("ltnSearch")}</span>
        <input className="c4-field" aria-label={v4("ltnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-hrl-empty">{v4("ltnEmpty")}</p>}
      <ul className="c4-ltn-rows">
        {shown.map((row) => {
          const seasonMark = seasonOf(row.lastLoginAt) as LanternSeason;
          const moonMark = moonOf(row.lastLoginAt) as LanternMoon;
          const glassMark = glassOf(row.lastLoginAt) as LanternGlass;
          const watchMark = watchOf(row.lastLoginAt);
          return (
            <li key={row.id} data-season={seasonMark || "blank"} data-moon={moonMark || "blank"} data-glass={glassMark || "blank"} data-watch={watchMark || "blank"}>
              <span className="c4-ltn-face" aria-hidden="true">{seasonMark ? seasonMark.slice(0, 1).toUpperCase() : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {seasonName(v4, seasonMark)}
                {" · "}
                {moonName(v4, moonMark)}
                {" · "}
                {glassName(v4, glassMark)}
                {" · "}
                {watchName(v4, watchMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
