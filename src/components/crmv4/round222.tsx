"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MZR_DENSITY_KEY,
  MZR_KEY,
  MZR_VIEW_KEY,
  SYC_KEY,
  SYC_REVIEW_KEY,
  activeBell,
  activeBay,
  activeCrestLane,
  activeCrestTone,
  activeFinish,
  activeTempo,
  activeWatcher,
  activeWeight,
  addRail,
  addRailTag,
  addRailView,
  adjacentRailCount,
  bayArg,
  bayGap,
  baySpan,
  bellArg,
  bellClashCount,
  bulkCrestReview,
  bulkRailArchive,
  bulkRailFinish,
  bulkRailPin,
  bulkRailTag,
  bulkRailTempo,
  busiestWatcher,
  catalogCrest,
  catalogCrestCount,
  clashBayCount,
  crestCopy,
  crestLane,
  crestLaneArg,
  crestLanes,
  crestRowsCsv,
  crestShare,
  crestState,
  crestStep,
  crestTone,
  crestToneArg,
  crestsCsv,
  cycleTempo,
  densityOf,
  dropRailView,
  editRail,
  editRailNote,
  fairWatcher,
  finishArg,
  flareLoad,
  houseFinish,
  lateRail,
  lateShare,
  leadingCrest,
  leadingCrestTone,
  longCrestCount,
  markOf,
  matchedRails,
  moveFocus,
  nextRail,
  openBookCount,
  pairWatcherCount,
  peakBay,
  pinFocused,
  presentLanes,
  quietBay,
  quietGalleryCount,
  railCopy,
  railCounts,
  railFinishes,
  railLedger,
  railShare,
  railWatchers,
  railsCsv,
  readHiddenLanes,
  readRailViews,
  readRails,
  readReviewedCrests,
  reminderRails,
  resetRails,
  setRailArchive,
  setRailHold,
  setRailPin,
  setRailWeight,
  sharedFinishCount,
  sharedMarkCount,
  shutBookCount,
  snoozeFocused,
  snoozeRail,
  sortRails,
  suggestBell,
  suggestFinish,
  suggestWatcher,
  tempoArg,
  tempoFocused,
  toggleCrest,
  toggleCrestReview,
  usedBays,
  visibleCrestLanes,
  visibleCrests,
  visibleRails,
  watcherArg,
  weightArg,
  weightLoad,
  wideCrest,
  wideCrestCount,
  windowRails,
  holdFocused,
  type CrestRow,
  type CrestShape,
  type MezzanineRail,
  type RailDensity,
  type RailSort,
  type RailTray,
  type RailView,
} from "@/lib/crmv4/round222";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type BookRow = {
  id: string;
  symbol?: string | null;
  side?: string | null;
  status?: string | null;
};

type GlanceRow = CrestRow & { id: string };

const FINISHES = ["linen", "graphite", "champagne"] as const;
const TEMPOS = ["hush", "live", "flare"] as const;
const LANES = ["core", "wing", "loft"] as const;

function finishLabel(v4: V4, finish: string): string {
  if (finish === "linen" || finish === "LINEN") return v4("mzrLinen");
  if (finish === "graphite" || finish === "GRAPHITE") return v4("mzrGraphite");
  if (finish === "champagne" || finish === "CHAMPAGNE") return v4("mzrChampagne");
  return v4("mzrBlankFinish");
}

function tempoLabel(v4: V4, tempo: string): string {
  if (tempo === "hush") return v4("mzrHush");
  if (tempo === "live") return v4("mzrLive");
  if (tempo === "flare") return v4("mzrFlare");
  return v4("mzrBlankTempo");
}

