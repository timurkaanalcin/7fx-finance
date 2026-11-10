"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PERCH_KEY,
  PERCH_VIEW_KEY,
  WATCH_KEY,
  activeBand,
  activeFold,
  activeKeeper,
  activePerch,
  activePlumage,
  activeShelf,
  activeSong,
  activeSpan,
  addPerch,
  addPerchView,
  assignedWatch,
  bandArg,
  bulkPerchCaged,
  bulkPerchPinned,
  clashPerchCount,
  dropPerchView,
  editPerch,
  foldArg,
  foldLines,
  foldOf,
  keeperArg,
  leadingFold,
  leadingShelf,
  loftCounts,
  loftOf,
  namedFolds,
  namedShelves,
  namedSpans,
  nextPerch,
  perchArg,
  perchBands,
  perchClashIds,
  perchCopy,
  perchCounts,
  perchGap,
  perchKeepers,
  perchPlumages,
  perchShare,
  perchSongs,
  perchTimeline,
  perchesCsv,
  plumageArg,
  plumageOf,
  quietOf,
  readHiddenShelves,
  readPerchViews,
  readPerches,
  resetPerches,
  setPerchCaged,
  setPerchPinned,
  setPerchRoosted,
  shelfArg,
  shelfLines,
  shelfOf,
  songArg,
  songOf,
  spanArg,
  spanLines,
  spanOf,
  stepPerchSong,
  toggleShelf,
  visiblePerches,
  visibleShelves,
  visibleWatchCustomers,
  watchShare,
  watchesCsv,
  wingOf,
  type PerchCard,
  type PerchPlumage,
  type PerchSong,
  type PerchTray,
  type PerchView,
  type WatchRow,
} from "@/lib/crmv4/round158";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastSeenAt?: string | null;
};

type GlanceRow = WatchRow & { id: string };

const LOFTS = ["low", "mid", "high"] as const;

function plumageName(v4: V4, plumage: PerchPlumage): string {
  if (plumage === "dove") return v4("avpPlumageDove");
  if (plumage === "crow") return v4("avpPlumageCrow");
  if (plumage === "jay") return v4("avpPlumageJay");
  if (plumage === "wren") return v4("avpPlumageWren");
  return v4("avpBlankPlumage");
}

function songName(v4: V4, song: PerchSong): string {
  if (song === "hush") return v4("avpSongHush");
  if (song === "call") return v4("avpSongCall");
  if (song === "chorus") return v4("avpSongChorus");
  return v4("avpBlankSong");
}

function loftName(v4: V4, name: string): string {
  if (name === "low") return v4("avpLow");
  if (name === "mid") return v4("avpMid");
  if (name === "high") return v4("avpHigh");
  if (name === "near") return v4("avpNear");
  if (name === "far") return v4("avpFar");
  if (/^(?:0?[1-9]|1[0-8])$/.test(name)) return String(Number(name));
  return v4("avpBlankPerch");
}

function shelfName(v4: V4, name: string): string {
  if (name === "night") return v4("pswNight");
  if (name === "morning") return v4("pswMorning");
  if (name === "afternoon") return v4("pswAfternoon");
  if (name === "evening") return v4("pswEvening");
  return v4("pswUnmarked");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("pswShort");
  if (name === "mid") return v4("pswMid");
  if (name === "long") return v4("pswLong");
  return v4("pswUnmarked");
}

function foldName(v4: V4, name: string): string {
  if (name === "early") return v4("pswFoldEarly");
  if (name === "late") return v4("pswFoldLate");
  if (name === "rest") return v4("pswFoldRest");
  return v4("pswUnmarked");
}

