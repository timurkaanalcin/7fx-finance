"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BLC_DENSITY_KEY,
  BLC_KEY,
  BLC_VIEW_KEY,
  DLS_KEY,
  DLS_REVIEW_KEY,
  activeHour,
  activeMetal,
  activePitch,
  activePulls,
  activeRinger,
  activeSealLane,
  activeSealTone,
  activeStance,
  addCord,
  addCordTag,
  addCordView,
  adjacentCordCount,
  bulkCordArchive,
  bulkCordMetal,
  bulkCordPin,
  bulkCordStance,
  bulkCordTag,
  bulkSealReview,
  busiestRinger,
  catalogSeal,
  catalogSealCount,
  clashHourCount,
  cordCopy,
  cordCounts,
  cordLedger,
  cordMetals,
  cordRingers,
  cordShare,
  cordsCsv,
  cycleStance,
  densityOf,
  dropCordView,
  editCord,
  editCordNote,
  fairRinger,
  giltSealCount,
  holdFocused,
  hourArg,
  hourGap,
  hourSpan,
  houseMetal,
  lateCord,
  lateShare,
  leadingSeal,
  leadingSealTone,
  matchedCords,
  metalArg,
  moveFocus,
  muteLoad,
  nextCord,
  pairRingerCount,
  peakHour,
  pinFocused,
  pitchArg,
  pitchLoad,
  presentSeals,
  pullsArg,
  pullsClashCount,
  quietHour,
  quietLoftCount,
  readCordViews,
  readCords,
  readHiddenSeals,
  readReviewedSeals,
  reminderCords,
  resetCords,
  ringerArg,
  sealCopy,
  sealLane,
  sealLaneArg,
  sealLanes,
  sealOf,
  sealRowsCsv,
  sealShare,
  sealState,
  sealStep,
  sealTone,
  sealToneArg,
  sealsCsv,
  setCordArchive,
  setCordHold,
  setCordPin,
  setCordPitch,
  sharedMetalCount,
  sharedSealCount,
  snoozeCord,
  snoozeFocused,
  soonCord,
  sortCords,
  sortMode,
  stanceArg,
  stanceFocused,
  suggestMetal,
  suggestPulls,
  suggestRinger,
  toggleSeal,
  toggleSealReview,
  usedHours,
  visibleCords,
  visibleSealCustomers,
  visibleSealLanes,
  wideSeal,
  wideSealCount,
  windowCords,
  type BellCord,
  type CordDensity,
  type CordSort,
  type CordTray,
  type CordView,
  type SealRow,
  type SealShape,
} from "@/lib/crmv4/round217";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  phone?: string | null;
};

type GlanceRow = SealRow & { id: string };

const METALS = ["brass", "bronze", "iron"] as const;
const STANCES = ["ring", "hush", "mute"] as const;
const LANES = ["loft", "hall", "yard"] as const;

function metalLabel(v4: V4, metal: string): string {
  if (metal === "brass" || metal === "BRASS") return v4("blcBrass");
  if (metal === "bronze" || metal === "BRONZE") return v4("blcBronze");
  if (metal === "iron" || metal === "IRON") return v4("blcIron");
  return v4("blcBlankMetal");
}

function stanceLabel(v4: V4, stance: string): string {
  if (stance === "ring") return v4("blcRing");
  if (stance === "hush") return v4("blcHush");
  if (stance === "mute") return v4("blcMute");
  return v4("blcBlankStance");
}

function pullsLabel(v4: V4, pulls: number | null): string {
  if (pulls === 2) return v4("blcPull2");
  if (pulls === 4) return v4("blcPull4");
  if (pulls === 8) return v4("blcPull8");
  return v4("blcBlankPulls");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "loft") return v4("dlsLoft");
  if (name === "hall") return v4("dlsHall");
  if (name === "yard") return v4("dlsYard");
  if (name === "blank") return v4("dlsClear");
  return v4("dlsUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("dlsGilt");
  if (name === "ink") return v4("dlsInk");
  if (name === "ivory") return v4("dlsIvory");
  if (name === "mist") return v4("dlsMist");
  return v4("dlsUnmarked");
}

