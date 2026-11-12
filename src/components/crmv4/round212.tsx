"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AML_DENSITY_KEY,
  AML_KEY,
  AML_VIEW_KEY,
  CLM_KEY,
  CLM_REVIEW_KEY,
  activeFlame,
  activeGlass,
  activeKeeper,
  activeLampLane,
  activeLampTone,
  activeOil,
  activePulse,
  activeStation,
  addLantern,
  addLanternMark,
  addLanternView,
  adjacentLanternCount,
  bulkLampReview,
  bulkLanternClose,
  bulkLanternFlame,
  bulkLanternMark,
  bulkLanternPin,
  bulkLanternPulse,
  catalogLamp,
  catalogLampCount,
  clashStationCount,
  cyclePulse,
  densityOf,
  dropLanternView,
  editLantern,
  editLanternNote,
  fairKeeper,
  flameArg,
  glassArg,
  glassClashCount,
  giltLampCount,
  holdFocused,
  houseFlame,
  keeperArg,
  knockLoad,
  lampCopy,
  lampLane,
  lampLaneArg,
  lampLanes,
  lampOf,
  lampRowsCsv,
  lampShare,
  lampState,
  lampTone,
  lampToneArg,
  lampsCsv,
  lanternCopy,
  lanternCounts,
  lanternFlames,
  lanternKeepers,
  lanternLedger,
  lanternShare,
  lanternsCsv,
  lateLantern,
  lateShare,
  leadingLamp,
  leadingLampTone,
  moveFocus,
  nextLantern,
  oilArg,
  oilLoad,
  pairKeeperCount,
  peakStation,
  pinFocused,
  presentLamps,
  pulseArg,
  quietHouseCount,
  quietStation,
  readHiddenLamps,
  readLanternViews,
  readLanterns,
  readReviewedLamps,
  reminderLanterns,
  resetLanterns,
  setLanternClose,
  setLanternHold,
  setLanternOil,
  setLanternPin,
  sharedFlameCount,
  sharedLampCount,
  snoozeFocused,
  snoozeLantern,
  soonLantern,
  sortLanterns,
  sortMode,
  stationArg,
  stationGap,
  stationSpan,
  suggestFlame,
  suggestGlass,
  suggestKeeper,
  toggleLamp,
  toggleLampReview,
  usedStations,
  visibleLampCustomers,
  visibleLampLanes,
  visibleLanterns,
  wideLampCount,
  windowLanterns,
  busiestKeeper,
  type LampRow,
  type LampShape,
  type LanternDensity,
  type LanternSort,
  type LanternTray,
  type LanternView,
  type AmbulatoryLantern,
} from "@/lib/crmv4/round212";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  country?: string | null;
};

type GlanceRow = LampRow & { id: string };

const FLAMES = ["ember", "ivory", "champagne"] as const;
const PULSES = ["hush", "bell", "knock"] as const;
const LANES = ["north", "mid", "south"] as const;

function flameLabel(v4: V4, flame: string): string {
  if (flame === "ember" || flame === "EMBER") return v4("alnEmber");
  if (flame === "ivory" || flame === "IVORY") return v4("alnIvory");
  if (flame === "champagne" || flame === "CHAMPAGNE") return v4("alnChampagne");
  return v4("alnBlankFlame");
}

function pulseLabel(v4: V4, pulse: string): string {
  if (pulse === "hush") return v4("alnHush");
  if (pulse === "bell") return v4("alnBell");
  if (pulse === "knock") return v4("alnKnock");
  return v4("alnBlankPulse");
}

function glassLabel(v4: V4, glass: number | null): string {
  if (glass === 2) return v4("alnGlass2");
  if (glass === 6) return v4("alnGlass6");
  if (glass === 12) return v4("alnGlass12");
  return v4("alnBlankGlass");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "north") return v4("clmNorth");
  if (name === "mid") return v4("clmMid");
  if (name === "south") return v4("clmSouth");
  if (name === "blank") return v4("clmClear");
  return v4("clmUnmarked");
}

function lampToneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("clmGilt");
  if (name === "ink") return v4("clmInk");
  if (name === "ivory") return v4("clmIvoryTone");
  if (name === "mist") return v4("clmMist");
  if (name === "plain") return v4("clmTonePlain");
  return v4("clmUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "alnAuditSave",
    edit: "alnAuditEdit",
    pulse: "alnAuditPulse",
    pin: "alnAuditPin",
    unpin: "alnAuditUnpin",
    hold: "alnAuditHold",
    lift: "alnAuditLift",
    close: "alnAuditClose",
    open: "alnAuditOpen",
    flame: "alnAuditFlame",
    mark: "alnAuditMark",
    oil: "alnAuditOil",
    glass: "alnAuditGlass",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, station: number | null, desk: string): string {
  const gap = stationGap(station, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("alnPast")} ${gap}`;
  if (gap < 0) return `${v4("alnAhead")} ${Math.abs(gap)}`;
  return v4("alnDue");
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

export function AmbulatoryLanterns({ v4 }: { v4: V4 }) {
  const [lanterns, setLanterns] = useState<AmbulatoryLantern[]>([]);
  const [views, setViews] = useState<LanternView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [station, setStation] = useState("");
  const [flame, setFlame] = useState("");
  const [pulse, setPulse] = useState("");
  const [glassValue, setGlassValue] = useState("");
  const [mark, setMark] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<LanternTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [flameFilter, setFlameFilter] = useState("all");
  const [pulseFilter, setPulseFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [glassFilter, setGlassFilter] = useState("all");
  const [oilFilter, setOilFilter] = useState("all");
  const [knockOnly, setKnockOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [dryOnly, setDryOnly] = useState(false);
  const [board, setBoard] = useState<"gallery" | "ledger">("gallery");
  const [order, setOrder] = useState<LanternSort>("station");
  const [density, setDensity] = useState<LanternDensity>("tall");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskStation, setDeskStation] = useState("");
  const [moveFlame, setMoveFlame] = useState("ember");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const oilRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readLanterns(readJson(AML_KEY, []));
    const saved = readLanternViews(readJson(AML_VIEW_KEY, []));
    setLanterns(next);
    setViews(saved);
    setDensity(densityOf(readJson(AML_DENSITY_KEY, "tall")));
    writeJson(AML_KEY, next);
    writeJson(AML_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: AmbulatoryLantern[]) {
    const saved = readLanterns(next);
    setLanterns(saved);
    writeJson(AML_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((lantern) => lantern.id === id)));
  }
  function storeViews(next: LanternView[]) {
    const saved = readLanternViews(next);
    setViews(saved);
    writeJson(AML_VIEW_KEY, saved);
  }
  function storeDensity(next: LanternDensity) {
    setDensity(next);
    writeJson(AML_DENSITY_KEY, next);
  }
  const keepers = lanternKeepers(lanterns);
  const flames = lanternFlames(lanterns);
  const bars = FLAMES.map((item) => ({ flame: item.toUpperCase(), count: lanterns.filter((lantern) => lantern.flame === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const flameOn = activeFlame(flameFilter, flames);
  const pulseOn = activePulse(pulseFilter, ["hush", "bell", "knock"]);
  const stationOn = activeStation(stationFilter);
  const glassOn = activeGlass(glassFilter);
  const oilOn = activeOil(oilFilter);
  const pickedStation = stationArg(stationOn);
  const shown = sortLanterns(visibleLanterns(
    lanterns,
    tray,
    query,
    keeperArg(keeperOn),
    flameArg(flameOn),
    pulseArg(pulseOn),
    pickedStation.exact,
    pickedStation.pick,
    glassArg(glassOn),
    oilArg(oilOn),
    knockOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    dryOnly,
  ), order);
  const ledger = lanternLedger(lanterns, query);
  const counts = lanternCounts(lanterns, deskStation);
  const clashes = clashStationCount(lanterns);
  const glasses = glassClashCount(lanterns);
  const neighbors = adjacentLanternCount(lanterns);
  const nextId = nextLantern(lanterns, deskStation);
  const nextRow = lanterns.find((lantern) => lantern.id === nextId);
  const suggestedFlame = suggestFlame(lanterns);
  const suggestedKeeper = suggestKeeper(lanterns);
  const suggestedGlass = suggestGlass(lanterns);
  const fair = fairKeeper(lanterns, roster);
  const busy = busiestKeeper(lanterns);
  const reminders = reminderLanterns(lanterns, deskStation);
  const windowRows = windowLanterns(lanterns, deskStation);
  const share = lateShare(lanterns, deskStation);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((lantern) => lantern.id);
    store(pinFocused(lanterns, ids, focus));
  };
  oilRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((lantern) => lantern.id);
    store(snoozeFocused(lanterns, ids, focus));
  };
  holdRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((lantern) => lantern.id);
    store(holdFocused(lanterns, ids, focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        clearDraft();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        oilRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        setBoard((current) => (current === "gallery" ? "ledger" : "gallery"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function clearDraft() {
    setTitle("");
    setNote("");
    setKeeper("");
    setStation("");
    setFlame("");
    setPulse("");
    setGlassValue("");
    setMark("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: LanternView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper);
    setFlameFilter(view.flame);
    setPulseFilter(view.pulse);
    setStationFilter(view.station);
    setGlassFilter(view.glass);
    setOilFilter(view.oil);
  }
  const rows = board === "ledger" ? ledger : shown;
  return (
    <section className="c4-aln" aria-label={v4("amlnTitle")} data-lanterns="1" data-role={role} data-density={density}>
      <div className="c4-aln-sheet">
        <header className="c4-aln-mast">
          <p className="c4-aln-spine">{v4("alnSpine")}</p>
          <div>
            <p className="c4-aln-kicker">{v4("amlnSub")}</p>
            <h2 className="c4-title">{v4("amlnTitle")}</h2>
          </div>
          <p className="c4-aln-plate" data-logo="mono">{v4("alnLogo")}</p>
        </header>
        <div className="c4-aln-body">
          <p className="c4-aln-rules">{v4("amlnHint")}</p>
          <p className="c4-meta">{v4("alnLocal")}</p>
          <p className="c4-meta">{v4("alnNew")} {v4("alnSlash")} {v4("amlnEscape")} {v4("alnKeys")} {v4("alnPinKey")} {v4("alnOilKey")} {v4("alnHoldKey")} {v4("alnBoardKey")}</p>
          {viewer && <p className="c4-aln-notice" data-viewer="1">{v4("alnViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-aln-notice" role="status">
              {v4("alnNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("alnNoticeAll") : v4("alnNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-aln-notice" role="status" data-late="1">{v4("alnLateNotice")} · {counts.late}</p>}
          <ol className="c4-aln-ledger" aria-label={v4("alnKpi")}>
            <li><span>{v4("alnOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("alnHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("alnClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("alnPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("alnPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("alnLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("alnSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("alnOil")}</span><strong>{counts.oil}</strong></li>
            <li><span>{v4("alnHouseShare")}</span><strong>{lanternShare(counts.house, lanterns.length)}%</strong></li>
            <li><span>{v4("alnLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-aln-sla" aria-label={v4("alnLateShare")}>
            <span>{v4("alnLateShare")}</span>
            <div className="c4-aln-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-aln-rail" aria-label={v4("alnFlames")}>
            {bars.map((bar) => (
              <div key={bar.flame} className="c4-aln-meter" data-flame={bar.flame.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setFlameFilter(bar.flame)}>{flameLabel(v4, bar.flame)} · {bar.count}</button>
                <div className="c4-aln-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-aln-empty">{v4("amlnEmpty")}</p>}
          </div>
          <div className="c4-aln-suggest">
            <p>{v4("alnSuggestFlame")} · {flameLabel(v4, suggestedFlame)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setFlame(suggestedFlame.toLowerCase())}>{v4("alnUseFlame")}</button>
            <p>{v4("alnSuggestKeeper")} · {suggestedKeeper || v4("alnBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedKeeper} onClick={() => setKeeper(suggestedKeeper)}>{v4("alnUseKeeper")}</button>
            <p>{v4("alnSuggestGlass")} · {glassLabel(v4, suggestedGlass)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setGlassValue(String(suggestedGlass))}>{v4("alnUseGlass")}</button>
            <p>{v4("alnAssign")} · {fair || v4("alnBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("alnAssign")}</button>
          </div>
          <p className="c4-meta">{v4("alnStations")} · {usedStations(lanterns)}</p>
          <p className="c4-meta">{clashes ? `${v4("alnClash")} · ${clashes}` : v4("alnClashNone")}</p>
          <p className="c4-meta">{glasses ? `${v4("alnGlassClash")} · ${glasses}` : v4("alnGlassClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("alnAdjacent")} · ${neighbors}` : v4("alnAdjacentNone")}</p>
          <p className="c4-meta">{pairKeeperCount(lanterns) ? `${v4("alnPairs")} · ${pairKeeperCount(lanterns)}` : v4("alnPairsNone")}</p>
          <p className="c4-meta">{sharedFlameCount(lanterns) ? `${v4("alnSharedFlame")} · ${sharedFlameCount(lanterns)}` : v4("alnSharedFlameNone")}</p>
          <p className="c4-meta">{`${v4("alnOilLoad")} · ${oilLoad(lanterns)}`}</p>
          <p className="c4-meta">{`${v4("alnQuietHouse")} · ${quietHouseCount(lanterns)}`}</p>
          <p className="c4-meta">{`${v4("alnKnockLoad")} · ${knockLoad(lanterns)}`}</p>
          <p className="c4-meta">{`${v4("alnStationSpan")} · ${stationSpan(lanterns)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("alnNext")} · ${nextRow.title}` : v4("alnNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("alnBusiest")} · ${busy}` : v4("alnBusiestNone")}</p>
          <div className="c4-aln-reminders" aria-label={v4("alnReminders")}>
            {reminders.length ? reminders.map((lantern) => <span key={lantern.id}>{lantern.title}</span>) : <span>{v4("alnReminderNone")}</span>}
          </div>
          <div className="c4-aln-window" aria-label={v4("alnWindow")}>
            {windowRows.length ? windowRows.map((lantern) => <span key={lantern.id}>{lantern.title}</span>) : <span>{v4("alnWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("amlnSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("amlnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-aln-filters" role="group" aria-label={v4("amlnSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("alnOpenTray") : item === "held" ? v4("alnHeldTray") : v4("alnClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={keeperOn === "all" ? "1" : "0"} onClick={() => setKeeperFilter("all")}>{v4("alnAll")}</button>
            <button type="button" className="c4-chip" data-on={keeperOn === "blank" ? "1" : "0"} onClick={() => setKeeperFilter("blank")}>{v4("alnBlankKeeper")}</button>
            {keepers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={keeperOn === name ? "1" : "0"} onClick={() => setKeeperFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={flameOn === "all" ? "1" : "0"} onClick={() => setFlameFilter("all")}>{v4("alnFlame")}</button>
            <button type="button" className="c4-chip" data-on={flameOn === "blank" ? "1" : "0"} onClick={() => setFlameFilter("blank")}>{v4("alnBlankFlame")}</button>
            {FLAMES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={flameOn === item.toUpperCase() ? "1" : "0"} onClick={() => setFlameFilter(item)}>{flameLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={pulseOn === "all" ? "1" : "0"} onClick={() => setPulseFilter("all")}>{v4("alnPulse")}</button>
            {PULSES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={pulseOn === item ? "1" : "0"} onClick={() => setPulseFilter(item)}>{pulseLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "6"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={stationOn === item ? "1" : "0"} onClick={() => setStationFilter(item)}>{item === "all" ? v4("alnStation") : item === "blank" ? v4("alnBlankStation") : item === "early" ? v4("alnEarly") : item === "mid" ? v4("amlnMid") : item === "late" ? v4("alnLateStation") : item === "peak" ? v4("alnPeak") : item === "quiet" ? v4("alnQuiet") : item}</button>
            ))}
            {["all", "blank", "2", "6", "12"].map((item) => (
              <button key={`g${item}`} type="button" className="c4-chip" data-on={glassOn === item ? "1" : "0"} onClick={() => setGlassFilter(item)}>{item === "all" ? v4("alnGlass") : item === "blank" ? v4("alnBlankGlass") : glassLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "0", "1", "4"].map((item) => (
              <button key={`o${item}`} type="button" className="c4-chip" data-on={oilOn === item ? "1" : "0"} onClick={() => setOilFilter(item)}>{item === "all" ? v4("alnOil") : item === "blank" ? v4("alnBlankOil") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={knockOnly ? "1" : "0"} onClick={() => setKnockOnly((on) => !on)}>{v4("alnKnockOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("alnPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("alnHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("alnQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={dryOnly ? "1" : "0"} onClick={() => setDryOnly((on) => !on)}>{v4("alnDryOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "station" ? "1" : "0"} onClick={() => setOrder(sortMode("station"))}>{v4("alnSortStation")}</button>
            <button type="button" className="c4-chip" data-on={order === "keeper" ? "1" : "0"} onClick={() => setOrder(sortMode("keeper"))}>{v4("alnSortKeeper")}</button>
            <button type="button" className="c4-chip" data-on={density === "tall" ? "1" : "0"} onClick={() => storeDensity("tall")}>{v4("alnTall")}</button>
            <button type="button" className="c4-chip" data-on={density === "low" ? "1" : "0"} onClick={() => storeDensity("low")}>{v4("alnLow")}</button>
            <button type="button" className="c4-chip" data-on={board === "gallery" ? "1" : "0"} onClick={() => setBoard("gallery")}>{v4("alnGallery")}</button>
            <button type="button" className="c4-chip" data-on={board === "ledger" ? "1" : "0"} onClick={() => setBoard("ledger")}>{v4("alnLedger")}</button>
          </div>
          <form className="c4-aln-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addLantern(lanterns, { id: `aln-${Date.now()}`, title, note, keeper, station, flame, pulse, glass: glassValue, marks: mark }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("alnLine")}<input ref={titleRef} className="c4-field" aria-label={v4("alnLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("alnNote")}<input className="c4-field" aria-label={v4("alnNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("alnKeeper")}<input className="c4-field" aria-label={v4("alnKeeper")} value={keeper} onChange={(event) => setKeeper(event.target.value)} /></label>
            <label className="c4-lab">{v4("alnStation")}<input className="c4-field" aria-label={v4("alnStation")} value={station} onChange={(event) => setStation(event.target.value)} /></label>
            <label className="c4-lab">{v4("alnFlame")}<input className="c4-field" aria-label={v4("alnFlame")} value={flame} onChange={(event) => setFlame(event.target.value)} /></label>
            <label className="c4-lab">{v4("alnPulse")}<input className="c4-field" aria-label={v4("alnPulse")} value={pulse} onChange={(event) => setPulse(event.target.value)} /></label>
            <label className="c4-lab">{v4("alnGlass")}<input className="c4-field" aria-label={v4("alnGlass")} value={glassValue} onChange={(event) => setGlassValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("alnMark")}<input className="c4-field" aria-label={v4("alnMark")} value={mark} onChange={(event) => setMark(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("alnSave")}</button>
          </form>
          <label className="c4-lab">{v4("alnDeskStation")}<input className="c4-field" aria-label={v4("alnDeskStation")} value={deskStation} onChange={(event) => setDeskStation(event.target.value)} /></label>
          <label className="c4-lab">{v4("alnRoster")}<input className="c4-field" aria-label={v4("alnRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-aln-views">
            <label className="c4-lab">{v4("alnViewName")}<input className="c4-field" aria-label={v4("alnViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addLanternView(views, { id: `view-${Date.now()}`, name, tray, query, keeper: keeperOn, flame: flameOn, pulse: pulseOn, station: stationOn, glass: glassOn, oil: oilOn }));
              setViewName("");
            }}>{v4("alnSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("alnDropView")} onClick={() => storeViews(dropLanternView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-aln-bulk">
            <label className="c4-lab">{v4("alnBulkFlame")}<input className="c4-field" aria-label={v4("alnBulkFlame")} value={moveFlame} onChange={(event) => setMoveFlame(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLanternFlame(lanterns, picked, moveFlame))}>{v4("alnBulkFlame")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLanternPin(lanterns, picked, true))}>{v4("alnBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLanternClose(lanterns, picked, true))}>{v4("alnBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLanternMark(lanterns, picked, mark))}>{v4("alnBulkMark")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLanternPulse(lanterns, picked, pulse))}>{v4("alnBulkPulse")}</button>
            <button type="button" className="c4-btn" onClick={() => download("ambulatory-lanterns.csv", lanternsCsv(lanterns, deskStation))}>{v4("amlnCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetLanterns())}>{v4("alnReset")}</button>
          </div>
          {!rows.length && <p className="c4-aln-empty">{v4("amlnEmpty")}</p>}
          <ol className={board === "ledger" ? "c4-aln-time" : "c4-aln-book"}>
            {rows.map((lantern, index) => (
              <li key={lantern.id} data-focus={focus === index ? "1" : "0"} data-late={lateLantern(lantern, deskStation) ? "1" : "0"} data-soon={soonLantern(lantern) ? "1" : "0"} data-peak={peakStation(lantern.station) ? "1" : "0"} data-quiet={quietStation(lantern.station) ? "1" : "0"} data-house={houseFlame(lantern.flame) ? "1" : "0"} data-pinned={lantern.pinned ? "1" : "0"} data-oil={lantern.oil ? "1" : "0"}>
                <label className="c4-check"><input type="checkbox" checked={picked.includes(lantern.id)} onChange={() => setPicked((ids) => ids.includes(lantern.id) ? ids.filter((id) => id !== lantern.id) : [...ids, lantern.id])} /><span>{lantern.station ?? "—"}</span></label>
                <div>
                  {editing === lantern.id ? (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("alnLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("alnNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editLanternNote(editLantern(lanterns, lantern.id, draft), lantern.id, noteDraft)); setEditing(""); }}>{v4("alnSave")}</button>
                    </div>
                  ) : (
                    <>
                      <strong>{lantern.title}</strong>
                      <span className="c4-meta">{lantern.keeper || v4("alnBlankKeeper")} · {flameLabel(v4, lantern.flame)} · {pulseLabel(v4, lantern.pulse)} · {glassLabel(v4, lantern.glass)} · {gapLabel(v4, lantern.station, deskStation)}</span>
                      {lantern.note && <p>{lantern.note}</p>}
                      {!!lantern.marks.length && <p className="c4-meta">{lantern.marks.join(" ")}</p>}
                      {lantern.audit && <p className="c4-meta">{auditLabel(v4, lantern.audit)}</p>}
                    </>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternPin(lanterns, lantern.id, !lantern.pinned))}>{lantern.pinned ? v4("alnUnpin") : v4("alnPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternHold(lanterns, lantern.id, !lantern.held))}>{lantern.held ? v4("alnLift") : v4("alnHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePulse(lanterns, lantern.id))}>{v4("alnPulse")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLanternMark(lanterns, lantern.id, mark))}>{v4("alnMark")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternClose(lanterns, lantern.id, !lantern.closed))}>{lantern.closed ? v4("alnReopen") : v4("alnClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternOil(lanterns, lantern.id, lantern.oil ? 0 : 1))}>{lantern.oil ? v4("alnOilOff") : v4("alnOilOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeLantern(lanterns, lantern.id))}>{v4("alnSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(lantern.id); setDraft(lantern.title); setNoteDraft(lantern.note); }}>{v4("alnEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = lanternCopy(lantern, deskStation); void navigator.clipboard?.writeText(line); setCopied(lantern.id); }}>{copied === lantern.id ? v4("alnCopied") : v4("amlnCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-aln-rules">{v4("amlnRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function CountryLamps({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<LampShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.users || []).map((user) => ({
    id: user.id,
    label: user.name || user.id,
    note: { country: user.country ?? null },
  })), [data.data?.users]);
  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    const present = presentLamps(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenLamps(readJson(CLM_KEY, []), present);
    const nextReviewed = readReviewedLamps(readJson(CLM_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(CLM_KEY, nextHidden);
    writeJson(CLM_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentLamps(rows);
  const lanes = visibleLampLanes(present, hidden, showHidden);
  const laneOn = activeLampLane(lane, present);
  const toneOn = activeLampTone(tone);
  const shown = visibleLampCustomers(rows, lampLaneArg(laneOn), lampToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = lampState(row.note);
      const token = state === "set" ? lampLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingLamp(rows);
  const toneLead = leadingLampTone(rows);
  const shared = sharedLampCount(rows);
  const catalog = catalogLampCount(rows);
  const bars = lampLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(CLM_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedLamps(next, ids);
    setReviewed(saved);
    writeJson(CLM_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-clm" aria-label={v4("clmTitle")} data-lamps="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-clm-sheet">
        <header className="c4-clm-mast">
          <div>
            <p className="c4-clm-kicker">{v4("clmSub")}</p>
            <h2 className="c4-title">{v4("clmTitle")}</h2>
          </div>
          <p className="c4-clm-plate" data-logo="mono">{v4("clmLogo")}</p>
        </header>
        <p className="c4-clm-rules">{v4("clmHint")}</p>
        <p className="c4-meta">{v4("clmKept")} {v4("clmEscape")}</p>
        {viewer && <p className="c4-clm-notice" data-viewer="1">{v4("clmViewer")}</p>}
        {data.error && <p className="c4-clm-empty" role="alert">{v4("clmFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("clmLoading")}</p>}
        {shared > 0 && <p className="c4-clm-notice" role="status">{v4("clmNotice")} · {shared}</p>}
        <ol className="c4-clm-ledger" aria-label={v4("clmKpi")}>
          <li><span>{v4("clmSet")}</span><strong>{rows.filter((row) => lampState(row.note) === "set").length}</strong></li>
          <li><span>{v4("clmCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("clmWide")}</span><strong>{wideLampCount(rows)}</strong></li>
          <li><span>{v4("clmGiltCount")}</span><strong>{giltLampCount(rows)}</strong></li>
          <li><span>{v4("clmShare")}</span><strong>{lampShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("clmShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-clm-rail" aria-label={v4("clmLanes")}>
          {bars.map((bar) => (
            <div key={bar.lane} className="c4-clm-meter">
              <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
              <div className="c4-clm-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-clm-empty">{v4("clmEmpty")}</p>}
        </div>
        <div className="c4-clm-suggest">
          <p>{v4("clmLeading")} · {lead ? laneLabel(v4, lead) : v4("clmLeadingNone")}</p>
          <p>{v4("clmToneLead")} · {toneLead ? lampToneLabel(v4, toneLead) : v4("clmToneNone")}</p>
          <p>{shared ? `${v4("clmShared")} · ${shared}` : v4("clmSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("clmSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("clmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-clm-filters">
          <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("clmAll")}</button>
          <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("clmClear")}</button>
          {LANES.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("clmTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("clmGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("clmInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("clmIvoryTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("clmMist")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("clmTonePlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("clmAllShapes") : item === "catalog" ? v4("clmCatalog") : item === "wide" ? v4("clmWide") : v4("clmGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("clmAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("clmReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("clmOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("clmShown") : v4("clmHidden")}</button>
        </div>
        <div className="c4-clm-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleLamp(hidden, item))}>
              {laneLabel(v4, item)} · {hidden.includes(item) ? v4("clmShow") : v4("clmHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLampReview(reviewed, shown.map((row) => row.id), true))}>{v4("clmBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLampReview(reviewed, ids, false))}>{v4("clmBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("country-lamps.csv", lampsCsv(rows))}>{v4("clmCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("country-lamp-rows.csv", lampRowsCsv(rows, reviewed))}>{v4("clmRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("clmCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-clm-empty">{v4("clmEmpty")}</p>}
        <ul className="c4-clm-index">
          {shown.map((row) => {
            const state = lampState(row.note);
            const mark = lampOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? lampLane(row.note) : "blank"} data-tone={lampTone(row.note) || "blank"} data-catalog={catalogLamp(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-clm-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{laneLabel(v4, state === "set" ? lampLane(row.note) : state === "clear" ? "blank" : "")} · {lampToneLabel(v4, lampTone(row.note))}</span>
                  {catalogLamp(row.note) && <span className="c4-meta">{v4("clmCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLampReview(reviewed, row.id))}>{v4("clmReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = lampCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("clmCopied") : v4("clmCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-clm-rules">{v4("clmRules")}</p>
      </div>
    </section>
  );
}