function quietName(v4: V4, name: string): string {
  if (name === "quiet") return v4("pswQuiet");
  if (name === "day") return v4("pswDay");
  return v4("pswUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("avpAuditSave");
  if (audit === "edit") return v4("avpAuditEdit");
  if (audit === "raise") return v4("avpAuditRaise");
  if (audit === "lower") return v4("avpAuditLower");
  if (audit === "pin") return v4("avpAuditPin");
  if (audit === "unpin") return v4("avpAuditUnpin");
  if (audit === "roost") return v4("avpAuditRoost");
  if (audit === "wake") return v4("avpAuditWake");
  if (audit === "cage") return v4("avpAuditCage");
  if (audit === "uncage") return v4("avpAuditUncage");
  return "";
}

function perchLabel(perch: number | null): string {
  return perch === null ? "—" : String(perch);
}

function gapLabel(v4: V4, perch: number | null, desk: string): string {
  const gap = perchGap(perch, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("avpPast")} ${gap}`;
  if (gap < 0) return `${v4("avpAhead")} ${Math.abs(gap)}`;
  return v4("avpDue");
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

function marks(song: string): number {
  if (song === "chorus") return 3;
  if (song === "call") return 2;
  if (song === "hush") return 1;
  return 0;
}

export function AviaryPerches({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<PerchCard[]>([]);
  const [views, setViews] = useState<PerchView[]>([]);
  const [text, setText] = useState("");
  const [keeper, setKeeper] = useState("");
  const [perch, setPerch] = useState("");
  const [plumage, setPlumage] = useState("");
  const [band, setBand] = useState("");
  const [song, setSong] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<PerchTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [plumageFilter, setPlumageFilter] = useState("all");
  const [bandFilter, setBandFilter] = useState("all");
  const [songFilter, setSongFilter] = useState("all");
  const [perchFilter, setPerchFilter] = useState("all");
  const [chorusOnly, setChorusOnly] = useState(false);
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
    const next = readPerches(readJson(PERCH_KEY, []));
    const saved = readPerchViews(readJson(PERCH_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(PERCH_KEY, next);
    writeJson(PERCH_VIEW_KEY, saved);
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
      if (event.key === "c" || event.key === "C") {
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
  const keepers = perchKeepers(cards);
  const plumages = perchPlumages(cards);
  const bands = perchBands(cards);
  const songs = perchSongs(cards);
  const bars = loftCounts(cards);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const plumageOn = activePlumage(plumageFilter, plumages);
  const bandOn = activeBand(bandFilter, bands);
  const songOn = activeSong(songFilter, songs);
  const perchOn = activePerch(perchFilter);
  const picked = perchArg(perchOn);
  const shown = visiblePerches(
    cards,
    tray,
    query,
    keeperArg(keeperOn),
    plumageArg(plumageOn),
    bandArg(bandOn),
    songArg(songOn),
    picked.exact,
    picked.band,
    chorusOnly,
    lateOnly,
    desk,
  );
  const timeline = perchTimeline(cards, query);
  const counts = perchCounts(cards, desk);
  const clashes = clashPerchCount(cards);
  const total = cards.length;
  const nextId = nextPerch(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);

  function store(next: PerchCard[]) {
    setCards(next);
    writeJson(PERCH_KEY, next);
  }

  function storeViews(next: PerchView[]) {
    setViews(next);
    writeJson(PERCH_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setKeeper("");
    setPerch("");
    setPlumage("");
    setBand("");
    setSong("");
  }

  function copyCard(card: PerchCard) {
    const body = perchCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: PerchView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(activeKeeper(view.keeper, perchKeepers(cards)));
    setPlumageFilter(activePlumage(view.plumage, perchPlumages(cards)));
    setBandFilter(activeBand(view.band, perchBands(cards)));
    setSongFilter(activeSong(view.song, perchSongs(cards)));
    setPerchFilter(activePerch(view.perch));
    setBoard("cards");
    setChorusOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-avp" aria-label={v4("avpTitle")} data-perches="1" data-role={role}>
      <header className="c4-avp-head">
        <p className="c4-avp-plate" data-logo="mono">{v4("avpLogo")}</p>
        <div>
          <p className="c4-avp-kicker">{v4("avpSub")}</p>
          <h2 className="c4-title">{v4("avpTitle")}</h2>
        </div>
        <p className="c4-avp-count">{shown.length}</p>
      </header>
      <details className="c4-avp-rules">
        <summary>{v4("avpRules")}</summary>
        <p className="c4-meta">{v4("avpHint")}</p>
        <p className="c4-meta">{v4("avpLocal")}</p>
        <p className="c4-meta">{v4("avpBlank")}</p>
        <p className="c4-meta">{v4("avpKeeperBlank")}</p>
        <p className="c4-meta">{v4("avpPerchBlank")}</p>
        <p className="c4-meta">{v4("avpPlumageBlank")}</p>
        <p className="c4-meta">{v4("avpBandBlank")}</p>
        <p className="c4-meta">{v4("avpSongBlank")}</p>
        <p className="c4-meta">{v4("avpEscape")}</p>
        <p className="c4-meta">{v4("avpSlash")}</p>
        <p className="c4-meta">{v4("avpNew")}</p>
      </details>
      {viewer ? <p className="c4-avp-notice" role="status">{v4("avpViewer")}</p> : null}
      <p className="c4-avp-notice" role="status">
        <span>{v4("avpNotice")}</span>
        <span className="c4-avp-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("avpNoticeAll") : v4("avpNoticeOpen")}
        </button>
      </p>
      <p className="c4-avp-notice" role="status">
        <span>{v4("avpClashNotice")}</span>
        <span className="c4-avp-count">{clashes}</span>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-avp-pins" aria-label={v4("avpPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.text); setBoard("cards"); }}>{card.text}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-avp-kpi" aria-label={v4("avpKpi")}>
        {(["open", "roosted", "caged", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = perchShare(count, total);
          const label = key === "open" ? v4("avpOpen") : key === "roosted" ? v4("avpRoosted") : key === "caged" ? v4("avpCaged") : v4("avpPinned");
          return (
            <p key={key} className="c4-avp-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("avpShare")} {share}%</span>
              <span className="c4-avp-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-avp-chart" aria-label={v4("avpChart")}>
        <p className="c4-avp-kicker">{v4("avpChart")}</p>
        {LOFTS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-avp-col" data-on={perchOn === name ? "1" : "0"} aria-pressed={perchOn === name} onClick={() => setPerchFilter(perchOn === name ? "all" : name)}>
              <span>{loftName(v4, name)}</span>
              <span className="c4-avp-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-avp-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addPerch(cards, { id: `avp-${Date.now()}`, text, keeper, perch, plumage, band, song });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("avpText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("avpText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("avpKeeper")}</span>
          <input className="c4-field" aria-label={v4("avpKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("avpPerch")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("avpPerch")} value={perch} disabled={viewer} onChange={(event) => setPerch(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("avpPlumage")}</span>
          <select className="c4-select" aria-label={v4("avpPlumage")} value={plumage} disabled={viewer} onChange={(event) => setPlumage(event.target.value)}>
            <option value="">{v4("avpBlankPlumage")}</option>
            <option value="dove">{v4("avpPlumageDove")}</option>
            <option value="crow">{v4("avpPlumageCrow")}</option>
            <option value="jay">{v4("avpPlumageJay")}</option>
            <option value="wren">{v4("avpPlumageWren")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("avpBand")}</span>
          <input className="c4-field" aria-label={v4("avpBand")} value={band} disabled={viewer} onChange={(event) => setBand(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("avpSong")}</span>
          <select className="c4-select" aria-label={v4("avpSong")} value={song} disabled={viewer} onChange={(event) => setSong(event.target.value)}>
            <option value="">{v4("avpBlankSong")}</option>
            <option value="hush">{v4("avpSongHush")}</option>
            <option value="call">{v4("avpSongCall")}</option>
            <option value="chorus">{v4("avpSongChorus")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("avpAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("avpTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("avpOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "roosted" ? "1" : "0"} aria-pressed={tray === "roosted"} onClick={() => setTray("roosted")}>{v4("avpRoosted")}</button>
        <button type="button" className="c4-chip" data-on={tray === "caged" ? "1" : "0"} aria-pressed={tray === "caged"} onClick={() => setTray("caged")}>{v4("avpCaged")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("avpTimeline")}</button>
        <button type="button" className="c4-chip" data-on={chorusOnly ? "1" : "0"} aria-pressed={chorusOnly} onClick={() => setChorusOnly((value) => !value)}>{v4("avpChorus")}</button>
        <button type="button" className="c4-btn" onClick={() => download("aviary-perches.csv", perchesCsv(cards, desk))}>{v4("avpCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPerchPinned(cards, shown.map((card) => card.id), true))}>{v4("avpBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPerchCaged(cards, shown.map((card) => card.id), true))}>{v4("avpBulkCage")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetPerches()); setEditing(""); }}>{v4("avpReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("avpPerches")}>
        <button type="button" className="c4-chip" data-on={perchOn === "all" ? "1" : "0"} aria-pressed={perchOn === "all"} onClick={() => setPerchFilter("all")}>{v4("avpAllPerches")}</button>
        <button type="button" className="c4-chip" data-on={perchOn === "blank" ? "1" : "0"} aria-pressed={perchOn === "blank"} onClick={() => setPerchFilter("blank")}>{v4("avpBlankPerch")}</button>
        <button type="button" className="c4-chip" data-on={perchOn === "near" ? "1" : "0"} aria-pressed={perchOn === "near"} onClick={() => setPerchFilter("near")}>{v4("avpNear")}</button>
        <button type="button" className="c4-chip" data-on={perchOn === "far" ? "1" : "0"} aria-pressed={perchOn === "far"} onClick={() => setPerchFilter("far")}>{v4("avpFar")}</button>
        {["1", "7", "13"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={perchOn === slot ? "1" : "0"} aria-pressed={perchOn === slot} onClick={() => setPerchFilter(perchOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("avpSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("avpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-avp-next">
        <label className="c4-lab">
          <span>{v4("avpDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("avpDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("avpNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("avpNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("avpKeepers")}</span>
          <select className="c4-select" aria-label={v4("avpKeepers")} value={keeperOn} onChange={(event) => setKeeperFilter(event.target.value)}>
            <option value="all">{v4("avpAllKeepers")}</option>
            <option value="blank">{v4("avpBlankKeeper")}</option>
            {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("avpPlumages")}</span>
          <select className="c4-select" aria-label={v4("avpPlumages")} value={plumageOn} onChange={(event) => setPlumageFilter(event.target.value)}>
            <option value="all">{v4("avpAllPlumages")}</option>
            <option value="blank">{v4("avpBlankPlumage")}</option>
            {plumages.map((item) => <option key={item} value={item}>{plumageName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("avpBands")}</span>
          <select className="c4-select" aria-label={v4("avpBands")} value={bandOn} onChange={(event) => setBandFilter(event.target.value)}>
            <option value="all">{v4("avpAllBands")}</option>
            <option value="blank">{v4("avpBlankBand")}</option>
            {bands.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("avpSongs")}</span>
          <select className="c4-select" aria-label={v4("avpSongs")} value={songOn} onChange={(event) => setSongFilter(event.target.value)}>
            <option value="all">{v4("avpAllSongs")}</option>
            <option value="blank">{v4("avpBlankSong")}</option>
            {songs.map((item) => <option key={item} value={item}>{songName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-avp-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addPerchView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          keeper: keeperOn,
          plumage: plumageOn,
          band: bandOn,
          song: songOn,
          perch: perchOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("avpViewName")}</span>
          <input className="c4-field" aria-label={v4("avpViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("avpSaveView")}</button>
      </form>
      <section aria-label={v4("avpViews")}>
        <p className="c4-avp-kicker">{v4("avpViews")}</p>
        {!views.length && <p className="c4-avp-empty">{v4("avpViewEmpty")}</p>}
        <ul className="c4-avp-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropPerchView(views, view.id))}>{v4("avpDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-avp-empty">{v4("avpEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-avp-rows">
          {shown.map((card) => {
            const clashesOn = perchClashIds(cards, card.id);
            const gap = gapLabel(v4, card.perch, desk);
            const wing = wingOf(card.perch);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-song={card.song || "blank"} data-plumage={card.plumage || "blank"} data-loft={loftOf(card.perch)}>
                <span className="c4-avp-folio" aria-hidden="true">{perchLabel(card.perch)}</span>
                <span className="c4-avp-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.song) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editPerch(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("avpEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("avpSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.keeper || v4("avpBlankKeeper")}
                    {" · "}
                    {perchLabel(card.perch)}
                    {" · "}
                    {plumageName(v4, plumageOf(card.plumage))}
                    {" · "}
                    {card.band || v4("avpBlankBand")}
                    {" · "}
                    {songName(v4, songOf(card.song))}
                    {wing === "blank" ? "" : ` · ${wing === "near" ? v4("avpNear") : v4("avpFar")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("avpAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("avpClash")} ${clashesOn.length}` : v4("avpClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("avpCopied") : v4("avpCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("avpEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepPerchSong(cards, card.id, 1))}>{v4("avpRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepPerchSong(cards, card.id, -1))}>{v4("avpLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setPerchPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("avpUnpin") : v4("avpPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.roosted} onClick={() => store(setPerchRoosted(cards, card.id, !card.roosted))}>{card.roosted ? v4("avpWake") : v4("avpRoost")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.caged} onClick={() => store(setPerchCaged(cards, card.id, !card.caged))}>{card.caged ? v4("avpUncage") : v4("avpCage")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-avp-time">
          {timeline.map((card) => (
            <li key={card.id} data-loft={loftOf(card.perch)}>
              <span className="c4-avp-clock">{perchLabel(card.perch)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function PresenceWatches({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenShelves, setHiddenShelves] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [shelf, setShelf] = useState("all");
  const [span, setSpan] = useState("all");
  const [fold, setFold] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      lastSeenAt: row.lastSeenAt,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const shelves = shelfLines(rows);
  const spans = spanLines(rows);
  const folds = foldLines(rows);
  const present = namedShelves(rows);
  const presentKey = present.join("\n");
  const shelfNames = namedShelves(rows);
  const spanNames = namedSpans(rows);
  const foldNames = namedFolds(rows);
  const blankShelf = shelves.find((line) => !line.shelf)?.count || 0;
  const leadShelf = leadingShelf(rows);
  const leadFold = leadingFold(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenShelves(readJson(WATCH_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenShelves(next);
    writeJson(WATCH_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleShelves(present, hiddenShelves, showHidden);
  const shelfOn = activeShelf(selected || shelf, selected ? chips : shelfNames);
  const spanOn = activeSpan(span, spanNames);
  const foldOn = activeFold(fold, foldNames);
  const shown = visibleWatchCustomers(
    rows,
    selected ? shelfArg(activeShelf(selected, chips)) : shelfArg(activeShelf(shelf, shelfNames)),
    foldArg(foldOn),
    spanArg(spanOn),
    query,
  );
  const widest = Math.max(1, ...shelves.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenShelves(next);
    writeJson(WATCH_KEY, next);
    if (clear && activeShelf(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-psw" aria-label={v4("pswTitle")} data-watches="1">
      <header className="c4-psw-head">
        <div>
          <p className="c4-avp-kicker">{v4("pswSub")}</p>
          <h2 className="c4-title">{v4("pswTitle")}</h2>
        </div>
        <p className="c4-avp-count">{v4("pswRows")} {rows.length}</p>
      </header>
      <details className="c4-avp-rules">
        <summary>{v4("pswRules")}</summary>
        <p className="c4-meta">{v4("pswHint")}</p>
        <p className="c4-meta">{v4("pswLocal")}</p>
        <p className="c4-meta">{v4("pswEscape")}</p>
      </details>
      {leadShelf ? <p className="c4-psw-lead"><span>{v4("pswLeadShelf")}</span> {shelfName(v4, leadShelf)}</p> : null}
      {leadFold ? <p className="c4-psw-lead"><span>{v4("pswLeadFold")}</span> {foldName(v4, leadFold)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("pswBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("presence-watches.csv", watchesCsv(rows))}>{v4("pswCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("pswLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("pswFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-avp-empty">{v4("pswNone")}</p>}
      {shelves.length > 0 && (
        <section className="c4-psw-chart" aria-label={v4("pswAllShelf")}>
          {shelves.map((line) => {
            const share = watchShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.shelf || "blank";
            return (
              <p key={name} className="c4-psw-col" data-shelf={line.shelf || "blank"}>
                <span>{shelfName(v4, line.shelf)}</span>
                <span className="c4-avp-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("pswShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-psw-shelves" role="group" aria-label={v4("pswAllShelf")}>
        <button type="button" className="c4-psw-shelf" data-on={!selected && shelfOn === "all" ? "1" : "0"} aria-pressed={!selected && shelfOn === "all"} onClick={() => { setSelected(""); setShelf("all"); }}>
          <span>{v4("pswAllShelf")}</span>
          <span className="c4-avp-count">{rows.length}</span>
        </button>
        {blankShelf > 0 && (
          <button type="button" className="c4-psw-shelf" data-on={!selected && shelf === "blank" ? "1" : "0"} aria-pressed={!selected && shelf === "blank"} onClick={() => { setSelected(""); setShelf(shelf === "blank" ? "all" : "blank"); }}>
            <span>{v4("pswUnmarked")}</span>
            <span className="c4-avp-count">{blankShelf}</span>
          </button>
        )}
        {shelfNames.map((item) => {
          const count = shelves.find((line) => line.shelf === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-psw-shelf" data-on={!selected && shelf === item ? "1" : "0"} aria-pressed={!selected && shelf === item} onClick={() => { setSelected(""); setShelf(shelf === item ? "all" : item); }}>
              <span>{shelfName(v4, item)}</span>
              <span className="c4-avp-count">{count}</span>
              <span>{v4("pswShare")} {watchShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pswSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("pswSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pswFolds")}>
        <button type="button" className="c4-chip" data-on={foldOn === "all" ? "1" : "0"} aria-pressed={foldOn === "all"} onClick={() => setFold("all")}>{v4("pswAllFolds")}</button>
        {folds.filter((line) => line.fold).map((line) => (
          <button key={line.fold} type="button" className="c4-chip" data-on={foldOn === line.fold ? "1" : "0"} aria-pressed={foldOn === line.fold} onClick={() => setFold(foldOn === line.fold ? "all" : line.fold)}>
            {foldName(v4, line.fold)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pswShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("pswShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("pswHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("pswShelves")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("pswAll")}</button>
        {chips.map((item) => {
          const line = shelves.find((row) => row.shelf === item);
          const count = line?.count || 0;
          const share = watchShare(count, rows.length);
          return (
            <span key={item} className="c4-psw-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setShelf("all"); setSelected(selected === item ? "" : item); }}>{shelfName(v4, item)}</button>
              <span className="c4-avp-count">{count}</span>
              <span className="c4-psw-share">{v4("pswShare")} {share}%</span>
              <span className="c4-avp-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleShelf(hiddenShelves, item, present), showHidden ? "" : item)}>{showHidden ? v4("pswShow") : v4("pswHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("pswSearch")}</span>
        <input className="c4-field" aria-label={v4("pswSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-avp-empty">{v4("pswEmpty")}</p>}
      <ul className="c4-psw-rows">
        {shown.map((row) => {
          const watch = assignedWatch(row.lastSeenAt);
          const shelfMark = shelfOf(row.lastSeenAt);
          const spanMark = spanOf(row.lastSeenAt);
          const foldMark = foldOf(row.lastSeenAt);
          const quietMark = quietOf(row.lastSeenAt);
          return (
            <li key={row.id} data-shelf={shelfMark || "blank"} data-fold={foldMark || "blank"} data-span={spanMark || "blank"} data-quiet={quietMark || "blank"}>
              <span className="c4-psw-face" aria-hidden="true">{watch || "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {watch || v4("pswUnmarked")}
                {" · "}
                {shelfName(v4, shelfMark)}
                {" · "}
                {spanName(v4, spanMark)}
                {" · "}
                {foldName(v4, foldMark)}
                {" · "}
                {quietName(v4, quietMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