function kindLabel(v4: V4, step: number): string {
  if (step === 1) return v4("dlsDigits");
  if (step === 2) return v4("dlsLetters");
  if (step === 3) return v4("dlsMixed");
  return v4("dlsClear");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "blcAuditSave",
    edit: "blcAuditEdit",
    stance: "blcAuditStance",
    pin: "blcAuditPin",
    unpin: "blcAuditUnpin",
    hold: "blcAuditHold",
    resume: "blcAuditResume",
    archive: "blcAuditArchive",
    open: "blcAuditOpen",
    metal: "blcAuditMetal",
    tag: "blcAuditTag",
    pitch: "blcAuditPitch",
    pulls: "blcAuditPulls",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("blcPast")} ${gap}`;
  if (gap < 0) return `${v4("blcAhead")} ${Math.abs(gap)}`;
  return v4("blcDue");
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

export function BellCords({ v4 }: { v4: V4 }) {
  const [cords, setCords] = useState<BellCord[]>([]);
  const [views, setViews] = useState<CordView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [ringer, setRinger] = useState("");
  const [hour, setHour] = useState("");
  const [metal, setMetal] = useState("");
  const [stance, setStance] = useState("");
  const [pullsValue, setPullsValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CordTray>("open");
  const [ringerFilter, setRingerFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [stanceFilter, setStanceFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [pullsFilter, setPullsFilter] = useState("all");
  const [pitchFilter, setPitchFilter] = useState("all");
  const [muteOnly, setMuteOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [lightOnly, setLightOnly] = useState(false);
  const [board, setBoard] = useState<"tower" | "line">("tower");
  const [order, setOrder] = useState<CordSort>("hour");
  const [density, setDensity] = useState<CordDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskHour, setDeskHour] = useState("");
  const [moveMetal, setMoveMetal] = useState("bronze");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const pullsRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const stanceRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCords(readJson(BLC_KEY, []));
    const saved = readCordViews(readJson(BLC_VIEW_KEY, []));
    setCords(next);
    setViews(saved);
    setDensity(densityOf(readJson(BLC_DENSITY_KEY, "airy")));
    writeJson(BLC_KEY, next);
    writeJson(BLC_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: BellCord[]) {
    const saved = readCords(next);
    setCords(saved);
    writeJson(BLC_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((cord) => cord.id === id)));
  }
  function storeViews(next: CordView[]) {
    const saved = readCordViews(next);
    setViews(saved);
    writeJson(BLC_VIEW_KEY, saved);
  }
  function storeDensity(next: CordDensity) {
    setDensity(next);
    writeJson(BLC_DENSITY_KEY, next);
  }
  const ringers = cordRingers(cords);
  const metals = cordMetals(cords);
  const bars = METALS.map((item) => ({ metal: item.toUpperCase(), count: cords.filter((cord) => cord.metal === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const ringerOn = activeRinger(ringerFilter, ringers);
  const metalOn = activeMetal(metalFilter, metals);
  const stanceOn = activeStance(stanceFilter, ["ring", "hush", "mute"]);
  const hourOn = activeHour(hourFilter);
  const pullsOn = activePulls(pullsFilter);
  const pitchOn = activePitch(pitchFilter);
  const pickedHour = hourArg(hourOn);
  const shown = sortCords(visibleCords(
    cords,
    tray,
    query,
    ringerArg(ringerOn),
    metalArg(metalOn),
    stanceArg(stanceOn),
    pickedHour.exact,
    pickedHour.pick,
    pullsArg(pullsOn),
    pitchArg(pitchOn),
    muteOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    lightOnly,
  ), order);
  const ledger = cordLedger(cords, query);
  const counts = cordCounts(cords, deskHour);
  const clashes = clashHourCount(cords);
  const pulls = pullsClashCount(cords);
  const neighbors = adjacentCordCount(cords);
  const nextId = nextCord(cords, deskHour);
  const nextRow = cords.find((cord) => cord.id === nextId);
  const suggestedMetal = suggestMetal(cords);
  const suggestedRinger = suggestRinger(cords);
  const suggestedPulls = suggestPulls(cords);
  const fair = fairRinger(cords, roster);
  const busy = busiestRinger(cords);
  const reminders = reminderCords(cords, deskHour);
  const windowRows = windowCords(cords, deskHour);
  const share = lateShare(cords, deskHour);
  const matched = matchedCords(cords, deskHour);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((cord) => cord.id);
    store(pinFocused(cords, ids, focus));
  };
  pullsRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((cord) => cord.id);
    store(snoozeFocused(cords, ids, focus));
  };
  holdRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((cord) => cord.id);
    store(holdFocused(cords, ids, focus));
  };
  stanceRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((cord) => cord.id);
    store(stanceFocused(cords, ids, focus));
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
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        pullsRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        stanceRef.current();
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        setBoard((current) => (current === "tower" ? "line" : "tower"));
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
    setRinger("");
    setHour("");
    setMetal("");
    setStance("");
    setPullsValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: CordView) {
    setTray(view.tray);
    setQuery(view.query);
    setRingerFilter(view.ringer);
    setMetalFilter(view.metal);
    setStanceFilter(view.stance);
    setHourFilter(view.hour);
    setPullsFilter(view.pulls);
    setPitchFilter(view.pitch);
  }
  const rows = board === "line" ? ledger : shown;
  return (
    <section className="c4-blc" aria-label={v4("blcTitle")} data-cords="1" data-role={role} data-density={density}>
      <div className="c4-blc-sheet">
        <header className="c4-blc-mast">
          <p className="c4-blc-spine">{v4("blcSpine")}</p>
          <div>
            <p className="c4-blc-kicker">{v4("blcSub")}</p>
            <h2 className="c4-title">{v4("blcTitle")}</h2>
          </div>
          <p className="c4-blc-plate" data-logo="mono">{v4("blcLogo")}</p>
        </header>
        <div className="c4-blc-body">
          <p className="c4-blc-rules">{v4("blcHint")}</p>
          <p className="c4-meta">{v4("blcLocal")}</p>
          <p className="c4-meta">{v4("blcNew")} {v4("blcSlash")} {v4("blcEscape")} {v4("blcKeys")} {v4("blcPinKey")} {v4("blcPullsKey")} {v4("blcHoldKey")} {v4("blcStanceKey")} {v4("blcBoardKey")}</p>
          {viewer && <p className="c4-blc-notice" data-viewer="1">{v4("blcViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-blc-notice" role="status">
              {v4("blcNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("blcNoticeAll") : v4("blcNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-blc-notice" role="status" data-late="1">{v4("blcLateNotice")} · {counts.late}</p>}
          <ol className="c4-blc-ledger" aria-label={v4("blcKpi")}>
            <li><span>{v4("blcOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("blcHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("blcArchived")}</span><strong>{counts.archived}</strong></li>
            <li><span>{v4("blcPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("blcPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("blcLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("blcSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("blcPitch")}</span><strong>{counts.pitch}</strong></li>
            <li><span>{v4("blcMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("blcHouseShare")}</span><strong>{cordShare(counts.house, cords.length)}%</strong></li>
            <li><span>{v4("blcLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-blc-sla" aria-label={v4("blcLateShare")}>
            <span>{v4("blcLateShare")}</span>
            <div className="c4-blc-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-blc-rail" aria-label={v4("blcMetals")}>
            {bars.map((bar) => (
              <div key={bar.metal} className="c4-blc-meter" data-metal={bar.metal.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setMetalFilter(bar.metal)}>{metalLabel(v4, bar.metal)} · {bar.count}</button>
                <div className="c4-blc-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-blc-empty">{v4("blcEmpty")}</p>}
          </div>
          <div className="c4-blc-suggest">
            <p>{v4("blcSuggestMetal")} · {metalLabel(v4, suggestedMetal)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setMetal(suggestedMetal.toLowerCase())}>{v4("blcUseMetal")}</button>
            <p>{v4("blcSuggestRinger")} · {suggestedRinger || v4("blcBlankRinger")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedRinger} onClick={() => setRinger(suggestedRinger)}>{v4("blcUseRinger")}</button>
            <p>{v4("blcSuggestPulls")} · {pullsLabel(v4, suggestedPulls)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPullsValue(String(suggestedPulls))}>{v4("blcUsePulls")}</button>
            <p>{v4("blcAssign")} · {fair || v4("blcBlankRinger")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setRinger(fair)}>{v4("blcAssign")}</button>
          </div>
          <p className="c4-meta">{v4("blcHours")} · {usedHours(cords)}</p>
          <p className="c4-meta">{clashes ? `${v4("blcClash")} · ${clashes}` : v4("blcClashNone")}</p>
          <p className="c4-meta">{pulls ? `${v4("blcPullsClash")} · ${pulls}` : v4("blcPullsClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("blcAdjacent")} · ${neighbors}` : v4("blcAdjacentNone")}</p>
          <p className="c4-meta">{pairRingerCount(cords) ? `${v4("blcPairs")} · ${pairRingerCount(cords)}` : v4("blcPairsNone")}</p>
          <p className="c4-meta">{sharedMetalCount(cords) ? `${v4("blcSharedMetal")} · ${sharedMetalCount(cords)}` : v4("blcSharedMetalNone")}</p>
          <p className="c4-meta">{`${v4("blcPitchLoad")} · ${pitchLoad(cords)}`}</p>
          <p className="c4-meta">{`${v4("blcQuietLoft")} · ${quietLoftCount(cords)}`}</p>
          <p className="c4-meta">{`${v4("blcMuteLoad")} · ${muteLoad(cords)}`}</p>
          <p className="c4-meta">{`${v4("blcHourSpan")} · ${hourSpan(cords)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("blcNext")} · ${nextRow.title}` : v4("blcNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("blcBusiest")} · ${busy}` : v4("blcBusiestNone")}</p>
          <div className="c4-blc-reminders" aria-label={v4("blcReminders")}>
            {reminders.length ? reminders.map((cord) => <span key={cord.id}>{cord.title}</span>) : <span>{v4("blcReminderNone")}</span>}
          </div>
          <div className="c4-blc-window" aria-label={v4("blcWindow")}>
            {windowRows.length ? windowRows.map((cord) => <span key={cord.id}>{cord.title}</span>) : <span>{v4("blcWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("blcSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("blcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-blc-filters" role="group" aria-label={v4("blcSearch")}>
            {(["open", "held", "archived"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("blcOpenTray") : item === "held" ? v4("blcHeldTray") : v4("blcArchivedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={ringerOn === "all" ? "1" : "0"} onClick={() => setRingerFilter("all")}>{v4("blcAll")}</button>
            <button type="button" className="c4-chip" data-on={ringerOn === "blank" ? "1" : "0"} onClick={() => setRingerFilter("blank")}>{v4("blcBlankRinger")}</button>
            {ringers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={ringerOn === name ? "1" : "0"} onClick={() => setRingerFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={metalOn === "all" ? "1" : "0"} onClick={() => setMetalFilter("all")}>{v4("blcMetal")}</button>
            <button type="button" className="c4-chip" data-on={metalOn === "blank" ? "1" : "0"} onClick={() => setMetalFilter("blank")}>{v4("blcBlankMetal")}</button>
            {METALS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={metalOn === item.toUpperCase() ? "1" : "0"} onClick={() => setMetalFilter(item)}>{metalLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={stanceOn === "all" ? "1" : "0"} onClick={() => setStanceFilter("all")}>{v4("blcStance")}</button>
            <button type="button" className="c4-chip" data-on={stanceOn === "blank" ? "1" : "0"} onClick={() => setStanceFilter("blank")}>{v4("blcBlankStance")}</button>
            {STANCES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={stanceOn === item ? "1" : "0"} onClick={() => setStanceFilter(item)}>{stanceLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "8"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={hourOn === item ? "1" : "0"} onClick={() => setHourFilter(item)}>{item === "all" ? v4("blcHour") : item === "blank" ? v4("blcBlankHour") : item === "early" ? v4("blcEarly") : item === "mid" ? v4("blcMid") : item === "late" ? v4("blcLateHour") : item === "peak" ? v4("blcPeak") : item === "quiet" ? v4("blcQuiet") : item}</button>
            ))}
            {["all", "blank", "2", "4", "8"].map((item) => (
              <button key={`p${item}`} type="button" className="c4-chip" data-on={pullsOn === item ? "1" : "0"} onClick={() => setPullsFilter(item)}>{item === "all" ? v4("blcPulls") : item === "blank" ? v4("blcBlankPulls") : pullsLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "0", "2", "4"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={pitchOn === item ? "1" : "0"} onClick={() => setPitchFilter(item)}>{item === "all" ? v4("blcPitch") : item === "blank" ? v4("blcBlankPitch") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={muteOnly ? "1" : "0"} onClick={() => setMuteOnly((on) => !on)}>{v4("blcMuteOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("blcPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("blcHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("blcQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={lightOnly ? "1" : "0"} onClick={() => setLightOnly((on) => !on)}>{v4("blcLightOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "hour" ? "1" : "0"} onClick={() => setOrder(sortMode("hour"))}>{v4("blcSortHour")}</button>
            <button type="button" className="c4-chip" data-on={order === "ringer" ? "1" : "0"} onClick={() => setOrder(sortMode("ringer"))}>{v4("blcSortRinger")}</button>
            <button type="button" className="c4-chip" data-on={density === "airy" ? "1" : "0"} onClick={() => storeDensity("airy")}>{v4("blcAiry")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("blcTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "tower" ? "1" : "0"} onClick={() => setBoard("tower")}>{v4("blcTower")}</button>
            <button type="button" className="c4-chip" data-on={board === "line" ? "1" : "0"} onClick={() => setBoard("line")}>{v4("blcLine")}</button>
          </div>
          <form className="c4-blc-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addCord(cords, { id: `blc-${Date.now()}`, title, note, ringer, hour, metal, stance, pulls: pullsValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("blcCord")}<input ref={titleRef} className="c4-field" aria-label={v4("blcCord")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("blcNote")}<input className="c4-field" aria-label={v4("blcNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("blcRinger")}<input className="c4-field" aria-label={v4("blcRinger")} value={ringer} onChange={(event) => setRinger(event.target.value)} /></label>
            <label className="c4-lab">{v4("blcHour")}<input className="c4-field" aria-label={v4("blcHour")} value={hour} onChange={(event) => setHour(event.target.value)} /></label>
            <label className="c4-lab">{v4("blcMetal")}<input className="c4-field" aria-label={v4("blcMetal")} value={metal} onChange={(event) => setMetal(event.target.value)} /></label>
            <label className="c4-lab">{v4("blcStance")}<input className="c4-field" aria-label={v4("blcStance")} value={stance} onChange={(event) => setStance(event.target.value)} /></label>
            <label className="c4-lab">{v4("blcPulls")}<input className="c4-field" aria-label={v4("blcPulls")} value={pullsValue} onChange={(event) => setPullsValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("blcTag")}<input className="c4-field" aria-label={v4("blcTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("blcSave")}</button>
          </form>
          <label className="c4-lab">{v4("blcDeskHour")}<input className="c4-field" aria-label={v4("blcDeskHour")} value={deskHour} onChange={(event) => setDeskHour(event.target.value)} /></label>
          <label className="c4-lab">{v4("blcRoster")}<input className="c4-field" aria-label={v4("blcRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-blc-views">
            <label className="c4-lab">{v4("blcViewName")}<input className="c4-field" aria-label={v4("blcViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addCordView(views, { id: `view-${Date.now()}`, name, tray, query, ringer: ringerOn, metal: metalOn, stance: stanceOn, hour: hourOn, pulls: pullsOn, pitch: pitchOn }));
              setViewName("");
            }}>{v4("blcSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("blcDropView")} onClick={() => storeViews(dropCordView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-blc-bulk">
            <label className="c4-lab">{v4("blcBulkMetal")}<input className="c4-field" aria-label={v4("blcBulkMetal")} value={moveMetal} onChange={(event) => setMoveMetal(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCordMetal(cords, picked, moveMetal))}>{v4("blcBulkMetal")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCordPin(cords, picked, true))}>{v4("blcBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCordArchive(cords, picked, true))}>{v4("blcBulkArchive")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCordTag(cords, picked, tag))}>{v4("blcBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCordStance(cords, picked, stance))}>{v4("blcBulkStance")}</button>
            <button type="button" className="c4-btn" onClick={() => download("bell-cords.csv", cordsCsv(cords, deskHour))}>{v4("blcCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCords())}>{v4("blcReset")}</button>
          </div>
          {!rows.length && <p className="c4-blc-empty">{v4("blcEmpty")}</p>}
          <ol className={board === "line" ? "c4-blc-time" : "c4-blc-book"}>
            {rows.map((cord, index) => (
              <li key={cord.id} data-focus={focus === index ? "1" : "0"} data-late={lateCord(cord, deskHour) ? "1" : "0"} data-soon={soonCord(cord) ? "1" : "0"} data-peak={peakHour(cord.hour) ? "1" : "0"} data-quiet={quietHour(cord.hour) ? "1" : "0"} data-house={houseMetal(cord.metal) ? "1" : "0"} data-pinned={cord.pinned ? "1" : "0"} data-pitch={cord.pitch ? "1" : "0"} data-stance={cord.stance || "blank"}>
                <label className="c4-check"><input type="checkbox" checked={picked.includes(cord.id)} onChange={() => setPicked((ids) => ids.includes(cord.id) ? ids.filter((id) => id !== cord.id) : [...ids, cord.id])} /><span>{cord.hour ?? "—"}</span></label>
                <div>
                  {editing === cord.id ? (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("blcCord")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("blcNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editCordNote(editCord(cords, cord.id, draft), cord.id, noteDraft)); setEditing(""); }}>{v4("blcSave")}</button>
                    </div>
                  ) : (
                    <>
                      <strong>{cord.title}</strong>
                      <span className="c4-meta">{cord.ringer || v4("blcBlankRinger")} · {metalLabel(v4, cord.metal)} · {stanceLabel(v4, cord.stance)} · {pullsLabel(v4, cord.pulls)} · {gapLabel(v4, cord.hour, deskHour)}</span>
                      {cord.note && <p>{cord.note}</p>}
                      {!!cord.tags.length && <p className="c4-meta">{cord.tags.join(" ")}</p>}
                      {cord.audit && <p className="c4-meta">{auditLabel(v4, cord.audit)}</p>}
                    </>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCordPin(cords, cord.id, !cord.pinned))}>{cord.pinned ? v4("blcUnpin") : v4("blcPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCordHold(cords, cord.id, !cord.held))}>{cord.held ? v4("blcResume") : v4("blcHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleStance(cords, cord.id))}>{v4("blcStance")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCordTag(cords, cord.id, tag))}>{v4("blcTag")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCordArchive(cords, cord.id, !cord.archived))}>{cord.archived ? v4("blcReopen") : v4("blcArchive")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCordPitch(cords, cord.id, cord.pitch ? 0 : 2))}>{cord.pitch ? v4("blcPitchOff") : v4("blcPitchOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeCord(cords, cord.id))}>{v4("blcSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(cord.id); setDraft(cord.title); setNoteDraft(cord.note); }}>{v4("blcEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = cordCopy(cord, deskHour); void navigator.clipboard?.writeText(line); setCopied(cord.id); }}>{copied === cord.id ? v4("blcCopied") : v4("blcCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-blc-rules">{v4("blcRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function DialSeals({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<SealShape>("all");
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
    note: { phone: user.phone ?? null },
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
    const present = presentSeals(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSeals(readJson(DLS_KEY, []), present);
    const nextReviewed = readReviewedSeals(readJson(DLS_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(DLS_KEY, nextHidden);
    writeJson(DLS_REVIEW_KEY, nextReviewed);
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
  const present = presentSeals(rows);
  const lanes = visibleSealLanes(present, hidden, showHidden);
  const laneOn = activeSealLane(lane, present);
  const toneOn = activeSealTone(tone);
  const shown = visibleSealCustomers(rows, sealLaneArg(laneOn), sealToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = sealState(row.note);
      const token = state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingSeal(rows);
  const toneLead = leadingSealTone(rows);
  const shared = sharedSealCount(rows);
  const catalog = catalogSealCount(rows);
  const bars = sealLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(DLS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedSeals(next, ids);
    setReviewed(saved);
    writeJson(DLS_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-dls" aria-label={v4("dlsTitle")} data-seals="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-dls-sheet">
        <header className="c4-dls-mast">
          <div>
            <p className="c4-dls-kicker">{v4("dlsSub")}</p>
            <h2 className="c4-title">{v4("dlsTitle")}</h2>
          </div>
          <p className="c4-dls-plate" data-logo="mono">{v4("dlsLogo")}</p>
        </header>
        <div className="c4-dls-body">
        <p className="c4-dls-rules">{v4("dlsHint")}</p>
        <p className="c4-meta">{v4("dlsKept")} {v4("dlsEscape")}</p>
        {viewer && <p className="c4-dls-notice" data-viewer="1">{v4("dlsViewer")}</p>}
        {data.error && <p className="c4-dls-empty" role="alert">{v4("dlsFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("dlsLoading")}</p>}
        {shared > 0 && <p className="c4-dls-notice" role="status">{v4("dlsNotice")} · {shared}</p>}
        <ol className="c4-dls-ledger" aria-label={v4("dlsKpi")}>
          <li><span>{v4("dlsSet")}</span><strong>{rows.filter((row) => sealState(row.note) === "set").length}</strong></li>
          <li><span>{v4("dlsCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("dlsWide")}</span><strong>{wideSealCount(rows)}</strong></li>
          <li><span>{v4("dlsGiltCount")}</span><strong>{giltSealCount(rows)}</strong></li>
          <li><span>{v4("dlsShare")}</span><strong>{sealShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("dlsShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-dls-rail" aria-label={v4("dlsLanes")}>
          {bars.map((bar) => (
            <div key={bar.lane} className="c4-dls-meter" data-lane={bar.lane}>
              <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
              <div className="c4-dls-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-dls-empty">{v4("dlsEmpty")}</p>}
        </div>
        <div className="c4-dls-suggest">
          <p>{v4("dlsLeading")} · {lead ? laneLabel(v4, lead) : v4("dlsLeadingNone")}</p>
          <p>{v4("dlsToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("dlsToneNone")}</p>
          <p>{shared ? `${v4("dlsShared")} · ${shared}` : v4("dlsSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("dlsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("dlsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-dls-filters">
          <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("dlsAll")}</button>
          <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("dlsClear")}</button>
          {LANES.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("dlsTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("dlsGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("dlsInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("dlsIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("dlsMist")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("dlsAllShapes") : item === "catalog" ? v4("dlsCatalog") : item === "wide" ? v4("dlsWide") : v4("dlsGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("dlsAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("dlsReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("dlsOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("dlsShown") : v4("dlsHidden")}</button>
        </div>
        <div className="c4-dls-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleSeal(hidden, item))}>
              {laneLabel(v4, item)} · {hidden.includes(item) ? v4("dlsShow") : v4("dlsHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, shown.map((row) => row.id), true))}>{v4("dlsBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, ids, false))}>{v4("dlsBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("dial-seals.csv", sealsCsv(rows))}>{v4("dlsCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("dial-seal-rows.csv", sealRowsCsv(rows, reviewed))}>{v4("dlsRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("dlsCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-dls-empty">{v4("dlsEmpty")}</p>}
        <ul className="c4-dls-index">
          {shown.map((row) => {
            const state = sealState(row.note);
            const mark = sealOf(row.note);
            const step = sealStep(row.note);
            const steps = [v4("dlsDigits"), v4("dlsLetters"), v4("dlsMixed")];
            return (
              <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? sealLane(row.note) : "blank"} data-tone={sealTone(row.note) || "blank"} data-catalog={catalogSeal(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-step={step}>
                <p className="c4-dls-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{sealCopy(row.note) || v4("dlsClear")} · {laneLabel(v4, state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, sealTone(row.note))}</span>
                  <ol className="c4-dls-time" aria-label={v4("dlsStep")}>
                    {steps.map((label, index) => (
                      <li key={label} data-on={step >= index + 1 ? "1" : "0"}>{label}</li>
                    ))}
                  </ol>
                  <span className="c4-meta">{kindLabel(v4, step)}</span>
                  {catalogSeal(row.note) && <span className="c4-meta">{v4("dlsCatalogMark")}</span>}
                  {wideSeal(row.note) && <span className="c4-meta">{v4("dlsWide")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSealReview(reviewed, row.id))}>{v4("dlsReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = sealCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("dlsCopied") : v4("dlsCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-dls-rules">{v4("dlsRules")}</p>
        </div>
      </div>
    </section>
  );
}