function bellLabel(v4: V4, bell: number | null): string {
  if (bell === 20) return v4("mzrBell20");
  if (bell === 40) return v4("mzrBell40");
  if (bell === 60) return v4("mzrBell60");
  return v4("mzrBlankBell");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "core") return v4("sycCore");
  if (name === "wing") return v4("sycWing");
  if (name === "loft") return v4("sycLoft");
  if (name === "blank") return v4("sycClear");
  return v4("sycUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "long") return v4("sycLongTone");
  if (name === "short") return v4("sycShort");
  if (name === "flat") return v4("sycFlat");
  if (name === "mist") return v4("sycMist");
  return v4("sycUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "mzrAuditSave",
    edit: "mzrAuditEdit",
    note: "mzrAuditNote",
    tempo: "mzrAuditTempo",
    pin: "mzrAuditPin",
    unpin: "mzrAuditUnpin",
    hold: "mzrAuditHold",
    resume: "mzrAuditResume",
    archive: "mzrAuditArchive",
    open: "mzrAuditOpen",
    finish: "mzrAuditFinish",
    tag: "mzrAuditTag",
    weight: "mzrAuditWeight",
    bell: "mzrAuditBell",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("mzrPast")} ${gap}`;
  if (gap < 0) return `${v4("mzrAhead")} ${Math.abs(gap)}`;
  return v4("mzrDue");
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

export function MezzanineRails({ v4 }: { v4: V4 }) {
  const [rails, setRails] = useState<MezzanineRail[]>([]);
  const [views, setViews] = useState<RailView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [watcher, setWatcher] = useState("");
  const [bay, setBay] = useState("");
  const [finish, setFinish] = useState("");
  const [tempo, setTempo] = useState("");
  const [bellValue, setBellValue] = useState("");
  const [weight, setWeight] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<RailTray>("open");
  const [watcherFilter, setWatcherFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [flareOnly, setFlareOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [lightOnly, setLightOnly] = useState(false);
  const [board, setBoard] = useState<"gallery" | "ledger">("gallery");
  const [order, setOrder] = useState<RailSort>("bay");
  const [density, setDensity] = useState<RailDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveFinish, setMoveFinish] = useState("linen");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const bellRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const tempoRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readRails(readJson(MZR_KEY, []));
    const saved = readRailViews(readJson(MZR_VIEW_KEY, []));
    setRails(next);
    setViews(saved);
    setDensity(densityOf(readJson(MZR_DENSITY_KEY, "airy")));
    writeJson(MZR_KEY, next);
    writeJson(MZR_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: MezzanineRail[]) {
    const saved = readRails(next);
    setRails(saved);
    writeJson(MZR_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((rail) => rail.id === id)));
  }
  function storeViews(next: RailView[]) {
    const saved = readRailViews(next);
    setViews(saved);
    writeJson(MZR_VIEW_KEY, saved);
  }
  function storeDensity(next: RailDensity) {
    setDensity(next);
    writeJson(MZR_DENSITY_KEY, next);
  }
  const watchers = railWatchers(rails);
  const finishes = railFinishes(rails);
  const bars = FINISHES.map((item) => ({ finish: item.toUpperCase(), count: rails.filter((rail) => rail.finish === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const watcherOn = activeWatcher(watcherFilter, watchers);
  const finishOn = activeFinish(finishFilter, finishes);
  const tempoOn = activeTempo(tempoFilter, ["hush", "live", "flare"]);
  const bayOn = activeBay(bayFilter);
  const bellOn = activeBell(bellFilter);
  const weightOn = activeWeight(weightFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortRails(visibleRails(
    rails,
    tray,
    query,
    watcherArg(watcherOn),
    finishArg(finishOn),
    tempoArg(tempoOn),
    pickedBay.exact,
    pickedBay.pick,
    bellArg(bellOn),
    weightArg(weightOn),
    flareOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    lightOnly,
  ), order);
  const ledger = railLedger(rails, query);
  const counts = railCounts(rails, deskBay);
  const share = lateShare(rails, deskBay);
  const matched = matchedRails(rails, deskBay);
  const clashes = clashBayCount(rails);
  const bells = bellClashCount(rails);
  const neighbors = adjacentRailCount(rails);
  const suggestedFinish = suggestFinish(rails);
  const suggestedName = suggestWatcher(rails);
  const suggestedBell = suggestBell(rails);
  const fair = fairWatcher(rails, roster);
  const busy = busiestWatcher(rails);
  const reminders = reminderRails(rails, deskBay);
  const windowRows = windowRails(rails, deskBay);
  const nextTitle = nextRail(rails, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocused(rails, shown.map((rail) => rail.id), focus));
  };
  bellRef.current = () => {
    if (!viewer) store(snoozeFocused(rails, shown.map((rail) => rail.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocused(rails, shown.map((rail) => rail.id), focus));
  };
  tempoRef.current = () => {
    if (!viewer) store(tempoFocused(rails, shown.map((rail) => rail.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setWatcher("");
        setBay("");
        setFinish("");
        setTempo("");
        setBellValue("");
        setWeight("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
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
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        bellRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        tempoRef.current();
        return;
      }
      if (event.key === "y" || event.key === "Y") {
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
    setWatcher("");
    setBay("");
    setFinish("");
    setTempo("");
    setBellValue("");
    setWeight("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: RailView) {
    setTray(view.tray);
    setQuery(view.query);
    setWatcherFilter(view.watcher);
    setFinishFilter(view.finish);
    setTempoFilter(view.tempo);
    setBayFilter(view.bay);
    setBellFilter(view.bell);
    setWeightFilter(view.weight);
  }
  const rows = board === "ledger" ? ledger : shown;
  return (
    <section className="c4-mzr" aria-label={v4("mzrTitle")} data-rails="1" data-role={role} data-density={density}>
      <div className="c4-mzr-sheet">
        <header className="c4-mzr-mast">
          <p className="c4-mzr-spine">{v4("mzrSpine")}</p>
          <div>
            <p className="c4-mzr-kicker">{v4("mzrSub")}</p>
            <h2 className="c4-title">{v4("mzrTitle")}</h2>
          </div>
          <p className="c4-mzr-plate" data-logo="mono">{v4("mzrLogo")}</p>
        </header>
        <div className="c4-mzr-body">
          <p className="c4-mzr-rules">{v4("mzrHint")}</p>
          <p className="c4-meta">{v4("mzrLocal")}</p>
          <p className="c4-meta">{v4("mzrNew")} {v4("mzrSlash")} {v4("mzrEscape")} {v4("mzrKeys")} {v4("mzrPinKey")} {v4("mzrBellKey")} {v4("mzrHoldKey")} {v4("mzrTempoKey")} {v4("mzrBoardKey")}</p>
          {viewer && <p className="c4-mzr-notice" data-viewer="1">{v4("mzrViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-mzr-notice" role="status">
              {v4("mzrNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("mzrNoticeAll") : v4("mzrNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-mzr-notice" role="status" data-late="1">{v4("mzrLateNotice")} · {counts.late}</p>}
          <ol className="c4-mzr-ledger" aria-label={v4("mzrKpi")}>
            <li><span>{v4("mzrOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("mzrHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("mzrArchived")}</span><strong>{counts.archived}</strong></li>
            <li><span>{v4("mzrPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("mzrPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("mzrLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("mzrSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("mzrWeight")}</span><strong>{counts.weight}</strong></li>
            <li><span>{v4("mzrMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("mzrHouseShare")}</span><strong>{railShare(counts.house, counts.open)}%</strong></li>
          </ol>
          <div className="c4-mzr-sla" aria-label={v4("mzrLateShare")}>
            <span>{v4("mzrLateShare")} · {share}%</span>
            <div className="c4-mzr-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-mzr-rail" aria-label={v4("mzrFinishes")}>
            {bars.map((bar) => (
              <div key={bar.finish} className="c4-mzr-meter" data-finish={bar.finish.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setFinishFilter(bar.finish)}>{finishLabel(v4, bar.finish)} · {bar.count}</button>
                <div className="c4-mzr-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-mzr-empty">{v4("mzrEmpty")}</p>}
          </div>
          <div className="c4-mzr-suggest">
            <p>{v4("mzrSuggestFinish")} · {finishLabel(v4, suggestedFinish)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setFinish(suggestedFinish.toLowerCase())}>{v4("mzrUseFinish")}</button>
            <p>{v4("mzrSuggestWatcher")} · {suggestedName || v4("mzrBlankWatcher")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedName} onClick={() => setWatcher(suggestedName)}>{v4("mzrUseWatcher")}</button>
            <p>{v4("mzrSuggestBell")} · {suggestedBell}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setBellValue(String(suggestedBell))}>{v4("mzrUseBell")}</button>
            <p>{v4("mzrAssign")} · {fair || v4("mzrBlankWatcher")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setWatcher(fair)}>{v4("mzrAssign")}</button>
          </div>
          <p className="c4-meta">{v4("mzrBays")} · {usedBays(rails)}</p>
          <p className="c4-meta">{clashes ? `${v4("mzrClash")} · ${clashes}` : v4("mzrClashNone")}</p>
          <p className="c4-meta">{bells ? `${v4("mzrBellClash")} · ${bells}` : v4("mzrBellClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("mzrAdjacent")} · ${neighbors}` : v4("mzrAdjacentNone")}</p>
          <p className="c4-meta">{pairWatcherCount(rails) ? `${v4("mzrPairs")} · ${pairWatcherCount(rails)}` : v4("mzrPairsNone")}</p>
          <p className="c4-meta">{sharedFinishCount(rails) ? `${v4("mzrSharedFinish")} · ${sharedFinishCount(rails)}` : v4("mzrSharedFinishNone")}</p>
          <p className="c4-meta">{v4("mzrWeightLoad")} · {weightLoad(rails)}</p>
          <p className="c4-meta">{v4("mzrQuietGallery")} · {quietGalleryCount(rails)}</p>
          <p className="c4-meta">{v4("mzrFlareLoad")} · {flareLoad(rails)}</p>
          <p className="c4-meta">{v4("mzrBaySpan")} · {baySpan(rails)}</p>
          <p className="c4-meta">{nextTitle ? `${v4("mzrNext")} · ${nextTitle}` : v4("mzrNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("mzrBusiest")} · ${busy}` : v4("mzrBusiestNone")}</p>
          <p className="c4-meta">{reminders.length ? `${v4("mzrReminders")} · ${reminders.map((rail) => rail.title).join(", ")}` : v4("mzrReminderNone")}</p>
          <p className="c4-meta">{windowRows.length ? `${v4("mzrWindow")} · ${windowRows.map((rail) => rail.title).join(", ")}` : v4("mzrWindowNone")}</p>
          <label className="c4-lab">{v4("mzrSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("mzrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-mzr-filters">
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("mzrOpenTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} onClick={() => setTray("held")}>{v4("mzrHeldTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "archived" ? "1" : "0"} onClick={() => setTray("archived")}>{v4("mzrArchivedTray")}</button>
            <button type="button" className="c4-chip" data-on={watcherOn === "all" ? "1" : "0"} onClick={() => setWatcherFilter("all")}>{v4("mzrAll")}</button>
            <button type="button" className="c4-chip" data-on={watcherOn === "blank" ? "1" : "0"} onClick={() => setWatcherFilter("blank")}>{v4("mzrBlankWatcher")}</button>
            {watchers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={watcherOn === name ? "1" : "0"} onClick={() => setWatcherFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={finishOn === "all" ? "1" : "0"} onClick={() => setFinishFilter("all")}>{v4("mzrFinish")}</button>
            {FINISHES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={finishOn === item.toUpperCase() ? "1" : "0"} onClick={() => setFinishFilter(item)}>{finishLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={tempoOn === "all" ? "1" : "0"} onClick={() => setTempoFilter("all")}>{v4("mzrTempo")}</button>
            {TEMPOS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tempoOn === item ? "1" : "0"} onClick={() => setTempoFilter(item)}>{tempoLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "2", "5", "6"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={bayOn === item ? "1" : "0"} onClick={() => setBayFilter(item)}>
                {item === "all" ? v4("mzrBay") : item === "blank" ? v4("mzrBlankBay") : item === "early" ? v4("mzrEarly") : item === "mid" ? v4("mzrMid") : item === "late" ? v4("mzrLateBay") : item === "peak" ? v4("mzrPeak") : item === "quiet" ? v4("mzrQuiet") : item}
              </button>
            ))}
            {["all", "blank", "20", "40", "60"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={bellOn === item ? "1" : "0"} onClick={() => setBellFilter(item)}>{item === "all" ? v4("mzrBell") : item === "blank" ? v4("mzrBlankBell") : item}</button>
            ))}
            {["all", "blank", "2", "4", "8"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={weightOn === item ? "1" : "0"} onClick={() => setWeightFilter(item)}>{item === "all" ? v4("mzrWeightFilter") : item === "blank" ? v4("mzrBlankWeight") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((on) => !on)}>{v4("mzrFlareOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("mzrPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("mzrHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("mzrQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={lightOnly ? "1" : "0"} onClick={() => setLightOnly((on) => !on)}>{v4("mzrLightOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder("bay")}>{v4("mzrSortBay")}</button>
            <button type="button" className="c4-chip" data-on={order === "watcher" ? "1" : "0"} onClick={() => setOrder("watcher")}>{v4("mzrSortWatcher")}</button>
            <button type="button" className="c4-chip" data-on={density === "airy" ? "1" : "0"} onClick={() => storeDensity("airy")}>{v4("mzrAiry")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("mzrTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "gallery" ? "1" : "0"} onClick={() => setBoard("gallery")}>{v4("mzrGallery")}</button>
            <button type="button" className="c4-chip" data-on={board === "ledger" ? "1" : "0"} onClick={() => setBoard("ledger")}>{v4("mzrLedger")}</button>
          </div>
          <form className="c4-mzr-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addRail(rails, { id: `rail-${Date.now()}`, title, note, watcher, bay, finish, tempo, bell: bellValue, weight, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("mzrRail")}<input ref={titleRef} className="c4-field" aria-label={v4("mzrRail")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("mzrNote")}<input className="c4-field" aria-label={v4("mzrNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("mzrWatcher")}<input className="c4-field" aria-label={v4("mzrWatcher")} value={watcher} onChange={(event) => setWatcher(event.target.value)} /></label>
            <label className="c4-lab">{v4("mzrBay")}<input className="c4-field" inputMode="numeric" aria-label={v4("mzrBay")} value={bay} onChange={(event) => setBay(event.target.value)} /></label>
            <label className="c4-lab">{v4("mzrFinish")}
              <select className="c4-field" aria-label={v4("mzrFinish")} value={finish} onChange={(event) => setFinish(event.target.value)}>
                <option value="">{v4("mzrBlankFinish")}</option>
                {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("mzrTempo")}
              <select className="c4-field" aria-label={v4("mzrTempo")} value={tempo} onChange={(event) => setTempo(event.target.value)}>
                <option value="">{v4("mzrBlankTempo")}</option>
                {TEMPOS.map((item) => <option key={item} value={item}>{tempoLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("mzrBell")}<input className="c4-field" inputMode="numeric" aria-label={v4("mzrBell")} value={bellValue} onChange={(event) => setBellValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("mzrWeightFilter")}<input className="c4-field" inputMode="numeric" aria-label={v4("mzrWeightFilter")} value={weight} onChange={(event) => setWeight(event.target.value)} /></label>
            <label className="c4-lab">{v4("mzrTag")}<input className="c4-field" aria-label={v4("mzrTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("mzrSave")}</button>
          </form>
          <label className="c4-lab">{v4("mzrDeskBay")}<input className="c4-field" inputMode="numeric" aria-label={v4("mzrDeskBay")} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
          <label className="c4-lab">{v4("mzrRoster")}<input className="c4-field" aria-label={v4("mzrRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <form className="c4-mzr-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer || !viewName.trim()) return;
            storeViews(addRailView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              watcher: watcherOn,
              finish: finishOn,
              tempo: tempoOn,
              bay: bayOn,
              bell: bellOn,
              weight: weightOn,
            }));
            setViewName("");
          }}>
            <label className="c4-lab">{v4("mzrViewName")}<input className="c4-field" aria-label={v4("mzrViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("mzrSaveView")}</button>
          </form>
          <div className="c4-mzr-views">
            {views.map((view) => (
              <p key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropRailView(views, view.id))}>{v4("mzrDropView")}</button>
              </p>
            ))}
          </div>
          <div className="c4-mzr-bulk">
            <label className="c4-lab">{v4("mzrBulkFinish")}
              <select className="c4-field" aria-label={v4("mzrBulkFinish")} value={moveFinish} onChange={(event) => setMoveFinish(event.target.value)}>
                {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRailFinish(rails, picked, moveFinish))}>{v4("mzrBulkFinish")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRailPin(rails, picked, true))}>{v4("mzrBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRailArchive(rails, picked, true))}>{v4("mzrBulkArchive")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRailTag(rails, picked, "a"))}>{v4("mzrBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRailTempo(rails, picked, "live"))}>{v4("mzrBulkTempo")}</button>
            <button type="button" className="c4-btn" disabled={!picked.length} onClick={() => setPicked([])}>{v4("mzrClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("mezzanine-rails.csv", railsCsv(rails, deskBay))}>{v4("mzrCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetRails())}>{v4("mzrReset")}</button>
          </div>
          {!rows.length && <p className="c4-mzr-empty">{v4("mzrEmpty")}</p>}
          <ol className="c4-mzr-book">
            {rows.map((rail, index) => (
              <li key={rail.id} data-focus={focus === index ? "1" : "0"} data-late={lateRail(rail, deskBay) ? "1" : "0"} data-house={houseFinish(rail.finish) ? "1" : "0"} data-peak={peakBay(rail.bay) ? "1" : "0"} data-quiet={quietBay(rail.bay) ? "1" : "0"}>
                <label className="c4-lab">
                  <input type="checkbox" aria-label={v4("mzrPick")} checked={picked.includes(rail.id)} onChange={() => setPicked((ids) => ids.includes(rail.id) ? ids.filter((id) => id !== rail.id) : [...ids, rail.id])} />
                  <span className="c4-meta">{index + 1}</span>
                </label>
                <div>
                  {editing === rail.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (!viewer) store(editRail(editRailNote(rails, rail.id, noteDraft), rail.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("mzrEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("mzrEditNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mzrApply")}</button>
                      <button type="button" className="c4-btn" onClick={() => setEditing("")}>{v4("mzrCancel")}</button>
                    </form>
                  ) : (
                    <button type="button" className="c4-btn" onClick={() => { setFocus(index); setEditing(rail.id); setDraft(rail.title); setNoteDraft(rail.note); }}>{rail.title}</button>
                  )}
                  <p className="c4-meta">{rail.watcher || v4("mzrBlankWatcher")} · {rail.bay ?? v4("mzrBlankBay")} · {finishLabel(v4, rail.finish)} · {tempoLabel(v4, rail.tempo)} · {bellLabel(v4, rail.bell)} · {gapLabel(v4, rail.bay, deskBay)}</p>
                  <p className="c4-meta">{rail.note} {rail.tags.join(" ")} {auditLabel(v4, rail.audit)}</p>
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRailPin(rails, rail.id, !rail.pinned))}>{rail.pinned ? v4("mzrUnpin") : v4("mzrPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRailHold(rails, rail.id, !rail.held))}>{rail.held ? v4("mzrResume") : v4("mzrHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRailArchive(rails, rail.id, !rail.archived))}>{rail.archived ? v4("mzrReopen") : v4("mzrArchive")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTempo(rails, rail.id))}>{tempoLabel(v4, rail.tempo)}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeRail(rails, rail.id))}>{v4("mzrSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRailWeight(rails, rail.id, rail.weight > 2 ? 2 : 4))}>{rail.weight}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRailTag(rails, rail.id, "b"))}>{v4("mzrTag")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = railCopy(rail, deskBay); void navigator.clipboard?.writeText(line); setCopied(rail.id); }}>{copied === rail.id ? v4("mzrCopied") : v4("mzrCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-mzr-rules">{v4("mzrRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function SymbolCrests({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ positions?: BookRow[] }>("/api/admin/positions?status=OPEN&take=40");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<CrestShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "fresh">("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.positions || []).map((row) => ({
    id: row.id,
    label: row.symbol || row.id,
    note: { symbol: row.symbol ?? null, side: row.side ?? null, status: row.status ?? null },
  })), [data.data?.positions]);
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
    const present = presentLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenLanes(readJson(SYC_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(SYC_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(SYC_KEY, nextHidden);
    writeJson(SYC_REVIEW_KEY, nextReviewed);
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
  const present = presentLanes(rows);
  const lanes = visibleCrestLanes(present, hidden, showHidden);
  const laneOn = activeCrestLane(lane, present);
  const toneOn = activeCrestTone(tone);
  const shown = visibleCrests(rows, crestLaneArg(laneOn), crestToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = crestState(row.note);
      const token = state === "set" ? crestLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingCrest(rows);
  const toneLead = leadingCrestTone(rows);
  const shared = sharedMarkCount(rows);
  const catalog = catalogCrestCount(rows);
  const bars = crestLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(SYC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, ids);
    setReviewed(saved);
    writeJson(SYC_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-syc" aria-label={v4("sycTitle")} data-crests="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-syc-sheet">
        <header className="c4-syc-mast">
          <div>
            <p className="c4-syc-kicker">{v4("sycSub")}</p>
            <h2 className="c4-title">{v4("sycTitle")}</h2>
          </div>
          <p className="c4-syc-plate" data-logo="mono">{v4("sycLogo")}</p>
        </header>
        <div className="c4-syc-body">
          <p className="c4-syc-rules">{v4("sycHint")}</p>
          <p className="c4-meta">{v4("sycKept")} {v4("sycEscape")}</p>
          {viewer && <p className="c4-syc-notice" data-viewer="1">{v4("sycViewer")}</p>}
          {data.error && <p className="c4-syc-empty" role="alert">{v4("sycFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("sycLoading")}</p>}
          {shared > 0 && <p className="c4-syc-notice" role="status">{v4("sycNotice")} · {shared}</p>}
          <ol className="c4-syc-ledger" aria-label={v4("sycKpi")}>
            <li><span>{v4("sycSet")}</span><strong>{rows.filter((row) => crestState(row.note) === "set").length}</strong></li>
            <li><span>{v4("sycClear")}</span><strong>{rows.filter((row) => crestState(row.note) === "clear").length}</strong></li>
            <li><span>{v4("sycCatalog")}</span><strong>{catalog}</strong></li>
            <li><span>{v4("sycWide")}</span><strong>{wideCrestCount(rows)}</strong></li>
            <li><span>{v4("sycLong")}</span><strong>{longCrestCount(rows)}</strong></li>
            <li><span>{v4("sycOpen")}</span><strong>{openBookCount(rows)}</strong></li>
            <li><span>{v4("sycShut")}</span><strong>{shutBookCount(rows)}</strong></li>
            <li><span>{v4("sycShare")}</span><strong>{crestShare(catalog, rows.length)}%</strong></li>
            <li><span>{v4("sycShared")}</span><strong>{shared}</strong></li>
          </ol>
          <p className="c4-meta">{v4("sycLanes")} · {lead ? laneLabel(v4, lead) : v4("sycUnmarked")} · {toneLead ? toneLabel(v4, toneLead) : v4("sycUnmarked")}</p>
          <div className="c4-syc-rail" aria-label={v4("sycLanes")}>
            {bars.map((bar) => (
              <div key={bar.lane} className="c4-syc-meter" data-lane={bar.lane}>
                <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
                <div className="c4-syc-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-syc-empty">{v4("sycEmpty")}</p>}
          </div>
          <label className="c4-lab">{v4("sycSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("sycSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-syc-filters">
            <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("sycAll")}</button>
            {present.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={laneOn === name ? "1" : "0"} onClick={() => setLane(name)}>{laneLabel(v4, name)}</button>
            ))}
            {["all", "long", "short", "flat", "mist"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("sycAll") : toneLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("sycReviewAll")}</button>
            <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("sycReviewed")}</button>
            <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("sycFresh")}</button>
            <button type="button" className="c4-chip" data-on={shape === "all" ? "1" : "0"} onClick={() => setShape("all")}>{v4("sycShapeAll")}</button>
            <button type="button" className="c4-chip" data-on={shape === "catalog" ? "1" : "0"} onClick={() => setShape("catalog")}>{v4("sycCatalogShape")}</button>
            <button type="button" className="c4-chip" data-on={shape === "wide" ? "1" : "0"} onClick={() => setShape("wide")}>{v4("sycWideShape")}</button>
            <button type="button" className="c4-chip" data-on={shape === "open" ? "1" : "0"} onClick={() => setShape("open")}>{v4("sycOpenShape")}</button>
            <button type="button" className="c4-chip" data-on={shape === "shut" ? "1" : "0"} onClick={() => setShape("shut")}>{v4("sycShutShape")}</button>
            <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("sycShow")}</button>
          </div>
          <div className="c4-row">
            {LANES.map((name) => (
              <button key={name} type="button" className="c4-btn" disabled={viewer || !present.includes(name)} onClick={() => storeHidden(toggleCrest(hidden, name))}>{v4("sycHide")} {laneLabel(v4, name)}</button>
            ))}
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), true))}>{v4("sycBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), false))}>{v4("sycBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("symbol-crests.csv", crestsCsv(rows))}>{v4("sycCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("symbol-crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("sycRowCsv")}</button>
          </div>
          {!shown.length && !data.loading && <p className="c4-syc-empty">{v4("sycEmpty")}</p>}
          <ol className="c4-syc-index">
            {shown.map((row) => {
              const step = crestStep(row.note);
              return (
                <li key={row.id} data-lane={crestLane(row.note) || "blank"} data-catalog={catalogCrest(row.note) ? "1" : "0"} data-wide={wideCrest(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                  <p className="c4-syc-mark" data-tone={crestTone(row.note) || "mist"}>{markOf(row.note) || "—"}</p>
                  <div>
                    <Link href={crmv4Href(base, "positions")}>{row.label}</Link>
                    <p className="c4-meta">{laneLabel(v4, crestLane(row.note) || "blank")} · {toneLabel(v4, crestTone(row.note) || "")} · {crestCopy(row.note)}</p>
                    <ol className="c4-syc-time" aria-label={v4("sycStep")}>
                      {[1, 2, 3].map((mark) => <li key={mark} data-on={step >= mark ? "1" : "0"}>{mark}</li>)}
                    </ol>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{v4("sycReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = `${row.label} · ${markOf(row.note)} · ${crestLane(row.note)} · ${crestTone(row.note)}`; void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("sycCopied") : v4("sycCopy")}</button>
                    {catalogCrest(row.note) && <span className="c4-meta">{v4("sycCatalogMark")}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="c4-syc-rules">{v4("sycRules")}</p>
          <p className="c4-meta">{v4("sycPositions")}</p>
        </div>
      </div>
    </section>
  );
}
